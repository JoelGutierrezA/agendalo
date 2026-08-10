-- Storage para iconos/logos de negocios.
-- La columna public.businesses.logo_url ya existe; este script solo crea el bucket y sus políticas.
-- Límite por archivo: 1 MB.

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

drop policy if exists "business_assets_public_read" on storage.objects;
create policy "business_assets_public_read"
on storage.objects for select
using (bucket_id = 'business-assets');

drop policy if exists "business_assets_owner_insert" on storage.objects;
create policy "business_assets_owner_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'business-assets'
  and exists (
    select 1
    from public.businesses b
    where b.id::text = (storage.foldername(name))[1]
      and b.owner_id = auth.uid()
  )
);

drop policy if exists "business_assets_owner_update" on storage.objects;
create policy "business_assets_owner_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'business-assets'
  and exists (
    select 1
    from public.businesses b
    where b.id::text = (storage.foldername(name))[1]
      and b.owner_id = auth.uid()
  )
)
with check (
  bucket_id = 'business-assets'
  and exists (
    select 1
    from public.businesses b
    where b.id::text = (storage.foldername(name))[1]
      and b.owner_id = auth.uid()
  )
);

drop policy if exists "business_assets_owner_delete" on storage.objects;
create policy "business_assets_owner_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'business-assets'
  and exists (
    select 1
    from public.businesses b
    where b.id::text = (storage.foldername(name))[1]
      and b.owner_id = auth.uid()
  )
);
