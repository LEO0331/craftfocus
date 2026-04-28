import type { BuildTargetId, FocusCategory } from '@/types/models';

export const FOCUS_CATEGORIES: FocusCategory[] = [
  'craft',
  'leather',
  'sewing',
  'study',
  'gym',
  'work',
];

export const BUILD_TARGETS: { id: BuildTargetId; label: string; category: FocusCategory }[] = [
  { id: 'leather_wallet', label: 'Leather Wallet', category: 'leather' },
  { id: 'sewing_kit', label: 'Sewing Kit', category: 'sewing' },
  { id: 'dumbbell', label: 'Dumbbell', category: 'gym' },
  { id: 'study_desk', label: 'Study Desk', category: 'study' },
  { id: 'desk_lamp', label: 'Desk Lamp', category: 'study' },
  { id: 'bookshelf', label: 'Bookshelf', category: 'study' },
  { id: 'work_desk', label: 'Work Desk', category: 'work' },
  { id: 'plant', label: 'Plant', category: 'craft' },
];

export const FOCUS_DURATIONS = [25, 45, 60] as const;
