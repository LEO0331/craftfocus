-- Compat wrapper for clients that call claim_official_inventory_item with one argument.

create or replace function public.claim_official_inventory_item(
  p_item_id text
)
returns table (seeds_balance integer, item_id text, quantity integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select *
  from public.claim_official_inventory_item(p_item_id, 25);
end;
$$;

revoke all on function public.claim_official_inventory_item(text) from public;
grant execute on function public.claim_official_inventory_item(text) to authenticated;
