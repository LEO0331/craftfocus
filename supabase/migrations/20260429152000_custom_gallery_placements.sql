create table if not exists public.custom_gallery_placements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.craft_posts(id) on delete cascade,
  cell_x integer not null,
  cell_y integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint custom_gallery_cell_bounds check (cell_x between 0 and 4 and cell_y between 0 and 4),
  constraint custom_gallery_unique_listing unique (user_id, listing_id),
  constraint custom_gallery_unique_cell unique (user_id, cell_x, cell_y)
);

create index if not exists idx_custom_gallery_user on public.custom_gallery_placements(user_id);

create or replace function public.touch_custom_gallery_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_custom_gallery_updated_at on public.custom_gallery_placements;
create trigger trg_custom_gallery_updated_at
before update on public.custom_gallery_placements
for each row execute function public.touch_custom_gallery_updated_at();

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

create or replace function public.remove_custom_gallery_placement(
  p_listing_id uuid
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

  delete from public.custom_gallery_placements
  where user_id = v_uid and listing_id = p_listing_id;
end;
$$;

alter table public.custom_gallery_placements enable row level security;

drop policy if exists "custom_gallery_public_read" on public.custom_gallery_placements;
create policy "custom_gallery_public_read"
on public.custom_gallery_placements
for select
using (true);

drop policy if exists "custom_gallery_owner_write" on public.custom_gallery_placements;
create policy "custom_gallery_owner_write"
on public.custom_gallery_placements
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

revoke all on function public.upsert_custom_gallery_placement(uuid, integer, integer) from public;
revoke all on function public.remove_custom_gallery_placement(uuid) from public;
grant execute on function public.upsert_custom_gallery_placement(uuid, integer, integer) to authenticated;
grant execute on function public.remove_custom_gallery_placement(uuid) to authenticated;

