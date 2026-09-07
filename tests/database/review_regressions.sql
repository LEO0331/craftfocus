-- Run after all migrations in a disposable database: psql -v ON_ERROR_STOP=1 -f this-file.
begin;
insert into public.item_catalog(id,name,category) values ('plant','Plant','decor'),('desk_lamp','Lamp','decor'),('bookshelf','Shelf','decor') on conflict do nothing;
insert into auth.users(id) values ('10000000-0000-0000-0000-000000000001'),('20000000-0000-0000-0000-000000000002');
insert into public.user_inventory(user_id,item_id,quantity) values
('10000000-0000-0000-0000-000000000001','plant',2),('10000000-0000-0000-0000-000000000001','desk_lamp',1)
on conflict (user_id,item_id) do update set quantity=excluded.quantity;
create function pg_temp.expect_error(statement text) returns void language plpgsql as $$
begin
  begin execute statement;
  exception when others then return;
  end;
  raise exception 'Expected error: %',statement;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ declare r uuid; p uuid; n integer; s uuid; s2 uuid; begin
  select id into r from public.rooms where user_id = auth.uid();
  perform public.place_inventory_at_anchor(r,'plant','test-anchor');
  perform public.place_inventory_at_anchor(r,'desk_lamp','test-anchor');
  select quantity into n from public.user_inventory where user_id = auth.uid() and item_id = 'plant';
  assert n = 2, 'Replacing a plant must refund it';
  perform public.place_inventory_at_anchor(r,'desk_lamp','test-anchor');
  select id into p from public.room_placements where room_id = r and anchor_id = 'test-anchor';
  perform public.remove_room_placement(p);
  perform pg_temp.expect_error(format('select public.remove_room_placement(%L)',p));
  select quantity into n from public.user_inventory where user_id = auth.uid() and item_id = 'desk_lamp';
  assert n = 1, 'Removal must refund exactly once';
  perform pg_temp.expect_error(format('select public.place_inventory_at_anchor(%L,%L,%L)',r,'missing-item','test-anchor'));

  perform pg_temp.expect_error($q$insert into public.friendships(requester_id,addressee_id,status) values(auth.uid(),'20000000-0000-0000-0000-000000000002','accepted')$q$);
  insert into public.friendships(requester_id,addressee_id,status) values(auth.uid(),'20000000-0000-0000-0000-000000000002','pending');
  perform pg_temp.expect_error($q$update public.friendships set status='accepted' where requester_id=auth.uid()$q$);
  perform pg_temp.expect_error($q$insert into public.craft_posts(user_id,title,description,category,image_url,listing_type,reward_item_id,seed_cost) values(auth.uid(),'Forged','','craft','https://example.com/a','catalog','plant',1)$q$);
  insert into public.craft_posts(user_id,title,description,category,image_url) values(auth.uid(),'Custom','','craft','https://example.com/a');
  perform pg_temp.expect_error($q$update public.craft_posts set listing_type='catalog',reward_item_id='plant' where user_id=auth.uid()$q$);
  perform pg_temp.expect_error($q$insert into public.focus_sessions(user_id,duration_minutes,status) values(auth.uid(),60,'completed')$q$);
  perform pg_temp.expect_error($q$select public.award_seeds_for_session(60,'completed','general')$q$);
  s := public.start_focus_session(25,'general');
  perform pg_temp.expect_error(format('select public.award_seeds_for_session(%L::uuid,%L)',s,'completed'));
  perform public.award_seeds_for_session(s,'given_up');
  perform public.award_seeds_for_session(s,'given_up');
  select seeds_balance into n from public.user_wallets where user_id=auth.uid();
  assert n = 5, 'Retrying finish must not mint twice';
  s := public.start_focus_session(25,'general');
  s2 := public.start_focus_session(45,'crafting');
  select coins into n from public.award_seeds_for_session(s,'given_up');
  assert n = 0, 'Superseded sessions cannot earn rewards';
end $$;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',true);
update public.friendships set status='accepted' where addressee_id=auth.uid();
do $$ begin
  assert exists(select 1 from public.friendships where addressee_id=auth.uid() and status='accepted'), 'Recipient can accept';
  perform pg_temp.expect_error($q$select public.remove_room_placement('00000000-0000-0000-0000-000000000000')$q$);
end $$;
reset role;
-- Advance only test server timestamps; clients have no write policy for runs.
update public.focus_session_runs set started_at=clock_timestamp()-interval '46 minutes' where finished_at is null;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ declare s uuid; n integer; begin
  select id into s from public.focus_session_runs where user_id=auth.uid() and finished_at is null;
  perform public.award_seeds_for_session(s,'completed');
  perform public.award_seeds_for_session(s,'completed');
  select seeds_balance into n from public.user_wallets where user_id=auth.uid();
  assert n = 55, '45-minute reward must be 50, once';
  select count(*) into n from public.focus_sessions where user_id=auth.uid();
  assert n = 2, 'History includes one give-up and one completion';
end $$;
rollback;
