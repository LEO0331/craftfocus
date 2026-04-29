import type { SpriteDefinition } from '@/constants/roomSprites';

const COMMON_BG = '#00000000';

export const ANIMAL_SPRITES: Record<string, SpriteDefinition> = {
  cat_general_0: { name: 'Cat General', palette: { '.': COMMON_BG, o: '#F4A261', d: '#B56A2B', w: '#FFF1D6', e: '#2E2E2E' }, grid: ['........','..oooo..','.owwwwo.','.oweewo.','.owwwwo.','..oddo..','.o....o.','........'] },
  cat_general_1: { name: 'Cat General', palette: { '.': COMMON_BG, o: '#F4A261', d: '#B56A2B', w: '#FFF1D6', e: '#2E2E2E' }, grid: ['........','..oooo..','.owwwwo.','.oweewo.','.owwwwo.','..oddo..','...oo...','........'] },
  cat_crafting_0: { name: 'Cat Crafting', palette: { '.': COMMON_BG, o: '#F4A261', d: '#B56A2B', w: '#FFF1D6', e: '#2E2E2E', g: '#6AA84F' }, grid: ['........','..oooo..','.owwwwo.','.oweewo.','.owwwwo.','..oddo..','..gggg..','........'] },
  cat_crafting_1: { name: 'Cat Crafting', palette: { '.': COMMON_BG, o: '#F4A261', d: '#B56A2B', w: '#FFF1D6', e: '#2E2E2E', g: '#6AA84F' }, grid: ['........','..oooo..','.owwwwo.','.oweewo.','.owwwwo.','..oddo..','.gg..gg.','........'] },
  cat_sewing_0: { name: 'Cat Sewing', palette: { '.': COMMON_BG, o: '#F4A261', d: '#B56A2B', w: '#FFF1D6', e: '#2E2E2E', p: '#E9A7C7' }, grid: ['........','..oooo..','.owwwwo.','.oweewo.','.owwwwo.','..oddo..','..pppp..','........'] },
  cat_sewing_1: { name: 'Cat Sewing', palette: { '.': COMMON_BG, o: '#F4A261', d: '#B56A2B', w: '#FFF1D6', e: '#2E2E2E', p: '#E9A7C7' }, grid: ['........','..oooo..','.owwwwo.','.oweewo.','.owwwwo.','..oddo..','.pp..pp.','........'] },
  dog_general_0: { name: 'Dog General', palette: { '.': COMMON_BG, b: '#C69C6D', d: '#8C6239', w: '#F7E7CE', e: '#2E2E2E' }, grid: ['........','..bbbb..','.bwwwwb.','.bweewb.','.bwwwwb.','..bddb..','.b....b.','........'] },
  dog_general_1: { name: 'Dog General', palette: { '.': COMMON_BG, b: '#C69C6D', d: '#8C6239', w: '#F7E7CE', e: '#2E2E2E' }, grid: ['........','..bbbb..','.bwwwwb.','.bweewb.','.bwwwwb.','..bddb..','...bb...','........'] },
  dog_crafting_0: { name: 'Dog Crafting', palette: { '.': COMMON_BG, b: '#C69C6D', d: '#8C6239', w: '#F7E7CE', e: '#2E2E2E', g: '#6AA84F' }, grid: ['........','..bbbb..','.bwwwwb.','.bweewb.','.bwwwwb.','..bddb..','..gggg..','........'] },
  dog_crafting_1: { name: 'Dog Crafting', palette: { '.': COMMON_BG, b: '#C69C6D', d: '#8C6239', w: '#F7E7CE', e: '#2E2E2E', g: '#6AA84F' }, grid: ['........','..bbbb..','.bwwwwb.','.bweewb.','.bwwwwb.','..bddb..','.gg..gg.','........'] },
  dog_sewing_0: { name: 'Dog Sewing', palette: { '.': COMMON_BG, b: '#C69C6D', d: '#8C6239', w: '#F7E7CE', e: '#2E2E2E', p: '#E9A7C7' }, grid: ['........','..bbbb..','.bwwwwb.','.bweewb.','.bwwwwb.','..bddb..','..pppp..','........'] },
  dog_sewing_1: { name: 'Dog Sewing', palette: { '.': COMMON_BG, b: '#C69C6D', d: '#8C6239', w: '#F7E7CE', e: '#2E2E2E', p: '#E9A7C7' }, grid: ['........','..bbbb..','.bwwwwb.','.bweewb.','.bwwwwb.','..bddb..','.pp..pp.','........'] },
  rabbit_general_0: { name: 'Rabbit General', palette: { '.': COMMON_BG, l: '#E0E0E0', d: '#9E9E9E', w: '#FFFFFF', e: '#2E2E2E' }, grid: ['..l..l..','..l..l..','.lwwwwl.','.lweewl.','.lwwwwl.','..lddl..','.l....l.','........'] },
  rabbit_general_1: { name: 'Rabbit General', palette: { '.': COMMON_BG, l: '#E0E0E0', d: '#9E9E9E', w: '#FFFFFF', e: '#2E2E2E' }, grid: ['..l..l..','..l..l..','.lwwwwl.','.lweewl.','.lwwwwl.','..lddl..','...ll...','........'] },
  rabbit_crafting_0: { name: 'Rabbit Crafting', palette: { '.': COMMON_BG, l: '#E0E0E0', d: '#9E9E9E', w: '#FFFFFF', e: '#2E2E2E', g: '#6AA84F' }, grid: ['..l..l..','..l..l..','.lwwwwl.','.lweewl.','.lwwwwl.','..lddl..','..gggg..','........'] },
  rabbit_crafting_1: { name: 'Rabbit Crafting', palette: { '.': COMMON_BG, l: '#E0E0E0', d: '#9E9E9E', w: '#FFFFFF', e: '#2E2E2E', g: '#6AA84F' }, grid: ['..l..l..','..l..l..','.lwwwwl.','.lweewl.','.lwwwwl.','..lddl..','.gg..gg.','........'] },
  rabbit_sewing_0: { name: 'Rabbit Sewing', palette: { '.': COMMON_BG, l: '#E0E0E0', d: '#9E9E9E', w: '#FFFFFF', e: '#2E2E2E', p: '#E9A7C7' }, grid: ['..l..l..','..l..l..','.lwwwwl.','.lweewl.','.lwwwwl.','..lddl..','..pppp..','........'] },
  rabbit_sewing_1: { name: 'Rabbit Sewing', palette: { '.': COMMON_BG, l: '#E0E0E0', d: '#9E9E9E', w: '#FFFFFF', e: '#2E2E2E', p: '#E9A7C7' }, grid: ['..l..l..','..l..l..','.lwwwwl.','.lweewl.','.lwwwwl.','..lddl..','.pp..pp.','........'] },
  fox_general_0: { name: 'Fox General', palette: { '.': COMMON_BG, o: '#D97706', d: '#92400E', w: '#FDE68A', e: '#2E2E2E' }, grid: ['........','..oooo..','.owwwwo.','.oweewo.','.owwwwo.','..oddo..','.o....o.','........'] },
  fox_general_1: { name: 'Fox General', palette: { '.': COMMON_BG, o: '#D97706', d: '#92400E', w: '#FDE68A', e: '#2E2E2E' }, grid: ['........','..oooo..','.owwwwo.','.oweewo.','.owwwwo.','..oddo..','...oo...','........'] },
  fox_crafting_0: { name: 'Fox Crafting', palette: { '.': COMMON_BG, o: '#D97706', d: '#92400E', w: '#FDE68A', e: '#2E2E2E', g: '#6AA84F' }, grid: ['........','..oooo..','.owwwwo.','.oweewo.','.owwwwo.','..oddo..','..gggg..','........'] },
  fox_crafting_1: { name: 'Fox Crafting', palette: { '.': COMMON_BG, o: '#D97706', d: '#92400E', w: '#FDE68A', e: '#2E2E2E', g: '#6AA84F' }, grid: ['........','..oooo..','.owwwwo.','.oweewo.','.owwwwo.','..oddo..','.gg..gg.','........'] },
  fox_sewing_0: { name: 'Fox Sewing', palette: { '.': COMMON_BG, o: '#D97706', d: '#92400E', w: '#FDE68A', e: '#2E2E2E', p: '#E9A7C7' }, grid: ['........','..oooo..','.owwwwo.','.oweewo.','.owwwwo.','..oddo..','..pppp..','........'] },
  fox_sewing_1: { name: 'Fox Sewing', palette: { '.': COMMON_BG, o: '#D97706', d: '#92400E', w: '#FDE68A', e: '#2E2E2E', p: '#E9A7C7' }, grid: ['........','..oooo..','.owwwwo.','.oweewo.','.owwwwo.','..oddo..','.pp..pp.','........'] },
};
