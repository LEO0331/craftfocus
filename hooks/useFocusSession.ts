import { useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { isLocalMode } from '@/lib/data-mode';
import { finishLocalFocusSession, startLocalFocusSession } from '@/lib/local/economy';
import type { FocusMode, FocusStatus } from '@/types/models';

interface SubmitFocusSessionInput {
  sessionId: string;
  status: FocusStatus;
  stoppedAt?: number;
}

export function useFocusSession() {
  const { player } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const startFocusSession = async (durationMinutes: number, mode: FocusMode) => {
    if (!player?.id) throw new Error('You must be logged in to start focus sessions.');
    if (isLocalMode) return startLocalFocusSession(durationMinutes, mode);
    const { data, error } = await supabase.rpc('start_focus_session', {
      p_duration_minutes: durationMinutes,
      p_mode: mode,
    });
    if (error) throw error;
    if (!data) throw new Error('The server did not start a focus session.');
    return data;
  };

  const submitFocusSession = async (input: SubmitFocusSessionInput) => {
    if (!player?.id) throw new Error('You must be logged in to save focus sessions.');

    setIsSaving(true);
    try {
      if (isLocalMode) return await finishLocalFocusSession(input.sessionId, input.status, input.stoppedAt);
      const { data, error } = await supabase.rpc('award_seeds_for_session', {
        p_session_id: input.sessionId,
        p_status: input.status,
      });
      if (error) throw error;

      const row = data?.[0];
      if (!row) throw new Error('The server did not return a focus reward.');
      return {
        coins: row.coins,
        seedsBalance: row.seeds_balance,
      };
    } finally {
      setIsSaving(false);
    }
  };

  return { startFocusSession, submitFocusSession, isSaving };
}
