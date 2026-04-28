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
