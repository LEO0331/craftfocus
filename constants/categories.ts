import { ITEM_CATALOG_SEED } from '@/constants/itemCatalog';
import type { BuildTargetId, FocusMode } from '@/types/models';

export const FOCUS_MODES: FocusMode[] = ['general', 'crafting', 'sewing'];
export const FOCUS_DURATIONS = [25, 45, 60] as const;

// Legacy exports kept for test/backward compatibility.
export const FOCUS_CATEGORIES = ['craft', 'leather', 'sewing', 'study', 'gym', 'work'] as const;
export const BUILD_TARGETS: Array<{ id: BuildTargetId; label: string }> = ITEM_CATALOG_SEED.map((item) => ({
  id: item.id,
  label: item.name,
}));
