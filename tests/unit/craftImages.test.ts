import { afterEach, describe, expect, it, vi } from 'vitest';

import { getTrustedCraftImageUrl } from '@/lib/craftImages';

const owner = '10000000-0000-0000-0000-000000000001';
const project = 'https://test.supabase.co';
const bucketUrl = `${project}/storage/v1/object/public/craft-images`;

afterEach(() => vi.unstubAllEnvs());

describe('getTrustedCraftImageUrl', () => {
  it('retains uploaded craft images from the configured project and owner prefix', () => {
    vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', `${project}/`);
    expect(getTrustedCraftImageUrl(`${bucketUrl}/${owner}/123-original.jpg`, owner))
      .toBe(`${bucketUrl}/${owner}/123-original.jpg`);
    expect(getTrustedCraftImageUrl(`${bucketUrl}/${owner}/crafts/123-pixel.png`, owner))
      .toBe(`${bucketUrl}/${owner}/crafts/123-pixel.png`);
  });

  it('suppresses unknown remote sources and invalid Storage paths', () => {
    vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', project);
    for (const uri of [
      'https://example.com/art.jpg',
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?viewer=1',
      `${bucketUrl}/different-owner/art.jpg`,
      `${bucketUrl}/${owner}/../art.jpg`,
      `${bucketUrl}/${owner}/%2e%2e/art.jpg`,
      `${bucketUrl}/${owner}/art.jpg?viewer=1`,
      `${bucketUrl}/${owner}/art.jpg\n`,
    ]) {
      expect(getTrustedCraftImageUrl(uri, owner)).toBeNull();
    }
  });

  it('keeps curated seed and official artwork eligible without a Storage URL', () => {
    vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', '');
    const legacy = 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f';
    const official = 'https://images.example.com/official/art.jpg';
    expect(getTrustedCraftImageUrl(legacy, owner)).toBe(legacy);
    expect(getTrustedCraftImageUrl(official, owner, true)).toBe(official);
    expect(getTrustedCraftImageUrl('http://images.example.com/art.jpg', owner, true)).toBeNull();
    expect(getTrustedCraftImageUrl(`${bucketUrl}/${owner}/art.jpg`, owner)).toBeNull();
    expect(getTrustedCraftImageUrl(undefined, owner)).toBeNull();
  });
});
