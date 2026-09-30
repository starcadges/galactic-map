import type { Faction, Region } from './types';
import { GALAXY, armPoint, polarPoint, ringPoint, streamPoint } from './galaxyModel';

// The present-day political map (34,211 SR) and the named regions of the Wheel.

const rp = (deg: number, rad: number): [number, number, number] => {
  const p = ringPoint(deg);
  return [p[0], p[2], rad];
};
const pp = (deg: number, r: number, rad: number): [number, number, number] => {
  const p = polarPoint(deg, r);
  return [p[0], p[2], rad];
};
/** seeds strung along a spiral arm, close enough to merge into one territory */
const armRun = (arm: number, r0: number, r1: number, rad: number): [number, number, number][] => {
  const out: [number, number, number][] = [];
  for (let r = r0; r <= r1; r += 2_400) {
    const p = armPoint(arm, r);
    out.push([p[0], p[2], rad * (0.85 + 0.3 * Math.sin(r / 7_000))]);
  }
  return out;
};
const ringRun = (d0: number, d1: number, rad: number): [number, number, number][] => {
  const out: [number, number, number][] = [];
  for (let d = d0; d <= d1; d += 5) out.push(rp(d, rad));
  return out;
};
const sector = (t0: number, t1: number, r0: number, r1: number, rad: number): [number, number, number][] => {
  const out: [number, number, number][] = [];
  for (let r = r0; r <= r1; r += rad * 0.9) {
    const step = ((rad * 0.9) / r) * (180 / Math.PI);
    for (let t = t0; t <= t1; t += step) out.push(pp(t, r, rad));
  }
  return out;
};

export const FACTIONS: Record<string, Faction> = {
  plenary: {
    id: 'plenary',
    name: 'The Plenary of the Weft',
    short: 'Plenary',
    color: '#d9c9a0',
    blurb:
      'The civil government of the thread network: 1,112 sessions old, seated in the habitat swarm at Calyx. It maintains trunk threads, keeps the Standard Reckoning, and arbitrates between everyone else. Admired for its patience, resented for its paperwork.',
    seeds: [...sector(-58, 88, 10_500, 27_000, 5_200), ...ringRun(-30, 95, 6_400), pp(165, 7_500, 3_800), pp(150, 13_000, 4_000)],
  },
  hallowmere: {
    id: 'hallowmere',
    name: 'The Hundred Houses of Hallowmere',
    short: 'Hallowmere',
    color: '#b98391',
    blurb:
      'An autonomous Ossic high culture along the northern arm — ceremonious, dynastic, ruinously proud. Formerly the Hallowmere Compact; the only power that was never conquered during the War of Cut Threads.',
    seeds: armRun(1, 38_500, 71_000, 8_500),
  },
  leagues: {
    id: 'leagues',
    name: 'The Low Leagues',
    short: 'Low Leagues',
    color: '#cf9b5c',
    blurb:
      'A mercantile confederation of freeports, guild-habitats and charter towns strung along the southern Ember Ring. It speaks the Low Tongues, names things plainly, and lends money to everyone, including the Plenary.',
    seeds: ringRun(105, 208, 6_800),
  },
  tethri: {
    id: 'tethri',
    name: 'The Tethri Moot',
    short: 'Tethri Moot',
    color: '#7fb49c',
    blurb:
      'The second people of the Wheel, long-lived and deliberate, governing themselves by a moot that meets once every ninety standard years. Their braided "songline" threads run along the southern arm.',
    seeds: [...armRun(0, 38_000, 72_000, 8_500), ...ringRun(212, 238, 5_800)],
  },
  ninefold: {
    id: 'ninefold',
    name: 'The Ninefold',
    short: 'Ninefold',
    color: '#90b5c8',
    blurb:
      'Machine polities descended from the nine minds emancipated in 12,040 SR. Scattered enclaves rather than a territory; they keep the archive at Coldstack and run the computation swarm at Ishmere under contract.',
    seeds: [pp(338, 28_000, 3_600), pp(95, 23_000, 3_000)],
  },
  qesh: {
    id: 'qesh',
    name: 'Qesh Remnant (Supervised)',
    short: 'Qesh Remnant',
    color: '#a65c4c',
    blurb:
      'What remains of the Qesh Ascendancy inside the bulge: a people living under treaty supervision for eighteen thousand years. Their borders are drawn by the Accord, not by them.',
    seeds: [pp(120, 6_000, 3_400), pp(100, 8_000, 2_600), pp(135, 4_600, 2_400)],
    dashed: true,
  },
  exclusion: {
    id: 'exclusion',
    name: 'The Orrhune Exclusion',
    short: 'Exclusion',
    color: '#efece2',
    blurb: 'Treaty space around the central black hole. Belongs to no one, governed by the Wardens of the Still Hour.',
    seeds: [[0, 0, 1_500]],
  },
  freeholds: {
    id: 'freeholds',
    name: 'Rim Freeholds',
    short: 'Freeholds',
    color: '#9a958b',
    blurb: 'Unaffiliated outer settlements. Charted, mostly; governed, occasionally.',
    seeds: [],
  },
  pell: {
    id: 'pell',
    name: 'The Pell Custodial',
    short: 'Pell Custodial',
    color: '#8f78a6',
    blurb:
      'The exile administration inside the compact satellite galaxy Pell, established to hold the defeated Qesh command. It outlived its prisoners and became a nation that nobody quite recognises.',
    seeds: [],
  },
  none: {
    id: 'none',
    name: 'Unclaimed',
    short: 'Unclaimed',
    color: '#77756f',
    blurb: 'No polity claims this space.',
    seeds: [],
  },
};

