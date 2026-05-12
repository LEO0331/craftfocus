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
    { id: 'bed_left', x: 3.7, y: 3.1, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'desk_left', x: 0.9, y: 4.7, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'desk_center', x: 1.9, y: 5.8, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'drawer_right', x: 5.3, y: 3.7, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'chair_front', x: 4.2, y: 5.4, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'wall_left', x: 0, y: 1, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
    { id: 'wall_center', x: 3, y: 0, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
    { id: 'wall_right', x: 6, y: 1, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
  ],
  gym: [
    { id: 'gym_floor_a', x: 0.2, y: 4.8, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'gym_floor_b', x: 1.1, y: 5.7, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'gym_floor_c', x: 3, y: 3, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'gym_floor_d', x: 5.0, y: 3.55, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'gym_floor_e', x: 5.9, y: 3.2, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'gym_floor_f', x: 5.9, y: 4.2, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'gym_floor_g', x: 1.9, y: 5.8, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'gym_floor_h', x: 4.2, y: 5.1, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'gym_wall_a', x: 1, y: 0, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
    { id: 'gym_wall_b', x: 3, y: 0, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
    { id: 'gym_wall_c', x: 5, y: 0, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
  ],
};
