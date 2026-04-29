-- Default animal hardening + admin reseed helpers

-- Ensure cat exists in catalog.
insert into public.animal_catalog (id, name, sprite_key, rarity, mode_variants)
values ('cat', 'Cat', 'cat', 'common', '{"general":"cat_general","crafting":"cat_crafting","sewing":"cat_sewing"}'::jsonb)
on conflict (id) do update
set
  name = excluded.name,
  sprite_key = excluded.sprite_key,
  rarity = excluded.rarity,
  mode_variants = excluded.mode_variants;

-- Backfill: if a user has no animals, assign cat and set active.
insert into public.user_animals (user_id, animal_id, is_active)
select p.id, 'cat', true
from public.profiles p
where not exists (
  select 1 from public.user_animals ua where ua.user_id = p.id
)
on conflict (user_id, animal_id) do nothing;

update public.user_animals ua
set is_active = true
where ua.animal_id = 'cat'
  and not exists (
    select 1 from public.user_animals x where x.user_id = ua.user_id and x.is_active = true
  );

update public.profiles p
set active_animal_id = 'cat'
where (p.active_animal_id is null)
  and exists (select 1 from public.user_animals ua where ua.user_id = p.id and ua.animal_id = 'cat');

-- Prefer cat by default for new users.
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

  if exists (select 1 from public.animal_catalog where id = 'cat') then
    picked_animal := 'cat';
  else
    select id into picked_animal
    from public.animal_catalog
    order by random()
    limit 1;
  end if;

  if picked_animal is not null then
    insert into public.user_animals (user_id, animal_id, is_active)
    values (new.id, picked_animal, true)
    on conflict (user_id, animal_id) do update set is_active = true;

    update public.user_animals
    set is_active = false
    where user_id = new.id
      and animal_id <> picked_animal;

    update public.profiles
    set active_animal_id = picked_animal
    where id = new.id;
  end if;

  return new;
end;
$$;

-- Admin helper: clean and reseed V2 data for one user.
create or replace function public.reseed_v2_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  if target_user_id is null then
    raise exception 'target_user_id is required';
  end if;

  if not exists (select 1 from public.profiles where id = target_user_id) then
    raise exception 'Profile not found for user_id %', target_user_id;
  end if;

  -- Clean craft/listing noise for this user.
  delete from public.listing_claims lc
  using public.craft_posts cp
  where cp.id = lc.listing_id
    and cp.user_id = target_user_id;

  delete from public.custom_collectibles cc
  using public.craft_posts cp
  where cp.id = cc.listing_id
    and cp.user_id = target_user_id;

  delete from public.likes l
  using public.craft_posts cp
  where cp.id = l.craft_post_id
    and cp.user_id = target_user_id;

  delete from public.comments c
  using public.craft_posts cp
  where cp.id = c.craft_post_id
    and cp.user_id = target_user_id;

  delete from public.craft_posts where user_id = target_user_id;

  -- Reset focus/wallet/inventory/room placements for a clean state.
  delete from public.focus_sessions where user_id = target_user_id;

  update public.user_wallets
  set seeds_balance = 0,
      updated_at = now()
  where user_id = target_user_id;

  delete from public.room_placements rp
  using public.rooms r
  where r.id = rp.room_id
    and r.user_id = target_user_id;

  delete from public.user_inventory where user_id = target_user_id;

  insert into public.user_inventory (user_id, item_id, quantity)
  values
    (target_user_id, 'plant', 2),
    (target_user_id, 'desk_lamp', 1),
    (target_user_id, 'bookshelf', 1)
  on conflict (user_id, item_id) do update
  set quantity = excluded.quantity,
      updated_at = now();

  -- Ensure default animal is cat and active.
  delete from public.user_animals where user_id = target_user_id;
  insert into public.user_animals (user_id, animal_id, is_active)
  values (target_user_id, 'cat', true)
  on conflict (user_id, animal_id) do update set is_active = true;

  update public.profiles
  set active_animal_id = 'cat'
  where id = target_user_id;

  -- Seed a clean pair of listings.
  insert into public.craft_posts (
    user_id,
    title,
    description,
    category,
    image_url,
    pixel_image_url,
    listing_category,
    seed_cost,
    listing_type,
    reward_item_id,
    is_active,
    created_at
  )
  values
    (
      target_user_id,
      'Starter Desk Lamp Listing',
      'A clean starter catalog listing.',
      'craft',
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4',
      null,
      'study',
      25,
      'catalog',
      'desk_lamp',
      true,
      v_now - interval '2 hours'
    ),
    (
      target_user_id,
      'Custom Fabric Patch',
      'A custom collectible-style listing.',
      'sewing',
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
      null,
      'sewing',
      20,
      'custom',
      null,
      true,
      v_now - interval '1 hour'
    );
end;
$$;

revoke all on function public.reseed_v2_user(uuid) from public;
grant execute on function public.reseed_v2_user(uuid) to service_role;
