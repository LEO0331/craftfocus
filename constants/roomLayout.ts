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
    { id: 'bed_left', x: 3.0, y: 2.2, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'desk_left', x: 0.55, y: 2.95, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'desk_center', x: 1.35, y: 3.65, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'drawer_right', x: 4.9, y: 2.55, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'chair_front', x: 3.35, y: 3.35, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'lounge_left', x: 0.15, y: 4.0, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'shelf_right', x: 5.85, y: 3.25, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'wall_left', x: 0, y: 1, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
    { id: 'wall_center', x: 3, y: 0, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
    { id: 'wall_right', x: 6, y: 1, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
  ],
  gym: [
    { id: 'gym_floor_a', x: 0, y: 5.0, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'gym_floor_b', x: 1.0, y: 6.0, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'gym_floor_c', x: 3, y: 3, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'gym_floor_d', x: 5.6, y: 3.35, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'gym_floor_e', x: 6, y: 2.6, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 5 },
    { id: 'gym_floor_f', x: 6, y: 4.4, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'gym_floor_g', x: 1.9, y: 5.8, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'gym_floor_h', x: 4.2, y: 5.1, slotType: 'floor', footprintW: 2, footprintH: 2, zIndex: 6 },
    { id: 'gym_wall_a', x: 1, y: 0, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
    { id: 'gym_wall_b', x: 3, y: 0, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
    { id: 'gym_wall_c', x: 5, y: 0, slotType: 'wall', footprintW: 1, footprintH: 1, zIndex: 2 },
  ],
};
