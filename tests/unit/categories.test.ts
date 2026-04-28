import { describe, expect, it } from 'vitest';

import { BUILD_TARGETS, FOCUS_CATEGORIES, FOCUS_DURATIONS } from '@/constants/categories';

describe('focus constants', () => {
  it('has supported focus categories', () => {
    expect(FOCUS_CATEGORIES).toEqual(['craft', 'leather', 'sewing', 'study', 'gym', 'work']);
  });

  it('has supported durations', () => {
    expect(FOCUS_DURATIONS).toEqual([25, 45, 60]);
  });

  it('keeps build target IDs unique', () => {
    const ids = BUILD_TARGETS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
