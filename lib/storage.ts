import { supabase } from '@/lib/supabase';
import { isLocalMode } from '@/lib/data-mode';

/**
 * Storage abstraction for images/files.
 * MVP uses Supabase Storage first; this interface keeps R2 migration low-friction.
 */
export interface StorageAdapter {
  uploadImage(params: { bucket: string; path: string; uri: string }): Promise<string>;
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_URI_PREFIXES = ['file:', 'data:', 'blob:', 'content://', 'ph://', 'asset-library://', '/'];
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

function hasImageSignature(bytes: Uint8Array, mime: string): boolean {
  if (mime === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mime === 'image/png') {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  if (mime === 'image/webp') {
    return (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  return false;
}

export async function readImageBlob(uri: string): Promise<Blob> {
  if (isLocalMode && uri.startsWith('data:')) {
    const separator = uri.indexOf(',');
    const mime = /^data:(image\/(?:jpeg|png|webp));base64$/i.exec(uri.slice(0, separator))?.[1];
    if (!mime) throw new Error('Unsupported file type. Use JPEG, PNG, or WEBP.');
    // The app's CSP permits data images for rendering, but excludes data URLs from fetch.
    if (uri.length - separator - 1 > Math.ceil(MAX_UPLOAD_BYTES / 3) * 4) {
      throw new Error('Image exceeds 10MB upload limit.');
    }
    const decoded = atob(uri.slice(separator + 1));
    const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
    const blob = new Blob([bytes], { type: mime });
    await validateImageBlob(blob);
    return blob;
  }

  const safe = isLocalMode
    ? uri.startsWith('blob:')
    : ALLOWED_URI_PREFIXES.some((prefix) => uri.startsWith(prefix));
  if (!safe) {
    throw new Error('Unsupported image URI source.');
  }
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to read file: ${response.status}`);
  }
  const blob = await response.blob();
  await validateImageBlob(blob);
  return blob;
}

export async function validateImageBlob(blob: Blob): Promise<void> {
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error('Image exceeds 10MB upload limit.');
  }
  if (!ALLOWED_MIME.has(blob.type)) {
    throw new Error('Unsupported file type. Use JPEG, PNG, or WEBP.');
  }

  const header = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  if (!hasImageSignature(header, blob.type)) {
    throw new Error('Invalid image content signature.');
  }
}

export const storageAdapter: StorageAdapter = {
  async uploadImage({ bucket, path, uri }) {
    if (isLocalMode) throw new Error('Image uploads require Online Mode.');
    const blob = await readImageBlob(uri);

    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      upsert: true,
      contentType: blob.type || 'image/jpeg',
    });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },
};
