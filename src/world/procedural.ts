import type { FactionId, PlanetDef, PlanetType, StarKind, SystemDef, Vec3 } from './types';
import { GALAXY, armStrength, ringStrength, sampleDensity, smooth, spectralClass, warpY, polarPoint } from './galaxyModel';
import { gauss, hash3, hashString, mulberry32, pick, range, weighted, type Rng } from './rng';
import { factionAt } from './territory';
import { CULTURE_LABEL, cultureForFaction, designation, nameFor, type Culture } from './names';
import { ELISION_CENTER } from './routes';
import { ERAS, fmtYear } from './history';
import { star } from './landmarks/helpers';

// The secondary layer: thousands of charted systems with generated identities,
// and the infinite register of catalogue stars beneath them.

export type SysType =
  | 'agri'
  | 'mining'
  | 'habitats'
  | 'relay'
  | 'research'
  | 'garden'
  | 'industry'
  | 'junction'
  | 'empty'
  | 'ruin'
  | 'depot'
  | 'retreat'
  | 'picket'
  | 'resort'
  | 'freehold'
  | 'waystation'
  | 'veteran'
  | 'faded';

export const TYPE_LABEL: Record<SysType, string> = {
  agri: 'Agricultural world',
  mining: 'Mining system',
  habitats: 'Habitat cluster',
  relay: 'Relay station',
  research: 'Research post',
  garden: 'Garden world',
  industry: 'Industrial system',
  junction: 'Junction town',
  empty: 'Charted · uninhabited',
  ruin: 'Ruin',
  depot: 'Refuelling depot',
  retreat: 'Monastic retreat',
  picket: 'Naval picket',
  resort: 'Resort system',
  freehold: 'Freehold',
  waystation: 'Pilgrim waystation',
  veteran: 'Tethri veteran settlement',
  faded: 'Sail Age colony (faded)',
};

export interface ChartedSystem {
  id: string;
  name: string;
  designation: string;
  culture: Culture;
  faction: FactionId;
  pos: Vec3;
  starKind: StarKind;
  temp: number;
  type: SysType;
  population: number;
  settled: number | null;
  summary: string;
  detail: string;
  seed: number;
}

// ---------------------------------------------------------------------------
// Text pools. Kept deliberately specific; generic phrasing is the enemy.

const CROPS = ['grain', 'kelp', 'fruit-tree', 'protein-moss', 'rice', 'tuber', 'orchard', 'vine', 'fungal', 'reed-sugar', 'pulse'];
const ORES = ['iridium seams', 'ice moons', 'carbon asteroids', 'metal-rich belt', 'volatile comets', 'deep crust', 'ring-ice', 'helium-3 atmosphere'];
const PRODUCTS = ['anchor ceramics', 'hull plate', 'tug engines', 'habitat shells', 'optical glass', 'reactor cores', 'rope-fibre', 'sensor lattices', 'fine instruments'];
const FIELDS = ['stellar seismology', 'thread-fray', 'xenobotany', 'deep-time climate', 'gravitational', 'linguistic', 'magnetosphere', 'comet-chemistry', 'Vey-script'];
const INSTITUTIONS = ['Collegium of Lanternfall', 'Office of the Reckoning', 'Hollow Scale consortium', 'Colloquy of Senn', 'Ninefold', 'Patience Office', 'Tethri Moot'];
const ORDERS = ['Order of the Still Hour', 'Hushers of the Deep Light', 'Candle Brethren', 'Keepers of the Crossing Road', 'Quiet Society', 'Listeners of the Long Choir', 'Order of the Opened Hand'];
const ATTRACTIONS = ['ring-sunsets', 'hot springs under a gas giant', 'aurora season', 'glass beaches', 'floating gardens', 'zero-gravity opera', 'eclipse festival', 'warm seas'];
const PILGRIM = ['Ossaran', 'Kettle Point', 'Iridane', 'Vantreth', 'Seren', 'the Crossing Road', 'Orrhune’s boundary'];

