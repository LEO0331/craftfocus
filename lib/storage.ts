import { supabase } from '@/lib/supabase';

/**
 * Storage abstraction for images/files.
 * MVP uses Supabase Storage first; this interface keeps R2 migration low-friction.
 */
export interface StorageAdapter {
  uploadImage(params: { bucket: string; path: string; uri: string }): Promise<string>;
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_URI_PREFIXES = ['file:', 'data:', 'blob:', 'content://', 'ph://', 'asset-library://', '/'];

async function uriToBlob(uri: string): Promise<Blob> {
  const safe = ALLOWED_URI_PREFIXES.some((prefix) => uri.startsWith(prefix));
  if (!safe) {
    throw new Error('Unsupported image URI source.');
  }
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to read file: ${response.status}`);
  }
  const blob = await response.blob();
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error('Image exceeds 10MB upload limit.');
  }
  return blob;
}

export const storageAdapter: StorageAdapter = {
  async uploadImage({ bucket, path, uri }) {
    const blob = await uriToBlob(uri);

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
