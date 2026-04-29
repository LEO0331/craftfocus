import { describe, expect, it } from 'vitest';

import { ROOM_SPRITES } from '@/constants/roomSprites';

describe('ROOM_SPRITES', () => {
  it('contains all expected sprite ids', () => {
    expect(Object.keys(ROOM_SPRITES).sort()).toEqual([
      'bean_bag',
      'bookshelf',
      'desk_lamp',
      'dumbbell',
      'fabric_roll',
      'floor_rug',
      'leather_wallet',
      'plant',
      'sewing_kit',
      'study_desk',
      'tool_box',
      'unknown',
      'wall_clock',
      'wall_frame',
      'work_desk',
      'yoga_mat',
    ]);
  });

  it('ensures each sprite has 8x8 pixel rows and palette entries', () => {
    for (const sprite of Object.values(ROOM_SPRITES)) {
      expect(sprite.grid.length).toBe(8);
      for (const row of sprite.grid) {
        expect(row.length).toBe(8);
        for (const code of row.split('')) {
          expect(sprite.palette[code]).toBeDefined();
        }
      }
    }
  });
});
