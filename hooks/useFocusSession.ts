import { useState } from 'react';

import { getFocusReward } from '@/lib/focusRewards';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { FocusMode, FocusStatus } from '@/types/models';

interface SubmitFocusSessionInput {
  durationMinutes: number;
  mode: FocusMode;
  status: FocusStatus;
}

export function useFocusSession() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const submitFocusSession = async (input: SubmitFocusSessionInput) => {
    if (!user?.id) throw new Error('You must be logged in to save focus sessions.');

    setIsSaving(true);
    try {
      const reward = getFocusReward(input.durationMinutes, input.status);
      const { data, error } = await supabase.rpc('award_seeds_for_session', {
        p_duration_minutes: input.durationMinutes,
        p_mode: input.mode,
        p_status: input.status,
      });
      if (error) throw error;

      const row = data?.[0];
      return {
        coins: row?.coins ?? reward.coins,
        seedsBalance: row?.seeds_balance ?? reward.seedsBalance,
      };
    } finally {
      setIsSaving(false);
    }
  };

  return { submitFocusSession, isSaving };
}
