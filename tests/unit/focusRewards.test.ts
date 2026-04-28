import { describe, expect, it } from 'vitest';

import { getFocusReward } from '@/lib/focusRewards';

describe('getFocusReward', () => {
  it('returns completion rewards for 25/45/60 durations', () => {
    expect(getFocusReward(25, 'completed')).toEqual({ coins: 25, progress: 25 });
    expect(getFocusReward(45, 'completed')).toEqual({ coins: 50, progress: 45 });
    expect(getFocusReward(60, 'completed')).toEqual({ coins: 75, progress: 60 });
  });

  it('returns fallback reward for unknown completed duration', () => {
    expect(getFocusReward(30, 'completed')).toEqual({ coins: 30, progress: 30 });
  });

  it('returns given up reward regardless of duration', () => {
    expect(getFocusReward(25, 'given_up')).toEqual({ coins: 5, progress: 5 });
    expect(getFocusReward(999, 'given_up')).toEqual({ coins: 5, progress: 5 });
  });
});
