-- CraftFocus V2 gameplay redesign core schema + RPCs

create type public.focus_mode as enum ('general', 'crafting', 'sewing');
create type public.room_type as enum ('bedroom', 'gym');
create type public.listing_type as enum ('catalog', 'custom');

create table if not exists public.user_wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  seeds_balance integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.animal_catalog (
  id text primary key,
  name text not null,
  sprite_key text not null,
  rarity text not null default 'common',
  mode_variants jsonb not null default '{}'::jsonb
);

create table if not exists public.user_animals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  animal_id text not null references public.animal_catalog(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  is_active boolean not null default false,
  unique (user_id, animal_id)
);

alter table public.profiles add column if not exists active_animal_id text references public.animal_catalog(id) on delete set null;
alter table public.focus_sessions add column if not exists mode public.focus_mode not null default 'general';

alter table public.focus_sessions alter column category drop not null;
alter table public.focus_sessions alter column build_target drop not null;
alter table public.focus_sessions alter column progress_awarded drop not null;

alter table public.rooms add column if not exists room_type public.room_type not null default 'bedroom';

create table if not exists public.user_inventory (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id text not null references public.item_catalog(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table if not exists public.room_placements (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  item_id text not null references public.item_catalog(id) on delete cascade,
  anchor_id text not null,
  placed_count integer not null default 1 check (placed_count > 0),
  created_at timestamptz not null default now(),
  unique (room_id, anchor_id)
);

alter table public.craft_posts add column if not exists listing_category text;
alter table public.craft_posts add column if not exists seed_cost integer not null default 10;
alter table public.craft_posts add column if not exists listing_type public.listing_type not null default 'custom';
alter table public.craft_posts add column if not exists reward_item_id text references public.item_catalog(id) on delete set null;
alter table public.craft_posts add column if not exists is_active boolean not null default true;

create table if not exists public.listing_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.craft_posts(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

create table if not exists public.custom_collectibles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.craft_posts(id) on delete cascade,
  image_url text,
  pixel_image_url text,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

insert into public.animal_catalog (id, name, sprite_key, rarity, mode_variants)
values
  ('cat', 'Cat', 'cat', 'common', '{"general":"cat_idle","crafting":"cat_craft","sewing":"cat_sew"}'::jsonb),
  ('dog', 'Dog', 'dog', 'common', '{"general":"dog_idle","crafting":"dog_craft","sewing":"dog_sew"}'::jsonb),
  ('rabbit', 'Rabbit', 'rabbit', 'common', '{"general":"rabbit_idle","crafting":"rabbit_craft","sewing":"rabbit_sew"}'::jsonb),
  ('fox', 'Fox', 'fox', 'rare', '{"general":"fox_idle","crafting":"fox_craft","sewing":"fox_sew"}'::jsonb)
on conflict (id) do update
set
  name = excluded.name,
  sprite_key = excluded.sprite_key,
  rarity = excluded.rarity,
  mode_variants = excluded.mode_variants;

create or replace function public.handle_new_user_v2()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  picked_animal text;
begin
  insert into public.profiles (id, username)
  values (new.id, 'user_' || substr(replace(new.id::text, '-', ''), 1, 8))
  on conflict (id) do nothing;

  insert into public.rooms (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_wallets (user_id, seeds_balance)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  insert into public.user_inventory (user_id, item_id, quantity)
  values (new.id, 'plant', 1)
  on conflict (user_id, item_id) do nothing;

  select id into picked_animal
  from public.animal_catalog
  order by random()
  limit 1;

  if picked_animal is not null then
    insert into public.user_animals (user_id, animal_id, is_active)
    values (new.id, picked_animal, true)
    on conflict (user_id, animal_id) do update set is_active = true;

    update public.profiles
    set active_animal_id = picked_animal
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user_v2();

create or replace function public.unlock_animals_for_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  total_minutes integer;
  unlock_count integer;
begin
  select coalesce(sum(duration_minutes), 0)::integer into total_minutes
  from public.focus_sessions
  where user_id = target_user_id and status = 'completed';

  if total_minutes < 120 then
    return;
  end if;

  unlock_count := 1 + floor(greatest(total_minutes - 120, 0) / 180);

  insert into public.user_animals (user_id, animal_id, is_active)
  select target_user_id, ac.id, false
  from (
    select id
    from public.animal_catalog
    order by id
    limit unlock_count
  ) ac
  on conflict (user_id, animal_id) do nothing;
end;
$$;

create or replace function public.award_seeds_for_session(
  p_duration_minutes integer,
  p_status text,
  p_mode public.focus_mode default 'general'
)
returns table (coins integer, seeds_balance integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_reward integer := 0;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_status = 'given_up' then
    v_reward := 5;
  elsif p_duration_minutes = 25 then
    v_reward := 25;
  elsif p_duration_minutes = 45 then
    v_reward := 50;
  elsif p_duration_minutes = 60 then
    v_reward := 75;
  else
    v_reward := greatest(p_duration_minutes, 0);
  end if;

  insert into public.focus_sessions (
    user_id, duration_minutes, category, build_target, status, reward_coins, progress_awarded, mode
  )
  values (
    v_uid, p_duration_minutes, null, null, p_status, v_reward, 0, p_mode
  );

  insert into public.user_wallets (user_id, seeds_balance)
  values (v_uid, v_reward)
  on conflict (user_id) do update
  set seeds_balance = public.user_wallets.seeds_balance + excluded.seeds_balance,
      updated_at = now();

  perform public.unlock_animals_for_user(v_uid);

  return query
  select v_reward, uw.seeds_balance
  from public.user_wallets uw
  where uw.user_id = v_uid;
end;
$$;

create or replace function public.place_inventory_at_anchor(
  p_room_id uuid,
  p_item_id text,
  p_anchor_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select user_id into v_owner from public.rooms where id = p_room_id;
  if v_owner is distinct from v_uid then
    raise exception 'Not room owner';
  end if;

  update public.user_inventory
  set quantity = quantity - 1, updated_at = now()
  where user_id = v_uid and item_id = p_item_id and quantity > 0;

  if not found then
    raise exception 'Not enough inventory';
  end if;

  delete from public.room_placements where room_id = p_room_id and anchor_id = p_anchor_id;

  insert into public.room_placements (room_id, item_id, anchor_id, placed_count)
  values (p_room_id, p_item_id, p_anchor_id, 1);
end;
$$;

create or replace function public.remove_room_placement(
  p_room_placement_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_item text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select r.user_id, rp.item_id
  into v_owner, v_item
  from public.room_placements rp
  join public.rooms r on r.id = rp.room_id
  where rp.id = p_room_placement_id;

  if v_owner is distinct from v_uid then
    raise exception 'Not room owner';
  end if;

  delete from public.room_placements where id = p_room_placement_id;

  insert into public.user_inventory (user_id, item_id, quantity)
  values (v_uid, v_item, 1)
  on conflict (user_id, item_id) do update
  set quantity = public.user_inventory.quantity + 1,
      updated_at = now();
end;
$$;

create or replace function public.claim_listing_with_seeds(
  p_listing_id uuid
)
returns table (seeds_balance integer, granted_item_id text, listing_type public.listing_type)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_seed_cost integer;
  v_reward_item_id text;
  v_listing_type public.listing_type;
  v_image_url text;
  v_pixel_url text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if exists (
    select 1 from public.listing_claims lc
    where lc.user_id = v_uid and lc.listing_id = p_listing_id
  ) then
    raise exception 'Already claimed';
  end if;

  select cp.seed_cost, cp.reward_item_id, cp.listing_type, cp.image_url, cp.pixel_image_url
  into v_seed_cost, v_reward_item_id, v_listing_type, v_image_url, v_pixel_url
  from public.craft_posts cp
  where cp.id = p_listing_id and cp.is_active = true;

  if v_seed_cost is null then
    raise exception 'Listing not found';
  end if;

  update public.user_wallets
  set seeds_balance = seeds_balance - v_seed_cost, updated_at = now()
  where user_id = v_uid and seeds_balance >= v_seed_cost;

  if not found then
    raise exception 'Not enough seeds';
  end if;

  insert into public.listing_claims (user_id, listing_id)
  values (v_uid, p_listing_id);

  if v_listing_type = 'catalog' and v_reward_item_id is not null then
    insert into public.user_inventory (user_id, item_id, quantity)
    values (v_uid, v_reward_item_id, 1)
    on conflict (user_id, item_id) do update
    set quantity = public.user_inventory.quantity + 1,
        updated_at = now();
  else
    insert into public.custom_collectibles (user_id, listing_id, image_url, pixel_image_url)
    values (v_uid, p_listing_id, v_image_url, v_pixel_url)
    on conflict (user_id, listing_id) do nothing;
  end if;

  return query
  select uw.seeds_balance, v_reward_item_id, v_listing_type
  from public.user_wallets uw
  where uw.user_id = v_uid;
end;
$$;

create or replace function public.set_active_animal(p_animal_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.user_animals ua
    where ua.user_id = v_uid and ua.animal_id = p_animal_id
  ) then
    raise exception 'Animal not unlocked';
  end if;

  update public.user_animals set is_active = false where user_id = v_uid;
  update public.user_animals set is_active = true where user_id = v_uid and animal_id = p_animal_id;
  update public.profiles set active_animal_id = p_animal_id where id = v_uid;
end;
$$;

alter table public.user_wallets enable row level security;
alter table public.animal_catalog enable row level security;
alter table public.user_animals enable row level security;
alter table public.user_inventory enable row level security;
alter table public.room_placements enable row level security;
alter table public.listing_claims enable row level security;
alter table public.custom_collectibles enable row level security;

create policy "wallet_owner_read" on public.user_wallets for select using (auth.uid() = user_id);
create policy "wallet_owner_insert" on public.user_wallets for insert with check (auth.uid() = user_id);
create policy "wallet_owner_update" on public.user_wallets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "animal_catalog_public_read" on public.animal_catalog for select using (true);
create policy "user_animals_owner_read" on public.user_animals for select using (auth.uid() = user_id);
create policy "user_animals_owner_write" on public.user_animals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_inventory_owner_read" on public.user_inventory for select using (auth.uid() = user_id);
create policy "user_inventory_owner_write" on public.user_inventory for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "room_placements_public_read" on public.room_placements for select using (true);
create policy "room_placements_owner_write" on public.room_placements
for all using (
  exists (select 1 from public.rooms r where r.id = room_id and r.user_id = auth.uid())
) with check (
  exists (select 1 from public.rooms r where r.id = room_id and r.user_id = auth.uid())
);

create policy "listing_claims_owner_read" on public.listing_claims for select using (auth.uid() = user_id);
create policy "listing_claims_owner_insert" on public.listing_claims for insert with check (auth.uid() = user_id);

create policy "custom_collectibles_owner_read" on public.custom_collectibles for select using (auth.uid() = user_id);
create policy "custom_collectibles_owner_write" on public.custom_collectibles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
