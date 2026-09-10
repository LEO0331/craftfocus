import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
import { convertImageToPixelSprite, pixelizeImage } from '@/lib/pixelize';

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

describe('persistent pixel sprite detail', () => {
  it('creates a square 16x16 grid with a richer palette', async () => {
    vi.stubGlobal('Image', class {
      onload = () => {};
      set src(_value: string) { this.onload(); }
    });
    const pixels = new Uint8ClampedArray(16 * 16 * 4);
    for (let index = 0; index < 16 * 16; index += 1) {
      pixels[index * 4] = (index * 17) % 256;
      pixels[index * 4 + 1] = (index * 31) % 256;
      pixels[index * 4 + 2] = (index * 47) % 256;
      pixels[index * 4 + 3] = 255;
    }
    vi.stubGlobal('document', {
      createElement: () => ({
        width: 0,
        height: 0,
        getContext: () => ({
          clearRect: vi.fn(),
          drawImage: vi.fn(),
          getImageData: () => ({ data: pixels }),
        }),
      }),
    });

    const result = await convertImageToPixelSprite('blob:test');
    expect(result?.grid).toHaveLength(16);
    expect(result?.grid.every((row) => row.length === 16)).toBe(true);
    expect(Object.keys(result?.palette ?? {}).length).toBeGreaterThan(8);
  });
});
