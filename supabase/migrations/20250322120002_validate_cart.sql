-- Проверка остатков до оформления заказа (без блокировок)

create or replace function public.validate_cart_stock(p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  el jsonb;
  v_product_id uuid;
  v_quantity int;
  v_stock int;
  issues jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'code', 'auth_required');
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('ok', false, 'code', 'empty_cart');
  end if;

  for el in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (el->>'product_id')::uuid;
    v_quantity := (el->>'quantity')::int;
    if v_quantity < 1 then
      return jsonb_build_object('ok', false, 'code', 'invalid_quantity');
    end if;
    select quantity into v_stock from public.inventory where product_id = v_product_id;
    if v_stock is null then
      issues := issues || jsonb_build_array(jsonb_build_object(
        'product_id', v_product_id,
        'available', 0,
        'requested', v_quantity
      ));
    elsif v_stock < v_quantity then
      issues := issues || jsonb_build_array(jsonb_build_object(
        'product_id', v_product_id,
        'available', v_stock,
        'requested', v_quantity
      ));
    end if;
  end loop;

  if jsonb_array_length(issues) > 0 then
    return jsonb_build_object('ok', false, 'code', 'insufficient_stock', 'issues', issues);
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.validate_cart_stock(jsonb) to authenticated;