const QUIRKS = [
  'Local law forbids whistling on the day side.',
  'The only moon is privately owned by a choir.',
  'Known for a blue beer that tastes faintly of iron.',
  'Has held the same chess match open since 27,114 SR.',
  'Its sun has a dim companion the locals call the Lodger.',
  'Every child plants a tree on their ninth birthday; the forests are laid out by year.',
  'Residents vote by leaving stones on the steps of the assembly hall.',
  'Once briefly famous for a trial about a stolen comet.',
  'The harbour master has been the same Ninefold instance for 4,000 years.',
  'Clocks here are set eleven minutes fast by long tradition. No one remembers why.',
  'Home to the largest flock of vacuum-kites in the Weft.',
  'Its founding charter was signed on the back of a shipping manifest.',
  'The whole population turns out to watch the yearly thread inspection.',
  'Local cuisine is dominated by a single, very adaptable mushroom.',
  'Has declared independence four times, each time by accident.',
  'Famous for its bells, which are rung whenever a ship leaves.',
  'Every house has a lamp in the window facing the nearest thread anchor.',
  'Speaks a dialect nobody else can follow after the second drink.',
  'Keeps an old sail-ark as a municipal library.',
  'Its archive holds the only surviving copy of a Dim-era cookbook.',
  'Holds a festival every time its two moons align, about every nine years.',
  'The weather service is a hereditary office.',
  'Once hosted a Plenary session by mistake.',
  'Built entirely by a single family, who still own the roads.',
  'Its gas giant is said to sing on certain nights. It does not.',
  'Carefully preserves a ruined Qesh listening post as a garden.',
  'Its three towns have been feuding over a boundary stone for 2,000 years.',
  'Children learn to pilot before they learn to swim.',
  'Imports all of its salt, and is touchy about it.',
  'The planet’s rings were added deliberately, for the view.',
  'A Tethri elder has lived here quietly for 700 years; everybody asks her advice.',
  'Has a museum devoted entirely to failed inventions.',
  'The local calendar starts from a flood.',
  'Exports tuned crystals used in Tamber relay housings.',
  'Its famous orchards are 11,000 years old and still fruiting.',
  'Known for extravagant funerals and very modest weddings.',
];

const RUIN_FATES = [
  'abandoned when its thread frayed during the Dim',
  'emptied by a plague in the Separate Lamps era',
  'bombarded during the War of Cut Threads',
  'left behind when its star began to flare',
  'deserted for reasons no surviving record gives',
  'evacuated after a failed terraforming attempt',
  'stripped by salvagers after a financial collapse',
];

const EMPTY_DESC = [
  'a cold red dwarf and a scatter of ice',
  'no rocky worlds worth a landing',
  'a young star still clearing its debris',
  'surveyed once in 26,000 SR and never revisited',
  'a quiet binary with a thin asteroid belt',
  'two gas giants and a great deal of silence',
  'a lone planet with an atmosphere of neon',
  'flare activity too high for settlement',
];

function eraName(y: number): string {
  for (const e of ERAS) if (y >= e.start && y < e.end) return e.name.replace(/^The /, '');
  return 'Long Afternoon';
}

function fmtPop(n: number): string {
  if (n <= 0) return 'Uninhabited';
  if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)} billion`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)} million`;
  if (n >= 1e3) return (Math.round(n / 100) * 100).toLocaleString('en-US');
  return String(Math.round(n));
}
export { fmtPop };

