-- Agendalo Supabase public booking RPCs
-- Run this after the initial schema.
-- It keeps public booking available without granting broad anon access to clients
-- or appointments tables.

begin;

create or replace function public.get_public_availability(
  target_slug text,
  target_service_id bigint,
  target_date date
)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  business_row public.businesses%rowtype;
  service_row public.services%rowtype;
  opening_row public.opening_hours%rowtype;
  slot_start timestamptz;
  slot_end timestamptz;
  day_start timestamptz;
  day_end timestamptz;
  slots text[] := '{}';
begin
  select b.*
  into business_row
  from public.businesses b
  join public.business_settings bs on bs.business_id = b.id
  where b.slug = target_slug
    and b.is_active = true
    and bs.allow_public_booking = true
  limit 1;

  if business_row.id is null then
    return slots;
  end if;

  select *
  into service_row
  from public.services
  where id = target_service_id
    and business_id = business_row.id
    and is_active = true
  limit 1;

  if service_row.id is null then
    return slots;
  end if;

  select *
  into opening_row
  from public.opening_hours
  where business_id = business_row.id
    and day_of_week = extract(dow from target_date)::smallint
    and is_open = true
  limit 1;

  if opening_row.id is null or opening_row.open_time is null or opening_row.close_time is null then
    return slots;
  end if;

  slot_start := (target_date + opening_row.open_time) at time zone 'America/Santiago';
  day_start := target_date::timestamp at time zone 'America/Santiago';
  day_end := (target_date::timestamp + interval '1 day') at time zone 'America/Santiago';

  while (slot_start + make_interval(mins => service_row.duration_minutes)) <= ((target_date + opening_row.close_time) at time zone 'America/Santiago') loop
    slot_end := slot_start + make_interval(mins => service_row.duration_minutes);

    if slot_start > now()
      and not exists (
        select 1
        from public.appointments a
        where a.business_id = business_row.id
          and a.status in ('pending', 'confirmed')
          and a.scheduled_at >= day_start
          and a.scheduled_at < day_end
          and a.scheduled_at < slot_end
          and (a.scheduled_at + make_interval(mins => a.duration_minutes)) > slot_start
      )
    then
      slots := array_append(slots, to_char(slot_start at time zone 'America/Santiago', 'HH24:MI'));
    end if;

    slot_start := slot_start + interval '30 minutes';
  end loop;

  return slots;
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
  join public.business_settings bs on bs.business_id = b.id
  where b.slug = target_slug
    and b.is_active = true
    and bs.allow_public_booking = true
  limit 1;

  if business_row.id is null then
    raise exception 'Negocio no disponible para reservas publicas.';
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
    'pending',
    target_notes,
    true
  )
  returning id into appointment_id;

  return appointment_id;
end;
$$;

create or replace function public.get_public_booking_confirmation(target_appointment_id bigint)
returns table (
  business_name text,
  service_name text,
  client_name text,
  scheduled_at timestamptz,
  status text
)
language sql
security definer
set search_path = public
as $$
  select
    b.name as business_name,
    coalesce(s.name, 'Servicio') as service_name,
    a.client_name,
    a.scheduled_at,
    a.status
  from public.appointments a
  join public.businesses b on b.id = a.business_id
  left join public.services s on s.id = a.service_id
  where a.id = target_appointment_id
    and a.is_from_public = true
  limit 1;
$$;

grant execute on function public.get_public_availability(text, bigint, date) to anon, authenticated;
grant execute on function public.create_public_booking(text, bigint, date, time, text, text, text, text) to anon, authenticated;
grant execute on function public.get_public_booking_confirmation(bigint) to anon, authenticated;

commit;
