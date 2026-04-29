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
  | 'wall_clock'
  | 'bean_bag'
  | 'tool_box'
  | 'floor_rug'
  | 'wall_frame'
  | 'cat_general_0'
  | 'cat_general_1'
  | 'cat_crafting_0'
  | 'cat_crafting_1'
  | 'cat_sewing_0'
  | 'cat_sewing_1'
  | 'dog_general_0'
  | 'dog_general_1'
  | 'dog_crafting_0'
  | 'dog_crafting_1'
  | 'dog_sewing_0'
  | 'dog_sewing_1'
  | 'rabbit_general_0'
  | 'rabbit_general_1'
  | 'rabbit_crafting_0'
  | 'rabbit_crafting_1'
  | 'rabbit_sewing_0'
  | 'rabbit_sewing_1'
  | 'fox_general_0'
  | 'fox_general_1'
  | 'fox_crafting_0'
  | 'fox_crafting_1'
  | 'fox_sewing_0'
  | 'fox_sewing_1'
  | 'unknown';

export type PixelGrid = string[];

export interface SpriteDefinition {
  name: string;
  palette: Record<string, string>;
  grid: PixelGrid;
}

const COMMON_BG = '#00000000';

export const ROOM_SPRITES: Record<string, SpriteDefinition> = {
  leather_wallet: {
    name: 'Leather Wallet',
    palette: { '.': COMMON_BG, b: '#5A3E2A', d: '#3C281C', l: '#8B5E3C', s: '#D8B17A' },
    grid: ['........', '..bbbb..', '.bllllb.', '.blsslb.', '.blddlb.', '.bllllb.', '..bbbb..', '........'],
  },
  sewing_kit: {
    name: 'Sewing Kit',
    palette: { '.': COMMON_BG, r: '#C74444', p: '#F2C9D2', d: '#7A2A2A', w: '#F4E7D0', n: '#5A5A5A' },
    grid: ['........', '.rrrrrr.', '.rppppr.', '.rpwwpr.', '.rpnwpr.', '.rddddr.', '.rrrrrr.', '........'],
  },
  fabric_roll: {
    name: 'Fabric Roll',
    palette: { '.': COMMON_BG, b: '#5B7FC2', l: '#9CB6E3', d: '#395788', s: '#E8EDF8' },
    grid: ['........', '...bbb..', '..blllb.', '.bslldb.', '.bldslb.', '..blllb.', '...bbb..', '........'],
  },
  dumbbell: {
    name: 'Dumbbell',
    palette: { '.': COMMON_BG, m: '#666666', l: '#A7A7A7', d: '#3D3D3D', h: '#D6D6D6' },
    grid: ['........', '.ll..ll.', '.lhmmhl.', '.ddmmdd.', '.ddmmdd.', '.lhmmhl.', '.ll..ll.', '........'],
  },
  yoga_mat: {
    name: 'Yoga Mat',
    palette: { '.': COMMON_BG, g: '#4F8C62', l: '#80B395', d: '#376348', w: '#DCEBDD' },
    grid: ['........', '.gggggg.', '.gllllg.', '.glwwlg.', '.glddlg.', '.gllllg.', '.gggggg.', '........'],
  },
  study_desk: {
    name: 'Study Desk',
    palette: { '.': COMMON_BG, w: '#B6834A', d: '#7D5730', l: '#D7A66E', p: '#E5DCC7', b: '#5C7998' },
    grid: ['........', '.llllll.', '.wwwwww.', '.wbbbbw.', '.wppppw.', '.w....w.', '.d....d.', '........'],
  },
  bookshelf: {
    name: 'Bookshelf',
    palette: { '.': COMMON_BG, w: '#8A5E34', b: '#C85B5B', g: '#5AA06F', y: '#D9B24C', c: '#5B89C8' },
    grid: ['........', '.wwwwww.', '.wbgcyw.', '.wwwwww.', '.wgybbw.', '.wwwwww.', '.wcgbyw.', '.wwwwww.'],
  },
  desk_lamp: {
    name: 'Desk Lamp',
    palette: { '.': COMMON_BG, y: '#F2D35C', g: '#8E8E8E', d: '#595959', w: '#FFF4BF' },
    grid: ['........', '...yy...', '..ywwy..', '...gg...', '...gg...', '..dgdd..', '.dddddd.', '........'],
  },
  work_desk: {
    name: 'Work Desk',
    palette: { '.': COMMON_BG, w: '#8A6238', s: '#5A6D82', l: '#A7C4E4', k: '#2F3A4A' },
    grid: ['........', '.wwwwww.', '.wssssw.', '.wslksw.', '.wssssw.', '.w....w.', '.w....w.', '.ww..ww.'],
  },
  plant: {
    name: 'Plant',
    palette: { '.': COMMON_BG, g: '#4B995F', l: '#77C189', p: '#A06A3A', d: '#6E4728', f: '#C75454' },
    grid: ['........', '..fggf..', '..gllg..', '.ggllgg.', '...gg...', '..pppp..', '..pddp..', '........'],
  },
  wall_clock: {
    name: 'Wall Clock',
    palette: { '.': COMMON_BG, w: '#E8E8E8', d: '#6B6B6B', h: '#C45A5A', b: '#6CA0D8' },
    grid: ['........', '..wwww..', '.wddddw.', '.wdhbdw.', '.wdbhdw.', '.wddddw.', '..wwww..', '........'],
  },
  bean_bag: {
    name: 'Bean Bag',
    palette: { '.': COMMON_BG, o: '#D98942', s: '#F2BE84', d: '#A86127' },
    grid: ['........', '..oooo..', '.osssso.', '.osddso.', '.osssso.', '..oddo..', '...oo...', '........'],
  },
  tool_box: {
    name: 'Tool Box',
    palette: { '.': COMMON_BG, r: '#C95050', d: '#812E2E', m: '#B9B9B9', b: '#F6F0E5' },
    grid: ['........', '..rrrr..', '.rmmmmr.', '.rbbbbr.', '.rbbbbr.', '.rddddr.', '..rrrr..', '........'],
  },
  floor_rug: {
    name: 'Floor Rug',
    palette: { '.': COMMON_BG, c: '#5D87C8', l: '#A7C1E8', d: '#3C5E93', w: '#E8F0FF' },
    grid: ['........', '.cccccc.', '.clwwlc.', '.cwdwdc.', '.clwwlc.', '.cccccc.', '........', '........'],
  },
  wall_frame: {
    name: 'Wall Frame',
    palette: { '.': COMMON_BG, g: '#D5B789', d: '#8A6C43', b: '#83A8D8', w: '#EEF5FF' },
    grid: ['........', '..gggg..', '..gddg..', '..gwwg..', '..gbbg..', '..gddg..', '..gggg..', '........'],
  },
  unknown: {
    name: 'Unknown',
    palette: { '.': COMMON_BG, x: '#A0A0A0' },
    grid: ['........', '.xxxxxx.', '.x....x.', '.x....x.', '.x....x.', '.x....x.', '.xxxxxx.', '........'],
  },
};
