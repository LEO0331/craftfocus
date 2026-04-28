export type SpriteId =
  | 'leather_wallet'
  | 'sewing_kit'
  | 'fabric_roll'
  | 'dumbbell'
  | 'yoga_mat'
  | 'study_desk'
  | 'bookshelf'
  | 'desk_lamp'
  | 'work_desk'
  | 'plant'
  | 'unknown';

export type PixelGrid = string[];

export interface SpriteDefinition {
  name: string;
  palette: Record<string, string>;
  grid: PixelGrid;
}

const COMMON_BG = '#00000000';

export const ROOM_SPRITES: Record<SpriteId, SpriteDefinition> = {
  leather_wallet: {
    name: 'Leather Wallet',
    palette: { '.': COMMON_BG, b: '#5A3E2A', d: '#3C281C', l: '#8B5E3C' },
    grid: ['........', '..bbbb..', '.bllllb.', '.bllllb.', '.bdlldb.', '..bbbb..', '........', '........'],
  },
  sewing_kit: {
    name: 'Sewing Kit',
    palette: { '.': COMMON_BG, r: '#C74444', p: '#F2C9D2', d: '#7A2A2A' },
    grid: ['........', '.rrrrrr.', '.rppppr.', '.rppppr.', '.rppppr.', '.rddddr.', '.rrrrrr.', '........'],
  },
  fabric_roll: {
    name: 'Fabric Roll',
    palette: { '.': COMMON_BG, b: '#5B7FC2', l: '#9CB6E3', d: '#395788' },
    grid: ['........', '...bbb..', '..blllb.', '.bllldb.', '.bllldb.', '..blllb.', '...bbb..', '........'],
  },
  dumbbell: {
    name: 'Dumbbell',
    palette: { '.': COMMON_BG, m: '#666666', l: '#A7A7A7', d: '#3D3D3D' },
    grid: ['........', '.ll..ll.', '.llmmll.', '.ddmmdd.', '.ddmmdd.', '.llmmll.', '.ll..ll.', '........'],
  },
  yoga_mat: {
    name: 'Yoga Mat',
    palette: { '.': COMMON_BG, g: '#4F8C62', l: '#80B395', d: '#376348' },
    grid: ['........', '........', '.gggggg.', '.gllllg.', '.gddddg.', '.gggggg.', '........', '........'],
  },
  study_desk: {
    name: 'Study Desk',
    palette: { '.': COMMON_BG, w: '#B6834A', d: '#7D5730', l: '#D7A66E' },
    grid: ['........', '.llllll.', '.wwwwww.', '.wddddw.', '.w....w.', '.w....w.', '.d....d.', '........'],
  },
  bookshelf: {
    name: 'Bookshelf',
    palette: { '.': COMMON_BG, w: '#8A5E34', b: '#C85B5B', g: '#5AA06F', y: '#D9B24C' },
    grid: ['........', '.wwwwww.', '.wbgbyw.', '.wwwwww.', '.wgybbw.', '.wwwwww.', '.wbbgyw.', '.wwwwww.'],
  },
  desk_lamp: {
    name: 'Desk Lamp',
    palette: { '.': COMMON_BG, y: '#F2D35C', g: '#8E8E8E', d: '#595959' },
    grid: ['........', '...yy...', '..yyyy..', '...gg...', '...gg...', '..dddd..', '.dddddd.', '........'],
  },
  work_desk: {
    name: 'Work Desk',
    palette: { '.': COMMON_BG, w: '#8A6238', s: '#5A6D82', l: '#A7C4E4' },
    grid: ['........', '.wwwwww.', '.wssssw.', '.wslssw.', '.wssssw.', '.w....w.', '.w....w.', '.ww..ww.'],
  },
  plant: {
    name: 'Plant',
    palette: { '.': COMMON_BG, g: '#4B995F', l: '#77C189', p: '#A06A3A', d: '#6E4728' },
    grid: ['........', '...gg...', '..gllg..', '..gllg..', '...gg...', '..pppp..', '..pddp..', '........'],
  },
  unknown: {
    name: 'Unknown',
    palette: { '.': COMMON_BG, x: '#A0A0A0' },
    grid: ['........', '.xxxxxx.', '.x....x.', '.x....x.', '.x....x.', '.x....x.', '.xxxxxx.', '........'],
  },
};
