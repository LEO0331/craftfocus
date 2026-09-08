-- Close abuse and provenance gaps identified during deployment review.

-- Catalog posts created before provenance existed cannot be distinguished from
-- forged rows. Quarantine all of them until an administrator explicitly
-- reviews and marks each row as official.
alter table public.craft_posts
add column official_source boolean not null default false;

update public.craft_posts
set is_active = false
where listing_type = 'catalog';

update public.craft_posts
set reward_item_id = null
where listing_type = 'custom' and reward_item_id is not null;

alter table public.craft_posts
add constraint craft_posts_custom_not_official
check (listing_type <> 'custom' or (not official_source and reward_item_id is null));

alter table public.craft_posts
add constraint craft_posts_active_catalog_verified
check (listing_type <> 'catalog' or not is_active or official_source);

comment on column public.craft_posts.official_source is
  'Service-managed provenance flag. Historical catalog rows start untrusted and inactive.';

-- Count accepted creations in a server-owned ledger. The count survives post
-- deletion and concurrent inserts increment one atomic row.
create table public.craft_post_daily_uploads (
  user_id uuid not null references public.profiles(id) on delete cascade,
  upload_day date not null,
  upload_count integer not null check (upload_count between 0 and 10),
  primary key (user_id, upload_day)
);

alter table public.craft_post_daily_uploads enable row level security;

insert into public.craft_post_daily_uploads(user_id, upload_day, upload_count)
select user_id, (created_at at time zone 'UTC')::date, least(count(*), 10)::integer
from public.craft_posts
where listing_type = 'custom'
group by user_id, (created_at at time zone 'UTC')::date
on conflict (user_id, upload_day) do update
set upload_count = greatest(
  public.craft_post_daily_uploads.upload_count,
  excluded.upload_count
);

create or replace function public.enforce_craft_post_daily_upload()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if new.listing_type = 'catalog' and not new.official_source then
    new.is_active := false;
  end if;
  -- Service jobs have no user JWT and retain their administrative behavior.
  if v_uid is null then return new; end if;
  if new.user_id <> v_uid then raise exception 'Cannot create a listing for another user'; end if;

  new.created_at := clock_timestamp();
  insert into public.craft_post_daily_uploads(user_id, upload_day, upload_count)
  values (v_uid, (new.created_at at time zone 'UTC')::date, 1)
  on conflict (user_id, upload_day) do update
  set upload_count = public.craft_post_daily_uploads.upload_count + 1
  where public.craft_post_daily_uploads.upload_count < 10;

  if not found then raise exception 'Daily craft upload limit reached'; end if;
  return new;
end;
$$;

drop trigger if exists trg_craft_post_daily_upload on public.craft_posts;
create trigger trg_craft_post_daily_upload
before insert on public.craft_posts
for each row execute function public.enforce_craft_post_daily_upload();

drop policy if exists "craft_posts_owner_insert" on public.craft_posts;
create policy "craft_posts_owner_insert" on public.craft_posts
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "craft_posts_custom_insert_only" on public.craft_posts;
create policy "craft_posts_custom_insert_only" on public.craft_posts
as restrictive for insert to authenticated
with check (listing_type = 'custom' and reward_item_id is null and not official_source);

drop policy if exists "craft_posts_custom_update_only" on public.craft_posts;
create policy "craft_posts_custom_update_only" on public.craft_posts
as restrictive for update to authenticated
using (listing_type = 'custom' and reward_item_id is null and not official_source)
with check (listing_type = 'custom' and reward_item_id is null and not official_source);

