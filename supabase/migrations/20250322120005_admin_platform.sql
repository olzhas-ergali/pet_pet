-- Админ-платформа: очередь рассылок, агрегаты продаж, массовые скидки, события low_stock

-- Расширяем типы integration_events (для аналитики FOMO / алертов)
alter table public.integration_events drop constraint if exists integration_events_type_check;
alter table public.integration_events add constraint integration_events_type_check
  check (type in (
    'price_updated',
    'order_created',
    'low_stock',
    'admin_notification_enqueued'
  ));

-- Очередь уведомлений (отправка push/email/Telegram — воркером / Edge Function вне этого репо)
create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('push', 'email', 'telegram')),
  title text not null,
  body text not null,
  audience jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'cancelled')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  error text
);

create index idx_notification_outbox_pending on public.notification_outbox (created_at)
  where status = 'pending';

alter table public.notification_outbox enable row level security;

create policy notification_outbox_admin_rw on public.notification_outbox
  for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Агрегаты для дашборда (только admin)
create or replace function public.admin_sales_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  j jsonb;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total_orders', (select count(*)::bigint from public.orders),
    'total_revenue', (select coalesce(sum(total_amount), 0)::numeric from public.orders),
    'orders_last_7d', (select count(*)::bigint from public.orders where created_at > now() - interval '7 days'),
    'pending_integration_events', (
      select count(*)::bigint from public.integration_events where processed_at is null
    ),
    'pending_notifications', (
      select count(*)::bigint from public.notification_outbox where status = 'pending'
    )
  ) into j;
  return j;
end;
$$;

revoke all on function public.admin_sales_overview() from public;
grant execute on function public.admin_sales_overview() to authenticated;

-- Постановка рассылки в очередь
create or replace function public.admin_enqueue_notification(
  p_channel text,
  p_title text,
  p_body text,
  p_audience jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  nid uuid;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_channel not in ('push', 'email', 'telegram') then
    raise exception 'invalid channel';
  end if;

  insert into public.notification_outbox (channel, title, body, audience, created_by)
  values (p_channel, p_title, p_body, coalesce(p_audience, '{}'::jsonb), auth.uid())
  returning id into nid;

  insert into public.integration_events (type, payload)
  values (
    'admin_notification_enqueued',
    jsonb_build_object('notification_id', nid, 'channel', p_channel)
  );

  return nid;
end;
$$;

revoke all on function public.admin_enqueue_notification(text, text, text, jsonb) from public;
grant execute on function public.admin_enqueue_notification(text, text, text, jsonb) to authenticated;

-- Массовая скидка: discount_price = base_price * (1 - p_percent/100), опционально фильтр по category
create or replace function public.admin_bulk_apply_discount_percent(
  p_category text,
  p_percent numeric
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_percent is null or p_percent < 0 or p_percent >= 100 then
    raise exception 'invalid percent';
  end if;

  update public.prices pr
  set discount_price = round(pr.base_price * (1 - p_percent / 100.0), 2)::numeric(14, 2)
  from public.products p
  where p.id = pr.product_id
    and (p_category is null or trim(p_category) = '' or p.category = p_category);

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.admin_bulk_apply_discount_percent(text, numeric) from public;
grant execute on function public.admin_bulk_apply_discount_percent(text, numeric) to authenticated;

-- Событие low_stock при пересечении порога (было >=20, стало <20)
create or replace function public.emit_low_stock_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.quantity < 20 and (tg_op = 'INSERT' or old.quantity is null or old.quantity >= 20) then
    insert into public.integration_events (type, payload)
    values (
      'low_stock',
      jsonb_build_object(
        'product_id', new.product_id,
        'quantity', new.quantity,
        'detected_at', now()
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists tr_inventory_low_stock_event on public.inventory;
create trigger tr_inventory_low_stock_event
  after insert or update of quantity on public.inventory
  for each row execute function public.emit_low_stock_event();
