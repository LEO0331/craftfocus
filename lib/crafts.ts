import { supabase } from '@/lib/supabase';
import type { TableRow } from '@/types/database';
import { sanitizeText } from '@/lib/validation';

type ProfileRow = TableRow<'profiles'>;
type CraftPostRow = TableRow<'craft_posts'>;
type LikeRow = TableRow<'likes'>;
type CommentRow = TableRow<'comments'>;
type ListingClaimRow = TableRow<'listing_claims'>;

export interface CraftFeedItem extends CraftPostRow {
  author_name: string;
  author_animal_id: string;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
  claimed_by_me: boolean;
}

export interface CraftComment {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  author_name: string;
}

export interface CraftPostDetail extends CraftFeedItem {
  comments: CraftComment[];
}

function buildProfileMap(profiles: ProfileRow[]) {
  return new Map(profiles.map((profile) => [profile.id, profile]));
}

function profileName(profile: ProfileRow | undefined): string {
  return profile?.display_name || profile?.username || 'Unknown user';
}

function profileAnimal(profile: ProfileRow | undefined): string {
  const raw = profile?.active_animal_id?.toLowerCase();
  if (raw?.startsWith('dog')) return 'dog';
  if (raw?.startsWith('rabbit')) return 'rabbit';
  if (raw?.startsWith('fox')) return 'fox';
  return 'cat';
}

function countByPostId<T extends { craft_post_id: string }>(rows: T[]) {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    map.set(row.craft_post_id, (map.get(row.craft_post_id) ?? 0) + 1);
  });
  return map;
}

