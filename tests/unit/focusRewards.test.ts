import { describe, expect, it } from 'vitest';

import { getFocusReward } from '@/lib/focusRewards';

describe('getFocusReward', () => {
  it('returns completion rewards for 25/45/60 durations', () => {
    expect(getFocusReward(25, 'completed')).toEqual({ coins: 25, seedsBalance: 25 });
    expect(getFocusReward(45, 'completed')).toEqual({ coins: 50, seedsBalance: 50 });
    expect(getFocusReward(60, 'completed')).toEqual({ coins: 75, seedsBalance: 75 });
  });

  it('returns fallback reward for unknown completed duration', () => {
    expect(getFocusReward(30, 'completed')).toEqual({ coins: 30, seedsBalance: 30 });
  });

  it('returns the given-up reward after one minute', () => {
    expect(getFocusReward(25, 'given_up')).toEqual({ coins: 5, seedsBalance: 5 });
    expect(getFocusReward(999, 'given_up', 60)).toEqual({ coins: 5, seedsBalance: 5 });
  });

  it('does not reward instant abandonment', () => {
    expect(getFocusReward(25, 'given_up', 59)).toEqual({ coins: 0, seedsBalance: 0 });
  });
});
