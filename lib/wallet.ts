import { supabase } from '@/lib/supabase';

export async function ensureWallet(userId: string): Promise<void> {
  const { data: existing, error: existingError } = await supabase
    .from('user_wallets')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.user_id) return;

  const { error } = await supabase.from('user_wallets').insert({
    user_id: userId,
    seeds_balance: 0,
  });
  if (!error) return;

  // Already exists / race conflict: treat as success.
  const normalizedError = error as {
    code?: string;
    status?: number;
    message?: string;
    details?: string;
  };
  const code = normalizedError.code ?? '';
  const status = normalizedError.status ?? 0;
  const message = `${normalizedError.message ?? ''} ${normalizedError.details ?? ''}`.toLowerCase();
  if (code === '23505' || status === 409 || message.includes('duplicate key')) return;

  throw error;
}

export async function getWalletBalance(userId: string): Promise<number> {
  const { data, error } = await supabase.from('user_wallets').select('seeds_balance').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data?.seeds_balance ?? 0;
}
