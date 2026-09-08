import type { FocusReward, FocusStatus } from '@/types/models';

const COMPLETE_REWARDS: Record<number, number> = {
  25: 25,
  45: 50,
  60: 75,
};

export function getFocusReward(durationMinutes: number, status: FocusStatus, elapsedSeconds = Number.POSITIVE_INFINITY): FocusReward {
  if (status === 'given_up') {
    const coins = elapsedSeconds >= 60 ? 5 : 0;
    return { coins, seedsBalance: coins };
  }

  const coins = COMPLETE_REWARDS[durationMinutes] ?? durationMinutes;
  return { coins, seedsBalance: coins };
}
