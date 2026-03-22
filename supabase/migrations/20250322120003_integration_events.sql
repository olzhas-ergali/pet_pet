-- События для интеграций (1C, Kaspi, Telegram, …)

create table public.integration_events (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('price_updated', 'order_created')),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  external_status text
);

create index idx_integration_events_unprocessed on public.integration_events (created_at)
  where processed_at is null;

alter table public.integration_events enable row level security;

-- Только service role (политики не нужны — клиент не ходит в таблицу)

create or replace function public.emit_price_updated_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.integration_events (type, payload)
  values (
    'price_updated',
    jsonb_build_object(
      'product_id', new.product_id,
      'base_price', new.base_price,
      'discount_price', new.discount_price,
      'updated_at', new.updated_at
    )
  );
  return new;
end;
$$;

drop trigger if exists tr_prices_integration_event on public.prices;
create trigger tr_prices_integration_event
  after insert or update on public.prices
  for each row execute function public.emit_price_updated_event();

create or replace function public.emit_order_created_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.integration_events (type, payload)
  values (
    'order_created',
    jsonb_build_object(
      'order_id', new.id,
      'user_id', new.user_id,
      'total_amount', new.total_amount,
      'status', new.status,
      'created_at', new.created_at
    )
  );
  return new;
end;
$$;

drop trigger if exists tr_orders_integration_event on public.orders;
create trigger tr_orders_integration_event
  after insert on public.orders
  for each row execute function public.emit_order_created_event();
