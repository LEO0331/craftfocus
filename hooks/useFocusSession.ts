import { useState } from 'react';

import { getFocusReward } from '@/lib/focusRewards';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { BuildTargetId, FocusCategory, FocusStatus } from '@/types/models';

interface SubmitFocusSessionInput {
  durationMinutes: number;
  category: FocusCategory;
  buildTarget: BuildTargetId;
  status: FocusStatus;
}

export function useFocusSession() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const submitFocusSession = async (input: SubmitFocusSessionInput) => {
    if (!user?.id) {
      throw new Error('You must be logged in to save focus sessions.');
    }

    setIsSaving(true);
    const reward = getFocusReward(input.durationMinutes, input.status);

    try {
      const { error: sessionError } = await supabase.from('focus_sessions').insert({
        user_id: user.id,
        duration_minutes: input.durationMinutes,
        category: input.category,
        build_target: input.buildTarget,
        status: input.status,
        reward_coins: reward.coins,
        progress_awarded: reward.progress,
      });

      if (sessionError) {
        throw sessionError;
      }

      const { data: itemCatalog, error: itemError } = await supabase
        .from('item_catalog')
        .select('id, required_progress')
        .eq('id', input.buildTarget)
        .maybeSingle();

      if (itemError) {
        throw itemError;
      }

      const requiredProgress = itemCatalog?.required_progress ?? 100;

      const { data: existingItem, error: existingItemError } = await supabase
        .from('user_items')
        .select('id, progress')
        .eq('user_id', user.id)
        .eq('item_id', input.buildTarget)
        .maybeSingle();

      if (existingItemError) {
        throw existingItemError;
      }

      const nextProgress = (existingItem?.progress ?? 0) + reward.progress;
      const nextUnlocked = nextProgress >= requiredProgress;

      const { error: upsertError } = await supabase.from('user_items').upsert(
        {
          id: existingItem?.id,
          user_id: user.id,
          item_id: input.buildTarget,
          progress: nextProgress,
          unlocked: nextUnlocked,
        },
        { onConflict: 'user_id,item_id' }
      );

      if (upsertError) {
        throw upsertError;
      }

      return reward;
    } finally {
      setIsSaving(false);
    }
  };

  return { submitFocusSession, isSaving };
}
