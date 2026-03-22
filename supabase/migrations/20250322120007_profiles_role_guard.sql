-- Запретить пользователю выставить себе role = 'admin' через UPDATE профиля
drop policy if exists profiles_update_self on public.profiles;

create policy profiles_update_self on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and (
      role <> 'admin'
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'admin'
      )
    )
  );
