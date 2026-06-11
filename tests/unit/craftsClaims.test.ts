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

import { claimListingWithSeeds, claimOfficialInventoryItem, setPostLike } from '@/lib/crafts';

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

  it('sets likes idempotently instead of toggling on retry', async () => {
    const upsert = vi.fn().mockResolvedValueOnce({ error: null });
    mocks.from.mockReturnValueOnce({ upsert });

    await expect(setPostLike('post-1', 'user-1', true)).resolves.toEqual({ liked: true });

    expect(mocks.from).toHaveBeenCalledWith('likes');
    expect(upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', craft_post_id: 'post-1' },
      { onConflict: 'user_id,craft_post_id', ignoreDuplicates: true },
    );
  });

  it('unsets likes idempotently by user and post', async () => {
    const secondEq = vi.fn().mockResolvedValueOnce({ error: null });
    const firstEq = vi.fn().mockReturnValueOnce({ eq: secondEq });
    const deleteFn = vi.fn().mockReturnValueOnce({ eq: firstEq });
    mocks.from.mockReturnValueOnce({ delete: deleteFn });

    await expect(setPostLike('post-1', 'user-1', false)).resolves.toEqual({ liked: false });

    expect(deleteFn).toHaveBeenCalled();
    expect(firstEq).toHaveBeenCalledWith('craft_post_id', 'post-1');
    expect(secondEq).toHaveBeenCalledWith('user_id', 'user-1');
  });
});
