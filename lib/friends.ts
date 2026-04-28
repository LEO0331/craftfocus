import { supabase } from '@/lib/supabase';
import type { TableRow } from '@/types/database';

type ProfileRow = TableRow<'profiles'>;
type FriendshipRow = TableRow<'friendships'>;

export interface FriendSearchResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface FriendListItem {
  friendship_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  role: 'requester' | 'addressee';
  profile_id: string;
  username: string;
  display_name: string | null;
}

export async function searchProfilesByUsername(query: string, currentUserId: string): Promise<FriendSearchResult[]> {
  const normalized = query.trim();
  if (!normalized) {
    return [];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id,username,display_name,avatar_url')
    .ilike('username', `%${normalized}%`)
    .neq('id', currentUserId)
    .limit(20);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  if (requesterId === addresseeId) {
    throw new Error('Cannot add yourself as a friend.');
  }

  const { data: forward, error: forwardError } = await supabase
    .from('friendships')
    .select('id,status')
    .eq('requester_id', requesterId)
    .eq('addressee_id', addresseeId)
    .maybeSingle();

  if (forwardError) {
    throw forwardError;
  }

  if (forward?.id) {
    if (forward.status === 'accepted') {
      throw new Error('You are already friends.');
    }
    if (forward.status === 'pending') {
      throw new Error('Friend request already pending.');
    }
  }

  const { data: reverse, error: reverseError } = await supabase
    .from('friendships')
    .select('id,status')
    .eq('requester_id', addresseeId)
    .eq('addressee_id', requesterId)
    .maybeSingle();

  if (reverseError) {
    throw reverseError;
  }

  if (reverse?.id) {
    if (reverse.status === 'accepted') {
      throw new Error('You are already friends.');
    }
    if (reverse.status === 'pending') {
      const { error: acceptError } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', reverse.id);
      if (acceptError) {
        throw acceptError;
      }
      return;
    }
  }

  if (forward?.id) {
    const { error: retryError } = await supabase
      .from('friendships')
      .update({ status: 'pending' })
      .eq('id', forward.id)
      .eq('requester_id', requesterId);
    if (retryError) {
      throw retryError;
    }
    return;
  }

  const { error } = await supabase.from('friendships').insert({
    requester_id: requesterId,
    addressee_id: addresseeId,
    status: 'pending',
  });

  if (error) {
    throw error;
  }
}

export async function listFriendships(currentUserId: string): Promise<FriendListItem[]> {
  const { data: friendships, error } = await supabase
    .from('friendships')
    .select('id,requester_id,addressee_id,status,created_at')
    .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  if (!friendships?.length) {
    return [];
  }

  const otherIds = Array.from(
    new Set(
      friendships.map((row: FriendshipRow) =>
        row.requester_id === currentUserId ? row.addressee_id : row.requester_id
      )
    )
  );

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id,username,display_name')
    .in('id', otherIds);

  if (profilesError) {
    throw profilesError;
  }

  const profileMap = new Map((profiles ?? []).map((profile: Pick<ProfileRow, 'id' | 'username' | 'display_name'>) => [profile.id, profile]));

  return friendships.map((row: FriendshipRow) => {
    const profileId = row.requester_id === currentUserId ? row.addressee_id : row.requester_id;
    const profile = profileMap.get(profileId);

    return {
      friendship_id: row.id,
      status: row.status,
      role: row.requester_id === currentUserId ? 'requester' : 'addressee',
      profile_id: profileId,
      username: profile?.username ?? 'unknown',
      display_name: profile?.display_name ?? null,
    };
  });
}

export async function respondToFriendRequest(
  friendshipId: string,
  nextStatus: 'accepted' | 'rejected',
  currentUserId: string
) {
  const { error } = await supabase
    .from('friendships')
    .update({ status: nextStatus })
    .eq('id', friendshipId)
    .eq('addressee_id', currentUserId);

  if (error) {
    throw error;
  }
}
