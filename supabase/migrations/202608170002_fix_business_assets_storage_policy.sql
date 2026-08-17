create or replace function public.can_manage_business_assets(folder_name text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.businesses b
    where b.id::text = folder_name
      and b.is_active = true
      and b.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles p
    where p.business_id::text = folder_name
      and p.is_active = true
      and (
        p.id = auth.uid()
        or p.email = auth.jwt() ->> 'email'
      )
  );
$$;

revoke all on function public.can_manage_business_assets(text) from public;
grant execute on function public.can_manage_business_assets(text) to authenticated;

drop policy if exists "Business users can upload business assets" on storage.objects;

create policy "Business users can upload business assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'business-assets'
  and public.can_manage_business_assets((storage.foldername(name))[1])
);
