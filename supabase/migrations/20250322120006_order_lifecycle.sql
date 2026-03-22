-- Жизненный цикл заказа: доставка/трекинг, Realtime, события смены статуса, поставщик видит заказы

alter table public.orders
  add column if not exists shipping_address jsonb not null default '{}'::jsonb;

alter table public.orders
  add column if not exists recipient_phone text;

alter table public.orders
  add column if not exists tracking_number text;

alter table public.orders
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tr_orders_updated_at on public.orders;
create trigger tr_orders_updated_at
  before update on public.orders
  for each row execute function public.set_orders_updated_at();

-- Типы событий интеграций
alter table public.integration_events drop constraint if exists integration_events_type_check;
alter table public.integration_events add constraint integration_events_type_check
  check (type in (
    'price_updated',
    'order_created',
    'low_stock',
    'admin_notification_enqueued',
    'order_status_changed'
  ));

create or replace function public.emit_order_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.integration_events (type, payload)
    values (
      'order_status_changed',
      jsonb_build_object(
        'order_id', new.id,
        'user_id', new.user_id,
        'old_status', old.status,
        'new_status', new.status,
        'tracking_number', new.tracking_number,
        'updated_at', new.updated_at
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists tr_orders_status_integration_event on public.orders;
create trigger tr_orders_status_integration_event
  after update on public.orders
  for each row execute function public.emit_order_status_changed();

-- Realtime: клиент и поставщик (RLS) получают апдейты заказов
alter table public.orders replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;
end $$;

-- RLS: поставщик видит заказы, где есть его товар; убираем правку статуса у покупателя (кроме отмены через RPC)
drop policy if exists orders_select_own on public.orders;
create policy orders_select_own on public.orders
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or exists (
      select 1 from public.order_items oi
      join public.products pr on pr.id = oi.product_id
      where oi.order_id = orders.id and pr.supplier_id = auth.uid()
    )
  );

drop policy if exists orders_update_admin on public.orders;
create policy orders_update_admin on public.orders
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Отмена только через RPC (ниже)

create or replace function public.cancel_my_pending_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;
  update public.orders
  set status = 'cancelled'
  where id = p_order_id
    and user_id = auth.uid()
    and status = 'pending';
  if not found then
    raise exception 'cannot cancel';
  end if;
  return true;
end;
$$;

revoke all on function public.cancel_my_pending_order(uuid) from public;
grant execute on function public.cancel_my_pending_order(uuid) to authenticated;

create or replace function public.admin_set_order_status(p_order_id uuid, p_status text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_status not in ('pending', 'paid', 'shipped', 'cancelled', 'completed') then
    raise exception 'invalid status';
  end if;
  update public.orders set status = p_status where id = p_order_id;
  if not found then
    raise exception 'not found';
  end if;
  return true;
end;
$$;

revoke all on function public.admin_set_order_status(uuid, text) from public;
grant execute on function public.admin_set_order_status(uuid, text) to authenticated;

create or replace function public.supplier_orders_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
  is_supplier boolean;
begin
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') into is_admin;
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'supplier') into is_supplier;
  if not is_admin and not is_supplier then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', g.id,
          'user_id', g.user_id,
          'status', g.status,
          'total_amount', g.total_amount,
          'tracking_number', g.tracking_number,
          'created_at', g.created_at,
          'updated_at', g.updated_at
        )
        order by g.created_at desc
      )
      from (
        select o.id,
          o.user_id,
          o.status,
          o.total_amount,
          o.tracking_number,
          o.created_at,
          o.updated_at
        from public.orders o
        join public.order_items oi on oi.order_id = o.id
        join public.products pr on pr.id = oi.product_id
        where is_admin or pr.supplier_id = auth.uid()
        group by o.id, o.user_id, o.status, o.total_amount, o.tracking_number, o.created_at, o.updated_at
      ) g
    ),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.supplier_orders_dashboard() from public;
grant execute on function public.supplier_orders_dashboard() to authenticated;

-- submit_order: один аргумент заменён на (items, meta) — старая сигнатура удаляется
drop function if exists public.submit_order(jsonb);

create or replace function public.submit_order(p_items jsonb, p_meta jsonb default '{}'::jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_order_id uuid;
  rec record;
  v_unit numeric(14, 2);
  v_total numeric(14, 2) := 0;
  v_stock int;
  v_base numeric(14, 2);
  v_discount numeric(14, 2);
  v_tiers jsonb;
  v_ship jsonb;
  v_phone text;
begin
  if v_uid is null then
    raise exception 'auth required';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty cart';
  end if;

  v_ship := case
    when p_meta ? 'shipping_address' then p_meta->'shipping_address'
    else p_meta
  end;
  v_phone := nullif(trim(coalesce(p_meta->>'recipient_phone', '')), '');

  for rec in
    select
      (el->>'product_id')::uuid as product_id,
      sum((el->>'quantity')::int) as qty
    from jsonb_array_elements(p_items) el
    group by 1
    order by 1
  loop
    if rec.qty < 1 then
      raise exception 'invalid quantity';
    end if;
    select quantity into v_stock from public.inventory where product_id = rec.product_id for update;
    if v_stock is null or v_stock < rec.qty then
      raise exception 'insufficient stock for product %', rec.product_id;
    end if;
  end loop;

  for rec in
    select
      (el->>'product_id')::uuid as product_id,
      sum((el->>'quantity')::int) as qty
    from jsonb_array_elements(p_items) el
    group by 1
    order by 1
  loop
    select p.base_price, p.discount_price, pr.wholesale_tiers
    into v_base, v_discount, v_tiers
    from public.products pr
    join public.prices p on p.product_id = pr.id
    where pr.id = rec.product_id;

    if v_base is null then
      raise exception 'product or price missing for %', rec.product_id;
    end if;

    v_unit := public.resolve_unit_price(v_base, v_discount, v_tiers, rec.qty);
    v_total := v_total + v_unit * rec.qty;
  end loop;

  insert into public.orders (user_id, total_amount, status, shipping_address, recipient_phone)
  values (v_uid, v_total, 'pending', coalesce(v_ship, '{}'::jsonb), v_phone)
  returning id into v_order_id;

  for rec in
    select
      (el->>'product_id')::uuid as product_id,
      sum((el->>'quantity')::int) as qty
    from jsonb_array_elements(p_items) el
    group by 1
    order by 1
  loop
    select p.base_price, p.discount_price, pr.wholesale_tiers
    into v_base, v_discount, v_tiers
    from public.products pr
    join public.prices p on p.product_id = pr.id
    where pr.id = rec.product_id;

    v_unit := public.resolve_unit_price(v_base, v_discount, v_tiers, rec.qty);
    insert into public.order_items (order_id, product_id, quantity, price_at_time)
    values (v_order_id, rec.product_id, rec.qty, v_unit);

    update public.inventory
    set quantity = quantity - rec.qty
    where product_id = rec.product_id;
  end loop;

  return v_order_id;
end;
$$;

revoke all on function public.submit_order(jsonb, jsonb) from public;
grant execute on function public.submit_order(jsonb, jsonb) to authenticated;
