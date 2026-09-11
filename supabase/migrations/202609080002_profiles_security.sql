-- Protect sensitive profile columns and move initial business assignment server-side.

begin;

revoke update on public.profiles from authenticated;
revoke update on public.profiles from public;
grant update (name) on public.profiles to authenticated;

drop policy if exists "profiles_update_own_or_admin" on public.profiles;

create policy "profiles_update_own_safe_fields"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create or replace function public.assign_initial_business(target_business_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles%rowtype;
  business_owner_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sesion no disponible.';
  end if;

  select *
  into profile_row
  from public.profiles
  where id = auth.uid()
  for update;

  if profile_row.id is null then
    raise exception 'Perfil no encontrado.';
  end if;

  if profile_row.is_active is not true then
    raise exception 'La cuenta no esta activa.';
  end if;

  if profile_row.business_id is not null then
    raise exception 'El perfil ya tiene un negocio asignado.';
  end if;

  select owner_id
  into business_owner_id
  from public.businesses
  where id = target_business_id;

  if business_owner_id is null then
    raise exception 'Negocio no encontrado.';
  end if;

  if business_owner_id <> auth.uid() then
    raise exception 'No puedes asignarte un negocio que no te pertenece.';
  end if;

  update public.profiles
  set business_id = target_business_id
  where id = auth.uid();
end;
$$;

create or replace function public.admin_set_profile_active(
  target_profile_id uuid,
  target_is_active boolean
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sesion no disponible.';
  end if;

  if not public.is_platform_admin() then
    raise exception 'No tienes permisos para esta accion.';
  end if;

  update public.profiles
  set is_active = target_is_active
  where id = target_profile_id
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Usuario no encontrado.';
  end if;

  return updated_profile;
end;
$$;

revoke all on function public.assign_initial_business(bigint) from public;
grant execute on function public.assign_initial_business(bigint) to authenticated;

revoke all on function public.admin_set_profile_active(uuid, boolean) from public;
grant execute on function public.admin_set_profile_active(uuid, boolean) to authenticated;

commit;
