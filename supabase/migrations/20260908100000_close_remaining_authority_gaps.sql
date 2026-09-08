-- Keep companion unlocks and legacy exchange decisions server-authoritative.

drop policy if exists "user_animals_owner_write" on public.user_animals;

create or replace function public.prevent_direct_active_animal_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- set_active_animal is SECURITY DEFINER and executes as its owner. Direct
  -- PostgREST profile edits execute as the authenticated database role.
  if current_user = 'authenticated'
     and new.active_animal_id is distinct from old.active_animal_id then
    raise exception 'Use set_active_animal to select an unlocked animal';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profile_active_animal_authority on public.profiles;
create trigger trg_profile_active_animal_authority
before update on public.profiles
for each row execute function public.prevent_direct_active_animal_change();

drop policy if exists "exchange_requester_insert" on public.exchange_requests;
create policy "exchange_requester_insert" on public.exchange_requests
for insert to authenticated
with check (
  auth.uid() = requester_id
  and requester_id <> owner_id
  and status = 'pending'
  and exists (
    select 1 from public.craft_posts post
    where post.id = craft_post_id and post.user_id = owner_id
  )
);

create or replace function public.enforce_exchange_transition()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null or new.status = old.status then return new; end if;
  if old.status = 'pending' and new.status in ('accepted', 'rejected')
     and auth.uid() = old.owner_id then return new; end if;
  if old.status = 'pending' and new.status = 'cancelled'
     and auth.uid() = old.requester_id then return new; end if;
  raise exception 'Unauthorized exchange transition';
end;
$$;

drop trigger if exists trg_exchange_authorized_transition on public.exchange_requests;
create trigger trg_exchange_authorized_transition
before update on public.exchange_requests
for each row execute function public.enforce_exchange_transition();
