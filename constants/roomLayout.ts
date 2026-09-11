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
    { id: 'bed_left', x: 2.96, y: 1.43, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'desk_left', x: 1.36, y: 3.03, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'desk_center', x: 6.56, y: 6.56, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'drawer_right', x: 6.14, y: 1.42, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'chair_front', x: 3.93, y: 6.57, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'lounge_left', x: 1.35, y: 6.2, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'shelf_right', x: 6.64, y: 3.86, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'wall_left', x: 0, y: 1, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
    { id: 'wall_center', x: 3, y: 0, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
    { id: 'wall_right', x: 6, y: 1, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
  ],
  gym: [
    { id: 'gym_floor_a', x: 1.35, y: 6.2, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'gym_floor_b', x: 1.36, y: 3.03, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'gym_floor_c', x: 2.96, y: 1.43, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'gym_floor_d', x: 6.14, y: 1.42, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'gym_floor_e', x: 4.14, y: 4.14, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'gym_floor_f', x: 6.64, y: 3.86, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'gym_floor_g', x: 3.93, y: 6.57, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'gym_floor_h', x: 6.56, y: 6.56, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'gym_wall_a', x: 1, y: 0, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
    { id: 'gym_wall_b', x: 3, y: 0, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
    { id: 'gym_wall_c', x: 5, y: 0, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
  ],
};
