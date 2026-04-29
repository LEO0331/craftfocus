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
  | 'plant';

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
  image_url?: string;
  half_built_image_url?: string;
  required_progress: number;
}
