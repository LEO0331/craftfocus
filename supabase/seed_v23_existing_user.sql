-- CraftFocus V2.3 seed for an existing user
-- Usage before running this script:
--   set app.demo_user_id = '<auth-user-uuid>';
do $$
declare
  demo_user_id uuid := nullif(current_setting('app.demo_user_id', true), '')::uuid;
  listing_one uuid;
  listing_two uuid;
begin
  if demo_user_id is null then
    raise notice 'Skip V2.3 existing-user seed: set app.demo_user_id first';
    return;
  end if;

  if not exists (select 1 from public.profiles where id = demo_user_id) then
    raise notice 'Skip V2.3 existing-user seed: profile % not found', demo_user_id;
    return;
  end if;

  insert into public.user_wallets (user_id, seeds_balance)
  values (demo_user_id, 180)
  on conflict (user_id) do update
  set seeds_balance = excluded.seeds_balance,
      updated_at = now();

  with inserted as (
    insert into public.craft_posts (
      user_id,
      title,
      description,
      category,
      listing_category,
      seed_cost,
      listing_type,
      image_url,
      pixel_image_url,
      pixel_palette,
      pixel_grid,
      is_active
    )
    values
      (
        demo_user_id,
        'Neon Thread Patch',
        'Custom patch with bright seam blocks.',
        'craft',
        'custom',
        28,
        'custom',
        null,
        null,
        '{".":"#00000000","a":"#8338EC","b":"#3A86FF","c":"#FFBE0B"}'::jsonb,
        array['........','..aaaa..','.abccba.','.acccca.','.acccca.','.abccba.','..aaaa..','........'],
        true
      ),
      (
        demo_user_id,
        'Pocket Fox Charm',
        'Small charm listing for gallery showcase.',
        'craft',
        'custom',
        32,
        'custom',
        null,
        null,
        '{".":"#00000000","a":"#FB8500","b":"#8ECAE6","c":"#023047"}'::jsonb,
        array['........','.aaaaaa.','.abbbba.','.abccba.','.abccba.','.abbbba.','.aaaaaa.','........'],
        true
      )
    returning id, title
  )
  select
    min(id) filter (where title = 'Neon Thread Patch'),
    min(id) filter (where title = 'Pocket Fox Charm')
  into listing_one, listing_two
  from inserted;

  if listing_one is not null then
    insert into public.listing_claims (user_id, listing_id)
    values (demo_user_id, listing_one)
    on conflict (user_id, listing_id) do nothing;

    insert into public.custom_collectibles (user_id, listing_id, image_url, pixel_image_url)
    values (demo_user_id, listing_one, null, null)
    on conflict (user_id, listing_id) do nothing;

    insert into public.custom_gallery_placements (user_id, listing_id, cell_x, cell_y)
    values (demo_user_id, listing_one, 0, 0)
    on conflict (user_id, listing_id) do update
    set cell_x = excluded.cell_x,
        cell_y = excluded.cell_y,
        updated_at = now();
  end if;

  if listing_two is not null then
    insert into public.listing_claims (user_id, listing_id)
    values (demo_user_id, listing_two)
    on conflict (user_id, listing_id) do nothing;

    insert into public.custom_collectibles (user_id, listing_id, image_url, pixel_image_url)
    values (demo_user_id, listing_two, null, null)
    on conflict (user_id, listing_id) do nothing;

    insert into public.custom_gallery_placements (user_id, listing_id, cell_x, cell_y)
    values (demo_user_id, listing_two, 2, 1)
    on conflict (user_id, listing_id) do update
    set cell_x = excluded.cell_x,
        cell_y = excluded.cell_y,
        updated_at = now();
  end if;
end;
$$;
