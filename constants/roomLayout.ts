import type { RoomType } from '@/types/models';

export type AnchorSlotType = 'floor' | 'wall';

export interface RoomAnchor {
  id: string;
  x: number;
  y: number;
  slotType: AnchorSlotType;
  footprintW: number;
  footprintH: number;
  zIndex: number;
}

export const ROOM_ANCHORS: Record<RoomType, RoomAnchor[]> = {
  bedroom: [
    { id: 'bed_left', x: 130, y: 120, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 3 },
    { id: 'desk_left', x: 70, y: 210, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'desk_center', x: 190, y: 250, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'drawer_right', x: 300, y: 210, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 4 },
    { id: 'wall_left', x: 60, y: 95, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
    { id: 'wall_center', x: 190, y: 70, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
    { id: 'wall_right', x: 320, y: 95, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
  ],
  gym: [
    { id: 'gym_floor_a', x: 90, y: 240, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'gym_floor_b', x: 180, y: 225, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'gym_floor_c', x: 270, y: 210, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'gym_wall_a', x: 110, y: 95, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
    { id: 'gym_wall_b', x: 250, y: 80, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
  ],
};