function typeFor(rng: Rng, faction: FactionId, youth: number, r: number): SysType {
  if (faction === 'none' || faction === 'freeholds') {
    return weighted(rng, [
      ['empty', 7],
      ['freehold', 2.2],
      ['ruin', 1.4],
      ['mining', 1],
      ['depot', 0.7],
      ['retreat', 0.6],
      ['research', 0.6],
    ] as const);
  }
  if (faction === 'qesh') {
    return weighted(rng, [
      ['industry', 3],
      ['mining', 2],
      ['habitats', 1.5],
      ['empty', 1],
      ['ruin', 1],
      ['picket', 0.8],
    ] as const);
  }
  if (faction === 'ninefold') {
    return weighted(rng, [
      ['habitats', 2],
      ['research', 2],
      ['relay', 2],
      ['empty', 1],
    ] as const);
  }
  const items: [SysType, number][] = [
    ['agri', 2.2],
    ['mining', 1.6 + youth],
    ['habitats', 1.8],
    ['relay', 0.8],
    ['research', 0.9],
    ['garden', 1.1],
    ['industry', 1.2],
    ['junction', 0.9],
    ['empty', 2.2],
    ['depot', 0.8],
    ['retreat', 0.4],
    ['picket', faction === 'hallowmere' ? 1 : 0.35],
    ['resort', 0.5],
    ['waystation', 0.3],
    ['ruin', r < 30_000 ? 0.4 : 0.6],
  ];
  return weighted(rng, items);
}

function popFor(rng: Rng, t: SysType): number {
  const lg = (a: number, b: number) => Math.exp(range(rng, Math.log(a), Math.log(b)));
  switch (t) {
    case 'agri':
      return lg(2e6, 9e9);
    case 'mining':
      return lg(4e3, 4e7);
    case 'habitats':
      return lg(5e6, 8e10);
    case 'relay':
      return lg(200, 3e5);
    case 'research':
      return lg(300, 2e6);
    case 'garden':
      return lg(1e8, 2e10);
    case 'industry':
      return lg(5e7, 5e10);
    case 'junction':
      return lg(1e6, 4e9);
    case 'depot':
      return lg(300, 4e5);
    case 'retreat':
      return lg(40, 2e5);
    case 'picket':
      return lg(2e3, 3e6);
    case 'resort':
      return lg(1e5, 5e8);
    case 'freehold':
      return lg(80, 5e7);
    case 'waystation':
      return lg(500, 4e6);
    case 'veteran':
      return lg(1e5, 4e8);
    case 'faded':
      return lg(1e4, 3e7);
    default:
      return 0;
  }
}

function settledFor(rng: Rng, faction: FactionId, t: SysType): number | null {
  if (t === 'empty') return null;
  if (t === 'veteran') return Math.round(range(rng, 15_903, 16_400));
  if (t === 'faded') return Math.round(range(rng, 300, 3_000));
  if (faction === 'tethri') return Math.round(range(rng, 8_600, 31_000));
  if (faction === 'qesh') return Math.round(range(rng, 9_000, 14_000));
  if (faction === 'hallowmere') return Math.round(range(rng, 9_100, 29_000));
  return Math.round(Math.pow(rng(), 0.7) * 22_000 + 8_000 + (rng() < 0.2 ? 6_000 : 0));
}

