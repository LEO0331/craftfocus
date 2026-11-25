-- Run after all migrations in a disposable database.
begin;

do $$ begin
  assert has_function_privilege('service_role', 'public.list_account_storage_objects(uuid)', 'execute');
  assert not has_function_privilege('anon', 'public.list_account_storage_objects(uuid)', 'execute');
  assert not has_function_privilege('authenticated', 'public.list_account_storage_objects(uuid)', 'execute');
  assert not has_function_privilege('anon', 'public.delete_my_account()', 'execute');
end $$;

insert into auth.users(id) values
  ('60000000-0000-0000-0000-000000000001'),
  ('60000002-0000-0000-0000-000000000002');

insert into storage.objects(id, bucket_id, name, owner, owner_id, metadata) values
  ('60000000-0000-0000-0000-000000000011', 'craft-images',
    '60000000-0000-0000-0000-000000000001/avatars/first.png', null,
    '60000000-0000-0000-0000-000000000001', '{"size":5}'),
  ('60000000-0000-0000-0000-000000000012', 'craft-images',
    '60000000-0000-0000-0000-000000000001/legacy.png',
    '60000000-0000-0000-0000-000000000001', null, '{"size":5}'),
  ('60000000-0000-0000-0000-000000000013', 'craft-images',
    '60000002-0000-0000-0000-000000000002/another.png', null,
    '60000002-0000-0000-0000-000000000002', '{"size":5}');

set local role service_role;
do $$ begin
  assert (
    select array_agg(object_name order by object_name)
    from public.list_account_storage_objects('60000000-0000-0000-0000-000000000001')
  ) = array[
    '60000000-0000-0000-0000-000000000001/avatars/first.png',
    '60000000-0000-0000-0000-000000000001/legacy.png'
  ], 'Only objects belonging to the requested user must be returned';
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '60000000-0000-0000-0000-000000000001', true);
do $$ begin
  begin
    perform public.delete_my_account();
    raise exception 'Deletion should wait for Storage cleanup';
  exception when sqlstate '55000' then
    null;
  end;
end $$;

reset role;
-- Simulate successful Storage API removal in this disposable metadata stub.
delete from storage.objects where id in (
  '60000000-0000-0000-0000-000000000011',
  '60000000-0000-0000-0000-000000000012'
);

set local role authenticated;
select public.delete_my_account();
reset role;
do $$ begin
  assert not exists (select 1 from auth.users where id = '60000000-0000-0000-0000-000000000001');
  assert exists (select 1 from auth.users where id = '60000002-0000-0000-0000-000000000002');
  assert exists (select 1 from storage.objects where id = '60000000-0000-0000-0000-000000000013');
end $$;

rollback;
