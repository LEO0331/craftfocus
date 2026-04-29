import { describe, expect, it } from 'vitest';

import { resolveAsciiAnimalBadge, resolveAsciiAnimalFrame } from '@/constants/asciiPets';
import { isValidGalleryCell } from '@/lib/galleryUtils';

describe('ascii companion helpers', () => {
  it('falls back to cat frame for unknown species', () => {
    const frame = resolveAsciiAnimalFrame('unknown', 'sewing', 0);
    expect(frame).toContain('/\\_/\\');
  });

  it('returns compact badge text for known species', () => {
    expect(resolveAsciiAnimalBadge('dog')).toContain('ᴥ');
  });
});

describe('gallery cell validation', () => {
  it('accepts 0..4 coordinates only', () => {
    expect(isValidGalleryCell(0, 0)).toBe(true);
    expect(isValidGalleryCell(4, 4)).toBe(true);
    expect(isValidGalleryCell(5, 4)).toBe(false);
    expect(isValidGalleryCell(-1, 3)).toBe(false);
    expect(isValidGalleryCell(2.5, 1)).toBe(false);
  });
});