function summaryFor(rng: Rng, c: Omit<ChartedSystem, 'summary' | 'detail'>): { summary: string; detail: string } {
  const n = c.name;
  const cls = spectralClass(c.temp);
  let s = '';
  switch (c.type) {
    case 'agri':
      s = `${n} is a farming world whose ${pick(rng, CROPS)} harvests feed ${Math.floor(range(rng, 3, 40))} neighbouring systems.`;
      break;
    case 'mining':
      s = `A mining system working the ${pick(rng, ORES)} around its ${cls}-class star.`;
      break;
    case 'habitats':
      s = `A cluster of ${Math.floor(range(rng, 12, 4000)).toLocaleString('en-US')} habitats in orbit around a ${cls}-class star; no planet was ever settled.`;
      break;
    case 'relay':
      s = `A relay station keeping ${Math.floor(range(rng, 6, 300))} message anchors for traffic passing to and from the nearest trunk.`;
      break;
    case 'research':
      s = `A ${pick(rng, FIELDS)} research post operated under charter from the ${pick(rng, INSTITUTIONS)}.`;
      break;
    case 'garden':
      s = `A temperate world of ${pick(rng, ['long coasts and river deltas', 'high plateaus and cold lakes', 'shallow warm seas', 'forest and fog', 'grassland under a pale sky'])}, settled early and never crowded.`;
      break;
    case 'industry':
      s = `An industrial system producing ${pick(rng, PRODUCTS)} for the Weft.`;
      break;
    case 'junction':
      s = `A junction town where ${Math.floor(range(rng, 3, 14))} regional threads meet; most of its people work in transit or feed those who do.`;
      break;
    case 'empty':
      s = `Charted, uninhabited: ${pick(rng, EMPTY_DESC)}.`;
      break;
    case 'ruin':
      s = `The ruins of a settlement from the ${eraName(c.settled ?? 12_000)}, ${pick(rng, RUIN_FATES)}.`;
      break;
    case 'depot':
      s = `A refuelling and repair depot for ships working the nearby threads.`;
      break;
    case 'retreat':
      s = `A retreat of the ${pick(rng, ORDERS)}, who value the distance.`;
      break;
    case 'picket':
      s = `A naval picket post of the ${c.faction === 'hallowmere' ? 'House fleets' : c.faction === 'qesh' ? 'Accord supervision force' : 'Plenary Navy'}.`;
      break;
    case 'resort':
      s = `A resort system known across the region for its ${pick(rng, ATTRACTIONS)}.`;
      break;
    case 'freehold':
      s = `An independent freehold that answers to no polity and prefers it that way.`;
      break;
    case 'waystation':
      s = `A waystation for pilgrims bound for ${pick(rng, PILGRIM)}.`;
      break;
    case 'veteran':
      s = `Settled by veterans of the Tethri relief fleet after the Siege of Vantreth, far from the southern arm, along the Long Way.`;
      break;
    case 'faded':
      s = `One of the first colonies of the Sail Age, reached by beamed sail from Oldport. It mattered enormously for two thousand years and has not mattered much since.`;
      break;
  }
  const bits: string[] = [];
  if (c.settled !== null && c.type !== 'veteran' && c.type !== 'faded') {
    bits.push(`Settled ${fmtYear(c.settled)}, in the ${eraName(c.settled)}.`);
  }
  if (rng() < 0.55) bits.push(pick(rng, QUIRKS));
  bits.push(`Named in ${CULTURE_LABEL[c.culture]}.`);
  return { summary: s, detail: bits.join(' ') };
}

// ---------------------------------------------------------------------------

function samplePosition(rng: Rng): Vec3 | null {
  const mode = rng();
  if (mode < 0.08) {
    // bulge
    const r = Math.abs(gauss(rng)) * 5_000 + 1_800;
    const th = rng() * Math.PI * 2;
    return [Math.cos(th) * r * 1.2, gauss(rng) * 900, Math.sin(th) * r];
  }
  const r = -GALAXY.diskScaleLength * Math.log(rng() * rng() + 1e-12) * 1.1;
  if (r > 98_000 || r < 2_500) return null;
  const th = rng() * Math.PI * 2;
  const x = Math.cos(th) * r;
  const z = Math.sin(th) * r;
  const p = (0.35 + armStrength(r, th) * 0.8 + ringStrength(x, z)) / 2.2;
  if (rng() > p) return null;
  const y = gauss(rng) * (r > 60_000 ? 700 : 350) + warpY(r, th);
  return [x, y, z];
}

