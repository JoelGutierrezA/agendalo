-- Add safe admin-only transitions for registration requests without creating subscriptions.

begin;

create or replace function public.approve_trial_registration_request(
  target_request_id bigint,
  target_admin_notes text default null
)
returns public.registration_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.registration_requests%rowtype;
  profile_row public.profiles%rowtype;
  updated_request public.registration_requests%rowtype;
  now_value timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'Sesion no disponible.';
  end if;

  if not public.is_platform_admin() then
    raise exception 'No tienes permisos para aprobar registros.';
  end if;

  select *
  into request_row
  from public.registration_requests
  where id = target_request_id
  for update;

  if request_row.id is null then
    raise exception 'Solicitud de registro no encontrada.';
  end if;

  if request_row.requested_plan_code <> 'trial' then
    raise exception 'Esta solicitud no corresponde a una prueba gratis.';
  end if;

  if request_row.status <> 'pending_approval' then
    raise exception 'Solo se pueden aprobar pruebas pendientes de aprobacion.';
  end if;

  select *
  into profile_row
  from public.profiles
  where id = request_row.profile_id
  for update;

  if profile_row.id is null then
    raise exception 'Perfil no encontrado.';
  end if;

  if profile_row.is_active is true then
    raise exception 'El perfil ya esta activo.';
  end if;

  update public.profiles
  set is_active = true
  where id = profile_row.id;

  update public.registration_requests
  set status = 'approved',
      approved_at = now_value,
      activation_deadline = now_value + interval '5 days',
      admin_notes = coalesce(nullif(trim(target_admin_notes), ''), registration_requests.admin_notes)
  where id = request_row.id
  returning * into updated_request;

  return updated_request;
end;
$$;

create or replace function public.mark_registration_request_instructions_sent(
  target_request_id bigint
)
returns public.registration_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.registration_requests%rowtype;
  updated_request public.registration_requests%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sesion no disponible.';
  end if;

  if not public.is_platform_admin() then
    raise exception 'No tienes permisos para marcar instrucciones.';
  end if;

  select *
  into request_row
  from public.registration_requests
  where id = target_request_id
  for update;

  if request_row.id is null then
    raise exception 'Solicitud de registro no encontrada.';
  end if;

  if request_row.requested_plan_code not in ('agenda', 'premium') then
    raise exception 'Solo los registros con plan pueden recibir instrucciones.';
  end if;

  if request_row.status <> 'pending_payment' then
    raise exception 'Solo se pueden marcar instrucciones en registros pendientes de pago.';
  end if;

  update public.registration_requests
  set status = 'instructions_sent',
      instructions_sent_at = now()
  where id = request_row.id
  returning * into updated_request;

  return updated_request;
end;
$$;

create or replace function public.complete_paid_registration_request(
  target_request_id bigint,
  target_admin_notes text default null
)
returns public.registration_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.registration_requests%rowtype;
  profile_row public.profiles%rowtype;
  updated_request public.registration_requests%rowtype;
  now_value timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'Sesion no disponible.';
  end if;

  if not public.is_platform_admin() then
    raise exception 'No tienes permisos para completar registros.';
  end if;

  select *
  into request_row
  from public.registration_requests
  where id = target_request_id
  for update;

  if request_row.id is null then
    raise exception 'Solicitud de registro no encontrada.';
  end if;

  if request_row.requested_plan_code not in ('agenda', 'premium') then
    raise exception 'Solo los registros con plan pueden completarse por pago.';
  end if;

  if request_row.status <> 'instructions_sent' then
    raise exception 'Solo se pueden confirmar pagos con instrucciones enviadas.';
  end if;

  select *
  into profile_row
  from public.profiles
  where id = request_row.profile_id
  for update;

  if profile_row.id is null then
    raise exception 'Perfil no encontrado.';
  end if;

  if profile_row.is_active is true then
    raise exception 'El perfil ya esta activo.';
  end if;

  update public.profiles
  set is_active = true
  where id = profile_row.id;

  update public.registration_requests
  set status = 'approved',
      payment_confirmed_at = now_value,
      payment_confirmed_by = auth.uid(),
      approved_at = now_value,
      activation_deadline = now_value + interval '5 days',
      admin_notes = coalesce(nullif(trim(target_admin_notes), ''), registration_requests.admin_notes)
  where id = request_row.id
  returning * into updated_request;

  return updated_request;
end;
$$;

create or replace function public.cancel_registration_request(
  target_request_id bigint,
  target_admin_notes text default null
)
returns public.registration_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.registration_requests%rowtype;
  updated_request public.registration_requests%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sesion no disponible.';
  end if;

  if not public.is_platform_admin() then
    raise exception 'No tienes permisos para cancelar registros.';
  end if;

  select *
  into request_row
  from public.registration_requests
  where id = target_request_id
  for update;

  if request_row.id is null then
    raise exception 'Solicitud de registro no encontrada.';
  end if;

  if request_row.status not in ('pending_approval', 'pending_payment', 'instructions_sent') then
    raise exception 'Solo se pueden cancelar registros abiertos.';
  end if;

  update public.registration_requests
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = auth.uid(),
      admin_notes = coalesce(nullif(trim(target_admin_notes), ''), registration_requests.admin_notes)
  where id = request_row.id
  returning * into updated_request;

  return updated_request;
end;
$$;

revoke all on function public.approve_trial_registration_request(bigint, text) from public;
grant execute on function public.approve_trial_registration_request(bigint, text) to authenticated;

revoke all on function public.mark_registration_request_instructions_sent(bigint) from public;
grant execute on function public.mark_registration_request_instructions_sent(bigint) to authenticated;

revoke all on function public.complete_paid_registration_request(bigint, text) from public;
grant execute on function public.complete_paid_registration_request(bigint, text) to authenticated;

revoke all on function public.cancel_registration_request(bigint, text) from public;
grant execute on function public.cancel_registration_request(bigint, text) to authenticated;

commit;
