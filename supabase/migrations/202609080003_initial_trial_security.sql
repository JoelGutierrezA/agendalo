-- Move initial trial creation behind a controlled RPC and close direct tenant inserts.

begin;

drop policy if exists "tenant_insert_business_subscriptions" on public.business_subscriptions;

create policy "admin_insert_business_subscriptions"
on public.business_subscriptions for insert
to authenticated
with check (public.is_platform_admin());

revoke insert on public.business_subscriptions from public;
grant insert on public.business_subscriptions to authenticated;

create or replace function public.create_initial_business_trial()
returns public.business_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles%rowtype;
  business_row public.businesses%rowtype;
  premium_plan_id bigint;
  trial_ends_at_value timestamptz;
  inserted_subscription public.business_subscriptions%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sesion no disponible.';
  end if;

  select *
  into profile_row
  from public.profiles
  where id = auth.uid();

  if profile_row.id is null then
    raise exception 'Perfil no encontrado.';
  end if;

  if profile_row.is_active is not true then
    raise exception 'La cuenta no esta activa.';
  end if;

  if profile_row.business_id is null then
    raise exception 'El perfil no tiene un negocio asignado.';
  end if;

  select *
  into business_row
  from public.businesses
  where id = profile_row.business_id;

  if business_row.id is null then
    raise exception 'Negocio no encontrado.';
  end if;

  if business_row.owner_id <> auth.uid() then
    raise exception 'El negocio no pertenece al usuario autenticado.';
  end if;

  if exists (
    select 1
    from public.business_subscriptions sub
    where sub.business_id = business_row.id
  ) then
    raise exception 'El negocio ya tiene una suscripcion.';
  end if;

  select id
  into premium_plan_id
  from public.plans
  where code = 'premium'
    and is_active = true
  limit 1;

  if premium_plan_id is null then
    raise exception 'No se encontro un plan Premium activo.';
  end if;

  trial_ends_at_value := now() + interval '14 days';

  insert into public.business_subscriptions (
    business_id,
    plan_id,
    status,
    starts_at,
    ends_at,
    trial_ends_at,
    cancelled_at,
    notes
  )
  values (
    business_row.id,
    premium_plan_id,
    'trialing',
    now(),
    trial_ends_at_value,
    trial_ends_at_value,
    null,
    'Prueba Premium de 14 dias creada automaticamente.'
  )
  returning * into inserted_subscription;

  return inserted_subscription;
end;
$$;

revoke all on function public.create_initial_business_trial() from public;
grant execute on function public.create_initial_business_trial() to authenticated;

commit;
