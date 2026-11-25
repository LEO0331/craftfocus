-- Only the deletion Edge Function needs to enumerate a user's stored files.
-- The Storage API, rather than SQL, removes the objects and their underlying bytes.
create function public.list_account_storage_objects(p_user_id uuid)
returns table (bucket_id text, object_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select object.bucket_id, object.name
  from storage.objects as object
  where object.owner_id = p_user_id::text
     or (object.owner_id is null and to_jsonb(object)->>'owner' = p_user_id::text)
  order by object.bucket_id, object.name
  limit 100;
$$;

revoke all on function public.list_account_storage_objects(uuid) from public, anon, authenticated;
grant execute on function public.list_account_storage_objects(uuid) to service_role;

-- Keep legacy clients' self-delete path for accounts with no remaining files.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- The craft-images upload trigger takes a conflicting lock on this same user
  -- row before accepting the upload. It also rejects writes after deletion.
  perform 1 from auth.users where id = v_uid for update;
  if not found then
    return;
  end if;

  if exists (select 1 from public.list_account_storage_objects(v_uid)) then
    raise exception 'Account still owns Storage objects' using errcode = '55000';
  end if;

  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
