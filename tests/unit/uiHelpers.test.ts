import { describe, expect, it } from 'vitest';

import {
  EXCHANGE_FILTER_OPTIONS,
  FRIEND_FILTER_OPTIONS,
} from '@/constants/filterOptions';
import { resolveSpriteId } from '@/constants/spriteUtils';

describe('ui helper constants', () => {
  it('keeps friend and exchange filter options stable', () => {
    expect(FRIEND_FILTER_OPTIONS).toEqual(['all', 'pending', 'accepted', 'rejected']);
    expect(EXCHANGE_FILTER_OPTIONS).toEqual(['all', 'pending', 'accepted', 'rejected', 'cancelled']);
  });

  it('resolves unknown sprite ids safely', () => {
    expect(resolveSpriteId('plant')).toBe('plant');
    expect(resolveSpriteId('not-a-real-item')).toBe('unknown');
  });
});