export function generateCharted(avoid: Vec3[], reservedNames: string[] = []): ChartedSystem[] {
  const rng = mulberry32(0xc4a27ed);
  const out: ChartedSystem[] = [];
  const usedNames = new Set<string>();
  const RESERVED = new Set(reservedNames);
  const grid = new Set<string>();
  const cellOf = (p: Vec3) => `${Math.floor(p[0] / 60)},${Math.floor(p[1] / 60)},${Math.floor(p[2] / 60)}`;
  for (const a of avoid) grid.add(cellOf(a));

  const tryAdd = (p: Vec3, forceType?: SysType, forceCulture?: Culture, forceFaction?: FactionId) => {
    const key = cellOf(p);
    if (grid.has(key)) return false;
    // the Elision: nothing is charted there
    if (Math.hypot(p[0] - ELISION_CENTER[0], p[2] - ELISION_CENTER[2]) < 6_500) return false;
    if (Math.hypot(p[0], p[1], p[2]) < 1_600) return false; // Exclusion & junction clutter
    const fa = forceFaction ?? factionAt(p[0], p[2]).faction;
    const r = Math.hypot(p[0], p[2]);
    const seed = hash3(Math.round(p[0]), Math.round(p[1]), Math.round(p[2]), 77);
    const lr = mulberry32(seed);
    const dens = sampleDensity(p[0], p[1], p[2]);
    if (!forceType && fa === 'none' && lr() > 0.4) return false;
    const type = forceType ?? typeFor(lr, fa, dens.youth, r);
    const culture = forceCulture ?? (fa === 'none' || fa === 'freeholds' ? (lr() < 0.6 ? 'low' : 'ossic') : cultureForFaction(fa, lr));
    const kind: StarKind = weighted(lr, [
      ['M', 40],
      ['K', 26],
      ['G', 16],
      ['F', 8],
      ['A', 4],
      ['WD', 3],
      ['B', dens.youth > 0.3 ? 3 : 0.5],
      ['RG', 1.5],
    ] as const);
    const temp = kind === 'WD' ? range(lr, 6_000, 20_000) : kind === 'RG' ? range(lr, 3_300, 4_500) : star(kind).temp * range(lr, 0.9, 1.1);
    const settled = settledFor(lr, fa, type);
    let name = nameFor(culture, lr);
    for (let k = 0; k < 8 && (usedNames.has(name) || RESERVED.has(name)); k++) name = nameFor(culture, lr);
    if (usedNames.has(name) || RESERVED.has(name)) name = `${name} ${['Minor', 'Beyond', 'Second', 'Far'][Math.floor(lr() * 4)]}`;
    usedNames.add(name);
    const base = {
      id: `cs-${out.length}`,
      name,
      designation: designation(fa, lr),
      culture,
      faction: fa,
      pos: p,
      starKind: kind,
      temp,
      type,
      population: popFor(lr, type),
      settled,
      seed,
    };
    const txt = summaryFor(lr, base);
    out.push({ ...base, ...txt });
    grid.add(key);
    return true;
  };

  // Special populations first, so geography carries history.
  // 1. The Long Way: Tethri veterans settled far from home.
  const lw: [number, number][] = [
    [292, 58_000],
    [307, 60_000],
    [322, 62_000],
    [336, 62_800],
    [350, 63_000],
    [3, 62_800],
    [15, 62_000],
    [30, 57_000],
    [45, 52_000],
  ];
  for (let i = 0; i < 26; i++) {
    const a = lw[i % lw.length];
    const b = lw[Math.min(lw.length - 1, (i % lw.length) + 1)];
    const t = rng();
    const deg = a[0] + ((((b[0] - a[0] + 540) % 360) - 180) * t);
    const r = a[1] + (b[1] - a[1]) * t + gauss(rng) * 1_200;
    const p = polarPoint(deg, r, gauss(rng) * 300);
    tryAdd(p, rng() < 0.8 ? 'veteran' : 'waystation', 'tethri', 'tethri');
  }
  // 2. Sail Age colonies around the Hearthward.
  for (let i = 0; i < 18; i++) {
    const p = polarPoint(348 + gauss(rng) * 3.5, 22_000 + gauss(rng) * 1_100, gauss(rng) * 400);
    tryAdd(p, 'faded', 'ossic');
  }
  // 3. Ruins of the war in the Graveyard Reach.
  for (let i = 0; i < 40; i++) {
    const p = polarPoint(128 + gauss(rng) * 16, 21_000 + gauss(rng) * 6_000, gauss(rng) * 300);
    tryAdd(p, 'ruin');
  }
  // 4. The main disk.
  let guard = 0;
  while (out.length < 2_600 && guard++ < 60_000) {
    const p = samplePosition(rng);
    if (p) tryAdd(p);
  }
  // 5. A thin scatter in the satellites and halo.
  for (let i = 0; i < 22; i++) {
    const c = GALAXY.pell;
    tryAdd([c[0] + gauss(rng) * 2_200, c[1] + gauss(rng) * 1_800, c[2] + gauss(rng) * 2_200], undefined, 'qesh', 'pell');
  }
  for (let i = 0; i < 10; i++) {
    const c = GALAXY.paleCompanion;
    tryAdd([c[0] + gauss(rng) * 7_000, c[1] + gauss(rng) * 5_000, c[2] + gauss(rng) * 7_000], rng() < 0.5 ? 'research' : 'empty', 'ossic', 'none');
  }
  return out;
}