-- A stopped session must contain at least one server-observed minute before it
-- earns the consolation reward. Shorter sessions are still recorded with zero.
create or replace function public.award_seeds_for_session(p_session_id uuid,p_status text)
returns table (coins integer,seeds_balance integer)
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_run public.focus_session_runs%rowtype;
  v_reward integer;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_status is null or p_status not in ('completed','given_up') then
    raise exception 'Invalid session payload';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('focus:' || v_uid::text,0));
  select * into v_run from public.focus_session_runs
  where id = p_session_id and user_id = v_uid for update;
  if not found then raise exception 'Focus session not found'; end if;

  if v_run.finished_at is not null then
    return query select v_run.reward_coins,coalesce((select uw.seeds_balance
      from public.user_wallets uw where uw.user_id = v_uid),0);
    return;
  end if;
  if p_status = 'completed' and clock_timestamp() < v_run.started_at + make_interval(mins => v_run.duration_minutes) then
    raise exception 'Focus session is not complete';
  end if;
  v_reward := case
    when p_status = 'given_up' and clock_timestamp() >= v_run.started_at + interval '1 minute' then 5
    when p_status = 'given_up' then 0
    when v_run.duration_minutes = 25 then 25
    when v_run.duration_minutes = 45 then 50
    else 75
  end;

  insert into public.focus_sessions(user_id,duration_minutes,status,reward_coins,progress_awarded,mode)
  values (v_uid,v_run.duration_minutes,p_status,v_reward,0,v_run.mode);
  insert into public.user_wallets(user_id,seeds_balance) values (v_uid,v_reward)
  on conflict (user_id) do update
  set seeds_balance = public.user_wallets.seeds_balance + excluded.seeds_balance,updated_at = now();
  update public.focus_session_runs set finished_at = clock_timestamp(),status = p_status,reward_coins = v_reward
  where id = v_run.id;
  perform public.unlock_animals_for_user(v_uid);
  return query select v_reward,uw.seeds_balance from public.user_wallets uw where uw.user_id = v_uid;
end;
$$;

revoke all on function public.award_seeds_for_session(uuid,text) from public;
grant execute on function public.award_seeds_for_session(uuid,text) to authenticated;

-- Recreate the claim function with explicit catalog provenance enforcement.
create or replace function public.claim_listing_with_seeds(p_listing_id uuid)
returns table (seeds_balance integer, granted_item_id text, listing_type public.listing_type)
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_seed_cost integer;
  v_reward_item_id text;
  v_listing_type public.listing_type;
  v_image_url text;
  v_pixel_url text;
  v_official_source boolean;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if exists (select 1 from public.listing_claims lc where lc.user_id = v_uid and lc.listing_id = p_listing_id) then
    raise exception 'Already claimed';
  end if;

  select cp.seed_cost,cp.reward_item_id,cp.listing_type,cp.image_url,cp.pixel_image_url,cp.official_source
  into v_seed_cost,v_reward_item_id,v_listing_type,v_image_url,v_pixel_url,v_official_source
  from public.craft_posts cp where cp.id = p_listing_id and cp.is_active = true;
  if v_seed_cost is null then raise exception 'Listing not found'; end if;
  if v_seed_cost < 1 or v_seed_cost > 100 then raise exception 'Invalid seed cost'; end if;
  if v_listing_type = 'catalog' and (v_reward_item_id is null or not v_official_source) then
    raise exception 'Unverified catalog listing';
  end if;

  insert into public.user_wallets(user_id,seeds_balance) values(v_uid,0) on conflict(user_id) do nothing;
  update public.user_wallets uw set seeds_balance=uw.seeds_balance-v_seed_cost,updated_at=now()
  where uw.user_id=v_uid and uw.seeds_balance>=v_seed_cost;
  if not found then raise exception 'Not enough seeds'; end if;
  insert into public.listing_claims(user_id,listing_id) values(v_uid,p_listing_id);

  if v_listing_type = 'catalog' then
    insert into public.user_inventory(user_id,item_id,quantity) values(v_uid,v_reward_item_id,1)
    on conflict(user_id,item_id) do update
    set quantity=public.user_inventory.quantity+1,updated_at=now();
  else
    insert into public.custom_collectibles(user_id,listing_id,image_url,pixel_image_url)
    values(v_uid,p_listing_id,v_image_url,v_pixel_url)
    on conflict(user_id,listing_id) do nothing;
  end if;
  return query select uw.seeds_balance,v_reward_item_id,v_listing_type
  from public.user_wallets uw where uw.user_id=v_uid;
end;
$$;

revoke all on function public.claim_listing_with_seeds(uuid) from public;
grant execute on function public.claim_listing_with_seeds(uuid) to authenticated;
