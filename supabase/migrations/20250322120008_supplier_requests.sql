-- Заявки на роль поставщика (модерация админом). UI и RPC одобрения — следующий этап.
create table public.supplier_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  message text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index idx_supplier_requests_user on public.supplier_requests (user_id);
create index idx_supplier_requests_status on public.supplier_requests (status);

alter table public.supplier_requests enable row level security;

create policy supplier_requests_select on public.supplier_requests
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy supplier_requests_insert on public.supplier_requests
  for insert with check (auth.uid() = user_id);

create policy supplier_requests_update_admin on public.supplier_requests
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
