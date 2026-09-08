import { describe, expect, it } from 'vitest';

import { formatAuthError } from '@/lib/authError';

describe('formatAuthError', () => {
  it.each([
    new TypeError('Failed to fetch'),
    Object.assign(new Error('network request failed'), { name: 'AuthRetryableFetchError' }),
  ])('turns network failures into an actionable outage message', (error) => {
    expect(formatAuthError(error, 'Retry.', 'Backend unavailable.')).toBe('Backend unavailable.');
  });

  it('preserves useful service errors', () => {
    expect(formatAuthError(new Error('User already registered'), 'Retry.', 'Backend unavailable.')).toBe('User already registered');
  });

  it('uses the fallback for unknown failures', () => {
    expect(formatAuthError(null, 'Retry.', 'Backend unavailable.')).toBe('Retry.');
  });
});
