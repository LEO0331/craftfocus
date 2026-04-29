-- Code review remediation patch

-- 1) Prevent client-controlled seed minting from arbitrary durations/status.
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
  elsif p_status = 'completed' and p_duration_minutes = 25 then
    v_reward := 25;
  elsif p_status = 'completed' and p_duration_minutes = 45 then
    v_reward := 50;
  elsif p_status = 'completed' and p_duration_minutes = 60 then
    v_reward := 75;
  else
    raise exception 'Invalid session payload';
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

-- Preserve explicit function grants after replace.
revoke all on function public.award_seeds_for_session(integer,text,public.focus_mode) from public;
grant execute on function public.award_seeds_for_session(integer,text,public.focus_mode) to authenticated;

-- 2) Ensure "status only" updates are actually enforced.
create or replace function public.prevent_friendship_non_status_change()
returns trigger
language plpgsql
as $$
begin
  if new.requester_id <> old.requester_id
     or new.addressee_id <> old.addressee_id
     or new.created_at <> old.created_at then
    raise exception 'immutable friendship principals';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_friendship_status_only on public.friendships;
create trigger trg_friendship_status_only
before update on public.friendships
for each row execute function public.prevent_friendship_non_status_change();

create or replace function public.prevent_exchange_non_status_change()
returns trigger
language plpgsql
as $$
begin
  if new.requester_id <> old.requester_id
     or new.owner_id <> old.owner_id
     or new.craft_post_id <> old.craft_post_id
     or coalesce(new.message, '') <> coalesce(old.message, '')
     or new.created_at <> old.created_at then
    raise exception 'only status can change';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_exchange_status_only on public.exchange_requests;
create trigger trg_exchange_status_only
before update on public.exchange_requests
for each row execute function public.prevent_exchange_non_status_change();

-- 3) Align storage policy with current app rendering strategy (public image URLs).
update storage.buckets
set public = true
where id = 'craft-images';

drop policy if exists "craft_images_owner_read" on storage.objects;
drop policy if exists "craft_images_public_read" on storage.objects;
create policy "craft_images_public_read"
on storage.objects
for select
to public
using (bucket_id = 'craft-images');
