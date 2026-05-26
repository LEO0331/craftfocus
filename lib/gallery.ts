import { supabase } from '@/lib/supabase';
import { isValidGalleryCell } from '@/lib/galleryUtils';
import type { TableRow } from '@/types/database';
import type { CustomGalleryPlacement, GalleryItem } from '@/types/models';

type CraftPostRow = TableRow<'craft_posts'>;
type CustomCollectibleRow = TableRow<'custom_collectibles'>;
type CustomGalleryPlacementRow = TableRow<'custom_gallery_placements'>;
type ListingClaimRow = TableRow<'listing_claims'>;

function mapPlacement(row: CustomGalleryPlacementRow): CustomGalleryPlacement {
  return {
    id: row.id,
    userId: row.user_id,
    listingId: row.listing_id,
    cellX: row.cell_x,
    cellY: row.cell_y,
  };
}

export async function listCustomCollectibles(userId: string): Promise<GalleryItem[]> {
  const { data: collectibles, error: collectiblesError } = await supabase
    .from('custom_collectibles')
    .select('listing_id,image_url,pixel_image_url')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (collectiblesError) throw collectiblesError;

  const ownedFromCollectibles = new Set((collectibles ?? []).map((entry) => entry.listing_id));

  // Legacy compatibility: users may have custom listing_claims without a custom_collectibles row.
  const { data: claims, error: claimsError } = await supabase
    .from('listing_claims')
    .select('listing_id')
    .eq('user_id', userId);
  if (claimsError) throw claimsError;

  const claimListingIds = (claims ?? []).map((entry: Pick<ListingClaimRow, 'listing_id'>) => entry.listing_id);
  const listingIds = Array.from(new Set([...ownedFromCollectibles, ...claimListingIds]));
  if (!listingIds.length) return [];

  const { data: posts, error: postsError } = await supabase
    .from('craft_posts')
    .select('id,title,image_url,pixel_image_url,pixel_palette,pixel_grid,listing_type')
    .in('id', listingIds);
  if (postsError) throw postsError;

  const postMap = new Map(
    (
      posts ?? []
    ).map((post: Pick<CraftPostRow, 'id' | 'title' | 'image_url' | 'pixel_image_url' | 'pixel_palette' | 'pixel_grid' | 'listing_type'>) => [
      post.id,
      post,
    ])
  );
  const collectibleMap = new Map(
    (collectibles ?? []).map((entry: Pick<CustomCollectibleRow, 'listing_id' | 'image_url' | 'pixel_image_url'>) => [entry.listing_id, entry])
  );

  return listingIds
    .map((listingId) => {
      const post = postMap.get(listingId);
      if (!post || post.listing_type !== 'custom') return null;
      const existing = collectibleMap.get(listingId);
      return {
        listingId,
        title: post.title ?? 'Unknown listing',
        imageUrl: existing?.image_url ?? post.image_url ?? null,
        pixelImageUrl: existing?.pixel_image_url ?? post.pixel_image_url ?? null,
        pixelPalette: (post.pixel_palette as Record<string, string> | null) ?? null,
        pixelGrid: post.pixel_grid ?? null,
      } satisfies GalleryItem;
    })
    .filter((entry): entry is GalleryItem => Boolean(entry));
}

export async function listGalleryPlacements(userId: string): Promise<CustomGalleryPlacement[]> {
  const { data, error } = await supabase
    .from('custom_gallery_placements')
    .select('id,user_id,listing_id,cell_x,cell_y')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapPlacement(row as CustomGalleryPlacementRow));
}

export async function listPublicGalleryPlacements(userId: string): Promise<CustomGalleryPlacement[]> {
  return listGalleryPlacements(userId);
}

export async function listPublicGalleryItems(userId: string): Promise<GalleryItem[]> {
  const placements = await listPublicGalleryPlacements(userId);
  const listingIds = Array.from(new Set(placements.map((entry) => entry.listingId)));
  if (!listingIds.length) return [];

  const { data, error } = await supabase
    .from('craft_posts')
    .select('id,title,image_url,pixel_image_url,pixel_palette,pixel_grid')
    .in('id', listingIds);
  if (error) throw error;

  return (data ?? []).map((entry: Pick<CraftPostRow, 'id' | 'title' | 'image_url' | 'pixel_image_url' | 'pixel_palette' | 'pixel_grid'>) => ({
    listingId: entry.id,
    title: entry.title,
    imageUrl: entry.image_url,
    pixelImageUrl: entry.pixel_image_url,
    pixelPalette: (entry.pixel_palette as Record<string, string> | null) ?? null,
    pixelGrid: entry.pixel_grid ?? null,
  }));
}

export async function upsertGalleryPlacement(listingId: string, x: number, y: number) {
  if (!isValidGalleryCell(x, y)) {
    throw new Error('Invalid gallery cell');
  }

  const { error } = await supabase.rpc('upsert_custom_gallery_placement', {
    p_listing_id: listingId,
    p_cell_x: x,
    p_cell_y: y,
  });
  if (error) throw error;
}

export async function removeGalleryPlacement(listingId: string) {
  const { error } = await supabase.rpc('remove_custom_gallery_placement', {
    p_listing_id: listingId,
  });
  if (error) throw error;
}
