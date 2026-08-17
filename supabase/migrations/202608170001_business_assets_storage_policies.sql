insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-assets',
  'business-assets',
  true,
  1048576,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Business assets are publicly readable" on storage.objects;
drop policy if exists "Business users can upload business assets" on storage.objects;

create policy "Business assets are publicly readable"
on storage.objects
for select
using (bucket_id = 'business-assets');

create policy "Business users can upload business assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'business-assets'
  and exists (
    select 1
    from public.profiles
    where profiles.business_id::text = (storage.foldername(name))[1]
      and profiles.is_active = true
      and (
        profiles.id = auth.uid()
        or profiles.email = auth.jwt() ->> 'email'
      )
  )
);
