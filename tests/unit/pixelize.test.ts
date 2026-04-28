import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

describe('pixelizeImage (native fallback)', () => {
  it('returns input URI on non-web platform', async () => {
    const { pixelizeImage } = await import('@/lib/pixelize');
    const input = 'file:///tmp/example.jpg';
    await expect(pixelizeImage(input)).resolves.toBe(input);
  });
});
