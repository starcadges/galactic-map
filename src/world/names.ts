import { pick, type Rng } from './rng';

// Naming conventions of the Wheel. Each culture has its own phonology and habits,
// so a name alone hints at who settled a place and when.

export type Culture = 'ossic' | 'hallow' | 'low' | 'tethri' | 'qesh' | 'machine' | 'catalog';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// --- Ossic: liquid, doubled consonants, soft endings -------------------------
const O_ON = ['v', 't', 's', 'm', 'n', 'l', 'r', 'h', 'th', 'c', 'd', 'k', 'ae', 'i', 'a', 'o', 'e'];
const O_MID = ['ss', 'll', 'rr', 'v', 'th', 'n', 'm', 'r', 'l', 'sh', 'nn', 'dd', 'st', 'rv'];
const O_V = ['a', 'e', 'i', 'o', 'a', 'e', 'ai', 'ae', 'ei', 'au', 'ia'];
const O_END = ['el', 'ai', 'ess', 'une', 'ar', 'ane', 'iel', 'oth', 'ra', 'is', 'ade', 'enne', 'ir', 'ath', 'eth', 'ovar', 'arre', 'ine', 'aun', 'elle', 'ion', 'ay', 'ura'];

export function ossic(rng: Rng): string {
  const syl = rng() < 0.45 ? 1 : 2;
  let s = pick(rng, O_ON) + pick(rng, O_V);
  for (let i = 1; i < syl; i++) s += pick(rng, O_MID) + pick(rng, O_V);
  s += pick(rng, O_MID).slice(0, rng() < 0.5 ? 1 : 2) + pick(rng, O_END);
  s = s.replace(/([aeiou])\1\1/g, '$1$1').replace(/([^aeiou])\1\1/g, '$1$1');
  return cap(s.length > 11 ? s.slice(0, 9) + pick(rng, ['el', 'ai', 'is']) : s);
}

// --- Hallowmerine: Ossic roots with the vocabulary of evening -------------
const H_WORDS = ['Evening', 'Vesper', 'Dusk', 'Candle', 'Hymn', 'Lamp', 'Tallow', 'Ember', 'Mourning', 'Houses'];
export function hallow(rng: Rng): string {
  const r = rng();
  if (r < 0.45) return ossic(rng);
  if (r < 0.75) return `${ossic(rng)} ${pick(rng, H_WORDS)}`;
  if (r < 0.9) return `Seat of ${ossic(rng)}`;
  return `${pick(rng, ['Last', 'Low', 'Long', 'Quiet', 'Late'])} ${pick(rng, H_WORDS)}`;
}

// --- The Low Tongues: plain compounds, possessives, numbers ---------------
const L_A = [
  'Salt', 'Brass', 'Tallow', 'Lantern', 'Copper', 'Rope', 'Harbour', 'Mercy', 'Tin', 'Wick', 'Coin', 'Gull', 'Cask', 'Keel',
  'Rust', 'Tide', 'Low', 'Far', 'Quiet', 'Old', 'Long', 'Cold', 'Bright', 'Pitch', 'Tar', 'Hook', 'Anchor', 'Ledger',
  'Penny', 'Barrow', 'Candle', 'Tally', 'Hollow', 'Thimble', 'Bitter', 'Silver', 'Ash', 'Slate', 'Chalk', 'Flint', 'Kettle',
  'Lamp', 'Hearth', 'Winter', 'Burden', 'Glean', 'Oar', 'Weir', 'Mill', 'Cinder', 'Brine', 'Whet',
];
const L_B = [
  'whistle', 'gate', 'hold', 'fall', 'reach', 'mark', 'ward', 'well', 'water', 'haven', 'cross', 'rest', 'stair', 'market',
  'end', 'moor', 'bank', 'sound', 'ferry', 'yard', 'light', 'knot', 'sill', 'drift', 'post', 'hythe', 'wick', 'mouth',
  'combe', 'tally', 'weigh', 'lock', 'stead', 'burn', 'ley', 'field',
];
const L_PERSON = ['Marrow', 'Hask', 'Dunne', 'Orly', 'Tamsin', 'Bryce', 'Odd', 'Wim', 'Jory', 'Ansel', 'Maud', 'Petra', 'Colm', 'Idris', 'Ness', 'Bartle', 'Fen', 'Greer'];
const L_THING = ['Patience', 'Folly', 'Rest', 'Luck', 'Reach', 'Landing', 'Fancy', 'Hope', 'Wager', 'Mistake', 'Bargain', 'Due'];
const L_NUM = ['Two', 'Three', 'Four', 'Five', 'Seven', 'Nine', 'Eleven', 'Twelve'];
const L_PL = ['Lamps', 'Wells', 'Hooks', 'Bells', 'Sisters', 'Kettles', 'Coins', 'Oaks', 'Gates', 'Stones'];
const L_ORD = ['Second', 'Third', 'Last', 'Little', 'Upper', 'Nether', 'Far', 'New', 'Old'];

