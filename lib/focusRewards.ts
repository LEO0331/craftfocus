import type { FocusReward, FocusStatus } from '@/types/models';

const COMPLETE_REWARDS: Record<number, FocusReward> = {
  25: { coins: 25, progress: 25 },
  45: { coins: 50, progress: 45 },
  60: { coins: 75, progress: 60 },
};

export function getFocusReward(durationMinutes: number, status: FocusStatus): FocusReward {
  if (status === 'given_up') {
    return { coins: 5, progress: 5 };
  }

  return COMPLETE_REWARDS[durationMinutes] ?? { coins: durationMinutes, progress: durationMinutes };
}
