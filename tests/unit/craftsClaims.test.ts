import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: mocks.rpc,
    from: mocks.from,
  },
}));

import { claimListingWithSeeds, claimOfficialInventoryItem } from '@/lib/crafts';

describe('craft claim APIs', () => {
  beforeEach(() => {
    mocks.rpc.mockReset();
    mocks.from.mockReset();
  });

  it('claims custom listings through the atomic RPC only', async () => {
    mocks.rpc.mockResolvedValueOnce({ error: null });

    await claimListingWithSeeds('listing-1');

    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith('claim_listing_with_seeds', { p_listing_id: 'listing-1' });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('claims official inventory through the v2 RPC only', async () => {
    mocks.rpc.mockResolvedValueOnce({ error: null });

    await claimOfficialInventoryItem('desk_lamp');

    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith('claim_official_inventory_item_v2', { p_item_id: 'desk_lamp' });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('surfaces RPC errors without mutating client-side tables', async () => {
    mocks.rpc.mockResolvedValueOnce({ error: { message: 'Not enough seeds', code: 'P0001' } });

    await expect(claimListingWithSeeds('listing-1')).rejects.toThrow('Not enough seeds');
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
