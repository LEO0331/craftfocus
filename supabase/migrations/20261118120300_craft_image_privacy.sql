-- Keep public delivery working by URL while restricting object enumeration.
drop policy if exists craft_images_public_read on storage.objects;
drop policy if exists craft_images_owner_read on storage.objects;
create policy craft_images_owner_read on storage.objects
for select to authenticated
using (bucket_id = 'craft-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create function public.enforce_craft_image_urls()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_issuer text := auth.jwt()->>'iss';
  v_image text := new.image_url;
  v_pixel text := new.pixel_image_url;
  v_prefix text;
  v_url text;
begin
  if auth.uid() is null or new.listing_type <> 'custom' then
    return new;
  end if;

  -- Existing URLs may be left intact when editing or deactivating older posts.
  if tg_op = 'UPDATE' and new.user_id = old.user_id then
    if new.image_url is not distinct from old.image_url then v_image := null; end if;
    if new.pixel_image_url is not distinct from old.pixel_image_url then v_pixel := null; end if;
  end if;
  if v_image is null and v_pixel is null then
    return new;
  end if;

  -- Auth's signed issuer identifies the project, independent of request headers.
  if v_issuer is null or v_issuer !~ '^https://[a-z0-9-]+[.]supabase[.]co/auth/v1$' then
    raise exception 'Craft images require a Supabase project issuer' using errcode = '23514';
  end if;
  v_prefix := left(v_issuer, -length('/auth/v1')) || '/storage/v1/object/public/craft-images/' || new.user_id || '/';

  foreach v_url in array array[v_image, v_pixel] loop
    if v_url is not null and (
      not starts_with(v_url, v_prefix) or
      substr(v_url, length(v_prefix) + 1) !~ '^([A-Za-z0-9_-][A-Za-z0-9_.-]*/)*[A-Za-z0-9_-][A-Za-z0-9_.-]*$'
    ) then
      raise exception 'Craft images must use the owner''s project Storage path' using errcode = '23514';
    end if;
  end loop;
  return new;
end;
$$;

revoke execute on function public.enforce_craft_image_urls() from public, anon, authenticated;

create trigger trg_enforce_craft_image_urls
before insert or update of image_url, pixel_image_url, user_id on public.craft_posts
for each row execute function public.enforce_craft_image_urls();

create or replace function public.deployment_contract_version()
returns text
language sql
stable
security invoker
set search_path = ''
as $$ select '2026-11-18.1'::text $$;
