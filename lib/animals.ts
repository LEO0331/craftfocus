import { supabase } from '@/lib/supabase';
import { ANIMAL_SPRITES } from '@/constants/animalSprites';
import type { FocusMode } from '@/types/models';

export interface UserAnimal {
  animal_id: string;
  name: string;
  sprite_key: string;
  is_active: boolean;
}

interface UserAnimalQueryRow {
  animal_id: string;
  is_active: boolean;
  animal_catalog?: unknown;
}

function isUserAnimalQueryRow(value: unknown): value is UserAnimalQueryRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.animal_id === 'string' && typeof row.is_active === 'boolean';
}

function getCatalogInfo(value: unknown): { name?: string; sprite_key?: string } {
  if (!value || typeof value !== 'object') return {};
  const row = value as Record<string, unknown>;
  return {
    name: typeof row.name === 'string' ? row.name : undefined,
    sprite_key: typeof row.sprite_key === 'string' ? row.sprite_key : undefined,
  };
}

export async function listUserAnimals(userId: string): Promise<UserAnimal[]> {
  const { data, error } = await supabase
    .from('user_animals')
    .select('animal_id,is_active,animal_catalog(name,sprite_key)')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).filter(isUserAnimalQueryRow).map((row) => {
    const catalog = getCatalogInfo(row.animal_catalog);
    return {
    animal_id: row.animal_id,
    name: catalog.name ?? row.animal_id,
    sprite_key: catalog.sprite_key ?? row.animal_id,
    is_active: Boolean(row.is_active),
    };
  });
}

export async function getActiveAnimal(userId: string): Promise<UserAnimal | null> {
  const rows = await listUserAnimals(userId);
  return rows.find((row) => row.is_active) ?? rows[0] ?? null;
}

export async function setActiveAnimal(animalId: string) {
  const { error } = await supabase.rpc('set_active_animal', { p_animal_id: animalId });
  if (error) throw error;
}

export function resolveAnimalSpecies(spriteKey: string): 'cat' | 'dog' | 'rabbit' | 'fox' {
  const base = spriteKey.split('_')[0]?.toLowerCase();
  if (base === 'dog' || base === 'rabbit' || base === 'fox') {
    return base;
  }
  return 'cat';
}

export function resolveAnimalVariant(spriteKey: string, mode: FocusMode, frameIndex: number) {
  const frame = frameIndex % 2;
  const primary = `${spriteKey}_${mode}_${frame}`;
  if (ANIMAL_SPRITES[primary]) {
    return primary;
  }

  const fallback = `cat_${mode}_${frame}`;
  if (ANIMAL_SPRITES[fallback]) {
    return fallback;
  }

  return 'cat_general_0';
}
