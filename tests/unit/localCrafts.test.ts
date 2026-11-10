import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LOCAL_USER_ID } from '@/lib/data-mode';
import { getCraftPostDetail, listCraftPosts } from '@/lib/crafts';
import { listCustomCollectibles, listGalleryPlacements, listPublicGalleryItems } from '@/lib/gallery';
import {
  createLocalCraft,
  deleteLocalCraft,
  placeLocalCollectible,
  removeLocalCollectiblePlacement,
} from '@/lib/local/crafts';
import { request, withLocalTransaction } from '@/lib/local/database';
import { readImageBlob } from '@/lib/storage';

vi.mock('@/lib/data-mode', () => ({ isLocalMode: true, LOCAL_USER_ID: 'craftfocus-local-player' }));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => { throw new Error('Unexpected online request'); },
    rpc: () => { throw new Error('Unexpected online request'); },
  },
}));

const png = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], { type: 'image/png' });

function createCraft(title: string, image = png) {
  return createLocalCraft({ title, description: 'A local craft', image, pixelImage: null, pixelPalette: null, pixelGrid: null });
}

describe('local crafts and gallery', () => {
  beforeEach(async () => {
    await withLocalTransaction(['crafts', 'gallery'], 'readwrite', async (tx) => {
      await request(tx.objectStore('gallery').clear());
      await request(tx.objectStore('crafts').clear());
    });
  });

  it('stores a private craft and exposes its image and ownership after rereading', async () => {
    const id = await createCraft('  Pixel   patch  ');
    expect(await listCraftPosts(LOCAL_USER_ID)).toMatchObject([{ id, title: 'Pixel patch' }]);
    const post = await getCraftPostDetail(id, LOCAL_USER_ID);
    expect(await post.imageBlob?.arrayBuffer()).toEqual(await png.arrayBuffer());
    expect(await listCustomCollectibles(LOCAL_USER_ID)).toMatchObject([{ listingId: id }]);
    expect(await listCustomCollectibles('other-user')).toEqual([]);
    expect(await listPublicGalleryItems(LOCAL_USER_ID)).toEqual([]);
  });

  it('rejects unsupported or invalid images before storing any records', async () => {
    await expect(createCraft('Text', new Blob(['text'], { type: 'text/plain' }))).rejects.toThrow('Unsupported file type');
    await expect(createCraft('Fake PNG', new Blob(['text'], { type: 'image/png' }))).rejects.toThrow('Invalid image content signature');
    expect(await listCraftPosts(LOCAL_USER_ID)).toEqual([]);
  });

  it('reads generated data URI previews without a fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    try {
      const preview = await readImageBlob('data:image/png;base64,iVBORw0KGgo=');
      expect(await preview.arrayBuffer()).toEqual(await png.arrayBuffer());
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('enforces cell bounds and ownership, serializes concurrent placement, and moves one item per cell', async () => {
    const first = await createCraft('First');
    const second = await createCraft('Second');
    await expect(placeLocalCollectible('unowned', 0, 0)).rejects.toThrow('Collectible not owned');
    await expect(placeLocalCollectible(first, 0, 5)).rejects.toThrow('Invalid gallery cell');
    const results = await Promise.allSettled([placeLocalCollectible(first, 0, 0), placeLocalCollectible(second, 0, 0)]);
    expect(results).toEqual([{ status: 'fulfilled', value: undefined }, { status: 'rejected', reason: new Error('Gallery cell is occupied') }]);
    await placeLocalCollectible(first, 4, 4);
    expect(await listGalleryPlacements(LOCAL_USER_ID)).toMatchObject([{ listingId: first, cellX: 4, cellY: 4 }]);
    await removeLocalCollectiblePlacement(first);
    expect(await listGalleryPlacements(LOCAL_USER_ID)).toEqual([]);
    expect(await listCustomCollectibles(LOCAL_USER_ID)).toHaveLength(2);
  });

  it('removes the craft and its placement together', async () => {
    const id = await createCraft('Craft to delete');
    await placeLocalCollectible(id, 1, 1);
    await deleteLocalCraft(id);
    expect(await listCustomCollectibles(LOCAL_USER_ID)).toEqual([]);
    expect(await listGalleryPlacements(LOCAL_USER_ID)).toEqual([]);
  });
});
