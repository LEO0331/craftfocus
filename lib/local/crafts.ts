import { LOCAL_USER_ID } from '@/lib/data-mode';
import { isValidGalleryCell } from '@/lib/galleryUtils';
import { validateImageBlob } from '@/lib/storage';
import { sanitizeText } from '@/lib/validation';
import { request, withLocalTransaction } from './database';

export interface LocalCraft {
  id: string;
  title: string;
  description: string;
  image: Blob;
  pixelImage: Blob | null;
  pixelPalette: Record<string, string> | null;
  pixelGrid: string[] | null;
  createdAt: string;
}

export interface LocalGalleryPlacement {
  id: string;
  cellX: number;
  cellY: number;
}

export async function listLocalCrafts(userId = LOCAL_USER_ID): Promise<LocalCraft[]> {
  if (userId !== LOCAL_USER_ID) return [];
  return withLocalTransaction(['crafts'], 'readonly', async (tx) => {
    const crafts: LocalCraft[] = await request(tx.objectStore('crafts').getAll());
    return crafts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
}

export function countLocalCrafts(): Promise<number> {
  return withLocalTransaction(['crafts'], 'readonly', (tx) => request(tx.objectStore('crafts').count()));
}

export async function getLocalCraft(id: string): Promise<LocalCraft | undefined> {
  return withLocalTransaction(['crafts'], 'readonly', (tx) => request(tx.objectStore('crafts').get(id)));
}

export async function createLocalCraft(input: Omit<LocalCraft, 'id' | 'createdAt'>): Promise<string> {
  const title = sanitizeText(input.title, 20);
  const description = sanitizeText(input.description, 60);
  if (!title) throw new Error('Enter a craft title.');
  await validateImageBlob(input.image);
  if (input.pixelImage) await validateImageBlob(input.pixelImage);

  const craft: LocalCraft = {
    ...input,
    title,
    description,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  await withLocalTransaction(['crafts'], 'readwrite', (tx) => request(tx.objectStore('crafts').add(craft)));
  return craft.id;
}

export async function deleteLocalCraft(id: string): Promise<void> {
  await withLocalTransaction(['crafts', 'gallery'], 'readwrite', async (tx) => {
    await request(tx.objectStore('gallery').delete(id));
    await request(tx.objectStore('crafts').delete(id));
  });
}

export async function listLocalGalleryPlacements(userId: string): Promise<LocalGalleryPlacement[]> {
  if (userId !== LOCAL_USER_ID) return [];
  return withLocalTransaction(['gallery'], 'readonly', (tx) => request(tx.objectStore('gallery').getAll()));
}

export async function placeLocalCollectible(id: string, cellX: number, cellY: number): Promise<void> {
  if (!isValidGalleryCell(cellX, cellY)) throw new Error('Invalid gallery cell');
  await withLocalTransaction(['crafts', 'gallery'], 'readwrite', async (tx) => {
    if (!(await request(tx.objectStore('crafts').getKey(id)))) throw new Error('Collectible not owned');
    const gallery = tx.objectStore('gallery');
    const placements: LocalGalleryPlacement[] = await request(gallery.getAll());
    if (placements.some((entry) => entry.id !== id && entry.cellX === cellX && entry.cellY === cellY)) {
      throw new Error('Gallery cell is occupied');
    }
    await request(gallery.put({ id, cellX, cellY } satisfies LocalGalleryPlacement));
  });
}

export async function removeLocalCollectiblePlacement(id: string): Promise<void> {
  await withLocalTransaction(['gallery'], 'readwrite', (tx) => request(tx.objectStore('gallery').delete(id)));
}
