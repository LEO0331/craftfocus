import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      setIsLoading(false);
      throw error;
    }

    if (data) {
      setProfile(data);
      setIsLoading(false);
      return;
    }

    const fallbackUsername = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
    const { data: createdProfile, error: createError } = await supabase
      .from('profiles')
      .insert({ id: user.id, username: fallbackUsername })
      .select('*')
      .single();

    if (createError) {
      setIsLoading(false);
      throw createError;
    }

    setProfile(createdProfile ?? null);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadProfile().catch((error) => {
      console.warn('Failed to load profile', error);
    });
  }, [loadProfile]);

  const saveProfile = useCallback(
    async (next: { display_name: string | null; bio: string | null; avatar_url: string | null }) => {
      if (!user?.id) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(next)
        .eq('id', user.id)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      setProfile(data ?? null);
      return data;
    },
    [user?.id]
  );

  return { profile, isLoading, refresh: loadProfile, saveProfile };
}
