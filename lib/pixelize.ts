import { Platform } from 'react-native';

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
