import { describe, expect, it } from 'vitest';

import { formatSupabaseError, normalizeListLimit } from '@/lib/api';

describe('API service helpers', () => {
  it('normalizes list limits with defaults and max bounds', () => {
    expect(normalizeListLimit(undefined, 40, 100)).toBe(40);
    expect(normalizeListLimit(0, 40, 100)).toBe(40);
    expect(normalizeListLimit(25.8, 40, 100)).toBe(25);
    expect(normalizeListLimit(250, 40, 100)).toBe(100);
  });

  it('formats Supabase errors without leaking raw objects', () => {
    expect(formatSupabaseError({ message: 'Not enough seeds', code: 'P0001' })).toBe('Not enough seeds [P0001]');
    expect(formatSupabaseError({})).toBe('Unknown error');
  });
});
