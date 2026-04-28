export type FocusCategory = 'craft' | 'leather' | 'sewing' | 'study' | 'gym' | 'work';

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

export interface FocusReward {
  coins: number;
  progress: number;
}

export interface ItemCatalogRow {
  id: BuildTargetId;
  name: string;
  category: string;
  image_url?: string;
  half_built_image_url?: string;
  required_progress: number;
}