export async function listCraftPosts(currentUserId?: string): Promise<CraftFeedItem[]> {
  const { data: posts, error: postsError } = await supabase
    .from('craft_posts')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(40);

  if (postsError) throw postsError;
  if (!posts?.length) return [];

  const authorIds = Array.from(new Set(posts.map((post) => post.user_id)));
  const postIds = posts.map((post) => post.id);

  const [profilesResult, likesResult, commentsResult, likedResult, claimsResult] = await Promise.all([
    supabase.from('profiles').select('*').in('id', authorIds),
    supabase.from('likes').select('craft_post_id').in('craft_post_id', postIds),
    supabase.from('comments').select('craft_post_id').in('craft_post_id', postIds),
    currentUserId
      ? supabase.from('likes').select('craft_post_id').eq('user_id', currentUserId).in('craft_post_id', postIds)
      : Promise.resolve({ data: [] as Pick<LikeRow, 'craft_post_id'>[], error: null }),
    currentUserId
      ? supabase.from('listing_claims').select('listing_id').eq('user_id', currentUserId).in('listing_id', postIds)
      : Promise.resolve({ data: [] as Pick<ListingClaimRow, 'listing_id'>[], error: null }),
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (likesResult.error) throw likesResult.error;
  if (commentsResult.error) throw commentsResult.error;
  if (likedResult.error) throw likedResult.error;
  if (claimsResult.error) throw claimsResult.error;

  const profileMap = buildProfileMap(profilesResult.data ?? []);
  const likesMap = countByPostId(likesResult.data ?? []);
  const commentsMap = countByPostId(commentsResult.data ?? []);
  const likedSet = new Set((likedResult.data ?? []).map((row) => row.craft_post_id));
  const claimSet = new Set((claimsResult.data ?? []).map((row) => row.listing_id));

  return posts.map((post) => ({
    ...post,
    author_name: profileName(profileMap.get(post.user_id)),
    author_animal_id: profileAnimal(profileMap.get(post.user_id)),
    likes_count: likesMap.get(post.id) ?? 0,
    comments_count: commentsMap.get(post.id) ?? 0,
    liked_by_me: likedSet.has(post.id),
    claimed_by_me: claimSet.has(post.id),
  }));
}

export async function createCraftPost(input: {
  userId: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  pixelImageUrl?: string | null;
  pixelPalette?: Record<string, string> | null;
  pixelGrid?: string[] | null;
  listingCategory: string;
  seedCost: number;
  listingType: 'catalog' | 'custom';
  rewardItemId?: string | null;
}) {
  const safeTitle = sanitizeText(input.title, 20);
  const safeDescription = input.description ? sanitizeText(input.description, 60) : '';

  const { data, error } = await supabase
    .from('craft_posts')
    .insert({
      user_id: input.userId,
      title: safeTitle,
      description: safeDescription,
      category: input.category,
      image_url: input.imageUrl,
      pixel_image_url: input.pixelImageUrl ?? null,
      pixel_palette: input.pixelPalette ?? null,
      pixel_grid: input.pixelGrid ?? null,
      listing_category: input.listingCategory,
      seed_cost: input.seedCost,
      listing_type: input.listingType,
      reward_item_id: input.rewardItemId ?? null,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function getCraftPostDetail(postId: string, currentUserId?: string): Promise<CraftPostDetail> {
  const { data: post, error: postError } = await supabase.from('craft_posts').select('*').eq('id', postId).single();
  if (postError) throw postError;

  const [authorResult, likesCountResult, commentsCountResult, likedResult, commentsResult, claimsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', post.user_id).maybeSingle(),
    supabase.from('likes').select('id', { count: 'exact', head: true }).eq('craft_post_id', postId),
    supabase.from('comments').select('id', { count: 'exact', head: true }).eq('craft_post_id', postId),
    currentUserId
      ? supabase.from('likes').select('id').eq('craft_post_id', postId).eq('user_id', currentUserId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from('comments').select('*').eq('craft_post_id', postId).order('created_at', { ascending: true }),
    currentUserId
      ? supabase.from('listing_claims').select('id').eq('listing_id', postId).eq('user_id', currentUserId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (authorResult.error) throw authorResult.error;
  if (likesCountResult.error) throw likesCountResult.error;
  if (commentsCountResult.error) throw commentsCountResult.error;
  if (likedResult.error) throw likedResult.error;
  if (commentsResult.error) throw commentsResult.error;
  if (claimsResult.error) throw claimsResult.error;

  const commentRows = commentsResult.data ?? [];
  const commentAuthorIds = Array.from(new Set(commentRows.map((comment) => comment.user_id)));

  const { data: commentAuthors, error: commentAuthorsError } = commentAuthorIds.length
    ? await supabase.from('profiles').select('*').in('id', commentAuthorIds)
    : { data: [] as ProfileRow[], error: null };

  if (commentAuthorsError) throw commentAuthorsError;

  const commentProfileMap = buildProfileMap(commentAuthors ?? []);

  const comments: CraftComment[] = commentRows.map((comment: CommentRow) => ({
    id: comment.id,
    user_id: comment.user_id,
    body: comment.body,
    created_at: comment.created_at,
    author_name: profileName(commentProfileMap.get(comment.user_id)),
  }));

  return {
    ...post,
    author_name: profileName(authorResult.data ?? undefined),
    author_animal_id: profileAnimal(authorResult.data ?? undefined),
    likes_count: likesCountResult.count ?? 0,
    comments_count: commentsCountResult.count ?? 0,
    liked_by_me: Boolean(likedResult.data),
    claimed_by_me: Boolean(claimsResult.data),
    comments,
  };
}

export async function claimListingWithSeeds(listingId: string) {
  const { error } = await supabase.rpc('claim_listing_with_seeds', { p_listing_id: listingId });
  if (error) throw error;
}

export async function claimOfficialInventoryItem(itemId: string) {
  const attemptErrors: Array<{ path: string; error: unknown }> = [];

  const primary = await supabase.rpc('claim_official_inventory_item_v2', {
    p_item_id: itemId,
  });
  if (!primary.error) return;
  attemptErrors.push({ path: 'claim_official_inventory_item_v2(text)', error: primary.error });

  const fallbackOneArg = await supabase.rpc('claim_official_inventory_item', { p_item_id: itemId });
  if (!fallbackOneArg.error) return;
  attemptErrors.push({ path: 'claim_official_inventory_item(text)', error: fallbackOneArg.error });

  const fallbackTwoArgs = await supabase.rpc('claim_official_inventory_item', {
    p_item_id: itemId,
    p_seed_cost: 25,
  });
  if (!fallbackTwoArgs.error) return;
  attemptErrors.push({ path: 'claim_official_inventory_item(text, integer)', error: fallbackTwoArgs.error });

  const formatError = (input: unknown) => {
    const e = input as { message?: string; details?: string; hint?: string; code?: string };
    const parts = [e.message, e.details, e.hint].filter((v): v is string => Boolean(v && v.trim()));
    const suffix = e.code ? ` [${e.code}]` : '';
    return `${parts.join(' | ') || 'Unknown error'}${suffix}`;
  };

  const reasons = attemptErrors.map((entry) => `${entry.path}: ${formatError(entry.error)}`).join(' || ');
  throw new Error(`Official claim failed. ${reasons}`);
}

export async function toggleLike(postId: string, userId: string) {
  const { data: existing, error: existingError } = await supabase
    .from('likes')
    .select('id')
    .eq('craft_post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing?.id) {
    const { error } = await supabase.from('likes').delete().eq('id', existing.id);
    if (error) throw error;
    return { liked: false };
  }

  const { error } = await supabase.from('likes').insert({ user_id: userId, craft_post_id: postId });
  if (error) throw error;
  return { liked: true };
}

export async function addComment(postId: string, userId: string, body: string) {
  const normalizedBody = body.trim();
  if (!normalizedBody) throw new Error('Comment cannot be empty.');

  const { error } = await supabase.from('comments').insert({ user_id: userId, craft_post_id: postId, body: normalizedBody });
  if (error) throw error;
}

export async function deleteCraftPost(postId: string, userId: string) {
  const { error } = await supabase.from('craft_posts').update({ is_active: false }).eq('id', postId).eq('user_id', userId);
  if (error) throw error;
}
