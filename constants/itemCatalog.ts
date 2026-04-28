import type { ItemCatalogRow } from '@/types/models';

export const ITEM_CATALOG_SEED: ItemCatalogRow[] = [
  { id: 'leather_wallet', name: 'Leather Wallet', category: 'leather', required_progress: 100 },
  { id: 'sewing_kit', name: 'Sewing Kit', category: 'sewing', required_progress: 100 },
  { id: 'fabric_roll', name: 'Fabric Roll', category: 'sewing', required_progress: 100 },
  { id: 'dumbbell', name: 'Dumbbell', category: 'gym', required_progress: 100 },
  { id: 'yoga_mat', name: 'Yoga Mat', category: 'gym', required_progress: 100 },
  { id: 'study_desk', name: 'Study Desk', category: 'study', required_progress: 100 },
  { id: 'bookshelf', name: 'Bookshelf', category: 'study', required_progress: 100 },
  { id: 'desk_lamp', name: 'Desk Lamp', category: 'study', required_progress: 100 },
  { id: 'work_desk', name: 'Work Desk', category: 'work', required_progress: 100 },
  { id: 'plant', name: 'Plant', category: 'craft', required_progress: 100 },
];
