import { supabase } from '@/lib/supabase';
import type { TableRow } from '@/types/database';

type RoomRow = TableRow<'rooms'>;
type RoomItemRow = TableRow<'room_items'>;
type UserItemRow = TableRow<'user_items'>;
type ItemCatalogRow = TableRow<'item_catalog'>;

export interface RoomLayoutItem {
  id: string;
  user_item_id: string;
  x: number;
  y: number;
  item_id: string;
  item_name: string;
  unlocked: boolean;
}

export interface UserInventoryItem {
  id: string;
  item_id: string;
  progress: number;
  unlocked: boolean;
}

export async function getOrCreateRoomId(userId: string): Promise<string> {
  const { data: existingRoom, error: roomError } = await supabase
    .from('rooms')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (roomError) {
    throw roomError;
  }

  if (existingRoom?.id) {
    return existingRoom.id;
  }

  const { data: createdRoom, error: createError } = await supabase
    .from('rooms')
    .insert({ user_id: userId })
    .select('id')
    .single();

  if (createError) {
    throw createError;
  }

  return createdRoom.id;
}

export async function listUserInventory(userId: string): Promise<UserInventoryItem[]> {
  const { data, error } = await supabase
    .from('user_items')
    .select('id,item_id,progress,unlocked')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: Pick<UserItemRow, 'id' | 'item_id' | 'progress' | 'unlocked'>) => ({
    id: row.id,
    item_id: row.item_id,
    progress: row.progress,
    unlocked: row.unlocked,
  }));
}

async function buildRoomLayout(roomId: string): Promise<RoomLayoutItem[]> {
  const { data: roomItems, error: roomItemsError } = await supabase
    .from('room_items')
    .select('id,user_item_id,x,y')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });

  if (roomItemsError) {
    throw roomItemsError;
  }

  const roomRows = roomItems ?? [];
  const userItemIds = Array.from(new Set(roomRows.map((entry: Pick<RoomItemRow, 'user_item_id'>) => entry.user_item_id)));
  if (!userItemIds.length) {
    return [];
  }

  const { data: userItems, error: userItemsError } = await supabase
    .from('user_items')
    .select('id,item_id,unlocked')
    .in('id', userItemIds);

  if (userItemsError) {
    throw userItemsError;
  }

  const userRows = userItems ?? [];
  const itemIds = Array.from(new Set(userRows.map((entry: Pick<UserItemRow, 'item_id'>) => entry.item_id)));

  const { data: itemCatalog, error: itemCatalogError } = await supabase
    .from('item_catalog')
    .select('id,name')
    .in('id', itemIds);

  if (itemCatalogError) {
    throw itemCatalogError;
  }

  const userItemMap = new Map(
    userRows.map((item: Pick<UserItemRow, 'id' | 'item_id' | 'unlocked'>) => [item.id, item])
  );
  const catalogMap = new Map(
    (itemCatalog ?? []).map((item: Pick<ItemCatalogRow, 'id' | 'name'>) => [item.id, item])
  );

  return roomRows.map((roomItem: Pick<RoomItemRow, 'id' | 'user_item_id' | 'x' | 'y'>) => {
    const userItem = userItemMap.get(roomItem.user_item_id);
    const catalog = userItem ? catalogMap.get(userItem.item_id) : undefined;

    return {
      id: roomItem.id,
      user_item_id: roomItem.user_item_id,
      x: roomItem.x,
      y: roomItem.y,
      item_id: userItem?.item_id ?? 'unknown',
      item_name: catalog?.name ?? userItem?.item_id ?? 'Unknown',
      unlocked: Boolean(userItem?.unlocked),
    };
  });
}

export async function listMyRoomLayout(userId: string): Promise<RoomLayoutItem[]> {
  const roomId = await getOrCreateRoomId(userId);
  return buildRoomLayout(roomId);
}

export async function listPublicRoomLayout(userId: string): Promise<RoomLayoutItem[]> {
  const { data: room, error } = await supabase.from('rooms').select('id').eq('user_id', userId).maybeSingle();
  if (error) {
    throw error;
  }
  if (!room?.id) {
    return [];
  }

  return buildRoomLayout(room.id);
}

export async function placeRoomItem(input: { userId: string; userItemId: string; x: number; y: number }) {
  const roomId = await getOrCreateRoomId(input.userId);

  const { error: clearError } = await supabase
    .from('room_items')
    .delete()
    .eq('room_id', roomId)
    .eq('x', input.x)
    .eq('y', input.y);

  if (clearError) {
    throw clearError;
  }

  const { error } = await supabase.from('room_items').insert({
    room_id: roomId,
    user_item_id: input.userItemId,
    x: input.x,
    y: input.y,
  });

  if (error) {
    throw error;
  }
}

export async function removeRoomItem(input: { roomItemId: string }) {
  const { error } = await supabase.from('room_items').delete().eq('id', input.roomItemId);
  if (error) {
    throw error;
  }
}
