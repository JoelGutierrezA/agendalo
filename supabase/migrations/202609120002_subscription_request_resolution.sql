-- Resolve subscription requests from platform admin without client-side subscription writes.

begin;

create or replace function public.complete_subscription_request(
  target_request_id bigint,
  target_admin_notes text default null
)
returns table (
  request_id bigint,
  business_id bigint,
  plan_id bigint,
  plan_code text,
  plan_name text,
  previous_ends_at timestamptz,
  new_ends_at timestamptz,
  preserved_days integer,
  added_days integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.subscription_requests%rowtype;
  business_row public.businesses%rowtype;
  requested_plan_row public.plans%rowtype;
  current_subscription_row public.business_subscriptions%rowtype;
  now_value timestamptz := now();
  base_end_value timestamptz;
  new_ends_at_value timestamptz;
  starts_at_value timestamptz;
  preserved_days_value integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Sesion no disponible.';
  end if;

  if not public.is_platform_admin() then
    raise exception 'No tienes permisos para completar solicitudes.';
  end if;

  select *
  into request_row
  from public.subscription_requests
  where id = target_request_id
  for update;

  if request_row.id is null then
    raise exception 'Solicitud no encontrada.';
  end if;

  if request_row.status <> 'instructions_sent' then
    raise exception 'Solo se pueden completar solicitudes con instrucciones enviadas.';
  end if;

  if request_row.requested_period_days <= 0 then
    raise exception 'La solicitud no tiene un periodo valido.';
  end if;

  select *
  into business_row
  from public.businesses
  where id = request_row.business_id;

  if business_row.id is null then
    raise exception 'Negocio no encontrado.';
  end if;

  select *
  into requested_plan_row
  from public.plans
  where id = request_row.requested_plan_id;

  if requested_plan_row.id is null then
    raise exception 'Plan solicitado no encontrado.';
  end if;

  select *
  into current_subscription_row
  from public.business_subscriptions
  where business_subscriptions.business_id = request_row.business_id
  for update;

  previous_ends_at := current_subscription_row.ends_at;

  if current_subscription_row.id is not null
    and current_subscription_row.ends_at > now_value
  then
    base_end_value := current_subscription_row.ends_at;
    preserved_days_value := ceil(extract(epoch from (current_subscription_row.ends_at - now_value)) / 86400)::integer;
  else
    base_end_value := now_value;
  end if;

  new_ends_at_value := base_end_value + make_interval(days => request_row.requested_period_days);

  if current_subscription_row.id is not null
    and current_subscription_row.status = 'active'
    and current_subscription_row.plan_id = request_row.requested_plan_id
    and current_subscription_row.ends_at > now_value
  then
    starts_at_value := current_subscription_row.starts_at;
  else
    starts_at_value := now_value;
  end if;

  if current_subscription_row.id is null then
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
      request_row.business_id,
      request_row.requested_plan_id,
      'active',
      starts_at_value,
      new_ends_at_value,
      null,
      null,
      'Suscripcion aplicada desde solicitud #' || request_row.id || '.'
    );
  else
    update public.business_subscriptions
    set plan_id = request_row.requested_plan_id,
        status = 'active',
        starts_at = starts_at_value,
        ends_at = new_ends_at_value,
        trial_ends_at = null,
        cancelled_at = null,
        notes = 'Suscripcion aplicada desde solicitud #' || request_row.id || '.'
    where id = current_subscription_row.id;
  end if;

  update public.subscription_requests
  set status = 'completed',
      completed_at = now_value,
      completed_by = auth.uid(),
      admin_notes = coalesce(nullif(trim(target_admin_notes), ''), subscription_requests.admin_notes)
  where id = request_row.id;

  request_id := request_row.id;
  business_id := request_row.business_id;
  plan_id := requested_plan_row.id;
  plan_code := requested_plan_row.code;
  plan_name := requested_plan_row.name;
  new_ends_at := new_ends_at_value;
  preserved_days := preserved_days_value;
  added_days := request_row.requested_period_days;

  return next;
end;
$$;

create or replace function public.cancel_subscription_request(
  target_request_id bigint,
  target_admin_notes text default null
)
returns public.subscription_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.subscription_requests%rowtype;
  updated_request public.subscription_requests%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sesion no disponible.';
  end if;

  if not public.is_platform_admin() then
    raise exception 'No tienes permisos para cancelar solicitudes.';
  end if;

  select *
  into request_row
  from public.subscription_requests
  where id = target_request_id
  for update;

  if request_row.id is null then
    raise exception 'Solicitud no encontrada.';
  end if;

  if request_row.status not in ('pending', 'instructions_sent') then
    raise exception 'Solo se pueden cancelar solicitudes pendientes o con instrucciones enviadas.';
  end if;

  update public.subscription_requests
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = auth.uid(),
      admin_notes = coalesce(nullif(trim(target_admin_notes), ''), subscription_requests.admin_notes)
  where id = request_row.id
  returning * into updated_request;

  return updated_request;
end;
$$;

revoke all on function public.complete_subscription_request(bigint, text) from public;
grant execute on function public.complete_subscription_request(bigint, text) to authenticated;

revoke all on function public.cancel_subscription_request(bigint, text) from public;
grant execute on function public.cancel_subscription_request(bigint, text) to authenticated;

commit;
