import type { RouteDef, Vec3 } from './types';
import { polarPoint, ringPoint, streamPoint, GALAXY } from './galaxyModel';

// The Weft: threads, songlines, and the dead roads beneath them.

const pp = polarPoint;
const rp = ringPoint;

export const ROUTE_STYLE: Record<
  RouteDef['cls'],
  { label: string; color: string; width: number; dash: number; alpha: number; pulse: number; desc: string }
> = {
  trunk: {
    label: 'Trunk thread',
    color: '#f1d9a6',
    width: 1.9,
    dash: 0,
    alpha: 0.5,
    pulse: 1,
    desc: 'Plenary-maintained, high-capacity threads anchored at the Spindle. The arteries of the Weft.',
  },
  thread: {
    label: 'Regional thread',
    color: '#a9c2bc',
    width: 1.2,
    dash: 0,
    alpha: 0.34,
    pulse: 0.6,
    desc: 'Ordinary threads between systems. Most of the network.',
  },
  songline: {
    label: 'Tethri songline',
    color: '#8fd0a8',
    width: 1.5,
    dash: 0,
    alpha: 0.42,
    pulse: 0.5,
    desc: 'Braided Tethri threads: slower to build, nearly impossible to cut. None were lost in the war.',
  },
  sail: {
    label: 'Sail-line (dormant)',
    color: '#b0703f',
    width: 1.0,
    dash: 0.8,
    alpha: 0.32,
    pulse: 0,
    desc: 'Sail Age beamed-light routes around the Hearthward. Unused for 26,000 years; still charted.',
  },
  grey: {
    label: 'Grey thread (cut)',
    color: '#8e8c88',
    width: 1.0,
    dash: 0.45,
    alpha: 0.3,
    pulse: 0,
    desc: 'Threads severed during the War of Cut Threads. The cut ends never fully decay.',
  },
  vey: {
    label: 'The Vey Road',
    color: '#c9c3e0',
    width: 1.2,
    dash: 0.93,
    alpha: 0.42,
    pulse: 0,
    desc: 'A line of two thousand dormant precursor beacons, two million years old.',
  },
  unanswered: {
    label: 'The Unanswered Line',
    color: '#f4f1ea',
    width: 1.0,
    dash: 0,
    alpha: 0.28,
    pulse: 0.15,
    desc: 'The longest thread ever made, to a cluster that stopped replying.',
  },
  restricted: {
    label: 'Supervised corridor',
    color: '#c46a58',
    width: 1.2,
    dash: 0.3,
    alpha: 0.4,
    pulse: 0.3,
    desc: 'Treaty-supervised threads serving the Qesh Remnant and the Pell Custodial.',
  },
  longway: {
    label: 'The Long Way (historic)',
    color: '#d8b87a',
    width: 1.0,
    dash: 0.6,
    alpha: 0.3,
    pulse: 0,
    desc: 'The route of the Tethri relief fleet to Vantreth, 15,871–15,902 SR. Walked by pilgrims today.',
  },
};

// Sail Age waypoints around Ossaran: colonies that faded when the threads came.
const sailA: Vec3 = pp(352, 21_300, 180);
const sailB: Vec3 = pp(343, 21_500, -140);
const sailC: Vec3 = pp(347, 23_400, 220);
const sailD: Vec3 = pp(341, 22_900, -60);
const sailE: Vec3 = pp(353, 22_700, -200);

