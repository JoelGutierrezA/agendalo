-- Enforce subscription-backed write access for internal appointments.

begin;

create or replace function public.can_operate_business(target_business_id bigint)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_platform_admin()
    or (
      auth.uid() is not null
      and exists (
        select 1
        from public.profiles p
        join public.businesses b on b.id = target_business_id
        where p.id = auth.uid()
          and p.is_active = true
          and p.business_id = target_business_id
      )
      and exists (
        select 1
        from public.business_subscriptions sub
        where sub.business_id = target_business_id
          and sub.status in ('trialing', 'active')
          and sub.ends_at > now()
      )
    );
$$;

drop policy if exists "tenant_crud_appointments" on public.appointments;
drop policy if exists "tenant_select_appointments" on public.appointments;
drop policy if exists "tenant_insert_active_appointments" on public.appointments;
drop policy if exists "tenant_update_active_appointments" on public.appointments;
drop policy if exists "tenant_delete_active_appointments" on public.appointments;

create policy "tenant_select_appointments"
on public.appointments for select
to authenticated
using (
  business_id = public.current_business_id()
  or public.is_platform_admin()
);

create policy "tenant_insert_active_appointments"
on public.appointments for insert
to authenticated
with check (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
  )
);

create policy "tenant_update_active_appointments"
on public.appointments for update
to authenticated
using (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
  )
)
with check (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
  )
);

create policy "tenant_delete_active_appointments"
on public.appointments for delete
to authenticated
using (
  public.is_platform_admin()
  or (
    business_id = public.current_business_id()
    and public.can_operate_business(business_id)
  )
);

revoke all on function public.can_operate_business(bigint) from public;
grant execute on function public.can_operate_business(bigint) to authenticated;

commit;
