import { supabase } from '@/lib/supabase';
import type { FocusMode } from '@/types/models';

export interface UserAnimal {
  animal_id: string;
  name: string;
  sprite_key: string;
  is_active: boolean;
}

export async function listUserAnimals(userId: string): Promise<UserAnimal[]> {
  const { data, error } = await (supabase as any)
    .from('user_animals')
    .select('animal_id,is_active,animal_catalog(name,sprite_key)')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    animal_id: row.animal_id,
    name: row.animal_catalog?.name ?? row.animal_id,
    sprite_key: row.animal_catalog?.sprite_key ?? row.animal_id,
    is_active: Boolean(row.is_active),
  }));
}

export async function getActiveAnimal(userId: string): Promise<UserAnimal | null> {
  const rows = await listUserAnimals(userId);
  return rows.find((row) => row.is_active) ?? rows[0] ?? null;
}

export async function setActiveAnimal(animalId: string) {
  const { error } = await (supabase as any).rpc('set_active_animal', { p_animal_id: animalId });
  if (error) {
    throw error;
  }
}

const SPRITE_ANIMATIONS: Record<string, Record<FocusMode, [string, string]>> = {
  cat: {
    general: ['plant', 'desk_lamp'],
    crafting: ['study_desk', 'work_desk'],
    sewing: ['sewing_kit', 'fabric_roll'],
  },
  dog: {
    general: ['bookshelf', 'plant'],
    crafting: ['work_desk', 'study_desk'],
    sewing: ['fabric_roll', 'sewing_kit'],
  },
  rabbit: {
    general: ['desk_lamp', 'plant'],
    crafting: ['study_desk', 'bookshelf'],
    sewing: ['sewing_kit', 'fabric_roll'],
  },
  fox: {
    general: ['dumbbell', 'yoga_mat'],
    crafting: ['work_desk', 'desk_lamp'],
    sewing: ['fabric_roll', 'sewing_kit'],
  },
};

export function resolveAnimalVariant(spriteKey: string, mode: FocusMode, frameIndex: number) {
  const fallback: [string, string] = ['plant', 'desk_lamp'];
  const pair = SPRITE_ANIMATIONS[spriteKey]?.[mode] ?? fallback;
  return pair[frameIndex % 2];
}
