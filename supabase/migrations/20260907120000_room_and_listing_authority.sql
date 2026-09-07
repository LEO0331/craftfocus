-- Serialize room inventory transfers and enforce social/listing authority.
create or replace function public.place_inventory_at_anchor(
  p_room_id uuid, p_item_id text, p_anchor_id text
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_old public.room_placements%rowtype;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  -- Both placement RPCs lock the room first, including empty anchors.
  perform 1 from public.rooms where id = p_room_id and user_id = v_uid for update;
  if not found then raise exception 'Not room owner'; end if;

  delete from public.room_placements
  where room_id = p_room_id and anchor_id = p_anchor_id
  returning * into v_old;
  if found then
    insert into public.user_inventory (user_id, item_id, quantity)
    values (v_uid, v_old.item_id, v_old.placed_count)
    on conflict (user_id, item_id) do update
    set quantity = public.user_inventory.quantity + excluded.quantity, updated_at = now();
  end if;

  update public.user_inventory
  set quantity = quantity - 1, updated_at = now()
  where user_id = v_uid and item_id = p_item_id and quantity > 0;
  if not found then raise exception 'Not enough inventory'; end if;

  insert into public.room_placements (room_id, item_id, anchor_id, placed_count)
  values (p_room_id, p_item_id, p_anchor_id, 1);
end;
$$;

create or replace function public.remove_room_placement(p_room_placement_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room_id uuid;
  v_old public.room_placements%rowtype;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select room_id into v_room_id from public.room_placements where id = p_room_placement_id;
  perform 1 from public.rooms where id = v_room_id and user_id = v_uid for update;
  if not found then raise exception 'Not room owner'; end if;

  -- Refund only the row actually removed, never a stale pre-lock snapshot.
  delete from public.room_placements
  where id = p_room_placement_id and room_id = v_room_id returning * into v_old;
  if not found then raise exception 'Placement not found'; end if;

  insert into public.user_inventory (user_id, item_id, quantity)
  values (v_uid, v_old.item_id, v_old.placed_count)
  on conflict (user_id, item_id) do update
  set quantity = public.user_inventory.quantity + excluded.quantity, updated_at = now();
end;
$$;

revoke all on function public.place_inventory_at_anchor(uuid,text,text) from public;
revoke all on function public.remove_room_placement(uuid) from public;
grant execute on function public.place_inventory_at_anchor(uuid,text,text) to authenticated;
grant execute on function public.remove_room_placement(uuid) to authenticated;

drop policy if exists "friendships_requester_insert" on public.friendships;
create policy "friendships_requester_insert" on public.friendships
for insert to authenticated
with check (auth.uid() = requester_id and requester_id <> addressee_id and status = 'pending');

create or replace function public.enforce_friendship_transition()
returns trigger
language plpgsql set search_path = public
as $$
begin
  -- Administrative SQL/service maintenance retains its existing privileges.
  if auth.uid() is null then return new; end if;
  if new.status = old.status then return new; end if;
  if old.status = 'pending' and new.status in ('accepted', 'rejected')
     and auth.uid() = old.addressee_id then return new; end if;
  if old.status = 'rejected' and new.status = 'pending'
     and auth.uid() = old.requester_id then return new; end if;
  raise exception 'Unauthorized friendship transition';
end;
$$;
create trigger trg_friendship_authorized_transition
before update on public.friendships
for each row execute function public.enforce_friendship_transition();

-- Official inventory is granted by the official RPC at its canonical price.
-- User-created listings cannot impersonate catalog listings on insert or update.
-- Restrictive policies preserve the existing daily-upload policy unchanged.
create policy "craft_posts_custom_insert_only" on public.craft_posts
as restrictive for insert to authenticated
with check (listing_type = 'custom' and reward_item_id is null);
create policy "craft_posts_custom_update_only" on public.craft_posts
as restrictive for update to authenticated
using (listing_type = 'custom' and reward_item_id is null)
with check (listing_type = 'custom' and reward_item_id is null);
