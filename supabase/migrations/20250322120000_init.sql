-- Схема MVP: профили, товары, цены, остатки, заказы

create extension if not exists "pgcrypto";

-- Профиль = пользователь Supabase Auth
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text,
  display_name text,
  role text not null default 'customer' check (role in ('customer', 'supplier', 'admin')),
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.profiles (id) on delete set null,
  name text not null,
  description text,
  category text not null default 'Прочее',
  image_url text,
  wholesale_tiers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  base_price numeric(14, 2) not null check (base_price >= 0),
  discount_price numeric(14, 2) check (discount_price is null or discount_price >= 0),
  updated_at timestamptz not null default now(),
  unique (product_id)
);

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  unique (product_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  total_amount numeric(14, 2) not null check (total_amount >= 0),
  status text not null default 'pending' check (
    status in ('pending', 'paid', 'shipped', 'cancelled', 'completed')
  ),
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  price_at_time numeric(14, 2) not null check (price_at_time >= 0)
);

create index idx_products_supplier on public.products (supplier_id);
create index idx_orders_user on public.orders (user_id);
create index idx_order_items_order on public.order_items (order_id);

-- updated_at на ценах
create or replace function public.set_prices_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger tr_prices_updated_at
  before update on public.prices
  for each row execute function public.set_prices_updated_at();

-- Профиль при регистрации
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone, display_name, role)
  values (
    new.id,
    coalesce(new.phone, new.raw_user_meta_data ->> 'phone'),
    coalesce(new.raw_user_meta_data ->> 'display_name', 'Пользователь'),
    coalesce((new.raw_user_meta_data ->> 'role')::text, 'customer')
  );
  return new;
exception
  when unique_violation then
    return new;
end;
$$;

create trigger on_auth_user_created_optbirja
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.prices enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- profiles
create policy profiles_select_self on public.profiles
  for select using (auth.uid() = id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

create policy profiles_update_self on public.profiles
  for update using (auth.uid() = id);

create policy profiles_insert_self on public.profiles
  for insert with check (auth.uid() = id);

-- products: каталог всем
create policy products_select_all on public.products for select using (true);

create policy products_insert_role on public.products
  for insert with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('supplier', 'admin')
    )
    and (supplier_id is null or supplier_id = auth.uid() or exists (
      select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'admin'
    ))
  );

create policy products_update_owner on public.products
  for update using (
    supplier_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or (supplier_id is null and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
    ))
  );

-- prices
create policy prices_select_all on public.prices for select using (true);

create policy prices_write_owner on public.prices
  for all using (
    exists (
      select 1 from public.products pr
      where pr.id = prices.product_id
        and (
          pr.supplier_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
          or (pr.supplier_id is null and exists (
            select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
          ))
        )
    )
  )
  with check (
    exists (
      select 1 from public.products pr
      where pr.id = prices.product_id
        and (
          pr.supplier_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
          or (pr.supplier_id is null and exists (
            select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
          ))
        )
    )
  );

-- inventory
create policy inventory_select_all on public.inventory for select using (true);

create policy inventory_write_owner on public.inventory
  for all using (
    exists (
      select 1 from public.products pr
      where pr.id = inventory.product_id
        and (
          pr.supplier_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
          or (pr.supplier_id is null and exists (
            select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
          ))
        )
    )
  )
  with check (
    exists (
      select 1 from public.products pr
      where pr.id = inventory.product_id
        and (
          pr.supplier_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
          or (pr.supplier_id is null and exists (
            select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
          ))
        )
    )
  );

-- orders
create policy orders_select_own on public.orders
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy orders_insert_own on public.orders
  for insert with check (user_id = auth.uid());

create policy orders_update_admin on public.orders
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or user_id = auth.uid()
  );

-- order_items
create policy order_items_select on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or exists (
          select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
        ))
    )
  );

create policy order_items_insert on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

-- Realtime: цены
alter publication supabase_realtime add table public.prices;
alter table public.prices replica identity full;

-- Стартовый каталог (без привязки к поставщику — правит admin)
insert into public.products (id, name, description, category, image_url, wholesale_tiers)
values
  (
    'a0000000-0000-4000-8000-000000000001',
    'Порошок стиральный Ariel автомат, 6кг',
    'Концентрированный порошок',
    'Бытовая химия',
    'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400',
    '[
      {"min":1,"max":9,"price":3200},
      {"min":10,"max":49,"price":2900},
      {"min":50,"max":9999,"price":2600}
    ]'::jsonb
  ),
  (
    'a0000000-0000-4000-8000-000000000002',
    'Масло подсолнечное "Золотая капля", 5л',
    'Рафинированное дезодорированное',
    'Продукты питания',
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
    '[
      {"min":1,"max":9,"price":2100},
      {"min":10,"max":49,"price":1950},
      {"min":50,"max":9999,"price":1800}
    ]'::jsonb
  ),
  (
    'a0000000-0000-4000-8000-000000000003',
    'Туалетная бумага "Мягкий знак", 24 рулона',
    'Двухслойная',
    'Бытовая химия',
    'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400',
    '[
      {"min":1,"max":9,"price":1450},
      {"min":10,"max":49,"price":1300},
      {"min":50,"max":9999,"price":1150}
    ]'::jsonb
  ),
  (
    'a0000000-0000-4000-8000-000000000004',
    'Гречка ядрица "Увелка", 10кг мешок',
    'ГОСТ',
    'Продукты питания',
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
    '[
      {"min":1,"max":9,"price":4800},
      {"min":10,"max":49,"price":4500},
      {"min":50,"max":9999,"price":4200}
    ]'::jsonb
  ),
  (
    'a0000000-0000-4000-8000-000000000005',
    'Средство для мытья посуды "Fairy", 5л',
    'Концентрат',
    'Бытовая химия',
    'https://images.unsplash.com/photo-1563987628-8f9b44de3d93?w=400',
    '[
      {"min":1,"max":9,"price":2650},
      {"min":10,"max":49,"price":2450},
      {"min":50,"max":9999,"price":2200}
    ]'::jsonb
  ),
  (
    'a0000000-0000-4000-8000-000000000006',
    'Сахар-песок "Чистый", 50кг мешок',
    'Кристаллический',
    'Продукты питания',
    'https://images.unsplash.com/photo-1629093305172-ec6fb8bb1206?w=400',
    '[
      {"min":1,"max":4,"price":17200},
      {"min":5,"max":19,"price":16800},
      {"min":20,"max":9999,"price":16200}
    ]'::jsonb
  )
on conflict (id) do nothing;

insert into public.prices (product_id, base_price, discount_price)
values
  ('a0000000-0000-4000-8000-000000000001', 4500, 3200),
  ('a0000000-0000-4000-8000-000000000002', 2800, 2100),
  ('a0000000-0000-4000-8000-000000000003', 1800, 1450),
  ('a0000000-0000-4000-8000-000000000004', 5200, 4800),
  ('a0000000-0000-4000-8000-000000000005', 3500, 2650),
  ('a0000000-0000-4000-8000-000000000006', 18500, 17200)
on conflict (product_id) do nothing;

insert into public.inventory (product_id, quantity)
values
  ('a0000000-0000-4000-8000-000000000001', 12),
  ('a0000000-0000-4000-8000-000000000002', 45),
  ('a0000000-0000-4000-8000-000000000003', 8),
  ('a0000000-0000-4000-8000-000000000004', 156),
  ('a0000000-0000-4000-8000-000000000005', 23),
  ('a0000000-0000-4000-8000-000000000006', 67)
on conflict (product_id) do nothing;