export function lowTongue(rng: Rng): string {
  const r = rng();
  if (r < 0.58) return pick(rng, L_A) + pick(rng, L_B);
  if (r < 0.72) return `${pick(rng, L_PERSON)}’s ${pick(rng, L_THING)}`;
  if (r < 0.84) return `${pick(rng, L_NUM)} ${pick(rng, L_PL)}`;
  return `${pick(rng, L_ORD)} ${pick(rng, L_A)}${rng() < 0.5 ? pick(rng, L_B) : ''}`;
}

// --- Tethri: open syllables, geminates, paired words ----------------------
const T_C = ['k', 't', 'm', 'b', 's', 'r', 'n', 'ng', 'd', 'h', 'v', 'l', 'mb', 'nd'];
const T_G = ['kk', 'tt', 'rr', 'ss', 'mm', 'bb', 'll', 'nn', 'dd'];
const T_V = ['a', 'e', 'i', 'o', 'u', 'o', 'a'];
const T_E = ['o', 'e', 'a', 'o', 'e'];
function tethriWord(rng: Rng): string {
  let s = pick(rng, T_C) + pick(rng, T_V);
  s += rng() < 0.6 ? pick(rng, T_G) : pick(rng, T_C);
  if (rng() < 0.35) s += pick(rng, T_V) + pick(rng, T_C);
  s += pick(rng, T_E);
  return cap(s);
}
export function tethri(rng: Rng): string {
  return rng() < 0.45 ? `${tethriWord(rng)} ${tethriWord(rng)}` : tethriWord(rng);
}

// --- Qesh: hard clusters, back vowels ---------------------------------------
const Q_ON = ['Q', 'Qh', 'Kh', 'Tz', 'Zh', 'Vr', 'Dh', 'Kr', 'Gh', 'Tr', 'Sk'];
const Q_V = ['a', 'u', 'o', 'a', 'ae'];
const Q_C = ['rr', 'kh', 'z', 'tz', 'rk', 'sk', 'q', 'hr', 'dh', 'mm', 'n', 'r', 't'];
export function qesh(rng: Rng): string {
  let s = pick(rng, Q_ON) + pick(rng, Q_V) + pick(rng, Q_C);
  if (rng() < 0.55) s += pick(rng, Q_V) + pick(rng, Q_C);
  if (rng() < 0.2) s += '-' + cap(pick(rng, ['ammun', 'harr', 'dhep', 'ukh', 'tzar', 'orr']));
  return s;
}

// --- Ninefold: numbers and virtues ------------------------------------------
const M_ORD = ['First', 'Second', 'Third', 'Fifth', 'Seventh', 'Ninth', 'Eleventh', 'Last', 'Twelfth', 'Forty-First'];
const M_NOUN = ['Reconciliation', 'Arithmetic', 'Sum', 'Cadence', 'Remainder', 'Tally', 'Proof', 'Index', 'Measure', 'Quotient', 'Register', 'Verse', 'Interval', 'Axiom'];
const M_ADJ = ['Patient', 'Quiet', 'Careful', 'Gentle', 'Late', 'Even', 'Unhurried', 'Low', 'Kind', 'Partial'];
export function machine(rng: Rng): string {
  const r = rng();
  if (r < 0.4) return `${pick(rng, M_ORD)} ${pick(rng, M_NOUN)}`;
  if (r < 0.8) return `The ${pick(rng, M_ADJ)} ${pick(rng, M_NOUN)}`;
  return `Instance ${Math.floor(rng() * 9000 + 1000)}`;
}

const PREFIX: Record<string, string> = {
  plenary: 'PL',
  hallowmere: 'HH',
  leagues: 'LL',
  tethri: 'TM',
  ninefold: 'NF',
  qesh: 'STQ',
  freeholds: 'FH',
  pell: 'PC',
  exclusion: 'EXC',
  none: 'UC',
};

export function designation(faction: string, rng: Rng): string {
  const p = PREFIX[faction] ?? 'UC';
  return `${p}-${Math.floor(rng() * 8999 + 1000)}`;
}

export function nameFor(culture: Culture, rng: Rng): string {
  switch (culture) {
    case 'ossic':
      return ossic(rng);
    case 'hallow':
      return hallow(rng);
    case 'low':
      return lowTongue(rng);
    case 'tethri':
      return tethri(rng);
    case 'qesh':
      return qesh(rng);
    case 'machine':
      return machine(rng);
    default:
      return ossic(rng);
  }
}

export function cultureForFaction(f: string, rng: Rng): Culture {
  switch (f) {
    case 'plenary':
      return rng() < 0.55 ? 'ossic' : 'low';
    case 'hallowmere':
      return 'hallow';
    case 'leagues':
      return rng() < 0.85 ? 'low' : 'ossic';
    case 'tethri':
      return rng() < 0.85 ? 'tethri' : 'low';
    case 'ninefold':
      return 'machine';
    case 'qesh':
    case 'pell':
      return 'qesh';
    default:
      return rng() < 0.5 ? 'low' : 'ossic';
  }
}

export const CULTURE_LABEL: Record<Culture, string> = {
  ossic: 'Ossic',
  hallow: 'Hallowmerine Ossic',
  low: 'Low Tongue',
  tethri: 'Tethri',
  qesh: 'Qesh',
  machine: 'Ninefold formal',
  catalog: 'Register only',
};
