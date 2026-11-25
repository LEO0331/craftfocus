// Static artwork installed by the existing demo and reseed migrations.
const LEGACY_CRAFT_IMAGES = new Set([
  'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
  'https://images.unsplash.com/photo-1519710164239-da123dc03ef4',
]);
const STORAGE_OBJECT_PATH = /^(?:[A-Za-z0-9_-][A-Za-z0-9_.-]*\/)*[A-Za-z0-9_-][A-Za-z0-9_.-]*$/;
const HTTPS_IMAGE_URL = /^https:\/\/[A-Za-z0-9.-]+(?::[0-9]+)?\/[^\s\\]+$/;

export function getTrustedCraftImageUrl(
  uri: string | null | undefined,
  ownerId: string,
  official = false,
): string | null {
  if (!uri || uri !== uri.trim()) return null;
  if (LEGACY_CRAFT_IMAGES.has(uri) || (official && HTTPS_IMAGE_URL.test(uri))) return uri;

  const projectUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
  if (!projectUrl) return null;
  const prefix = `${projectUrl}/storage/v1/object/public/craft-images/${ownerId}/`;
  return uri.startsWith(prefix) && STORAGE_OBJECT_PATH.test(uri.slice(prefix.length)) ? uri : null;
}
