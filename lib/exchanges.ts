import { supabase } from '@/lib/supabase';
import type { TableRow } from '@/types/database';
import { sanitizeText } from '@/lib/validation';

type ExchangeRow = TableRow<'exchange_requests'>;
type ProfileRow = TableRow<'profiles'>;
type CraftPostRow = TableRow<'craft_posts'>;

export interface ExchangeListItem extends ExchangeRow {
  requester_name: string;
  owner_name: string;
  craft_title: string;
}

export async function createExchangeRequest(input: {
  requesterId: string;
  ownerId: string;
  craftPostId: string;
  message?: string;
}) {
  if (input.requesterId === input.ownerId) {
    throw new Error('Cannot request exchange on your own craft.');
  }

  const { data: existing, error: existingError } = await supabase
    .from('exchange_requests')
    .select('id,status')
    .eq('requester_id', input.requesterId)
    .eq('owner_id', input.ownerId)
    .eq('craft_post_id', input.craftPostId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing?.id) {
    throw new Error('Exchange request already pending for this post.');
  }

  const { error } = await supabase.from('exchange_requests').insert({
    requester_id: input.requesterId,
    owner_id: input.ownerId,
    craft_post_id: input.craftPostId,
    message: input.message ? sanitizeText(input.message, 240) : null,
    status: 'pending',
  });

  if (error) {
    throw error;
  }
}

export async function listMyExchangeRequests(currentUserId: string): Promise<ExchangeListItem[]> {
  const { data: exchanges, error } = await supabase
    .from('exchange_requests')
    .select('*')
    .or(`requester_id.eq.${currentUserId},owner_id.eq.${currentUserId}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  if (!exchanges?.length) {
    return [];
  }

  const profileIds = Array.from(new Set(exchanges.flatMap((entry: ExchangeRow) => [entry.requester_id, entry.owner_id])));
  const postIds = Array.from(new Set(exchanges.map((entry: ExchangeRow) => entry.craft_post_id)));

  const [profilesResult, postsResult] = await Promise.all([
    supabase.from('profiles').select('id,username,display_name').in('id', profileIds),
    supabase.from('craft_posts').select('id,title').in('id', postIds),
  ]);

  if (profilesResult.error) {
    throw profilesResult.error;
  }
  if (postsResult.error) {
    throw postsResult.error;
  }

  const profileMap = new Map(
    (profilesResult.data ?? []).map((profile: Pick<ProfileRow, 'id' | 'username' | 'display_name'>) => [profile.id, profile])
  );
  const postMap = new Map((postsResult.data ?? []).map((post: Pick<CraftPostRow, 'id' | 'title'>) => [post.id, post]));

  return exchanges.map((entry: ExchangeRow) => ({
    ...entry,
    requester_name:
      profileMap.get(entry.requester_id)?.display_name || profileMap.get(entry.requester_id)?.username || 'unknown',
    owner_name: profileMap.get(entry.owner_id)?.display_name || profileMap.get(entry.owner_id)?.username || 'unknown',
    craft_title: postMap.get(entry.craft_post_id)?.title || 'Unknown craft',
  }));
}

export async function updateExchangeStatus(
  exchangeId: string,
  nextStatus: 'accepted' | 'rejected' | 'cancelled',
  currentUserId: string
) {
  const { data: exchange, error: findError } = await supabase
    .from('exchange_requests')
    .select('id,requester_id,owner_id,status')
    .eq('id', exchangeId)
    .single();

  if (findError) {
    throw findError;
  }

  if (nextStatus === 'cancelled') {
    if (exchange.requester_id !== currentUserId) {
      throw new Error('Only requester can cancel an exchange request.');
    }
  } else if (exchange.owner_id !== currentUserId) {
    throw new Error('Only owner can accept/reject an exchange request.');
  }

  const { error } = await supabase.from('exchange_requests').update({ status: nextStatus }).eq('id', exchangeId);
  if (error) {
    throw error;
  }
}
