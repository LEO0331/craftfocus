export type BuildTargetId =
  | 'leather_wallet'
  | 'sewing_kit'
  | 'fabric_roll'
  | 'dumbbell'
  | 'yoga_mat'
  | 'study_desk'
  | 'bookshelf'
  | 'desk_lamp'
  | 'work_desk'
  | 'plant'
  | 'wall_clock'
  | 'bean_bag'
  | 'tool_box'
  | 'floor_rug'
  | 'wall_frame';

export type FocusStatus = 'completed' | 'given_up';
export type FocusMode = 'general' | 'crafting' | 'sewing';
export type RoomType = 'bedroom' | 'gym';
export type ListingType = 'catalog' | 'custom';
export type AnimalId = 'cat' | 'dog' | 'rabbit' | 'fox';
export type InventoryQuantity = number;

export interface FocusReward {
  coins: number;
  seedsBalance: number;
}

export interface ItemCatalogRow {
  id: BuildTargetId;
  name: string;
  category: string;
  description?: string;
  image_url?: string;
  half_built_image_url?: string;
  required_progress: number;
}

export interface CustomGalleryPlacement {
  id: string;
  userId: string;
  listingId: string;
  cellX: number;
  cellY: number;
}

export interface GalleryCell {
  x: number;
  y: number;
}

export interface GalleryItem {
  listingId: string;
  title: string;
  imageUrl: string | null;
  pixelImageUrl: string | null;
  pixelPalette: Record<string, string> | null;
  pixelGrid: string[] | null;
}