// ---------------------------------------------------------------------------
// Procedural star systems: used for charted systems and any catalogue star.

const TEMPERATE: PlanetType[] = ['terran', 'ocean', 'desert', 'garden', 'toxic', 'ice'];

export function proceduralSystem(seed: number, kind: StarKind, temp: number, inhabited: boolean, type?: SysType): SystemDef {
  const rng = mulberry32(seed ^ 0x51e7);
  const st = star(kind, { temp });
  const planets: PlanetDef[] = [];
  const count = kind === 'WD' ? Math.floor(rng() * 3) : Math.floor(range(rng, 0, kind === 'M' ? 5 : 8));
  const hzLo = 0.2 * Math.sqrt(temp / 5_700);
  const hzHi = 0.45 * Math.sqrt(temp / 5_700);
  let orbit = range(rng, 0.1, 0.18);
  let settledWorld = -1;
  for (let i = 0; i < count; i++) {
    let t: PlanetType;
    if (orbit < hzLo * 0.8) t = pick(rng, ['lava', 'barren', 'desert'] as PlanetType[]);
    else if (orbit < hzHi) t = pick(rng, TEMPERATE);
    else if (orbit < hzHi * 2.2) t = pick(rng, ['gas', 'gas', 'icegiant', 'barren', 'ice'] as PlanetType[]);
    else t = pick(rng, ['icegiant', 'ice', 'gas', 'barren'] as PlanetType[]);
    if (type === 'ruin' && i === 1) t = 'barren';
    const p: PlanetDef = {
      name: '',
      type: t,
      radius: 0,
      orbit,
      period: 60 * Math.pow(orbit / 0.2, 1.5) * range(rng, 0.9, 1.2),
      phase: rng() * Math.PI * 2,
      incl: gauss(rng) * 0.04,
      seed: Math.floor(rng() * 1e6),
    };
    const base: Record<string, number> = { gas: 0.024, icegiant: 0.017, terran: 0.009, ocean: 0.0095, garden: 0.009, desert: 0.0085, toxic: 0.009, ice: 0.0075, lava: 0.0075, barren: 0.006 };
    p.radius = (base[t] ?? 0.008) * range(rng, 0.75, 1.2);
    if ((t === 'gas' || t === 'icegiant') && rng() < 0.3) {
      p.ring = { inner: p.radius * 1.35, outer: p.radius * range(rng, 1.8, 2.4), color: pick(rng, ['#c2b096', '#a8b4bc', '#b8a080']), style: 'dust', tilt: gauss(rng) * 0.3 };
    }
    if ((t === 'gas' || t === 'icegiant') && rng() < 0.6) {
      const mc = 1 + Math.floor(rng() * 3);
      p.moons = [];
      for (let m = 0; m < mc; m++) {
        p.moons.push({ name: '', type: pick(rng, ['barren', 'ice', 'barren'] as PlanetType[]), radius: 0.0022 + rng() * 0.0015, orbit: p.radius * (1.9 + m * 0.9 + rng() * 0.3), period: 20 + m * 15 + rng() * 10, phase: rng() * 6.28 });
      }
    }
    if (inhabited && settledWorld < 0 && (TEMPERATE.includes(t) || (i === count - 1 && rng() < 0.6))) {
      settledWorld = i;
      p.lights = range(rng, 0.25, 0.8);
      if (t === 'toxic' || t === 'ice') p.lights *= 0.5;
    }
    planets.push(p);
    orbit *= range(rng, 1.45, 1.85);
    if (orbit > 1.4) break;
  }
  const structures: SystemDef['structures'] = [];
  if (rng() < 0.35) structures.push({ kind: 'belt', count: 500 + Math.floor(rng() * 900), radius: orbit * 0.8, spread: 0.04 + rng() * 0.05, color: '#8f857a' });
  if (inhabited) {
    if (type === 'habitats') structures.push({ kind: 'habitats', count: 200 + Math.floor(rng() * 900), radius: range(rng, 0.25, 0.6), spread: 0.06, color: '#f0dcb8' });
    if (type === 'mining') structures.push({ kind: 'stations', count: 30, radius: orbit * 0.8, spread: 0.1, color: '#ffc58a' });
    if (type === 'relay') structures.push({ kind: 'relays', count: 24, radius: 0.3 });
    if (type === 'industry') structures.push({ kind: 'stations', count: 50, radius: 0.35, spread: 0.2, color: '#ffd6a0' });
    if (type === 'picket') structures.push({ kind: 'stations', count: 40, radius: 0.5, spread: 0.02, color: '#d7c0b0' });
    structures.push({ kind: 'gate', radius: Math.min(orbit, 1.1), size: 0.025 });
  }
  if (type === 'ruin') structures.push({ kind: 'debris', count: 900, radius: planets[1]?.orbit ?? 0.35, spread: 0.05, thickness: 0.01, color: '#8a8074' });
  return { stars: [st], planets, structures, extent: Math.max(0.5, Math.min(orbit, 1.3)), traffic: inhabited ? 0.3 : 0 };
}

