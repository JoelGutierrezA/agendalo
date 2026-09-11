-- New self-registrations must always wait for platform approval.
-- Existing profiles are intentionally left untouched.

alter table public.profiles
  alter column is_active set default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
