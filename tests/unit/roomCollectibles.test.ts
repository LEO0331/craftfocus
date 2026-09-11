import { describe, expect, it } from 'vitest';
import { roomCollectibleSprite } from '@/constants/roomCollectibles';
import { ROOM_SPRITES } from '@/constants/roomSprites';
import { roomPoint, roomSceneWidth } from '@/lib/roomGeometry';

describe('themed room collectibles', () => {
  it('provides complete square pixel art for both themes without changing item identity', () => {
    for (const id of ['plant','study_desk','work_desk','bookshelf','desk_lamp','bean_bag','floor_rug','dumbbell','yoga_mat','wall_frame','wall_clock','tool_box']) {
      for (const roomType of ['bedroom','gym'] as const) {
        const art = roomCollectibleSprite(id, roomType)!;
        expect(art.name).toBe(ROOM_SPRITES[id].name);
        expect(art.grid.length).toBe(16);
        art.grid.forEach((row) => {
          expect(row.length).toBe(16);
          [...row].forEach((token) => expect(art.palette[token]).toBeDefined());
        });
      }
    }
  });
  it('changes the palette while retaining recognizable outlines', () => {
    const bedroom = roomCollectibleSprite('yoga_mat','bedroom')!;
    const gym = roomCollectibleSprite('yoga_mat','gym')!;
    expect(bedroom.grid).toEqual(gym.grid);
    expect(bedroom.palette).not.toEqual(gym.palette);
    expect(roomCollectibleSprite('custom-upload','bedroom')).toBeUndefined();
  });
  it('joins floor and wall corners with a single projection and respects narrow containers', () => {
    expect(roomPoint(0,0)).toEqual({x:300,y:184});
    expect(roomPoint(7,7)).toEqual({x:300,y:436});
    expect(roomPoint(0,7)).toEqual({x:48,y:310});
    expect(roomPoint(7,0)).toEqual({x:552,y:310});
    expect(roomPoint(0,0,144)).toEqual({x:300,y:40});
    expect(roomSceneWidth(240)).toBe(240);
    expect(roomSceneWidth(800)).toBe(560);
  });
});
