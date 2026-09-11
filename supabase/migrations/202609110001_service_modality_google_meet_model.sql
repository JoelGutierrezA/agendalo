-- Add service modality and Google Meet snapshot fields without enabling Meet generation yet.

begin;

alter table public.services
  add column if not exists modality text not null default 'presencial',
  add column if not exists generate_google_meet boolean not null default false;

update public.services
set modality = coalesce(modality, 'presencial'),
    generate_google_meet = coalesce(generate_google_meet, false);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'services_modality_check'
      and conrelid = 'public.services'::regclass
  ) then
    alter table public.services
      add constraint services_modality_check
      check (modality in ('presencial', 'online'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'services_meet_requires_online_check'
      and conrelid = 'public.services'::regclass
  ) then
    alter table public.services
      add constraint services_meet_requires_online_check
      check (not (modality = 'presencial' and generate_google_meet = true));
  end if;
end;
$$;

alter table public.appointments
  add column if not exists service_modality text,
  add column if not exists generate_google_meet boolean not null default false,
  add column if not exists google_meet_url text,
  add column if not exists google_conference_id text,
  add column if not exists google_conference_status text not null default 'none';

update public.appointments
set generate_google_meet = coalesce(generate_google_meet, false),
    google_conference_status = coalesce(google_conference_status, 'none');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_service_modality_check'
      and conrelid = 'public.appointments'::regclass
  ) then
    alter table public.appointments
      add constraint appointments_service_modality_check
      check (service_modality is null or service_modality in ('presencial', 'online'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_google_conference_status_check'
      and conrelid = 'public.appointments'::regclass
  ) then
    alter table public.appointments
      add constraint appointments_google_conference_status_check
      check (google_conference_status in ('none', 'pending', 'created', 'failed'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_meet_requires_online_check'
      and conrelid = 'public.appointments'::regclass
  ) then
    alter table public.appointments
      add constraint appointments_meet_requires_online_check
      check (not (service_modality = 'presencial' and generate_google_meet = true));
  end if;
end;
$$;

create or replace function public.create_public_booking(
  target_slug text,
  target_service_id bigint,
  target_date date,
  target_time time,
  target_client_name text,
  target_client_email text,
  target_client_phone text,
  target_notes text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  business_row public.businesses%rowtype;
  service_row public.services%rowtype;
  opening_row public.opening_hours%rowtype;
  client_row public.clients%rowtype;
  appointment_id bigint;
  scheduled_at_value timestamptz;
  ends_at_value timestamptz;
begin
  select b.*
  into business_row
  from public.businesses b
  join public.business_settings settings on settings.business_id = b.id
  where b.slug = target_slug
    and b.is_active = true
    and settings.allow_public_booking = true
  limit 1;

  if business_row.id is null then
    raise exception 'Negocio no disponible para reservas publicas.';
  end if;

  if not public.is_business_subscription_active(business_row.id) then
    raise exception 'Este negocio no tiene reservas publicas activas en este momento.';
  end if;

  select *
  into service_row
  from public.services
  where id = target_service_id
    and business_id = business_row.id
    and is_active = true
  limit 1;

  if service_row.id is null then
    raise exception 'Servicio no disponible.';
  end if;

  scheduled_at_value := (target_date + target_time) at time zone 'America/Santiago';
  ends_at_value := scheduled_at_value + make_interval(mins => service_row.duration_minutes);

  select *
  into opening_row
  from public.opening_hours
  where business_id = business_row.id
    and day_of_week = extract(dow from target_date)::smallint
    and is_open = true
  limit 1;

  if opening_row.id is null
    or scheduled_at_value < ((target_date + opening_row.open_time) at time zone 'America/Santiago')
    or ends_at_value > ((target_date + opening_row.close_time) at time zone 'America/Santiago')
  then
    raise exception 'La cita esta fuera del horario de atencion.';
  end if;

  if scheduled_at_value <= now() then
    raise exception 'No se puede reservar un horario pasado.';
  end if;

  if exists (
    select 1
    from public.appointments a
    where a.business_id = business_row.id
      and a.status in ('pending', 'confirmed')
      and a.scheduled_at < ends_at_value
      and (a.scheduled_at + make_interval(mins => a.duration_minutes)) > scheduled_at_value
  ) then
    raise exception 'Este horario ya no esta disponible. Por favor elige otro.';
  end if;

  select *
  into client_row
  from public.clients
  where business_id = business_row.id
    and lower(email) = lower(target_client_email)
  limit 1;

  if client_row.id is null then
    insert into public.clients (business_id, name, email, phone)
    values (business_row.id, target_client_name, target_client_email, target_client_phone)
    returning * into client_row;
  else
    update public.clients
    set name = target_client_name,
        phone = target_client_phone
    where id = client_row.id
    returning * into client_row;
  end if;

  insert into public.appointments (
    business_id,
    client_id,
    service_id,
    client_name,
    client_email,
    client_phone,
    scheduled_at,
    duration_minutes,
    service_modality,
    generate_google_meet,
    status,
    notes,
    is_from_public
  )
  values (
    business_row.id,
    client_row.id,
    service_row.id,
    target_client_name,
    target_client_email,
    target_client_phone,
    scheduled_at_value,
    service_row.duration_minutes,
    service_row.modality,
    service_row.generate_google_meet,
    'pending',
    target_notes,
    true
  )
  returning id into appointment_id;

  return appointment_id;
end;
$$;

grant execute on function public.create_public_booking(text, bigint, date, time, text, text, text, text) to anon, authenticated;

commit;
