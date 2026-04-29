import { supabase } from '@/lib/supabase';

export async function ensureProfileRow(userId: string, email?: string | null) {
  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  if (readError) throw readError;
  if (existing?.id) return;

  const fallbackUsername = (email?.split('@')[0] || `user_${userId.slice(0, 8)}`)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .slice(0, 24);

  const { error: insertError } = await supabase.from('profiles').insert({
    id: userId,
    username: fallbackUsername || `user_${userId.slice(0, 8)}`,
  });
  if (insertError) throw insertError;
}

