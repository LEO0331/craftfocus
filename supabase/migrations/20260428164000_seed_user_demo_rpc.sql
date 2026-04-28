-- Seed demo app data for an existing user (auth user must already exist).
-- Usage:
--   select public.seed_demo_data_for_user('00000000-0000-0000-0000-000000000000'::uuid);

create or replace function public.seed_demo_data_for_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
  v_now timestamptz := now();
begin
  if target_user_id is null then
    raise exception 'target_user_id is required';
  end if;

  if not exists (select 1 from public.profiles p where p.id = target_user_id) then
    raise exception 'Profile not found for user_id %', target_user_id;
  end if;

  insert into public.rooms (user_id, name)
  values (target_user_id, 'My Focus Room')
  on conflict (user_id) do nothing;

  select r.id into v_room_id
  from public.rooms r
  where r.user_id = target_user_id
  limit 1;

  insert into public.focus_sessions (user_id, duration_minutes, category, build_target, status, reward_coins, progress_awarded, created_at)
  values
    (target_user_id, 25, 'study', 'study_desk', 'completed', 25, 25, v_now - interval '1 day'),
    (target_user_id, 45, 'work', 'work_desk', 'completed', 50, 45, v_now - interval '6 hours'),
    (target_user_id, 25, 'sewing', 'sewing_kit', 'given_up', 5, 5, v_now - interval '2 hours')
  on conflict do nothing;

  insert into public.user_items (user_id, item_id, progress, unlocked)
  values
    (target_user_id, 'study_desk', 100, true),
    (target_user_id, 'desk_lamp', 60, false),
    (target_user_id, 'sewing_kit', 45, false),
    (target_user_id, 'plant', 100, true)
  on conflict (user_id, item_id) do update
  set
    progress = greatest(public.user_items.progress, excluded.progress),
    unlocked = public.user_items.unlocked or excluded.unlocked;

  insert into public.craft_posts (user_id, title, description, category, image_url, pixel_image_url, open_to_exchange, created_at)
  values
    (
      target_user_id,
      'Handmade Leather Card Holder',
      'First prototype with edge burnishing.',
      'leather',
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
      null,
      true,
      v_now - interval '3 hours'
    ),
    (
      target_user_id,
      'Mini Sewing Pouch',
      'Trying a compact zipper layout.',
      'sewing',
      'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb',
      null,
      false,
      v_now - interval '1 hour'
    )
  on conflict do nothing;

  if v_room_id is not null then
    insert into public.room_items (room_id, user_item_id, x, y)
    select v_room_id, ui.id, coords.x, coords.y
    from (
      values
        ('study_desk'::text, 1, 3),
        ('plant'::text, 4, 2)
    ) as coords(item_id, x, y)
    join public.user_items ui
      on ui.user_id = target_user_id
     and ui.item_id = coords.item_id
    on conflict do nothing;
  end if;
end;
$$;

revoke all on function public.seed_demo_data_for_user(uuid) from public;
grant execute on function public.seed_demo_data_for_user(uuid) to service_role;
