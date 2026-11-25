-- Hosted projects may have explicitly granted these roles EXECUTE at creation.
revoke execute on function public.reseed_v2_user(uuid) from public, anon, authenticated;
revoke execute on function public.seed_demo_data_for_user(uuid) from public, anon, authenticated;
revoke execute on function public.unlock_animals_for_user(uuid) from public, anon, authenticated;

-- The app unlists crafts. Hard deletes cascade to other players' claims.
drop policy if exists craft_posts_owner_delete on public.craft_posts;
revoke delete on public.craft_posts from public, anon, authenticated;

-- The app only creates and deletes comments. The database owns their ordering.
drop policy if exists comments_owner_update on public.comments;
revoke update on public.comments from public, anon, authenticated;

create or replace function public.enforce_comment_hourly_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
  v_window timestamptz := date_trunc('hour', v_now);
begin
  if v_uid is null then
    return new;
  end if;
  if new.user_id <> v_uid then
    raise exception 'Cannot comment for another user';
  end if;

  new.body := btrim(new.body);
  new.created_at := v_now;
  insert into public.comment_hourly_writes(user_id, window_start, comment_count)
  values (v_uid, v_window, 1)
  on conflict (user_id, window_start) do update
  set comment_count = public.comment_hourly_writes.comment_count + 1
  where public.comment_hourly_writes.comment_count < 100;

  if not found then
    raise exception 'Hourly comment limit reached';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_comment_hourly_limit() from public, anon, authenticated;
