-- Track registration request emails and keep state changes server-side.

begin;

alter table public.registration_requests
  add column if not exists instructions_email_id text,
  add column if not exists activation_email_sent_at timestamptz,
  add column if not exists activation_email_id text;

drop function if exists public.mark_registration_request_instructions_sent(bigint);

create or replace function public.mark_registration_request_instructions_sent(
  target_request_id bigint,
  target_provider_message_id text default null
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
      instructions_sent_at = now(),
      instructions_email_id = nullif(trim(target_provider_message_id), '')
  where id = request_row.id
  returning * into updated_request;

  return updated_request;
end;
$$;

create or replace function public.mark_registration_activation_email_sent(
  target_request_id bigint,
  target_provider_message_id text
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
    raise exception 'No tienes permisos para marcar correo de activacion.';
  end if;

  select *
  into request_row
  from public.registration_requests
  where id = target_request_id
  for update;

  if request_row.id is null then
    raise exception 'Solicitud de registro no encontrada.';
  end if;

  if request_row.status <> 'approved' then
    raise exception 'Solo se puede marcar correo de activacion en registros aprobados.';
  end if;

  update public.registration_requests
  set activation_email_sent_at = now(),
      activation_email_id = nullif(trim(target_provider_message_id), '')
  where id = request_row.id
  returning * into updated_request;

  return updated_request;
end;
$$;

revoke all on function public.mark_registration_request_instructions_sent(bigint, text) from public;
grant execute on function public.mark_registration_request_instructions_sent(bigint, text) to authenticated;

revoke all on function public.mark_registration_activation_email_sent(bigint, text) from public;
grant execute on function public.mark_registration_activation_email_sent(bigint, text) to authenticated;

commit;
