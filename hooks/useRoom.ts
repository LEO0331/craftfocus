import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import {
  listMyRoomLayout,
  listUserInventory,
  placeRoomItem,
  removeRoomItem,
  type RoomLayoutItem,
  type UserInventoryItem,
} from '@/lib/rooms';
import type { SpriteId } from '@/constants/roomSprites';

export function useRoom() {
  const { user } = useAuth();
  const [roomItems, setRoomItems] = useState<RoomLayoutItem[]>([]);
  const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshRoom = useCallback(async () => {
    if (!user?.id) {
      setRoomItems([]);
      setInventory([]);
      return;
    }

    setIsLoading(true);

    try {
      const [layout, bag] = await Promise.all([listMyRoomLayout(user.id), listUserInventory(user.id)]);
      setRoomItems(layout);
      setInventory(bag);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshRoom();
  }, [refreshRoom]);

  const unlockedInventory = useMemo(() => inventory.filter((item) => item.unlocked), [inventory]);

  const placeItem = useCallback(
    async (args: { userItemId: string; x: number; y: number }) => {
      if (!user?.id) {
        throw new Error('You must be logged in.');
      }
      await placeRoomItem({ userId: user.id, userItemId: args.userItemId, x: args.x, y: args.y });
      await refreshRoom();
    },
    [refreshRoom, user?.id]
  );

  const clearCell = useCallback(
    async (roomItemId: string) => {
      await removeRoomItem({ roomItemId });
      await refreshRoom();
    },
    [refreshRoom]
  );

  const roomGridItems = useMemo(
    () =>
      roomItems.map((item) => ({
        ...item,
        spriteId: (item.item_id as SpriteId) ?? 'unknown',
      })),
    [roomItems]
  );

  return {
    roomItems,
    roomGridItems,
    inventory,
    unlockedInventory,
    isLoading,
    refreshRoom,
    placeItem,
    clearCell,
  };
}
