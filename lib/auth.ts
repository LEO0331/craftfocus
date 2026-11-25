import { supabase } from '@/lib/supabase';

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function deleteMyAccount() {
  const { error } = await supabase.functions.invoke('delete-my-account', { method: 'POST' });
  if (error) {
    throw error;
  }
}
