-- CraftFocus security hardening

-- 1) Restrict SECURITY DEFINER function execution explicitly.
revoke all on function public.unlock_animals_for_user(uuid) from public;
revoke all on function public.award_seeds_for_session(integer,text,public.focus_mode) from public;
revoke all on function public.place_inventory_at_anchor(uuid,text,text) from public;
revoke all on function public.remove_room_placement(uuid) from public;
revoke all on function public.claim_listing_with_seeds(uuid) from public;
revoke all on function public.set_active_animal(text) from public;

grant execute on function public.unlock_animals_for_user(uuid) to service_role;
grant execute on function public.award_seeds_for_session(integer,text,public.focus_mode) to authenticated;
grant execute on function public.place_inventory_at_anchor(uuid,text,text) to authenticated;
grant execute on function public.remove_room_placement(uuid) to authenticated;
grant execute on function public.claim_listing_with_seeds(uuid) to authenticated;
grant execute on function public.set_active_animal(text) to authenticated;

-- 2) Prevent relationship ownership tampering and limit mutable fields.
drop policy if exists "friendships_involved_update" on public.friendships;
drop policy if exists "exchange_involved_update" on public.exchange_requests;

create policy "friendships_involved_update_status_only" on public.friendships
for update
using (auth.uid() = requester_id or auth.uid() = addressee_id)
with check (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "exchange_involved_update_status_only" on public.exchange_requests
for update
using (auth.uid() = requester_id or auth.uid() = owner_id)
with check (auth.uid() = requester_id or auth.uid() = owner_id);

create or replace function public.prevent_friendship_identity_change()
returns trigger
language plpgsql
as $$
begin
  if new.requester_id <> old.requester_id
     or new.addressee_id <> old.addressee_id then
    raise exception 'immutable friendship principals';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_friendship_immutable on public.friendships;
create trigger trg_friendship_immutable
before update on public.friendships
for each row execute function public.prevent_friendship_identity_change();

create or replace function public.prevent_exchange_identity_change()
returns trigger
language plpgsql
as $$
begin
  if new.requester_id <> old.requester_id
     or new.owner_id <> old.owner_id
     or new.craft_post_id <> old.craft_post_id then
    raise exception 'immutable exchange principals';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_exchange_immutable on public.exchange_requests;
create trigger trg_exchange_immutable
before update on public.exchange_requests
for each row execute function public.prevent_exchange_identity_change();

-- 3) Harden storage bucket exposure.
update storage.buckets
set public = false
where id = 'craft-images';

drop policy if exists "craft_images_public_read" on storage.objects;
drop policy if exists "craft_images_owner_read" on storage.objects;
create policy "craft_images_owner_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'craft-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 4) Seed cost guardrails to reduce abuse.
alter table public.craft_posts
  drop constraint if exists craft_posts_seed_cost_minmax;
alter table public.craft_posts
  add constraint craft_posts_seed_cost_minmax check (seed_cost between 1 and 10000);
