import type { SpriteDefinition } from '@/constants/roomSprites';
import type { RoomType } from '@/types/models';

export const ROOM_COLLECTION_COLORS = {
  bedroom: { frame: '#D9BD96', border: '#B39670', inset: '#FBF2E1', accent: '#A97251' },
  gym: { frame: '#AAC5B8', border: '#77988A', inset: '#EDF3E9', accent: '#49786B' },
};

type Paint = (rect: (x: number, y: number, w: number, h: number, token: string) => void) => void;
function sprite(name: string, paint: Paint): SpriteDefinition {
  const cells = Array.from({ length: 16 }, () => Array<string>(16).fill('.'));
  paint((x, y, w, h, token) => {
    for (let row = y; row < y + h; row += 1) {
      for (let col = x; col < x + w; col += 1) cells[row][col] = token;
    }
  });
  return { name, palette: {}, grid: cells.map((row) => row.join('')) };
}

// Original 16px miniatures matching the room's wood, fabric, and leaf colors.
// The IDs remain the canonical inventory IDs, so no new rewards are implied.
const MINIATURES: Record<string, SpriteDefinition> = {
  plant: sprite('Plant', (r) => {
    r(4,14,8,1,'s'); r(7,3,2,9,'g');
    r(3,5,4,3,'g'); r(2,4,3,2,'l'); r(5,6,3,3,'g');
    r(9,3,4,3,'g'); r(11,2,2,2,'l'); r(8,4,3,3,'l');
    r(5,1,3,4,'l'); r(6,1,1,3,'g');
    r(4,10,8,2,'w'); r(5,12,6,2,'d'); r(5,12,4,2,'a');
  }),
  bookshelf: sprite('Bookshelf', (r) => {
    r(2,14,12,1,'s'); r(2,2,11,12,'d'); r(2,1,11,1,'w'); r(3,3,9,3,'s'); r(3,8,9,4,'s');
    r(2,2,1,12,'a'); r(3,6,9,2,'w'); r(3,12,9,1,'w');
    [3,6,9].forEach((x,i) => { r(x,3,2,3,['g','f','b'][i]); r(x,8,2,4,['b','c','g'][i]); r(x,8,1,1,'c'); });
    r(12,2,1,12,'w');
  }),
  study_desk: sprite('Study Desk', (r) => {
    r(1,14,14,1,'s'); r(3,8,2,6,'d'); r(12,8,2,6,'d');
    r(1,6,14,3,'a'); r(2,5,12,2,'w'); r(1,8,14,1,'d');
    r(4,4,5,2,'c'); r(4,4,1,2,'g'); r(11,2,2,3,'b'); r(10,4,4,1,'b');
  }),
  work_desk: sprite('Work Desk', (r) => {
    r(1,14,14,1,'s'); r(3,9,2,5,'d'); r(12,9,2,5,'d'); r(1,7,14,2,'w'); r(1,9,14,1,'a');
    r(5,1,8,5,'s'); r(6,2,6,3,'b'); r(7,2,3,1,'c'); r(8,6,2,1,'s'); r(6,7,6,1,'s');
  }),
  desk_lamp: sprite('Desk Lamp', (r) => {
    r(4,14,9,1,'s'); r(7,6,2,7,'d'); r(7,7,1,5,'w');
    r(5,2,6,1,'w'); r(4,3,8,2,'w'); r(3,5,10,2,'a'); r(4,5,8,1,'c');
    r(5,12,6,1,'w'); r(4,13,8,1,'a');
  }),
  bean_bag: sprite('Bean Bag', (r) => {
    r(2,13,12,2,'s'); r(4,3,8,2,'w'); r(3,5,10,7,'a'); r(2,7,12,5,'a');
    r(4,5,7,5,'w'); r(3,10,10,2,'w'); r(4,12,8,1,'d'); r(12,7,1,5,'d');
  }),
  floor_rug: sprite('Floor Rug', (r) => {
    r(2,12,12,1,'s'); r(1,5,14,7,'f'); r(2,6,12,5,'c'); r(3,7,10,3,'f');
    r(5,7,1,3,'a'); r(8,7,1,3,'a'); r(11,7,1,3,'a');
    [2,5,8,11].forEach((x) => { r(x,4,1,1,'c'); r(x,12,1,1,'c'); });
  }),
  yoga_mat: sprite('Yoga Mat', (r) => {
    r(2,13,12,1,'s'); r(3,5,10,8,'g'); r(4,6,8,6,'l');
    r(4,9,8,1,'g'); r(4,11,8,1,'g'); r(2,3,12,3,'g'); r(3,2,10,1,'l');
    r(3,3,9,1,'l'); r(12,3,2,3,'d'); r(12,4,1,1,'c');
  }),
  dumbbell: sprite('Dumbbell', (r) => {
    r(1,12,14,1,'s'); r(5,7,6,2,'b'); r(6,7,4,1,'c');
    r(1,5,2,6,'d'); r(3,4,3,8,'g'); r(3,5,1,6,'l');
    r(10,4,3,8,'g'); r(10,5,1,6,'l'); r(13,5,2,6,'d');
  }),
  wall_frame: sprite('Wall Frame', (r) => {
    r(4,2,9,12,'d'); r(3,1,9,12,'w'); r(4,2,7,10,'c'); r(5,3,5,8,'b');
    r(8,4,2,2,'c'); r(5,8,2,3,'g'); r(7,9,3,2,'l');
  }),
  wall_clock: sprite('Wall Clock', (r) => {
    r(4,2,8,12,'d'); r(2,4,12,8,'d'); r(4,3,8,10,'c'); r(3,4,10,8,'c');
    r(7,4,1,5,'d'); r(7,8,4,1,'d'); r(7,8,1,1,'f');
  }),
  tool_box: sprite('Tool Box', (r) => {
    r(2,13,12,1,'s'); r(6,3,5,1,'d'); r(5,4,1,2,'d'); r(11,4,1,2,'d');
    r(2,6,12,7,'g'); r(2,6,12,2,'l'); r(2,8,12,1,'d'); r(7,8,2,2,'c'); r(12,9,2,4,'d');
  }),
};

const PALETTES: Record<RoomType, Record<string,string>> = {
  bedroom: { '.':'#00000000', s:'#715B4838', w:'#DDB781', a:'#BE8859', d:'#835B40', g:'#5D8060', l:'#94B078', f:'#B5755E', b:'#829CA0', c:'#F4E4C1' },
  gym: { '.':'#00000000', s:'#274C4538', w:'#CAD6B7', a:'#8FA786', d:'#405E55', g:'#547F72', l:'#8FB49D', f:'#668C91', b:'#94ADA4', c:'#EEF2DB' },
};

export function roomCollectibleSprite(itemId: string, roomType: RoomType): SpriteDefinition | undefined {
  const definition = MINIATURES[itemId];
  return definition ? { ...definition, palette: PALETTES[roomType] } : undefined;
}
