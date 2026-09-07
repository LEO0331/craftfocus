-- Disposable local database only; requires trust auth and the dblink extension.
-- Run with psql -v ON_ERROR_STOP=1 after all migrations.
create extension if not exists dblink;
insert into public.item_catalog(id,name,category) values ('plant','Plant','decor') on conflict do nothing;
insert into auth.users(id) values ('30000000-0000-0000-0000-000000000003');
select set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000003',false);
select public.place_inventory_at_anchor((select id from public.rooms where user_id=auth.uid()),'plant','race');
select id as placement_id from public.room_placements where room_id=(select id from public.rooms where user_id=auth.uid()) \gset
select dblink_connect('a',format('host=%s port=%s dbname=%s user=%s',inet_server_addr(),inet_server_port(),current_database(),current_user));
select dblink_connect('b',format('host=%s port=%s dbname=%s user=%s',inet_server_addr(),inet_server_port(),current_database(),current_user));
select dblink_exec('a','set role authenticated');
select dblink_exec('b','set role authenticated');
select dblink_exec('a',$$set request.jwt.claim.sub='30000000-0000-0000-0000-000000000003'$$);
select dblink_exec('b',$$set request.jwt.claim.sub='30000000-0000-0000-0000-000000000003'$$);
begin;
select id from public.rooms where user_id=auth.uid() for update;
select dblink_send_query('a',format('select public.remove_room_placement(%L)',:'placement_id'));
select dblink_send_query('b',format('select public.remove_room_placement(%L)',:'placement_id'));
-- Both callers queue behind the same room lock before it is released.
select pg_sleep(0.2);
commit;
select * from dblink_get_result('a',false) as result(value text);
select * from dblink_get_result('b',false) as result(value text);
do $$ begin
  assert (select quantity from public.user_inventory where user_id=auth.uid() and item_id='plant')=1,
    'Concurrent removals must refund exactly one item';
  assert not exists(select 1 from public.room_placements where room_id=(select id from public.rooms where user_id=auth.uid())),
    'Placement must be removed';
end $$;
-- Drain the asynchronous command terminators before reusing connections.
select * from dblink_get_result('a',false) as result(value text);
select * from dblink_get_result('b',false) as result(value text);
select public.start_focus_session(60,'general') as run_id \gset
update public.focus_session_runs set started_at=clock_timestamp()-interval '61 minutes' where id=:'run_id';
begin;
select pg_advisory_xact_lock(hashtextextended('focus:' || auth.uid()::text,0));
select dblink_send_query('a',format('select coins from public.award_seeds_for_session(%L::uuid,%L)',:'run_id','completed'));
select dblink_send_query('b',format('select coins from public.award_seeds_for_session(%L::uuid,%L)',:'run_id','completed'));
select pg_sleep(0.2);
commit;
select * from dblink_get_result('a') as result(coins integer);
select * from dblink_get_result('b') as result(coins integer);
do $$ begin
  assert (select seeds_balance from public.user_wallets where user_id=auth.uid())=75,
    'Concurrent finishes must award exactly once';
  assert (select count(*) from public.focus_sessions where user_id=auth.uid())=1,
    'Concurrent finishes must create exactly one history row';
end $$;
select dblink_disconnect('a');
select dblink_disconnect('b');
delete from auth.users where id='30000000-0000-0000-0000-000000000003';
