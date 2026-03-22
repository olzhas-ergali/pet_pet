-- Атомарное оформление заказа: проверка остатков, фиксация цены, списание

create or replace function public.resolve_unit_price(
  base numeric,
  discount numeric,
  tiers jsonb,
  qty int
)
returns numeric
language plpgsql
immutable
as $$
declare
  t jsonb;
  fallback numeric;
begin
  fallback := coalesce(discount, base);
  if tiers is null or jsonb_typeof(tiers) <> 'array' or jsonb_array_length(tiers) = 0 then
    return fallback;
  end if;
  for t in select * from jsonb_array_elements(tiers)
  loop
    if qty >= (t->>'min')::int and qty <= (t->>'max')::int then
      return (t->>'price')::numeric;
    end if;
  end loop;
  return fallback;
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
  el jsonb;
  v_product_id uuid;
  v_quantity int;
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

  for el in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (el->>'product_id')::uuid;
    v_quantity := (el->>'quantity')::int;
    if v_quantity < 1 then
      raise exception 'invalid quantity';
    end if;
    select quantity into v_stock from public.inventory where product_id = v_product_id for update;
    if v_stock is null or v_stock < v_quantity then
      raise exception 'insufficient stock for product %', v_product_id;
    end if;
  end loop;

  for el in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (el->>'product_id')::uuid;
    v_quantity := (el->>'quantity')::int;
    select p.base_price, p.discount_price, pr.wholesale_tiers
    into v_base, v_discount, v_tiers
    from public.products pr
    join public.prices p on p.product_id = pr.id
    where pr.id = v_product_id;

    v_unit := public.resolve_unit_price(v_base, v_discount, v_tiers, v_quantity);
    v_total := v_total + v_unit * v_quantity;
  end loop;

  insert into public.orders (user_id, total_amount, status)
  values (v_uid, v_total, 'pending')
  returning id into v_order_id;

  for el in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (el->>'product_id')::uuid;
    v_quantity := (el->>'quantity')::int;
    select p.base_price, p.discount_price, pr.wholesale_tiers
    into v_base, v_discount, v_tiers
    from public.products pr
    join public.prices p on p.product_id = pr.id
    where pr.id = v_product_id;

    v_unit := public.resolve_unit_price(v_base, v_discount, v_tiers, v_quantity);
    insert into public.order_items (order_id, product_id, quantity, price_at_time)
    values (v_order_id, v_product_id, v_quantity, v_unit);

    update public.inventory
    set quantity = quantity - v_quantity
    where product_id = v_product_id;
  end loop;

  return v_order_id;
end;
$$;

grant execute on function public.submit_order(jsonb) to authenticated;
grant execute on function public.resolve_unit_price(numeric, numeric, jsonb, int) to authenticated, anon;
