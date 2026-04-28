-- CraftFocus storage bucket + safe default RLS policies
-- Bucket: craft-images
-- Path convention enforced by policy: <auth.uid()>/...

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'craft-images',
  'craft-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "craft_images_public_read" on storage.objects;
create policy "craft_images_public_read"
on storage.objects
for select
to public
using (bucket_id = 'craft-images');

drop policy if exists "craft_images_auth_insert_own_prefix" on storage.objects;
create policy "craft_images_auth_insert_own_prefix"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'craft-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "craft_images_auth_update_own_prefix" on storage.objects;
create policy "craft_images_auth_update_own_prefix"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'craft-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'craft-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "craft_images_auth_delete_own_prefix" on storage.objects;
create policy "craft_images_auth_delete_own_prefix"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'craft-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
