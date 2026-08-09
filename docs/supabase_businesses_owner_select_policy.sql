-- Allow a business owner to read the business immediately after insert.
-- Without this, onboarding can insert a business but the returning select fails
-- before profiles.business_id is updated.

drop policy if exists "businesses_select_private_or_public" on public.businesses;

create policy "businesses_select_private_or_public"
on public.businesses for select
to anon, authenticated
using (
  public.is_platform_admin()
  or owner_id = auth.uid()
  or id = public.current_business_id()
  or (
    is_active = true
    and exists (
      select 1
      from public.business_settings bs
      where bs.business_id = businesses.id
        and bs.allow_public_booking = true
    )
  )
);