export const ROUTES: RouteDef[] = [
  // --- Trunks -----------------------------------------------------------
  { id: 'tr-heart', name: 'The Hearth Trunk', cls: 'trunk', path: ['spindle', 'tamber', 'lanternfall', 'calyx'], traffic: 1, built: '22,030 SR', status: 'Open · heavy' },
  { id: 'tr-mirren', name: 'Calyx–Mirrenhall Trunk', cls: 'trunk', path: ['calyx', 'mirrenhall'], traffic: 1, built: '21,400 SR', status: 'Open · heavy' },
  { id: 'tr-ossaran', name: 'The Pilgrim Trunk', cls: 'trunk', path: ['calyx', 'ossaran'], traffic: 0.8, built: '21,380 SR', status: 'Open · seasonal surges' },
  { id: 'tr-anvell', name: 'The Table Line', cls: 'trunk', path: ['calyx', 'anvell', 'lanh'], traffic: 0.7, built: '22,500 SR', status: 'Open' },
  { id: 'tr-foundry', name: 'The Foundry Trunk', cls: 'trunk', path: ['spindle', 'metronome', 'harrowdeep'], traffic: 1, built: '22,100 SR', status: 'Open · heavy freight' },
  { id: 'tr-south', name: 'The Counting Trunk', cls: 'trunk', path: ['harrowdeep', pp(150, 16_000, 100), 'saltwhistle'], traffic: 0.95, built: '21,812 SR', status: 'Open · heavy' },
  { id: 'tr-mirren-cold', name: 'The Archive Trunk', cls: 'trunk', path: ['mirrenhall', 'coldstack', 'saltwhistle'], traffic: 0.8, built: '21,000 SR', status: 'Open' },
  { id: 'tr-north', name: 'The Evening Trunk', cls: 'trunk', path: ['calyx', pp(45, 30_000, 200), 'oriel', 'hallowmere'], traffic: 0.75, built: '24,300 SR', status: 'Open' },
  { id: 'tr-west', name: 'The Tide Trunk', cls: 'trunk', path: ['lanh', 'orrelband', 'kettobe'], traffic: 0.7, built: '22,900 SR', status: 'Open' },
  {
    id: 'tr-ringroad',
    name: 'The Ring Road',
    cls: 'trunk',
    path: ['esk', 'ishmere', 'serrathe', rp(95, 0, 0), 'saltwhistle', 'marrows-patience', 'hathe', 'opened-hand', 'triadh'],
    traffic: 0.9,
    built: '23,000–24,100 SR',
    status: 'Open · the busiest ring of threads in the Wheel',
  },
  { id: 'tr-ring-west', name: 'The Ring Road (western spur)', cls: 'trunk', path: ['orrelband', 'esk'], traffic: 0.8, built: '23,300 SR', status: 'Open' },
  { id: 'tr-quorum', name: 'Quorum Trunk', cls: 'trunk', path: ['calyx', 'quorum', 'esk'], traffic: 0.6, built: '22,600 SR', status: 'Open' },

  // --- Regional threads ------------------------------------------------
  { id: 'th-seren', name: 'The Houses’ Thread', cls: 'thread', path: ['hallowmere', 'seren', 'senn'], traffic: 0.45, built: '24,800 SR', status: 'Open' },
  { id: 'th-vigil', name: 'Vigil Line', cls: 'thread', path: ['senn', 'vigil', 'sistersight'], traffic: 0.3, built: '25,600 SR', status: 'Open' },
  { id: 'th-kindle', name: 'Candlewright Thread', cls: 'thread', path: ['seren', 'kindle'], traffic: 0.25, built: '26,850 SR', status: 'Open · lattice-repair priority' },
  { id: 'th-vantreth', name: 'Memorial Thread', cls: 'thread', path: ['oriel', 'vantreth', 'iridane'], traffic: 0.15, built: '23,700 SR', status: 'Open · memorial traffic only' },
  { id: 'th-serrathe', name: 'Girdle Thread', cls: 'thread', path: ['serrathe', 'oriel'], traffic: 0.5, built: '26,400 SR', status: 'Open' },
  { id: 'th-cinder', name: 'Wick Thread', cls: 'thread', path: ['saltwhistle', 'cinderwake'], traffic: 0.35, built: '22,200 SR', status: 'Open · terminates at the nebula edge' },
  { id: 'th-ishmere', name: 'Contract Line', cls: 'thread', path: ['ishmere', 'quorum'], traffic: 0.3, built: '25,280 SR', status: 'Open' },
  { id: 'th-tamber', name: 'Chorus Line', cls: 'thread', path: ['tamber', 'mirrenhall'], traffic: 0.4, built: '24,900 SR', status: 'Open' },
  { id: 'th-sail', name: 'Old Harbour Thread', cls: 'thread', path: ['lanh', 'oldport'], traffic: 0.15, built: '23,050 SR', status: 'Open · twice weekly' },
  { id: 'th-ammat', name: 'Lifting Line', cls: 'thread', path: ['spindle', 'ammat'], traffic: 0.55, built: '22,901 SR', status: 'Open' },
  { id: 'th-plumb', name: 'Plumb Service Thread', cls: 'thread', path: ['spindle', 'plumb'], traffic: 0.1, built: '21,002 SR', status: 'Open · Exclusion permit required' },
  { id: 'th-hathe', name: 'Scree Thread', cls: 'thread', path: ['hathe', 'oum'], traffic: 0.12, built: '27,100 SR', status: 'Open · irregular' },
  { id: 'th-breach', name: 'The Breach Crossing', cls: 'thread', path: ['triadh', 'breachlight', 'orrelband'], traffic: 0.35, built: '23,900 SR', status: 'Open · long, empty crossing' },
  { id: 'th-plenty', name: 'Charter Line 771', cls: 'thread', path: ['serrathe', pp(30, 55_000, 300), 'plenty'], traffic: 0.02, built: '26,405 SR', status: 'Open · no scheduled service' },
  { id: 'th-halo', name: 'The High Thread', cls: 'thread', path: ['mirrenhall', pp(60, 40_000, 9_000), 'hollow-scale'], traffic: 0.1, built: '28,300 SR', status: 'Open' },

  // --- Tethri songlines -------------------------------------------------
  { id: 'sl-tul', name: 'Songline of the Twinned', cls: 'songline', path: ['kettobe', 'tul-varra', 'opened-hand'], traffic: 0.5, built: '8,900 SR', status: 'Open · never cut' },
  { id: 'sl-ambo', name: 'Garden Songline', cls: 'songline', path: ['kettobe', 'ambo-sarre', 'shoals'], traffic: 0.3, built: '11,600 SR', status: 'Open · ends at the Shoals edge' },
  { id: 'sl-hesk', name: 'Cordon Songline', cls: 'songline', path: ['ambo-sarre', 'hesk'], traffic: 0.1, built: '19,420 SR', status: 'Cordon supply only' },
  { id: 'sl-toll', name: 'Rim Songline', cls: 'songline', path: ['kettobe', pp(245, 70_000, 600), 'tollhouse'], traffic: 0.12, built: '27,250 SR', status: 'Open' },

  // --- Dormant sail-lines around the Hearthward ------------------------
  { id: 'sa-1', name: 'Sail-line of the Crossing', cls: 'sail', path: ['oldport', 'ossaran', 'tessivel'], traffic: 0, built: '−131 SR', status: 'Dormant since c. 8,300 SR' },
  { id: 'sa-2', name: 'Maddeny Beam 3', cls: 'sail', path: ['oldport', sailA], traffic: 0, built: '1,640 SR', status: 'Dormant' },
  { id: 'sa-3', name: 'Maddeny Beam 7', cls: 'sail', path: ['oldport', sailB], traffic: 0, built: '1,700 SR', status: 'Dormant' },
  { id: 'sa-4', name: 'Maddeny Beam 9', cls: 'sail', path: ['oldport', sailC], traffic: 0, built: '2,030 SR', status: 'Dormant' },
  { id: 'sa-5', name: 'Maddeny Beam 11', cls: 'sail', path: ['oldport', sailD], traffic: 0, built: '2,480 SR', status: 'Dormant' },
  { id: 'sa-6', name: 'Hearth Beam 2', cls: 'sail', path: ['ossaran', sailE], traffic: 0, built: '600 SR', status: 'Dormant' },

  // --- Grey threads: the scars of the war -------------------------------
  { id: 'gr-1', name: 'Ascendancy Line (cut 15,011)', cls: 'grey', path: ['qhorrat', 'severance'], traffic: 0, built: '11,900 SR', status: 'Severed' },
  { id: 'gr-2', name: 'Compact Treasury Line (cut 15,655)', cls: 'grey', path: ['iridane', 'severance', pp(160, 12_000, -200)], traffic: 0, built: '12,400 SR', status: 'Severed' },
  { id: 'gr-3', name: 'Vantreth Siege Lines (cut 15,831)', cls: 'grey', path: ['vantreth', pp(118, 16_000, 0), 'qhorrat'], traffic: 0, built: '13,000 SR', status: 'Severed' },
  { id: 'gr-4', name: 'The Old Evening Line', cls: 'grey', path: ['unlit', pp(100, 32_000, 0), 'hallowmere'], traffic: 0, built: '12,100 SR', status: 'Severed' },
  { id: 'gr-5', name: 'Kiln–Compact Line', cls: 'grey', path: ['severance', pp(170, 22_000, 0), pp(185, 28_000, 0)], traffic: 0, built: '12,800 SR', status: 'Severed' },
  { id: 'gr-6', name: 'Old Spindle–Evening Line', cls: 'grey', path: ['spindle', pp(80, 9_000, 0), 'unlit'], traffic: 0, built: '11,000 SR', status: 'Severed' },
  { id: 'gr-7', name: 'Unlit Supply Line', cls: 'grey', path: ['unlit', 'coldstack'], traffic: 0, built: '13,300 SR', status: 'Severed' },

  // --- The long dead roads ---------------------------------------------
  {
    id: 'vey-road',
    name: 'The Vey Road',
    cls: 'vey',
    path: [streamPoint(0.22), streamPoint(0.3), 'stillwater', streamPoint(0.5), streamPoint(0.62), 'beacon-1288', streamPoint(0.9), streamPoint(0.99)],
    traffic: 0,
    built: '≈ 2.1 million years ago',
    status: 'Dormant · one beacon active',
  },
  {
    id: 'unanswered',
    name: 'The Unanswered Line',
    cls: 'unanswered',
    path: ['tollhouse', [-70_000, 26_000, -88_000], 'aurel'],
    traffic: 0.02,
    built: '27,300 SR',
    status: 'Open · acknowledging · no replies since 29,880 SR',
  },
  { id: 'rs-qesh', name: 'Supervised Corridor Q', cls: 'restricted', path: ['qhorrat', 'spindle'], traffic: 0.25, built: '16,300 SR', status: 'Supervised · inspection at both ends' },
  { id: 'rs-pell', name: 'The Custodial Line', cls: 'restricted', path: ['spindle', [9_000, -5_500, 10_000], 'pell-custodial'], traffic: 0.2, built: '16,110 SR', status: 'Supervised' },
  {
    id: 'longway',
    name: 'The Long Way',
    cls: 'longway',
    path: ['kettobe', pp(292, 58_000, 400), pp(322, 62_000, 300), pp(350, 63_000, 0), pp(15, 62_000, -200), pp(45, 52_000, -100), 'oriel', 'vantreth'],
    traffic: 0,
    built: '15,871 SR',
    status: 'Historic · pilgrim route',
    note: 'Flown hop by hop along Tethri songlines and abandoned survey threads.',
  },
];

/** The Elision bends everything that passes near it. */
export const ELISION_CENTER: Vec3 = polarPoint(2, 52_000, 0);
export const ELISION_BEND_RADIUS = 9_500;

export const PELL_CENTER = GALAXY.pell;
