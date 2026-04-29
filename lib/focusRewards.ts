import type { FocusReward, FocusStatus } from '@/types/models';

const COMPLETE_REWARDS: Record<number, number> = {
  25: 25,
  45: 50,
  60: 75,
};

export function getFocusReward(durationMinutes: number, status: FocusStatus): FocusReward {
  if (status === 'given_up') {
    return { coins: 5, seedsBalance: 5 };
  }

  const coins = COMPLETE_REWARDS[durationMinutes] ?? durationMinutes;
  return { coins, seedsBalance: coins };
}
