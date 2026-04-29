comment on table public.user_items is 'LEGACY: V1 progress inventory model. V2 uses user_inventory + room_placements.';
comment on table public.room_items is 'LEGACY: V1 room model. V2 uses room_placements.';
comment on table public.exchange_requests is 'LEGACY SOCIAL FLOW: retained for backwards compatibility. V2 UI uses listing_claims + custom_collectibles.';

comment on table public.user_wallets is 'V2 canonical seed balance source.';
comment on table public.user_inventory is 'V2 canonical official inventory source.';
comment on table public.listing_claims is 'V2 canonical listing claim records.';
comment on table public.custom_collectibles is 'V2 canonical custom collectible ownership records.';
comment on table public.custom_gallery_placements is 'V2 canonical 5x5 gallery placements for custom collectibles.';

