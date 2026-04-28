-- CraftFocus MVP schema (Supabase Postgres)
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  duration_minutes integer not null,
  category text not null,
  build_target text not null,
  status text not null check (status in ('completed', 'given_up')),
  reward_coins integer not null default 0,
  progress_awarded integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.item_catalog (
  id text primary key,
  name text not null,
  category text not null,
  image_url text,
  half_built_image_url text,
  required_progress integer not null default 100
);

create table if not exists public.user_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id text not null references public.item_catalog(id) on delete restrict,
  progress integer not null default 0,
  unlocked boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null default 'My Focus Room',
  created_at timestamptz not null default now()
);

create table if not exists public.room_items (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_item_id uuid not null references public.user_items(id) on delete cascade,
  x integer not null,
  y integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.craft_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  image_url text,
  pixel_image_url text,
  open_to_exchange boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  craft_post_id uuid not null references public.craft_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, craft_post_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  craft_post_id uuid not null references public.craft_posts(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

create table if not exists public.exchange_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  craft_post_id uuid not null references public.craft_posts(id) on delete cascade,
  message text,
  status text not null check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_focus_sessions_user_created_at on public.focus_sessions(user_id, created_at desc);
create index if not exists idx_craft_posts_created_at on public.craft_posts(created_at desc);
create index if not exists idx_room_items_room on public.room_items(room_id);
create index if not exists idx_friendships_requester on public.friendships(requester_id);
create index if not exists idx_friendships_addressee on public.friendships(addressee_id);
create index if not exists idx_exchange_owner on public.exchange_requests(owner_id);
create index if not exists idx_exchange_requester on public.exchange_requests(requester_id);

-- Auto-create profile + room when new auth user appears.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'user_' || substr(replace(new.id::text, '-', ''), 1, 8))
  on conflict (id) do nothing;

  insert into public.rooms (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.item_catalog enable row level security;
alter table public.user_items enable row level security;
alter table public.rooms enable row level security;
alter table public.room_items enable row level security;
alter table public.craft_posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.friendships enable row level security;
alter table public.exchange_requests enable row level security;

-- profiles: public read, owner update
create policy "profiles_public_read" on public.profiles
for select using (true);

create policy "profiles_owner_insert" on public.profiles
for insert with check (auth.uid() = id);

create policy "profiles_owner_update" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

-- focus_sessions: owner only
create policy "focus_owner_read" on public.focus_sessions
for select using (auth.uid() = user_id);

create policy "focus_owner_insert" on public.focus_sessions
for insert with check (auth.uid() = user_id);

create policy "focus_owner_update" on public.focus_sessions
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "focus_owner_delete" on public.focus_sessions
for delete using (auth.uid() = user_id);

-- item_catalog: public read
create policy "item_catalog_public_read" on public.item_catalog
for select using (true);

-- user_items: owner read/write, plus public read when unlocked for room display
create policy "user_items_owner_read" on public.user_items
for select using (auth.uid() = user_id);

create policy "user_items_unlocked_public_read" on public.user_items
for select using (unlocked = true);

create policy "user_items_owner_insert" on public.user_items
for insert with check (auth.uid() = user_id);

create policy "user_items_owner_update" on public.user_items
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_items_owner_delete" on public.user_items
for delete using (auth.uid() = user_id);

-- rooms and room_items: public readable, owner mutates
create policy "rooms_public_read" on public.rooms
for select using (true);

create policy "rooms_owner_insert" on public.rooms
for insert with check (auth.uid() = user_id);

create policy "rooms_owner_update" on public.rooms
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "room_items_public_read" on public.room_items
for select using (true);

create policy "room_items_owner_insert" on public.room_items
for insert with check (
  exists (
    select 1
    from public.rooms r
    where r.id = room_id and r.user_id = auth.uid()
  )
);

create policy "room_items_owner_update" on public.room_items
for update using (
  exists (
    select 1
    from public.rooms r
    where r.id = room_id and r.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.rooms r
    where r.id = room_id and r.user_id = auth.uid()
  )
);

create policy "room_items_owner_delete" on public.room_items
for delete using (
  exists (
    select 1
    from public.rooms r
    where r.id = room_id and r.user_id = auth.uid()
  )
);

-- craft_posts: public read, owner write
create policy "craft_posts_public_read" on public.craft_posts
for select using (true);

create policy "craft_posts_owner_insert" on public.craft_posts
for insert with check (auth.uid() = user_id);

create policy "craft_posts_owner_update" on public.craft_posts
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "craft_posts_owner_delete" on public.craft_posts
for delete using (auth.uid() = user_id);

-- likes/comments: authenticated users
create policy "likes_public_read" on public.likes
for select using (true);

create policy "likes_auth_insert" on public.likes
for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "likes_owner_delete" on public.likes
for delete using (auth.uid() = user_id);

create policy "comments_public_read" on public.comments
for select using (true);

create policy "comments_auth_insert" on public.comments
for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "comments_owner_update" on public.comments
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "comments_owner_delete" on public.comments
for delete using (auth.uid() = user_id);

-- friendships: only involved users
create policy "friendships_involved_read" on public.friendships
for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "friendships_requester_insert" on public.friendships
for insert with check (auth.uid() = requester_id);

create policy "friendships_involved_update" on public.friendships
for update using (auth.uid() = requester_id or auth.uid() = addressee_id)
with check (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "friendships_requester_delete" on public.friendships
for delete using (auth.uid() = requester_id);

-- exchange_requests: requester + owner only
create policy "exchange_involved_read" on public.exchange_requests
for select using (auth.uid() = requester_id or auth.uid() = owner_id);

create policy "exchange_requester_insert" on public.exchange_requests
for insert with check (auth.uid() = requester_id);

create policy "exchange_involved_update" on public.exchange_requests
for update using (auth.uid() = requester_id or auth.uid() = owner_id)
with check (auth.uid() = requester_id or auth.uid() = owner_id);

create policy "exchange_requester_delete" on public.exchange_requests
for delete using (auth.uid() = requester_id);