// ---------------------------------------------------------------------------
// Catalogue stars: anything in the local star field can be inspected.

const GREEK = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'κ', 'λ', 'μ', 'ν', 'ξ', 'π', 'ρ', 'σ', 'τ', 'φ', 'χ', 'ω'];

export interface CatalogStar {
  id: string;
  designation: string;
  kind: StarKind;
  temp: number;
  pos: Vec3;
  seed: number;
  surveyed: number | null;
  planets: number;
  note: string;
  faction: FactionId;
}

export function catalogStar(seed: number, pos: Vec3, temp: number, lum: number): CatalogStar {
  const rng = mulberry32(seed);
  const kind: StarKind = lum > 40 && temp < 4_600 ? 'RG' : temp > 9_000 && lum < 0.05 ? 'WD' : (spectralClass(temp) as StarKind);
  const f = factionAt(pos[0], pos[2]).faction;
  const sector = Math.floor(Math.abs(pos[0]) / 1_000) * 131 + Math.floor(Math.abs(pos[2]) / 1_000);
  const prefix = f === 'none' ? 'UC' : f === 'tethri' ? 'TM' : f === 'leagues' ? 'LL' : f === 'hallowmere' ? 'HH' : f === 'qesh' ? 'STQ' : 'WR';
  const des = `${prefix} ${String(sector % 9999).padStart(4, '0')}·${Math.floor(rng() * 999)
    .toString()
    .padStart(3, '0')}${rng() < 0.2 ? ' ' + pick(rng, GREEK) : ''}`;
  const surveyed = f === 'none' ? (rng() < 0.4 ? Math.round(range(rng, 22_000, 34_000)) : null) : Math.round(range(rng, 9_000, 34_000));
  const planets = kind === 'WD' ? Math.floor(rng() * 2) : Math.floor(rng() * rng() * 9);
  const notes = [
    'No thread access. Reached only by tug from the nearest anchor.',
    'Listed in the register; no survey report on file.',
    'Survey drone visited once. Report: "nothing to report."',
    'Claimed by a mining syndicate; claim lapsed.',
    'A navigation marker buoy is maintained in orbit.',
    'Flare-prone. Avoid close approach.',
    'Named informally by a passing pilot; name not recognised by the register.',
    'Part of a common proper-motion group with its neighbours.',
    'Ice-rich outer system. Water rights unclaimed.',
    'Considered for settlement in the High Weave; application withdrawn.',
  ];
  return {
    id: `cat-${seed}`,
    designation: des,
    kind,
    temp,
    pos,
    seed,
    surveyed,
    planets,
    note: pick(rng, notes),
    faction: f,
  };
}

export function seedFromId(id: string): number {
  return hashString(id);
}

export { smooth };
