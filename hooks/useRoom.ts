import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import {
  listMyRoom,
  listUserInventory,
  placeInventoryAtAnchor,
  removeRoomPlacement,
  setRoomType as persistRoomType,
  type RoomPlacement,
  type UserInventoryItem,
} from '@/lib/rooms';
import type { RoomType } from '@/types/models';

export function useRoom() {
  const { user } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<RoomType>('bedroom');
  const [placements, setPlacements] = useState<RoomPlacement[]>([]);
  const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshRoom = useCallback(async () => {
    if (!user?.id) {
      setRoomId(null);
      setRoomType('bedroom');
      setPlacements([]);
      setInventory([]);
      return;
    }

    setIsLoading(true);
    try {
      const [roomData, bag] = await Promise.all([listMyRoom(user.id), listUserInventory(user.id)]);
      setRoomId(roomData.roomId);
      setRoomType(roomData.roomType);
      setPlacements(roomData.placements);
      setInventory(bag);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshRoom();
  }, [refreshRoom]);

  const inventoryByItem = useMemo(() => new Map(inventory.map((entry) => [entry.item_id, entry.quantity])), [inventory]);

  const placeAtAnchor = useCallback(
    async (itemId: string, anchorId: string) => {
      if (!roomId) {
        return;
      }
      await placeInventoryAtAnchor({ roomId, itemId, anchorId });
      await refreshRoom();
    },
    [refreshRoom, roomId]
  );

  const removePlacementAtAnchor = useCallback(
    async (anchorId: string) => {
      const placement = placements.find((entry) => entry.anchor_id === anchorId);
      if (!placement) {
        return;
      }
      await removeRoomPlacement(placement.id);
      await refreshRoom();
    },
    [placements, refreshRoom]
  );

  const switchRoomType = useCallback(
    async (next: RoomType) => {
      if (!user?.id) {
        return;
      }
      await persistRoomType(user.id, next);
      await refreshRoom();
    },
    [refreshRoom, user?.id]
  );

  return {
    roomId,
    roomType,
    placements,
    inventory,
    inventoryByItem,
    isLoading,
    refreshRoom,
    placeAtAnchor,
    removePlacementAtAnchor,
    switchRoomType,
  };
}
