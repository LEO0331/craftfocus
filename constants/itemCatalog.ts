import type { ItemCatalogRow } from '@/types/models';

export const ITEM_CATALOG_SEED: ItemCatalogRow[] = [
  { id: 'leather_wallet', name: 'Leather Wallet', category: 'leather', description: 'Compact holder for cards and notes.', required_progress: 100 },
  { id: 'sewing_kit', name: 'Sewing Kit', category: 'sewing', description: 'Starter kit with thread and needle tools.', required_progress: 100 },
  { id: 'fabric_roll', name: 'Fabric Roll', category: 'sewing', description: 'Soft fabric roll for room decoration.', required_progress: 100 },
  { id: 'dumbbell', name: 'Dumbbell', category: 'gym', description: 'A classic weight to complete your gym corner.', required_progress: 100 },
  { id: 'yoga_mat', name: 'Yoga Mat', category: 'gym', description: 'A comfy mat for stretching sessions.', required_progress: 100 },
  { id: 'study_desk', name: 'Study Desk', category: 'study', description: 'A focused desk setup for study vibes.', required_progress: 100 },
  { id: 'bookshelf', name: 'Bookshelf', category: 'study', description: 'A tidy shelf to showcase your book stack.', required_progress: 100 },
  { id: 'desk_lamp', name: 'Desk Lamp', category: 'study', description: 'Warm light for late-night concentration.', required_progress: 100 },
  { id: 'work_desk', name: 'Work Desk', category: 'work', description: 'A practical workstation for productivity.', required_progress: 100 },
  { id: 'plant', name: 'Plant', category: 'craft', description: 'A small plant to brighten your room.', required_progress: 100 },
  { id: 'wall_clock', name: 'Wall Clock', category: 'study', description: 'Keep sessions on time with a clean wall clock.', required_progress: 100 },
  { id: 'bean_bag', name: 'Bean Bag', category: 'craft', description: 'A comfy lounge seat for your pixel room corner.', required_progress: 100 },
  { id: 'tool_box', name: 'Tool Box', category: 'work', description: 'Organize tools and crafting essentials in one box.', required_progress: 100 },
  { id: 'floor_rug', name: 'Floor Rug', category: 'study', description: 'Add a cozy patterned rug to your room floor.', required_progress: 100 },
  { id: 'wall_frame', name: 'Wall Frame', category: 'craft', description: 'Showcase a framed memory on your wall.', required_progress: 100 },
];
