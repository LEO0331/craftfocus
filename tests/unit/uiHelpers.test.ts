import { describe, expect, it } from 'vitest';

import {
  EXCHANGE_FILTER_OPTIONS,
  EXCHANGE_FILTER_VALUES,
  FRIEND_FILTER_OPTIONS,
  FRIEND_FILTER_VALUES,
} from '@/constants/filterOptions';
import { resolveSpriteId } from '@/constants/spriteUtils';

describe('ui helper constants', () => {
  it('keeps friend and exchange filter options stable', () => {
    expect(FRIEND_FILTER_VALUES).toEqual(['all', 'pending', 'accepted', 'rejected']);
    expect(EXCHANGE_FILTER_VALUES).toEqual(['all', 'pending', 'accepted', 'rejected', 'cancelled']);
    expect(FRIEND_FILTER_OPTIONS.map((option) => option.value)).toEqual(FRIEND_FILTER_VALUES);
    expect(EXCHANGE_FILTER_OPTIONS.map((option) => option.value)).toEqual(EXCHANGE_FILTER_VALUES);
  });

  it('resolves unknown sprite ids safely', () => {
    expect(resolveSpriteId('plant')).toBe('plant');
    expect(resolveSpriteId('not-a-real-item')).toBe('unknown');
  });
});
