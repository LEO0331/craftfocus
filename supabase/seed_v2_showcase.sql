-- CraftFocus V2 showcase seed
-- Replace demo_user_id before running.
do $$
declare
  demo_user_id uuid := null; -- set to a real auth user id in your environment
  listing_a uuid;
  listing_b uuid;
begin
  if demo_user_id is null then
    raise notice 'Skip demo seed: set demo_user_id in seed_v2_showcase.sql';
    return;
  end if;

  insert into public.user_wallets (user_id, seeds_balance)
  values (demo_user_id, 120)
  on conflict (user_id) do update
  set seeds_balance = excluded.seeds_balance,
      updated_at = now();

  insert into public.user_inventory (user_id, item_id, quantity)
  values
    (demo_user_id, 'plant', 2),
    (demo_user_id, 'desk_lamp', 1),
    (demo_user_id, 'study_desk', 1)
  on conflict (user_id, item_id) do update
  set quantity = excluded.quantity,
      updated_at = now();

  insert into public.craft_posts (
    user_id, title, description, category, listing_category, seed_cost, listing_type, reward_item_id, image_url, pixel_image_url, is_active
  )
  values
    (demo_user_id, 'Patchwork Cat Badge', 'A small cat-themed patch badge.', 'craft', 'custom', 25, 'custom', null, null, null, true),
    (demo_user_id, 'Blue Thread Cardholder', 'Hand-stitched cardholder sample.', 'craft', 'custom', 30, 'custom', null, null, null, true)
  returning id into listing_a;

  select id into listing_b
  from public.craft_posts
  where user_id = demo_user_id
  order by created_at desc
  limit 1 offset 1;

  insert into public.custom_collectibles (user_id, listing_id, image_url, pixel_image_url)
  values
    (demo_user_id, listing_a, null, null),
    (demo_user_id, listing_b, null, null)
  on conflict (user_id, listing_id) do nothing;

  insert into public.custom_gallery_placements (user_id, listing_id, cell_x, cell_y)
  values
    (demo_user_id, listing_a, 0, 0),
    (demo_user_id, listing_b, 2, 1)
  on conflict (user_id, listing_id) do update
  set cell_x = excluded.cell_x,
      cell_y = excluded.cell_y,
      updated_at = now();
end;
$$;
