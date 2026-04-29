create or replace function public.claim_official_inventory_item(
  p_item_id text,
  p_seed_cost integer default 25
)
returns table (seeds_balance integer, item_id text, quantity integer)
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

  if p_seed_cost < 1 then
    raise exception 'Invalid seed cost';
  end if;

  if not exists (select 1 from public.item_catalog where id = p_item_id) then
    raise exception 'Unknown item';
  end if;

  insert into public.user_wallets (user_id, seeds_balance)
  values (v_uid, 0)
  on conflict (user_id) do nothing;

  update public.user_wallets
  set seeds_balance = seeds_balance - p_seed_cost,
      updated_at = now()
  where user_id = v_uid and seeds_balance >= p_seed_cost;

  if not found then
    raise exception 'Not enough seeds';
  end if;

  insert into public.user_inventory (user_id, item_id, quantity)
  values (v_uid, p_item_id, 1)
  on conflict (user_id, item_id) do update
  set quantity = public.user_inventory.quantity + 1,
      updated_at = now();

  return query
  select uw.seeds_balance, ui.item_id, ui.quantity
  from public.user_wallets uw
  join public.user_inventory ui
    on ui.user_id = uw.user_id and ui.item_id = p_item_id
  where uw.user_id = v_uid;
end;
$$;

revoke all on function public.claim_official_inventory_item(text, integer) from public;
grant execute on function public.claim_official_inventory_item(text, integer) to authenticated;

