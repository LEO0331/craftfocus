-- Stable, non-overloaded RPC for official inventory claim
-- Avoids PostgREST overload/signature ambiguity on claim_official_inventory_item

create or replace function public.claim_official_inventory_item_v2(
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
  from public.claim_official_inventory_item(p_item_id, 25::integer);
end;
$$;

revoke all on function public.claim_official_inventory_item_v2(text) from public;
grant execute on function public.claim_official_inventory_item_v2(text) to authenticated;
