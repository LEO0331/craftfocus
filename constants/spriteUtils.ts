import { ROOM_SPRITES, type SpriteId } from '@/constants/roomSprites';

export function resolveSpriteId(itemId: string): SpriteId {
  return (itemId in ROOM_SPRITES ? itemId : 'unknown') as SpriteId;
}
