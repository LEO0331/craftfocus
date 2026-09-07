import { useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { FocusMode, FocusStatus } from '@/types/models';

interface SubmitFocusSessionInput {
  sessionId: string;
  status: FocusStatus;
}

export function useFocusSession() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const startFocusSession = async (durationMinutes: number, mode: FocusMode) => {
    if (!user?.id) throw new Error('You must be logged in to start focus sessions.');
    const { data, error } = await supabase.rpc('start_focus_session', {
      p_duration_minutes: durationMinutes,
      p_mode: mode,
    });
    if (error) throw error;
    if (!data) throw new Error('The server did not start a focus session.');
    return data;
  };

  const submitFocusSession = async (input: SubmitFocusSessionInput) => {
    if (!user?.id) throw new Error('You must be logged in to save focus sessions.');

    setIsSaving(true);
    try {
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