export const REGIONS: Region[] = [
  {
    id: 'core',
    name: 'The Orrhune Exclusion',
    aliases: 'the Core · the Still Hour',
    center: [0, 0, 0],
    radius: 1_800,
    view: 5_500,
    blurb: 'Treaty space around the central black hole, and the densest traffic in the galaxy just outside it.',
    labelRank: 2,
  },
  {
    id: 'kiln',
    name: 'The Kiln',
    aliases: 'the Bulge · Qesh-Ammun',
    center: [1_500, 0, 4_000],
    radius: 9_000,
    view: 26_000,
    blurb: 'The old red bulge: ancient stars, industrial stellar engineering, and the supervised remnant of the Qesh Ascendancy.',
    labelRank: 1,
  },
  {
    id: 'heart',
    name: 'The Plenary Heart',
    aliases: 'the Inner Disk · the Hearthward',
    center: polarPoint(15, 18_000),
    radius: 12_000,
    view: 36_000,
    blurb: 'The inner disk inside the Ember Ring, where the Osse first rose, and where the Plenary still sits.',
    labelRank: 1,
  },
  {
    id: 'ring',
    name: 'The Ember Ring',
    aliases: 'the Ring Road · the Kindling',
    center: ringPoint(60),
    radius: 14_000,
    view: 110_000,
    blurb: 'A 200,000-light-year circle of young stars and glowing nurseries: the galaxy’s most crowded frontier, long since settled.',
    labelRank: 1,
  },
  {
    id: 'hallow',
    name: 'Hallowmere Arm',
    aliases: 'the Northern Arm · the Hundred Houses',
    center: armPoint(1, 52_000),
    radius: 16_000,
    view: 48_000,
    blurb: 'The northern arm beyond the Ring, domain of the Hundred Houses.',
    labelRank: 1,
  },
  {
    id: 'tethri',
    name: 'The Tethri Reach',
    aliases: 'the Southern Arm · Ambo-Kettoro',
    center: armPoint(0, 54_000),
    radius: 16_000,
    view: 48_000,
    blurb: 'The southern arm, home of the Tethri and their braided songlines.',
    labelRank: 1,
  },
  {
    id: 'graveyard',
    name: 'The Graveyard Reach',
    aliases: 'the Cut Country',
    center: polarPoint(128, 21_000),
    radius: 9_000,
    view: 30_000,
    blurb: 'The sector where the War of Cut Threads was fought hardest. Grey threads, dead stars, memorials.',
    labelRank: 1,
  },
  {
    id: 'breach',
    name: 'The Breach',
    aliases: 'the Quiet Gap',
    center: ringPoint(267),
    radius: 6_000,
    view: 22_000,
    blurb: 'A tear in the Ember Ring, left when the companion galaxy Pell plunged through the disk two hundred million years ago.',
    labelRank: 2,
  },
  {
    id: 'elision',
    name: 'Navigational Deprecation Zone 7',
    aliases: 'the Elision',
    center: polarPoint(2, 52_000),
    radius: 5_000,
    view: 20_000,
    blurb: 'An area the charts decline to describe.',
    labelRank: 2,
  },
  {
    id: 'rim',
    name: 'The Far Rim',
    aliases: 'the Outer Dark · the Warp',
    center: polarPoint(150, 84_000),
    radius: 30_000,
    view: 90_000,
    blurb: 'The warped outer disk: thin starlight, long silences, and the few who chose them.',
    labelRank: 1,
  },
  {
    id: 'stream',
    name: 'The Drowned Road',
    aliases: 'the Giant Stream · Veyrhal',
    center: streamPoint(0.42),
    radius: 40_000,
    view: 160_000,
    blurb: 'The torn-out remains of Veyrhal, a dwarf galaxy the Wheel swallowed two billion years ago — and the home of the vanished Vey.',
    labelRank: 1,
  },
  {
    id: 'pell',
    name: 'Pell',
    aliases: 'the Lesser Lamp',
    center: [...GALAXY.pell],
    radius: 6_000,
    view: 22_000,
    blurb: 'A compact satellite galaxy hanging just off the disk. Place of exile.',
    labelRank: 1,
  },
  {
    id: 'pale',
    name: 'The Pale Companion',
    aliases: 'the Far Lamp',
    center: [...GALAXY.paleCompanion],
    radius: 16_000,
    view: 60_000,
    blurb: 'A diffuse dwarf galaxy in the northern halo, quiet and old. A laboratory for things that do not shine.',
    labelRank: 1,
  },
  {
    id: 'halo',
    name: 'The Halo',
    aliases: 'the High Dark',
    center: [0, 60_000, 0],
    radius: 150_000,
    view: 300_000,
    blurb: 'The thin spherical haze of ancient stars and globular clusters around the disk.',
    labelRank: 2,
  },
];

export const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r]));
