-- Run after all CraftFocus migrations on the disposable database.
begin;

insert into auth.users(id) values
  ('70000000-0000-0000-0000-000000000001'),
  ('70000002-0000-0000-0000-000000000002');

-- Just below 512 MiB. A malformed size is conservatively counted as 10 MiB.
insert into storage.objects (id, bucket_id, name, metadata)
select gen_random_uuid(),
       'craft-images',
       '70000000-0000-0000-0000-000000000001/' || n || '.jpg',
       case when n = 1 then '{"size":"unknown"}'::jsonb else '{"size":10485760}'::jsonb end
from generate_series(1, 51) n;

insert into storage.objects (id, bucket_id, name, metadata) values
  (gen_random_uuid(), 'craft-images', '70000000-0000-0000-0000-000000000001/remaining.jpg', '{"size":2097152}'),
  (gen_random_uuid(), 'craft-images', '70000002-0000-0000-0000-000000000002/independent.jpg', '{"size":10485760}');

do $$
begin
  begin
    insert into storage.objects (id, bucket_id, name, metadata)
    values (gen_random_uuid(), 'craft-images', '70000000-0000-0000-0000-000000000001/over.jpg', '{"size":1}');
    raise exception 'Expected new object to exceed the per-account image byte limit';
  exception when check_violation then
    if sqlerrm <> 'Craft image storage quota exceeded' then raise; end if;
  end;

  begin
    update storage.objects
    set metadata = '{"size":2097153}'
    where name = '70000000-0000-0000-0000-000000000001/remaining.jpg';
    raise exception 'Expected replacement to exceed the per-account image byte limit';
  exception when check_violation then
    if sqlerrm <> 'Craft image storage quota exceeded' then raise; end if;
  end;

  begin
    insert into storage.objects (id, bucket_id, name, metadata)
    values (gen_random_uuid(), 'craft-images', '70000000-0000-0000-0000-000000000003/stale.jpg', '{"size":1}');
    raise exception 'Expected a deleted or absent account prefix to reject uploads';
  exception when foreign_key_violation then
    if sqlerrm <> 'Upload account does not exist' then raise; end if;
  end;
end;
$$;

update storage.objects
set metadata = '{"size":1}'
where name = '70000000-0000-0000-0000-000000000001/remaining.jpg';

insert into storage.objects (id, bucket_id, name, metadata)
values (gen_random_uuid(), 'craft-images', '70000000-0000-0000-0000-000000000001/fits.jpg', '{"size":2097151}');

-- The object ceiling applies even if files are tiny.
insert into storage.objects (id, bucket_id, name, metadata)
select gen_random_uuid(), 'craft-images', '70000002-0000-0000-0000-000000000002/small-' || n || '.jpg', '{"size":1}'
from generate_series(1, 999) n;

do $$
begin
  begin
    insert into storage.objects (id, bucket_id, name, metadata)
    values (gen_random_uuid(), 'craft-images', '70000002-0000-0000-0000-000000000002/over.jpg', '{"size":1}');
    raise exception 'Expected the per-account image object limit';
  exception when check_violation then
    if sqlerrm <> 'Craft image storage quota exceeded' then raise; end if;
  end;
end;
$$;

rollback;

-- Different keys must share the same account quota under concurrent uploads.
create extension if not exists dblink;
insert into auth.users(id) values ('70000004-0000-0000-0000-000000000004');
insert into storage.objects (id, bucket_id, name, metadata)
select gen_random_uuid(), 'craft-images', '70000004-0000-0000-0000-000000000004/' || n || '.jpg',
       case when n = 52 then '{"size":1048576}'::jsonb else '{"size":10485760}'::jsonb end
from generate_series(1, 52) n;

select dblink_connect('quota_a', format('host=%s port=%s dbname=%s user=%s',
  inet_server_addr(), inet_server_port(), current_database(), current_user));
select dblink_connect('quota_b', format('host=%s port=%s dbname=%s user=%s',
  inet_server_addr(), inet_server_port(), current_database(), current_user));

begin;
select pg_advisory_xact_lock(hashtextextended('craftfocus:craft-images:70000004-0000-0000-0000-000000000004', 0));
select dblink_send_query('quota_a', $$
  insert into storage.objects (id, bucket_id, name, metadata)
  values (gen_random_uuid(), 'craft-images', '70000004-0000-0000-0000-000000000004/first-race.jpg', '{"size":1048576}')
  returning name
$$);
select dblink_send_query('quota_b', $$
  insert into storage.objects (id, bucket_id, name, metadata)
  values (gen_random_uuid(), 'craft-images', '70000004-0000-0000-0000-000000000004/second-race.jpg', '{"size":1048576}')
  returning name
$$);
select pg_sleep(0.2);
commit;

select * from dblink_get_result('quota_a', false) as result(name text);
select * from dblink_get_result('quota_b', false) as result(name text);
do $$
begin
  assert (
    select count(*) from storage.objects where bucket_id = 'craft-images' and name in (
      '70000004-0000-0000-0000-000000000004/first-race.jpg',
      '70000004-0000-0000-0000-000000000004/second-race.jpg'
    )
  ) = 1, 'Only one simultaneous upload may use the final 1 MiB';
end;
$$;

select dblink_disconnect('quota_a');
select dblink_disconnect('quota_b');
delete from storage.objects where bucket_id = 'craft-images' and name like '70000004-0000-0000-0000-000000000004/%';
delete from auth.users where id = '70000004-0000-0000-0000-000000000004';
