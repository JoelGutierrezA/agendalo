-- Agendalo Supabase tenant owner policies
-- Lets the authenticated owner write tenant-scoped rows even during onboarding,
-- before or while profiles.business_id is being refreshed in the client.

create or replace function public.owns_business(target_business_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.businesses b
    where b.id = target_business_id
      and b.owner_id = auth.uid()
  );
$$;

drop policy if exists "tenant_select_business_settings" on public.business_settings;
drop policy if exists "tenant_write_business_settings" on public.business_settings;
drop policy if exists "public_select_booking_settings" on public.business_settings;

create policy "tenant_select_business_settings"
on public.business_settings for select
to authenticated
using (
  business_id = public.current_business_id()
  or public.owns_business(business_id)
  or public.is_platform_admin()
);

create policy "public_select_booking_settings"
on public.business_settings for select
to anon
using (allow_public_booking = true);

create policy "tenant_write_business_settings"
on public.business_settings for all
to authenticated
using (
  business_id = public.current_business_id()
  or public.owns_business(business_id)
  or public.is_platform_admin()
)
with check (
  business_id = public.current_business_id()
  or public.owns_business(business_id)
  or public.is_platform_admin()
);

drop policy if exists "tenant_select_opening_hours" on public.opening_hours;
drop policy if exists "tenant_write_opening_hours" on public.opening_hours;
drop policy if exists "public_select_opening_hours" on public.opening_hours;

create policy "tenant_select_opening_hours"
on public.opening_hours for select
to authenticated
using (
  business_id = public.current_business_id()
  or public.owns_business(business_id)
  or public.is_platform_admin()
);

create policy "public_select_opening_hours"
on public.opening_hours for select
to anon
using (
  exists (
    select 1
    from public.business_settings bs
    where bs.business_id = opening_hours.business_id
      and bs.allow_public_booking = true
  )
);

create policy "tenant_write_opening_hours"
on public.opening_hours for all
to authenticated
using (
  business_id = public.current_business_id()
  or public.owns_business(business_id)
  or public.is_platform_admin()
)
with check (
  business_id = public.current_business_id()
  or public.owns_business(business_id)
  or public.is_platform_admin()
);

drop policy if exists "tenant_write_services" on public.services;
drop policy if exists "tenant_select_services" on public.services;
drop policy if exists "public_select_active_services" on public.services;

create policy "tenant_select_services"
on public.services for select
to authenticated
using (
  business_id = public.current_business_id()
  or public.owns_business(business_id)
  or public.is_platform_admin()
);

create policy "public_select_active_services"
on public.services for select
to anon
using (
  is_active = true
  and exists (
    select 1
    from public.business_settings bs
    join public.businesses b on b.id = bs.business_id
    where bs.business_id = services.business_id
      and bs.allow_public_booking = true
      and b.is_active = true
  )
);

create policy "tenant_write_services"
on public.services for all
to authenticated
using (
  business_id = public.current_business_id()
  or public.owns_business(business_id)
  or public.is_platform_admin()
)
with check (
  business_id = public.current_business_id()
  or public.owns_business(business_id)
  or public.is_platform_admin()
);
