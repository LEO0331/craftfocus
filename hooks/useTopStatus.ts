import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { onTopStatusRefresh } from '@/lib/topStatusBus';
import { resolveAsciiAnimalBadge } from '@/constants/asciiPets';
import { getActiveAnimal, resolveAnimalSpecies } from '@/lib/animals';

const KNOWN_SPECIES = new Set(['cat', 'dog', 'rabbit', 'fox']);

function normalizeSpecies(input: string | null | undefined): string {
  if (!input) return 'cat';
  const base = input.split('_')[0].toLowerCase();
  return KNOWN_SPECIES.has(base) ? base : 'cat';
}

export function useTopStatus() {
  const { user } = useAuth();
  const [seedsBalance, setSeedsBalance] = useState(0);
  const [activeAnimal, setActiveAnimal] = useState('cat');

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setSeedsBalance(0);
      setActiveAnimal('cat');
      return;
    }

    const [{ data: wallet }, { data: profile }] = await Promise.all([
      supabase.from('user_wallets').select('seeds_balance').eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('active_animal_id').eq('id', user.id).maybeSingle(),
    ]);

    setSeedsBalance(Number(wallet?.seeds_balance ?? 0));
    if (profile?.active_animal_id) {
      setActiveAnimal(normalizeSpecies(profile.active_animal_id));
      return;
    }

    const active = await getActiveAnimal(user.id);
    setActiveAnimal(resolveAnimalSpecies(active?.sprite_key ?? 'cat'));
  }, [user?.id]);

  useEffect(() => {
    refresh().catch(() => {
      // noop
    });
  }, [refresh]);

  useEffect(() => onTopStatusRefresh(() => {
    refresh().catch(() => {
      // noop
    });
  }), [refresh]);

  useEffect(() => {
    const timer = setInterval(() => {
      refresh().catch(() => {
        // noop
      });
    }, 30000);

    return () => clearInterval(timer);
  }, [refresh]);

  const badgeText = useMemo(() => resolveAsciiAnimalBadge(activeAnimal), [activeAnimal]);

  return { seedsBalance, activeAnimal, badgeText, refresh };
}
