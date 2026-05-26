-- Harden V2 seed economy writes.
-- Clients may read their own state and create a zero-balance wallet shell, but
-- seed deductions, inventory grants, listing claims, and gallery placements must
-- go through SECURITY DEFINER RPCs so balance and ownership checks stay atomic.

-- 1) Wallets: no direct balance mutation from the public client.
drop policy if exists "wallet_owner_insert" on public.user_wallets;
drop policy if exists "wallet_owner_insert_zero" on public.user_wallets;
drop policy if exists "wallet_owner_update" on public.user_wallets;
drop policy if exists "wallet_owner_delete" on public.user_wallets;

create policy "wallet_owner_insert_zero"
on public.user_wallets
for insert
to authenticated
with check (auth.uid() = user_id and seeds_balance = 0);

-- 2) Inventory/claim/collectible rows are server-granted only.
drop policy if exists "user_inventory_owner_write" on public.user_inventory;
drop policy if exists "listing_claims_owner_insert" on public.listing_claims;
drop policy if exists "custom_collectibles_owner_write" on public.custom_collectibles;

-- 3) Room and gallery placement writes are validated by RPC only.
drop policy if exists "room_placements_owner_write" on public.room_placements;
drop policy if exists "custom_gallery_owner_write" on public.custom_gallery_placements;

-- 4) Make listing claims robust when a wallet row is absent and keep it atomic.
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

  if v_seed_cost < 1 or v_seed_cost > 100 then
    raise exception 'Invalid seed cost';
  end if;

  insert into public.user_wallets (user_id, seeds_balance)
  values (v_uid, 0)
  on conflict (user_id) do nothing;

  update public.user_wallets
  set seeds_balance = seeds_balance - v_seed_cost,
      updated_at = now()
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

revoke all on function public.claim_listing_with_seeds(uuid) from public;
grant execute on function public.claim_listing_with_seeds(uuid) to authenticated;

-- 5) Allow gallery placement for canonical collectibles and legacy custom
-- listing_claims without granting direct writes to custom_collectibles.
create or replace function public.upsert_custom_gallery_placement(
  p_listing_id uuid,
  p_cell_x integer,
  p_cell_y integer
)
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

  if p_cell_x < 0 or p_cell_x > 4 or p_cell_y < 0 or p_cell_y > 4 then
    raise exception 'Cell out of range';
  end if;

  if not exists (
    select 1
    from public.custom_collectibles cc
    where cc.user_id = v_uid and cc.listing_id = p_listing_id
  ) and not exists (
    select 1
    from public.listing_claims lc
    join public.craft_posts cp on cp.id = lc.listing_id
    where lc.user_id = v_uid
      and lc.listing_id = p_listing_id
      and cp.listing_type = 'custom'
  ) then
    raise exception 'Collectible not owned';
  end if;

  delete from public.custom_gallery_placements
  where user_id = v_uid and cell_x = p_cell_x and cell_y = p_cell_y and listing_id <> p_listing_id;

  insert into public.custom_gallery_placements (user_id, listing_id, cell_x, cell_y)
  values (v_uid, p_listing_id, p_cell_x, p_cell_y)
  on conflict (user_id, listing_id)
  do update
  set cell_x = excluded.cell_x,
      cell_y = excluded.cell_y,
      updated_at = now();
end;
$$;

revoke all on function public.upsert_custom_gallery_placement(uuid, integer, integer) from public;
grant execute on function public.upsert_custom_gallery_placement(uuid, integer, integer) to authenticated;
