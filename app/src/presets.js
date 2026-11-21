// presets.js — title presets, post sizes, font pickers. The defaults are the
// poster's own words, not a game's: invented titles, invented people,
// invented places.
export const TITLE_PRESETS = [
  { title: 'VICE HEAT', subtitle: 'a Leonida story', tagline: 'ONE LAST JOB IN LEONIDA', quote: 'The definitive Vice City poster', source: 'Vice Daily' },
  { title: 'SUNSET HEIST', subtitle: 'one last job in Leonida', tagline: 'EVERY SUNSET HAS A PRICE', quote: 'Steals the whole sunset', source: 'Neon Coast Mag' },
  { title: 'NEON HARBOR', subtitle: 'where the tide brings trouble', tagline: 'THE TIDE BRINGS TROUBLE', quote: 'Glows like the boulevard at 2am', source: 'Palm Weekly' },
  { title: 'PALM ROYALE', subtitle: 'every crown has a price', tagline: 'EVERY CROWN HAS A PRICE', quote: 'Pure Vice City, frame after frame', source: 'The Leonida Post' },
  { title: 'GOLDEN MILE', subtitle: 'drive it like you stole it', tagline: 'DRIVE IT LIKE YOU STOLE IT', quote: 'The cover your feed has been waiting for', source: 'Sunset State' },
];

export const SIZES = [
  { id: '1920x1080', label: '1920 × 1080 · landscape', w: 1920, h: 1080 },
  { id: '1080x1350', label: '1080 × 1350 · portrait', w: 1080, h: 1350 },
  { id: '1080x1080', label: '1080 × 1080 · square', w: 1080, h: 1080 },
];

export function sizeById(id) {
  return SIZES.find((s) => s.id === id) ?? SIZES[0];
}

export const TITLE_FONTS = [
  { id: 'Anton', label: 'Anton — heavy chrome' },
  { id: 'Bebas Neue', label: 'Bebas Neue — tall caps' },
];

export const SCRIPT_FONTS = [
  { id: 'Pacifico', label: 'Pacifico — neon script' },
  { id: 'Sacramento', label: 'Sacramento — fine script' },
];

export const EDITION_TAG = 'FIRST EDITION';
export const RELEASE_LINE = 'COMING 2026  •  LEONIDA  •  VICE HEAT PICTURES';
export const BILLING_LINE =
  'VICE HEAT PICTURES presents LUCIA REYES  MARCUS COLE  ROSA DEL MAR  music by THE PALM KINGS  a LEONIDA story';
