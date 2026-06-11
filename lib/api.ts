export const API_LIMITS = {
  craftFeedDefault: 40,
  craftFeedMax: 100,
  commentsDefault: 100,
  roomPlacementsDefault: 50,
  galleryDefault: 100,
  friendshipsDefault: 100,
} as const;

export function normalizeListLimit(input: number | undefined, fallback: number, max: number) {
  if (!Number.isFinite(input)) return fallback;
  const value = Math.floor(Number(input));
  if (value < 1) return fallback;
  return Math.min(value, max);
}

export function formatSupabaseError(input: unknown): string {
  const e = input as { message?: string; details?: string; hint?: string; code?: string };
  const parts = [e.message, e.details, e.hint].filter((v): v is string => Boolean(v && v.trim()));
  const suffix = e.code ? ` [${e.code}]` : '';
  return `${parts.join(' | ') || 'Unknown error'}${suffix}`;
}

export function mutationError(prefix: string, error: unknown) {
  return new Error(`${prefix}. ${formatSupabaseError(error)}`);
}
