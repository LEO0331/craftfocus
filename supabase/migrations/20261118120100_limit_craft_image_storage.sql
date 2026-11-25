create schema if not exists craftfocus_private;

-- Supabase's Storage service supplies metadata.size on final writes. Count
-- older rows and preliminary authorization probes without a size at the
-- bucket's per-file limit. User-supplied user_metadata is never used.
create function craftfocus_private.craft_image_size(metadata jsonb)
returns bigint
language sql immutable
set search_path = ''
as $$
  select case
    when metadata->>'size' ~ '^[0-9]{1,15}$' then (metadata->>'size')::bigint
    else 10485760::bigint
  end;
$$;

revoke all on function craftfocus_private.craft_image_size(jsonb) from public, anon, authenticated;

create function craftfocus_private.enforce_craft_image_storage_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_prefix text := split_part(new.name, '/', 1);
  object_count bigint;
  stored_bytes numeric;
  keeps_same_prefix boolean := false;
  increases_bytes boolean := true;
begin
  -- Own-prefix RLS binds user uploads. Check the path even when Storage
  -- persists the authorized operation as its internal service role.
  if account_prefix !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return null;
  end if;

  -- Account deletion takes an exclusive lock on this row before its final
  -- Storage check. A stale or in-flight upload must not outlive the account.
  perform 1 from auth.users where id = account_prefix::uuid for key share;
  if not found then
    raise exception 'Upload account does not exist' using errcode = '23503';
  end if;

  -- Serialize writes to different keys in the same account. This AFTER
  -- trigger counts the candidate row (including upserts and moves). Use the
  -- Storage-managed name_prefix_search text_pattern_ops index for path bounds.
  perform pg_advisory_xact_lock(hashtextextended('craftfocus:craft-images:' || account_prefix, 0));
  select count(*), coalesce(sum(craftfocus_private.craft_image_size(metadata)), 0)
  into object_count, stored_bytes
  from storage.objects
  where bucket_id = 'craft-images'
    and name ~>=~ (account_prefix || '/')
    and name ~<~ (account_prefix || '0');

  if tg_op = 'UPDATE' then
    keeps_same_prefix := old.bucket_id = new.bucket_id and split_part(old.name, '/', 1) = account_prefix;
    if keeps_same_prefix then
      increases_bytes := craftfocus_private.craft_image_size(new.metadata) > craftfocus_private.craft_image_size(old.metadata);
    end if;
  end if;

  -- Existing accounts over a limit can still replace a file with a smaller
  -- one, or free space through the Storage API.
  if (object_count > 1000 and not keeps_same_prefix) or (stored_bytes > 536870912 and increases_bytes) then
    raise exception 'Craft image storage quota exceeded' using errcode = '23514';
  end if;
  return null;
end;
$$;

revoke all on function craftfocus_private.enforce_craft_image_storage_limit() from public, anon, authenticated;

create trigger craftfocus_craft_image_storage_limit
after insert or update of bucket_id, name, metadata on storage.objects
for each row when (new.bucket_id = 'craft-images')
execute function craftfocus_private.enforce_craft_image_storage_limit();
