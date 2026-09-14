-- Bound public social-feed work and expose a deploy-time schema contract.

alter table public.comments
  add constraint comments_body_length
  check (char_length(btrim(body)) between 1 and 240) not valid;

alter table public.craft_posts
  add constraint craft_posts_title_length
  check (char_length(btrim(title)) between 1 and 20) not valid;

alter table public.craft_posts
  add constraint craft_posts_description_length
  check (description is null or char_length(description) <= 60) not valid;

create index if not exists idx_likes_craft_post_id on public.likes(craft_post_id);
create index if not exists idx_comments_craft_post_id on public.comments(craft_post_id);

create table public.comment_hourly_writes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  window_start timestamptz not null,
  comment_count integer not null check (comment_count between 0 and 100),
  primary key (user_id, window_start)
);

alter table public.comment_hourly_writes enable row level security;

create function public.enforce_comment_hourly_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_window timestamptz := date_trunc('hour', clock_timestamp());
begin
  if v_uid is null then
    return new;
  end if;
  if new.user_id <> v_uid then
    raise exception 'Cannot comment for another user';
  end if;

  new.body := btrim(new.body);
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

create trigger trg_comment_hourly_limit
before insert on public.comments
for each row execute function public.enforce_comment_hourly_limit();

revoke all on function public.enforce_comment_hourly_limit() from public;

create function public.get_craft_post_engagement(p_post_ids uuid[])
returns table (craft_post_id uuid, likes_count bigint, comments_count bigint)
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  if coalesce(cardinality(p_post_ids), 0) > 100 then
    raise exception 'Too many post IDs';
  end if;

  return query
  with requested as (
    select distinct unnest(p_post_ids) as id
  )
  select requested.id,
    (select count(*) from public.likes l where l.craft_post_id = requested.id),
    (select count(*) from public.comments c where c.craft_post_id = requested.id)
  from requested
  join public.craft_posts post on post.id = requested.id
  where post.is_active = true;
end;
$$;

revoke all on function public.get_craft_post_engagement(uuid[]) from public;
grant execute on function public.get_craft_post_engagement(uuid[]) to anon, authenticated;

create function public.deployment_contract_version()
returns text
language sql
stable
security invoker
set search_path = public
as $$ select '2026-09-14.1'::text $$;

revoke all on function public.deployment_contract_version() from public;
grant execute on function public.deployment_contract_version() to anon, authenticated;
