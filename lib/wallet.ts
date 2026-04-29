import { supabase } from '@/lib/supabase';

export async function getWalletBalance(userId: string): Promise<number> {
  const { data, error } = await supabase.from('user_wallets').select('seeds_balance').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data?.seeds_balance ?? 0;
}
