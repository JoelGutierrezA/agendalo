-- Send subscription transfer instructions before allowing payment confirmation.

begin;

alter table public.subscription_requests
  add column if not exists instructions_email_id text;

create or replace function public.mark_subscription_request_instructions_sent(
  target_request_id bigint,
  target_provider_message_id text default null
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
    raise exception 'No tienes permisos para enviar instrucciones.';
  end if;

  select *
  into request_row
  from public.subscription_requests
  where id = target_request_id
  for update;

  if request_row.id is null then
    raise exception 'Solicitud no encontrada.';
  end if;

  if request_row.status <> 'pending' then
    raise exception 'Solo se pueden enviar instrucciones a solicitudes pendientes.';
  end if;

  update public.subscription_requests
  set status = 'instructions_sent',
      instructions_sent_at = now(),
      instructions_email_id = nullif(trim(target_provider_message_id), '')
  where id = request_row.id
  returning * into updated_request;

  return updated_request;
end;
$$;

revoke all on function public.mark_subscription_request_instructions_sent(bigint, text) from public;
grant execute on function public.mark_subscription_request_instructions_sent(bigint, text) to authenticated;

commit;
