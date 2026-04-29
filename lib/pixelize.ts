import { Platform } from 'react-native';

export type PixelPalette = Record<string, string>;

export interface PixelGridSpriteData {
  palette: PixelPalette;
  grid: string[];
}

/**
 * Experimental pixelize service. Returns a data URL on web.
 * Native currently falls back to the original URI for MVP.
 */
export async function pixelizeImage(inputUri: string): Promise<string> {
  if (Platform.OS !== 'web') {
    return inputUri;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const tinyCanvas = document.createElement('canvas');
        const outputCanvas = document.createElement('canvas');

        const baseSize = 48;
        const ratio = img.width / img.height || 1;
        const tinyWidth = Math.max(16, Math.round(baseSize * ratio));
        const tinyHeight = Math.max(16, Math.round(baseSize / ratio));

        tinyCanvas.width = tinyWidth;
        tinyCanvas.height = tinyHeight;

        const tinyCtx = tinyCanvas.getContext('2d');
        if (!tinyCtx) {
          reject(new Error('Failed to build tiny canvas context'));
          return;
        }

        tinyCtx.imageSmoothingEnabled = false;
        tinyCtx.drawImage(img, 0, 0, tinyWidth, tinyHeight);

        outputCanvas.width = tinyWidth * 8;
        outputCanvas.height = tinyHeight * 8;

        const outputCtx = outputCanvas.getContext('2d');
        if (!outputCtx) {
          reject(new Error('Failed to build output canvas context'));
          return;
        }

        outputCtx.imageSmoothingEnabled = false;
        outputCtx.drawImage(tinyCanvas, 0, 0, outputCanvas.width, outputCanvas.height);

        resolve(outputCanvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for pixelization'));
    img.src = inputUri;
  });
}

const PIXEL_TOKENS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function toHex(value: number) {
  return value.toString(16).padStart(2, '0');
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function quantize(value: number) {
  return Math.max(0, Math.min(255, Math.round(value / 51) * 51));
}

function pickPaletteBuckets(imageData: Uint8ClampedArray, maxColors: number) {
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
  for (let i = 0; i < imageData.length; i += 4) {
    const alpha = imageData[i + 3];
    if (alpha < 40) continue;
    const r = quantize(imageData[i]);
    const g = quantize(imageData[i + 1]);
    const b = quantize(imageData[i + 2]);
    const key = `${r}-${g}-${b}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    buckets.set(key, { count: 1, r, g, b });
  }

  return Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, maxColors);
}

function nearestPaletteToken(r: number, g: number, b: number, colors: Array<{ token: string; r: number; g: number; b: number }>) {
  let bestToken = colors[0]?.token ?? '.';
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const color of colors) {
    const dr = r - color.r;
    const dg = g - color.g;
    const db = b - color.b;
    const distance = dr * dr + dg * dg + db * db;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestToken = color.token;
    }
  }

  return bestToken;
}

/**
 * Converts an image to a compact 8x8 palette+grid sprite payload.
 * Used as persistent fallback when image URLs are unavailable.
 */
export async function convertImageToPixelSprite(inputUri: string): Promise<PixelGridSpriteData | null> {
  if (Platform.OS !== 'web') {
    return null;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 8;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.clearRect(0, 0, size, size);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, size, size);

        const raw = ctx.getImageData(0, 0, size, size);
        const buckets = pickPaletteBuckets(raw.data, PIXEL_TOKENS.length);
        if (!buckets.length) {
          resolve(null);
          return;
        }

        const colors = buckets.map((bucket, index) => ({ token: PIXEL_TOKENS[index], r: bucket.r, g: bucket.g, b: bucket.b }));
        const palette: PixelPalette = { '.': '#00000000' };
        colors.forEach((color) => {
          palette[color.token] = rgbToHex(color.r, color.g, color.b);
        });

        const grid: string[] = [];
        for (let y = 0; y < size; y += 1) {
          let row = '';
          for (let x = 0; x < size; x += 1) {
            const offset = (y * size + x) * 4;
            const alpha = raw.data[offset + 3];
            if (alpha < 40) {
              row += '.';
              continue;
            }
            row += nearestPaletteToken(raw.data[offset], raw.data[offset + 1], raw.data[offset + 2], colors);
          }
          grid.push(row);
        }

        resolve({ palette, grid });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = inputUri;
  });
}

const SURPRISE_PALETTES: string[][] = [
  ['#1F2937', '#EF4444', '#F59E0B', '#FDE68A'],
  ['#0B3C5D', '#328CC1', '#D9B310', '#1D2731'],
  ['#2D1E2F', '#7B2CBF', '#C77DFF', '#E0AAFF'],
  ['#1E2D24', '#4C956C', '#B5C99A', '#F6F4D2'],
];

/**
 * Generates a random pixel-art preview using a fixed palette.
 * This is non-AI and deterministic per invocation seed.
 */
export async function generateSurprisePixelArt(seed = Date.now()): Promise<string> {
  if (Platform.OS !== 'web') {
    throw new Error('Surprise pixel generator is currently supported on web only.');
  }

  const palette = SURPRISE_PALETTES[Math.abs(seed) % SURPRISE_PALETTES.length];
  const cells = 16;
  const scale = 12;
  const width = cells * scale;
  const height = cells * scale;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to build canvas context');
  }

  let state = seed % 2147483647;
  const next = () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = palette[0];
  ctx.fillRect(0, 0, width, height);

  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < Math.ceil(cells / 2); x += 1) {
      const color = palette[Math.floor(next() * palette.length)];
      if (next() > 0.24) {
        continue;
      }
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
      ctx.fillRect((cells - 1 - x) * scale, y * scale, scale, scale);
    }
  }

  return canvas.toDataURL('image/png');
}
