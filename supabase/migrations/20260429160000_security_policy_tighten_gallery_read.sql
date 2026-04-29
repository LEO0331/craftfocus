drop policy if exists "custom_gallery_public_read" on public.custom_gallery_placements;

create policy "custom_gallery_authenticated_read"
on public.custom_gallery_placements
for select
to authenticated
using (true);

