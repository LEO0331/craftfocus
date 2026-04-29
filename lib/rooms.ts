import { supabase } from '@/lib/supabase';
import type { RoomType } from '@/types/models';

export interface RoomPlacement {
  id: string;
  anchor_id: string;
  item_id: string;
}

export interface UserInventoryItem {
  item_id: string;
  quantity: number;
}

export async function getOrCreateRoom(userId: string): Promise<{ id: string; room_type: RoomType }> {
  const { data: existing, error } = await supabase.from('rooms').select('id,room_type').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (existing?.id) return { id: existing.id, room_type: existing.room_type ?? 'bedroom' };

  const { data: created, error: createError } = await supabase
    .from('rooms')
    .insert({ user_id: userId, room_type: 'bedroom' })
    .select('id,room_type')
    .single();
  if (createError) throw createError;
  return { id: created.id, room_type: created.room_type ?? 'bedroom' };
}

export async function listMyRoom(userId: string): Promise<{ roomId: string; roomType: RoomType; placements: RoomPlacement[] }> {
  const room = await getOrCreateRoom(userId);
  const { data, error } = await supabase
    .from('room_placements')
    .select('id,anchor_id,item_id')
    .eq('room_id', room.id)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return { roomId: room.id, roomType: room.room_type, placements: (data ?? []).map((row) => ({ id: row.id, anchor_id: row.anchor_id, item_id: row.item_id })) };
}

export async function listPublicRoomLayout(userId: string): Promise<{ roomType: RoomType; placements: RoomPlacement[] }> {
  const { data: room, error } = await supabase.from('rooms').select('id,room_type').eq('user_id', userId).maybeSingle();
  if (error || !room?.id) return { roomType: 'bedroom', placements: [] };

  const { data, error: pError } = await supabase.from('room_placements').select('id,anchor_id,item_id').eq('room_id', room.id);
  if (pError) throw pError;

  return { roomType: room.room_type ?? 'bedroom', placements: (data ?? []).map((row) => ({ id: row.id, anchor_id: row.anchor_id, item_id: row.item_id })) };
}

export async function listUserInventory(userId: string): Promise<UserInventoryItem[]> {
  const { data, error } = await supabase.from('user_inventory').select('item_id,quantity').eq('user_id', userId).order('item_id', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({ item_id: row.item_id, quantity: row.quantity }));
}

export async function setRoomType(userId: string, roomType: RoomType) {
  const room = await getOrCreateRoom(userId);
  const { error } = await supabase.from('rooms').update({ room_type: roomType }).eq('id', room.id);
  if (error) throw error;
}

export async function placeInventoryAtAnchor(input: { roomId: string; itemId: string; anchorId: string }) {
  const { error } = await supabase.rpc('place_inventory_at_anchor', {
    p_room_id: input.roomId,
    p_item_id: input.itemId,
    p_anchor_id: input.anchorId,
  });
  if (error) throw error;
}

export async function removeRoomPlacement(roomPlacementId: string) {
  const { error } = await supabase.rpc('remove_room_placement', { p_room_placement_id: roomPlacementId });
  if (error) throw error;
}
