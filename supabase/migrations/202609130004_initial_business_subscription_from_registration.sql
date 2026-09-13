-- Create initial business subscriptions from approved registration requests.

begin;

alter table public.registration_requests
  add column if not exists subscription_applied_at timestamptz,
  add column if not exists applied_business_id bigint references public.businesses(id) on delete set null;

create index if not exists registration_requests_applied_business_id_idx
on public.registration_requests (applied_business_id);

create or replace function public.create_initial_business_subscription()
returns table (
  business_subscription_id bigint,
  business_id bigint,
  plan_id bigint,
  plan_code text,
  status text,
  starts_at timestamptz,
  ends_at timestamptz,
  trial_ends_at timestamptz,
  total_days integer,
  effective_start timestamptz,
  source text,
  already_created boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles%rowtype;
  business_row public.businesses%rowtype;
  registration_row public.registration_requests%rowtype;
  existing_subscription public.business_subscriptions%rowtype;
  inserted_subscription public.business_subscriptions%rowtype;
  plan_row public.plans%rowtype;
  now_value timestamptz := now();
  source_value text := 'legacy';
  subscription_status_value text;
  effective_start_value timestamptz;
  total_days_value integer;
  trial_ends_at_value timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Sesion no disponible.';
  end if;

  select *
  into profile_row
  from public.profiles profile
  where profile.id = auth.uid()
  for update;

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
  from public.businesses business
  where business.id = profile_row.business_id;

  if business_row.id is null then
    raise exception 'Negocio no encontrado.';
  end if;

  if business_row.owner_id <> auth.uid() then
    raise exception 'El negocio no pertenece al usuario autenticado.';
  end if;

  select *
  into registration_row
  from public.registration_requests request
  where request.profile_id = profile_row.id
  for update;

  select *
  into existing_subscription
  from public.business_subscriptions subscription
  where subscription.business_id = business_row.id
  for update;

  if registration_row.id is not null
    and registration_row.subscription_applied_at is not null
  then
    if registration_row.applied_business_id is distinct from business_row.id then
      raise exception 'La solicitud de registro ya fue aplicada a otro negocio.';
    end if;

    if existing_subscription.id is null then
      raise exception 'La solicitud figura aplicada, pero el negocio no tiene suscripcion.';
    end if;
  end if;

  if existing_subscription.id is not null then
    select *
    into plan_row
    from public.plans plan
    where plan.id = existing_subscription.plan_id;

    business_subscription_id := existing_subscription.id;
    business_id := existing_subscription.business_id;
    plan_id := existing_subscription.plan_id;
    plan_code := plan_row.code;
    status := existing_subscription.status;
    starts_at := existing_subscription.starts_at;
    ends_at := existing_subscription.ends_at;
    trial_ends_at := existing_subscription.trial_ends_at;
    total_days := greatest(ceil(extract(epoch from (existing_subscription.ends_at - existing_subscription.starts_at)) / 86400)::integer, 0);
    effective_start := existing_subscription.starts_at;
    source := case when registration_row.id is null then 'legacy' else 'registration_request' end;
    already_created := true;
    return next;
    return;
  end if;

  if registration_row.id is null then
    select *
    into plan_row
    from public.plans plan
    where plan.code = 'premium'
      and plan.is_active = true
    limit 1;

    if plan_row.id is null then
      raise exception 'No se encontro un plan Premium activo.';
    end if;

    source_value := 'legacy';
    subscription_status_value := 'trialing';
    effective_start_value := now_value;
    total_days_value := 14;
    trial_ends_at_value := effective_start_value + make_interval(days => total_days_value);
  else
    source_value := 'registration_request';

    if registration_row.status <> 'approved' then
      raise exception 'La solicitud de registro no esta aprobada.';
    end if;

    if registration_row.approved_at is null or registration_row.activation_deadline is null then
      raise exception 'La solicitud aprobada no tiene fechas de activacion validas.';
    end if;

    if registration_row.requested_plan_id is null then
      raise exception 'La solicitud no tiene un plan solicitado valido.';
    end if;

    select *
    into plan_row
    from public.plans plan
    where plan.id = registration_row.requested_plan_id;

    if plan_row.id is null then
      raise exception 'El plan solicitado ya no existe.';
    end if;

    effective_start_value := least(now_value, registration_row.activation_deadline);

    if registration_row.requested_plan_code = 'trial' then
      if plan_row.code <> 'premium' then
        raise exception 'La prueba gratis debe estar asociada al plan Premium.';
      end if;

      subscription_status_value := 'trialing';
      total_days_value := registration_row.included_trial_days;
      trial_ends_at_value := effective_start_value + make_interval(days => total_days_value);
    elsif registration_row.requested_plan_code in ('agenda', 'premium') then
      if registration_row.payment_confirmed_at is null then
        raise exception 'El pago de la solicitud no ha sido confirmado.';
      end if;

      if plan_row.id <> registration_row.requested_plan_id then
        raise exception 'El plan solicitado no coincide con la solicitud.';
      end if;

      subscription_status_value := 'active';
      total_days_value := registration_row.included_trial_days + registration_row.purchased_period_days;
      trial_ends_at_value := null;
    else
      raise exception 'Tipo de plan de registro no soportado.';
    end if;

    if total_days_value <= 0 then
      raise exception 'La solicitud no tiene dias disponibles para aplicar.';
    end if;
  end if;

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
    plan_row.id,
    subscription_status_value,
    effective_start_value,
    effective_start_value + make_interval(days => total_days_value),
    trial_ends_at_value,
    null,
    case
      when source_value = 'legacy' then 'Prueba Premium de 14 dias creada automaticamente.'
      else 'Suscripcion inicial creada desde solicitud de registro #' || registration_row.id || '.'
    end
  )
  returning * into inserted_subscription;

  if registration_row.id is not null then
    update public.registration_requests
    set subscription_applied_at = now_value,
        applied_business_id = business_row.id
    where registration_requests.id = registration_row.id;
  end if;

  business_subscription_id := inserted_subscription.id;
  business_id := inserted_subscription.business_id;
  plan_id := inserted_subscription.plan_id;
  plan_code := plan_row.code;
  status := inserted_subscription.status;
  starts_at := inserted_subscription.starts_at;
  ends_at := inserted_subscription.ends_at;
  trial_ends_at := inserted_subscription.trial_ends_at;
  total_days := total_days_value;
  effective_start := effective_start_value;
  source := source_value;
  already_created := false;
  return next;
end;
$$;

create or replace function public.create_initial_business_trial()
returns public.business_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  created_result record;
  subscription_row public.business_subscriptions%rowtype;
begin
  select *
  into created_result
  from public.create_initial_business_subscription()
  limit 1;

  if created_result.business_subscription_id is null then
    raise exception 'No se pudo crear la suscripcion inicial.';
  end if;

  select *
  into subscription_row
  from public.business_subscriptions subscription
  where subscription.id = created_result.business_subscription_id;

  if subscription_row.id is null then
    raise exception 'No se encontro la suscripcion inicial.';
  end if;

  return subscription_row;
end;
$$;

revoke all on function public.create_initial_business_subscription() from public;
grant execute on function public.create_initial_business_subscription() to authenticated;

revoke all on function public.create_initial_business_trial() from public;
grant execute on function public.create_initial_business_trial() to authenticated;

commit;
