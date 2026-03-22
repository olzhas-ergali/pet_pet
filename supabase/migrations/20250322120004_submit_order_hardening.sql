-- Агрегация одинаковых product_id в корзине, блокировки по порядку id, явные ошибки при отсутствии цены

create or replace function public.validate_cart_stock(p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  v_stock int;
  issues jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'code', 'auth_required');
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('ok', false, 'code', 'empty_cart');
  end if;

  for rec in
    select
      (el->>'product_id')::uuid as product_id,
      sum((el->>'quantity')::int) as qty
    from jsonb_array_elements(p_items) el
    group by 1
    order by 1
  loop
    if rec.qty < 1 then
      return jsonb_build_object('ok', false, 'code', 'invalid_quantity');
    end if;
    select quantity into v_stock from public.inventory where product_id = rec.product_id;
    if v_stock is null then
      issues := issues || jsonb_build_array(jsonb_build_object(
        'product_id', rec.product_id,
        'available', 0,
        'requested', rec.qty
      ));
    elsif v_stock < rec.qty then
      issues := issues || jsonb_build_array(jsonb_build_object(
        'product_id', rec.product_id,
        'available', v_stock,
        'requested', rec.qty
      ));
    end if;
  end loop;

  if jsonb_array_length(issues) > 0 then
    return jsonb_build_object('ok', false, 'code', 'insufficient_stock', 'issues', issues);
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.submit_order(p_items jsonb)
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
begin
  if v_uid is null then
    raise exception 'auth required';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty cart';
  end if;

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

  insert into public.orders (user_id, total_amount, status)
  values (v_uid, v_total, 'pending')
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
