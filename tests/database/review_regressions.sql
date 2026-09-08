-- Run after all migrations in a disposable database: psql -v ON_ERROR_STOP=1 -f this-file.
begin;
do $$ begin
  assert exists(select 1 from public.item_catalog where id='plant'),
    'Fresh migrations must seed the starter plant required by signup';
end $$;
insert into public.item_catalog(id,name,category) values ('plant','Plant','decor'),('desk_lamp','Lamp','decor'),('bookshelf','Shelf','decor') on conflict do nothing;
insert into auth.users(id) values ('10000000-0000-0000-0000-000000000001'),('20000000-0000-0000-0000-000000000002');
insert into public.craft_posts(user_id,title,description,category,image_url)
values('20000000-0000-0000-0000-000000000002','Exchange','','craft','https://example.com/b');
insert into public.craft_posts(user_id,title,description,category,image_url,listing_type,reward_item_id,official_source,is_active)
values('20000000-0000-0000-0000-000000000002','Unverified catalog','','craft','https://example.com/c','catalog','plant',false,false);
insert into public.craft_posts(user_id,title,description,category,image_url,listing_type,reward_item_id,official_source,is_active,seed_cost)
values('20000000-0000-0000-0000-000000000002','Trusted catalog','','craft','https://example.com/d','catalog','plant',true,true,1);
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
do $$ declare r uuid; p uuid; n integer; s uuid; s2 uuid; post_id uuid; exchange_id uuid; catalog_id uuid; begin
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
  insert into public.craft_posts(user_id,title,description,category,image_url,created_at,seed_cost)
  values(auth.uid(),'Custom','','craft','https://example.com/a','2000-01-01',25);
  assert exists(select 1 from public.craft_posts where user_id=auth.uid() and title='Custom'
    and created_at >= date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC'),
    'Authenticated callers cannot backdate uploads';
  insert into public.craft_posts(user_id,title,description,category,image_url)
  select auth.uid(),'Quota ' || quota.value,'','craft','https://example.com/q'
  from generate_series(2,10) as quota(value);
  perform pg_temp.expect_error($q$insert into public.craft_posts(user_id,title,category,image_url) values(auth.uid(),'Quota 11','craft','https://example.com/q')$q$);
  delete from public.craft_posts where user_id=auth.uid() and title='Quota 2';
  perform pg_temp.expect_error($q$insert into public.craft_posts(user_id,title,category,image_url) values(auth.uid(),'Quota replacement','craft','https://example.com/q')$q$);
  perform pg_temp.expect_error($q$update public.craft_posts set listing_type='catalog',reward_item_id='plant' where user_id=auth.uid()$q$);
  update public.user_animals set animal_id='dog' where user_id=auth.uid();
  assert not exists(select 1 from public.user_animals where user_id=auth.uid() and animal_id='dog'),
    'Direct companion ownership mutation must affect no rows';
  perform pg_temp.expect_error($q$update public.profiles set active_animal_id='dog' where id=auth.uid()$q$);
  perform public.set_active_animal('cat');
  select id into post_id from public.craft_posts
  where user_id='20000000-0000-0000-0000-000000000002' and title='Exchange';
  perform pg_temp.expect_error(format(
    'insert into public.exchange_requests(requester_id,owner_id,craft_post_id,status) values(auth.uid(),%L,%L,%L)',
    '20000000-0000-0000-0000-000000000002',post_id,'accepted'));
  insert into public.exchange_requests(requester_id,owner_id,craft_post_id,status)
  values(auth.uid(),'20000000-0000-0000-0000-000000000002',post_id,'pending') returning id into exchange_id;
  perform pg_temp.expect_error(format('update public.exchange_requests set status=%L where id=%L','accepted',exchange_id));
  select id into catalog_id from public.craft_posts where title='Unverified catalog';
  perform pg_temp.expect_error(format('select public.claim_listing_with_seeds(%L)',catalog_id));
  perform pg_temp.expect_error($q$insert into public.focus_sessions(user_id,duration_minutes,status) values(auth.uid(),60,'completed')$q$);
  perform pg_temp.expect_error($q$select public.award_seeds_for_session(60,'completed','general')$q$);
  s := public.start_focus_session(25,'general');
  perform pg_temp.expect_error(format('select public.award_seeds_for_session(%L::uuid,%L)',s,'completed'));
  perform public.award_seeds_for_session(s,'given_up');
  perform public.award_seeds_for_session(s,'given_up');
  select seeds_balance into n from public.user_wallets where user_id=auth.uid();
  assert n = 0, 'Instant abandonment must earn zero and retry must not mint';
  s := public.start_focus_session(25,'general');
  s2 := public.start_focus_session(45,'crafting');
  select coins into n from public.award_seeds_for_session(s,'given_up');
  assert n = 0, 'Superseded sessions cannot earn rewards';
end $$;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',true);
update public.friendships set status='accepted' where addressee_id=auth.uid();
update public.exchange_requests set status='accepted' where owner_id=auth.uid();
do $$ begin
  assert exists(select 1 from public.friendships where addressee_id=auth.uid() and status='accepted'), 'Recipient can accept';
  assert exists(select 1 from public.exchange_requests where owner_id=auth.uid() and status='accepted'), 'Craft owner can accept';
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
  assert n = 50, '45-minute reward must be 50, once';
  select count(*) into n from public.focus_sessions where user_id=auth.uid();
  assert n = 2, 'History includes one give-up and one completion';
end $$;
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
select public.start_focus_session(25,'general') as rewarded_giveup_id \gset
reset role;
update public.focus_session_runs set started_at=clock_timestamp()-interval '61 seconds' where id=:'rewarded_giveup_id';
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
select * from public.award_seeds_for_session(:'rewarded_giveup_id'::uuid,'given_up'::text);
do $$ declare n integer; post_id uuid; begin
  select seeds_balance into n from public.user_wallets where user_id=auth.uid();
  assert n = 55, 'Abandonment after one minute earns five seeds';
  select id into post_id from public.craft_posts where user_id=auth.uid() and title='Custom';
  select claim.seeds_balance into n from public.claim_listing_with_seeds(post_id) claim;
  assert n = 30, 'A verified custom claim deducts its seed cost';
  assert exists(select 1 from public.custom_collectibles where user_id=auth.uid() and listing_id=post_id),
    'A custom claim grants a collectible';
  select id into post_id from public.craft_posts where title='Trusted catalog';
  select claim.seeds_balance into n from public.claim_listing_with_seeds(post_id) claim;
  assert n = 29, 'A trusted catalog claim deducts its seed cost';
  assert (select quantity from public.user_inventory where user_id=auth.uid() and item_id='plant')=3,
    'A trusted catalog claim grants its official item';
end $$;
reset role;
select set_config('request.jwt.claim.sub','',false);
set role service_role;
select public.reseed_v2_user('20000000-0000-0000-0000-000000000002');
do $$ begin
  assert exists(select 1 from public.craft_posts
    where user_id='20000000-0000-0000-0000-000000000002'
      and listing_type='catalog' and not official_source and not is_active),
    'Legacy reseed helpers must quarantine unverified catalog rows';
end $$;
rollback;
