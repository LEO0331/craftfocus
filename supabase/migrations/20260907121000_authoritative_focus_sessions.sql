-- Store starts separately so completed-session history remains backward compatible.
create table public.focus_session_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  duration_minutes integer not null check (duration_minutes in (25,45,60)),
  mode public.focus_mode not null,
  started_at timestamptz not null default clock_timestamp(),
  finished_at timestamptz,
  status text check (status in ('completed','given_up')),
  reward_coins integer,
  check ((finished_at is null and status is null and reward_coins is null)
      or (finished_at is not null and status is not null and reward_coins is not null))
);
create unique index focus_session_runs_one_active
on public.focus_session_runs(user_id) where finished_at is null;
alter table public.focus_session_runs enable row level security;
create policy "focus_runs_owner_read" on public.focus_session_runs
for select to authenticated using (auth.uid() = user_id);

-- History feeds animal unlocks: it must also be server-written only.
drop policy if exists "focus_owner_insert" on public.focus_sessions;
drop policy if exists "focus_owner_update" on public.focus_sessions;
drop policy if exists "focus_owner_delete" on public.focus_sessions;

create function public.start_focus_session(p_duration_minutes integer, p_mode public.focus_mode default 'general')
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_duration_minutes is null or p_duration_minutes not in (25,45,60) or p_mode is null then
    raise exception 'Invalid session payload';
  end if;
  -- Recover after a closed tab or failed abandonment request. Superseded runs
  -- earn nothing; only an explicit finish awards a reward.
  perform pg_advisory_xact_lock(hashtextextended('focus:' || v_uid::text,0));
  update public.focus_session_runs
  set finished_at = clock_timestamp(),status = 'given_up',reward_coins = 0
  where user_id = v_uid and finished_at is null;
  insert into public.focus_session_runs(user_id,duration_minutes,mode)
  values (v_uid,p_duration_minutes,p_mode) returning id into v_id;
  return v_id;
end;
$$;

-- Deny the legacy caller-controlled duration endpoint, including old clients.
create or replace function public.award_seeds_for_session(
  p_duration_minutes integer,p_status text,p_mode public.focus_mode default 'general'
)
returns table (coins integer,seeds_balance integer)
language plpgsql security definer set search_path = public
as $$
begin
  raise exception 'Start a server focus session before requesting rewards';
end;
$$;

create function public.award_seeds_for_session(p_session_id uuid,p_status text)
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
  v_reward := case when p_status = 'given_up' then 5
    when v_run.duration_minutes = 25 then 25
    when v_run.duration_minutes = 45 then 50 else 75 end;

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

revoke all on function public.start_focus_session(integer,public.focus_mode) from public;
revoke all on function public.award_seeds_for_session(uuid,text) from public;
revoke all on function public.award_seeds_for_session(integer,text,public.focus_mode) from public,authenticated;
grant execute on function public.start_focus_session(integer,public.focus_mode) to authenticated;
grant execute on function public.award_seeds_for_session(uuid,text) to authenticated;
