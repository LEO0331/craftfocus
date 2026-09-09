import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
import { pixelizeImage } from '@/lib/pixelize';

afterEach(() => vi.unstubAllGlobals());

describe('web pixel preview dimensions', () => {
  it.each([[800, 400], [400, 800], [10000, 10]])('preserves aspect ratio and bounds canvases for %ix%i images', async (width, height) => {
    vi.stubGlobal('Image', class {
      width = width;
      height = height;
      onload = () => {};
      set src(_value: string) { this.onload(); }
    });
    const canvases: Array<{ width: number; height: number }> = [];
    vi.stubGlobal('document', {
      createElement: () => {
        const canvas = { width: 0, height: 0, getContext: () => ({ drawImage: vi.fn() }), toDataURL: () => 'data:image/png;base64,test' };
        canvases.push(canvas);
        return canvas;
      },
    });
    await pixelizeImage('blob:test');
    expect(Math.max(canvases[0].width, canvases[0].height)).toBe(96);
    expect(Math.max(canvases[1].width, canvases[1].height)).toBe(384);
    if (width / height < 48 && height / width < 48) {
      expect(canvases[0].width / canvases[0].height).toBeCloseTo(width / height);
    }
  });
});
