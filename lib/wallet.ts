import { supabase } from '@/lib/supabase';

export async function ensureWallet(userId: string): Promise<void> {
  const { error } = await supabase.from('user_wallets').insert({
    user_id: userId,
    seeds_balance: 0,
  });
  if (!error) return;

  // Already exists: expected when wallet has already been created.
  const code = (error as { code?: string }).code;
  if (code === '23505') return;

  throw error;
}

export async function getWalletBalance(userId: string): Promise<number> {
  const { data, error } = await supabase.from('user_wallets').select('seeds_balance').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data?.seeds_balance ?? 0;
}
