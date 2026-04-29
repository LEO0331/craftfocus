export type AsciiSpecies = 'cat' | 'dog' | 'rabbit' | 'fox';
export type AsciiActivity = 'sewing' | 'training';

const CAT_SEWING = [
  String.raw` /\_/\ 
(=^.^=)✂
 /|_|\\ `,
  String.raw` /\_/\ 
(=^o^=)🧵
 /|_|\\ `,
  String.raw` /\_/\ 
(=^.^=)✂
 /|_|\\ `,
];

const CAT_TRAINING = [
  String.raw` /\_/\ 
(=^.^=)🏃
 /|_|\\ `,
  String.raw` /\_/\ 
(=^o^=)💪
 /|_|\\ `,
  String.raw` /\_/\ 
(=^.^=)🏃
 /|_|\\ `,
];

const DOG_SEWING = [
  String.raw` / \__
(•ᴥ• )✂
 /|_|\\ `,
  String.raw` / \__
(•ᴥ• )🧵
 /|_|\\ `,
  String.raw` / \__
(•ᴥ• )✂
 /|_|\\ `,
];

const DOG_TRAINING = [
  String.raw` / \__
(•ᴥ• )🏋
 /|_|\\ `,
  String.raw` / \__
(•ᴥ• )💪
 /|_|\\ `,
  String.raw` / \__
(•ᴥ• )🏋
 /|_|\\ `,
];

const RABBIT_SEWING = [
  String.raw` (\_/)
(•.• )🪡
 /|_|\\ `,
  String.raw` (\_/)
(•.• )🧵
 /|_|\\ `,
  String.raw` (\_/)
(•.• )🪡
 /|_|\\ `,
];

const RABBIT_TRAINING = [
  String.raw` (\_/)
(•.• )🏃
 /|_|\\ `,
  String.raw` (\_/)
(•.• )💪
 /|_|\\ `,
  String.raw` (\_/)
(•.• )🏃
 /|_|\\ `,
];

const FOX_SEWING = [
  String.raw` /\__/\
(•ㅅ• )✂
 /|_|\\ `,
  String.raw` /\__/\
(•ㅅ• )🧵
 /|_|\\ `,
  String.raw` /\__/\
(•ㅅ• )✂
 /|_|\\ `,
];

const FOX_TRAINING = [
  String.raw` /\__/\
(•ㅅ• )🏋
 /|_|\\ `,
  String.raw` /\__/\
(•ㅅ• )💪
 /|_|\\ `,
  String.raw` /\__/\
(•ㅅ• )🏋
 /|_|\\ `,
];

const ASCII_FRAMES: Record<AsciiSpecies, Record<AsciiActivity, string[]>> = {
  cat: { sewing: CAT_SEWING, training: CAT_TRAINING },
  dog: { sewing: DOG_SEWING, training: DOG_TRAINING },
  rabbit: { sewing: RABBIT_SEWING, training: RABBIT_TRAINING },
  fox: { sewing: FOX_SEWING, training: FOX_TRAINING },
};

const ASCII_BADGE: Record<AsciiSpecies, string> = {
  cat: '(^•ω•^)',
  dog: '(•ᴥ•)',
  rabbit: '(\\_/)',
  fox: '(•ㅅ•)',
};

export function resolveAsciiAnimalFrame(species: string, activity: AsciiActivity, frame: number): string {
  const safeSpecies = (species in ASCII_FRAMES ? species : 'cat') as AsciiSpecies;
  const frames = ASCII_FRAMES[safeSpecies][activity];
  return frames[Math.abs(frame) % frames.length] ?? ASCII_FRAMES.cat.sewing[0];
}

export function resolveAsciiAnimalBadge(species: string): string {
  const safeSpecies = (species in ASCII_BADGE ? species : 'cat') as AsciiSpecies;
  return ASCII_BADGE[safeSpecies];
}

