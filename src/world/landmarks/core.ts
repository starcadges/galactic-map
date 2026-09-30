import type { Landmark } from '../types';
import { polarPoint } from '../galaxyModel';
import { moon, planet, star } from './helpers';

// The Orrhune Exclusion and the Kiln: the galactic core and the old red bulge.

export const CORE: Landmark[] = [
  {
    id: 'orrhune',
    name: 'Orrhune',
    aliases: [
      ['Orrhune', 'Ossic: "the listening dark"'],
      ['The Still Hour', 'treaty usage, after the Accord of 16,104 SR'],
      ['Qesh-Ammun Tzar', 'Qesh: "the throne of the Kiln" — now proscribed'],
      ['EXC-0', 'Plenary navigation register'],
    ],
    designation: 'EXC-0 · Exclusion Primary',
    category: 'Supermassive black hole · Treaty exclusion zone',
    icon: 'blackhole',
    region: 'core',
    faction: 'exclusion',
    pos: [0, 0, 0],
    rank: 1,
    population: '≈ 2.9 million observers, custodians and wardens. No births permitted inside the boundary.',
    facts: [
      ['Mass', '1.4 × 10⁸ solar masses'],
      ['Exclusion radius', '38 ly, marked by 2,200 boundary buoys'],
      ['Governed by', 'Wardens of the Still Hour — joint mandate of 11 signatories'],
      ['Principal works', 'The Tessary · the Penrose Mills · the Ledger listening post'],
      ['Access', 'Treaty pass. No armed vessel within the boundary.'],
    ],
    summary:
      'The dark at the centre of the Wide Wheel. Since the [[event:accord|Accord of the Still Hour]] ended the War of Cut Threads here in 16,104 SR, Orrhune has belonged to no one: a 38-light-year sphere of treaty space where no weapon may be carried and no thread may be anchored, ringed by the most expensive scientific instruments ever built.',
    sections: [
      {
        title: 'The Exclusion',
        body:
          'Every vessel crossing the boundary shuts down its drive for one standard hour and drifts, in memory of the hour it took to sign the Accord. Wardens call this "keeping the Hour." Pilots call it the most expensive hour in the galaxy; a hauler on the [[spindle|Spindle]] approach can lose a day of schedule to it. Nobody has ever been fined for skipping it, because nobody has ever skipped it.',
      },
      {
        title: 'The Tessary',
        body:
          'A ring of 41,000 observation stations orbiting at the edge of the accretion flow, completed in 26,050 SR as a single relativistic interferometer. It images the photon ring, holds the galactic reference frame, and relays the time signal of [[metronome|the Metronome]] to the rest of the Weft. Each station bears the name of one person killed in the War of Cut Threads, drawn by lottery; the names rotate every century. There are 1.9 billion eligible names.',
      },
      {
        title: 'The Penrose Mills',
        body:
          'Frames dipped into the ergosphere tap the hole’s rotation for power. They feed the Tessary and beam the surplus to the Spindle. A faction of Wardens called the Stillers has petitioned for nine thousand years to shut them down: every millennium the Mills slow Orrhune’s spin by a measurable fraction of a part in 10¹⁸. The petition is a standing agenda item at [[anvell|Anvell]].',
      },
      {
        title: 'The Quiet Ledger',
        body:
          'In 29,114 SR the Tessary detected a structured signal circling just outside the photon sphere — 1,008 values, repeating every nine days and seven hours, with no visible transmitter. In 33,980 SR the Ninefold at [[coldstack|Coldstack]] matched 41 of those values to the lengths of the threads cut at [[severance|the Severance]]. The other 967 correspond to nothing anyone has found. The Wardens do not speculate in public.',
      },
    ],
    chronology: [
      { y: 'c. 6,200 SR', t: 'The Iterant Expedition sets out for the core and is lost at [[false-heart|the False Heart]].' },
      { y: '10,450 SR', t: 'Deep anchoring discovered from [[plumb|the Plumb]]; the Spindle begins to grow.' },
      { y: '14,480 SR', t: 'The Qesh Ascendancy seals the core. War.' },
      { y: '16,104 SR', t: 'The Accord of the Still Hour, signed on a drifting relay nicknamed the Table Without Legs.' },
      { y: '26,050 SR', t: 'The Tessary completed.' },
      { y: '29,114 SR', t: 'The Quiet Ledger detected.' },
      { y: '33,980 SR', t: 'Ledger partially matched to the Severance.' },
    ],
    warning: 'Treaty space. Tidal shear hazard inside 0.3 light-hours. Drive shutdown mandatory at the boundary.',
    trivia: [
      'The Table Without Legs still drifts inside the Exclusion. It is not a museum; it is still, legally, in session.',
    ],
    system: {
      stars: [star('BH')],
      planets: [],
      special: 'blackhole',
      extent: 2.6,
      traffic: 0.35,
      structures: [
        { kind: 'stations', count: 900, radius: 1.55, spread: 0.02, color: '#e8dcc0', label: 'The Tessary', dish: true },
        { kind: 'pillars', count: 6, radius: 0.62, label: 'Penrose Mills' },
        { kind: 'cordon', radius: 38, count: 220, label: 'Exclusion boundary' },
      ],
    },
    tags: ['black hole', 'core', 'treaty', 'observatory', 'war', 'sacred', 'mystery'],
    localDay: { name: 'Tessary watch', hours: 9.29 },
  },
  {
    id: 'spindle',
    name: 'The Spindle',
    aliases: [
      ['Vell-Tharun', 'Ossic: "the turning place"'],
      ['Core Junction One', 'Plenary navigation register'],
      ['the Knot', 'pilots’ usage'],
    ],
    designation: 'CJ-1 · Weft Primary Junction',
    category: 'Transit nexus · Deep-anchor junction',
    icon: 'structure',
    region: 'core',
    faction: 'plenary',
    pos: polarPoint(35, 1_400, 120),
    rank: 1,
    population: '310 million resident; ≈ 40 million in transit at any moment',
    facts: [
      ['Threads anchored', '3,118 (1,904 trunk-rated)'],
      ['Daily transits', '≈ 71 million hull-passages'],
      ['Operated by', 'Plenary Office of the Weft, Junction Directorate'],
      ['Anchored since', '10,452 SR (Qesh), re-anchored 22,030 SR (Lamplighters)'],
      ['Nearest', '[[orrhune|Orrhune]] 1,400 ly · [[metronome|the Metronome]]'],
    ],
    summary:
      'Where the Weft is tied together. Anchors set in the steep gravity near the core hold threads hundreds of times longer than anchors anywhere else, so every long thread in the galaxy either begins here or is priced as if it did. From a distance the Spindle is a slow-turning braid of anchor rings eleven light-hours long, with three thousand threads fanning out of it in every direction.',
    sections: [
      {
        title: 'How it works',
        body:
          'A thread is a pair of bound anchors: whatever enters one exits the other. Anchors must be carried to their destination the slow way, so the network grows outward from wherever anchors are made — and anchors made at the Spindle are the only ones that can be carried across half a galaxy without the thread fraying. This is why the Qesh wanted it, why the [[event:war-begins|war]] began here, and why the [[event:accord|Accord]] placed it just outside the Exclusion rather than inside.',
      },
      {
        title: 'Life in the Knot',
        body:
          'Residents are mostly junction staff, tenders, brokers and the people who feed them. The Spindle has its own dialect, Knot-cant, built almost entirely out of thread designations; a Knot-born child can recite the routing table to [[saltwhistle|Saltwhistle]] before learning to count. The most prestigious job is tender of the Old Pairs — the handful of Qesh-era anchors that still hold, and which nobody fully understands.',
      },
    ],
    chronology: [
      { y: '10,452 SR', t: 'First deep anchor set by Qesh surveyors.' },
      { y: '14,480 SR', t: 'Sealed by the Ascendancy.' },
      { y: '16,104 SR', t: 'Opened by the Accord; most threads already cut or frayed.' },
      { y: '22,030 SR', t: 'Re-anchored by Lamplighter crews working from Coldstack’s preserved pairs.' },
      { y: '34,211 SR', t: 'Busiest place in the Wheel, by any measure anyone uses.' },
    ],
    system: {
      stars: [star('K', { temp: 4_900 })],
      planets: [planet('Tharun Sill', 'barren', 0.3, 160, { info: { summary: 'An airless rock used as ballast and bulk storage for anchor machinery.' } })],
      structures: [
        { kind: 'spindle', count: 56, radius: 0.55, label: 'Anchor braid' },
        { kind: 'stations', count: 160, radius: 0.9, spread: 0.4, color: '#f0d7a0' },
      ],
      extent: 1.4,
      traffic: 1,
    },
    tags: ['transit', 'hub', 'threads', 'trade', 'core'],
    localDay: { name: 'Junction shift', hours: 8 },
  },
  {
    id: 'plumb',
    name: 'The Plumb',
    aliases: [
      ['Harth Station', 'Qesh foundation name'],
      ['the Plumb at Harth', 'formal Plenary usage'],
    ],
    designation: 'EXC-L3 · Gravitational laboratory',
    category: 'Gravitational laboratory · Qesh-era research station',
    icon: 'station',
    region: 'core',
    faction: 'exclusion',
    pos: polarPoint(250, 620, -40),
    rank: 2,
    population: '4,300 researchers and families',
    facts: [
      ['Instrument', 'A chain of 900 tethered test masses, 3.1 light-hours long, hanging coreward'],
      ['Experiment running since', '10,190 SR (with a 4,800-year gap)'],
      ['Host star', 'Harth, a bloated K giant'],
      ['Status', 'Exclusion scientific concession'],
    ],
    summary:
      'A Qesh laboratory that hangs a three-light-hour plumb line toward Orrhune and measures, to absurd precision, how spacetime leans. The Qesh learned deep anchoring here. The Plenary seized it after the war, and — being the Plenary — kept the original experiment running rather than start a new one.',
    sections: [
      {
        title: 'The longest experiment',
        body:
          'The Plumb measures the drift of its test masses relative to one another. The Qesh started the series in 10,190 SR; it stopped during the Dim when the last caretakers left, and resumed in 21,002 SR when a Lamplighter crew found the station intact and the logs readable. Researchers here are proud that their data set spans more than twenty thousand years, and defensive about the gap.',
      },
      {
        title: 'A complicated inheritance',
        body:
          'Qesh inscriptions still line the station’s spine. The Remnant at [[qhorrat|Qhorrat]] petitions every few centuries for the Plumb’s return, or at least joint custody. The Plenary’s answer has not changed in eighteen thousand years, but it is always delivered with great courtesy.',
      },
    ],
    system: {
      stars: [star('RG', { temp: 4_300, radius: 0.13 })],
      planets: [],
      structures: [{ kind: 'plumb', length: 1.2, label: 'The plumb line' }],
      extent: 1.0,
      traffic: 0.1,
    },
    tags: ['science', 'qesh', 'gravity', 'core'],
  },
  {
    id: 'false-heart',
    name: 'The False Heart',
    aliases: [
      ['Iterant’s Rest', 'memorial name'],
      ['P1 Concentration', 'Sail Age astronomical designation'],
    ],
    designation: 'EXC-A7 · Memorial site',
    category: 'Stellar concentration · Lost expedition site',
    icon: 'ruin',
    region: 'core',
    faction: 'exclusion',
    pos: [-420, 30, 60],
    rank: 2,
    population: 'None. Visited by memorial pilgrims under Warden escort.',
    facts: [
      ['Nature', 'An eccentric disk of ancient red stars, offset from the true centre'],
      ['Lost here', 'The Iterant Expedition, c. 6,200 SR — 4 ships, 1,120 crew'],
      ['Wrecks located', '3 of 4, in stable orbit'],
    ],
    summary:
      'To Sail Age astronomers on Ossaran the brightest knot of the core was obviously the centre. It was not: it is a lopsided disk of old red stars on long orbits, all bunched at the far end of their ellipses. The Iterant Expedition spent sixty years crossing the Kiln to reach it, arrived at the wrong place, and died there.',
    sections: [
      {
        title: 'The Iterant',
        body:
          'Four sail-ships left Ossaran around 6,140 SR, before threads existed, carrying the Collegium’s best instruments to "the Heart of the Wheel." Their final transmissions, received on Ossaran some 20,000 years later by relay, describe crews who had realised the true core lay hundreds of light-years further on and who voted, unanimously, to continue. Three hulls were found by the Wardens in 26,410 SR in slow orbit around the concentration, their drives fused. The fourth has never been located.',
      },
      {
        title: 'Custom',
        body:
          'Crews bound for [[orrhune|Orrhune]] on their first posting traditionally leave something aboard the Iterant wrecks: a coin, a note, a tool. The wrecks are now so full that the Wardens have begun cataloguing the offerings, a task expected to take another three centuries.',
      },
    ],
    system: {
      stars: [star('M', { temp: 3_500, radius: 0.03 }), star('K', { temp: 3_900, radius: 0.026, orbit: { r: 0.5, period: 900, phase: 2 } })],
      planets: [],
      structures: [{ kind: 'wreck', count: 3, radius: 0.35, label: 'Iterant wrecks' }],
      extent: 0.9,
      traffic: 0.05,
    },
    tags: ['ruin', 'expedition', 'memorial', 'sail age', 'core'],
  },
  {
    id: 'metronome',
    name: 'The Metronome',
    aliases: [
      ['Ammerai Tok', 'Ossic: "the counting bell"'],
      ['Pulsar Standard Zero', 'Plenary register'],
      ['Old Tick', 'Knot-cant'],
    ],
    designation: 'PSZ-0 · Reckoning standard',
    category: 'Millisecond pulsar · Galactic timekeeping authority',
    icon: 'station',
    region: 'kiln',
    faction: 'plenary',
    pos: polarPoint(200, 4_200, 260),
    rank: 1,
    population: '61,000 — the Tickwardens and their households',
    facts: [
      ['Rotation', '716.4 turns per second'],
      ['Role', 'Defines the Standard second, day and year for the entire Weft'],
      ['Institution', 'The Office of the Reckoning (est. 22,420 SR)'],
      ['Dress code', 'Strictly enforced; see below'],
    ],
    summary:
      'Every clock in the Weft is, eventually, a copy of this one. A neutron star spinning 716 times a second sits inside a ring of timing stations whose staff — the Tickwardens — are the most punctual, most ceremonial and most gently mocked civil servants in the galaxy.',
    sections: [
      {
        title: 'The Office of the Reckoning',
        body:
          'Founded two years after the Plenary itself, the Office counts pulses, corrects for the star’s slow spin-down, and publishes the Standard Reckoning to every junction via [[orrhune|the Tessary]] relay. Tickwardens wear black with a single white cuff whose width indicates seniority to the microsecond. They are forbidden to be late, and the fine for lateness is set in pulses.',
      },
      {
        title: 'The Glitch of 30,772',
        body:
          'Pulsars occasionally "glitch" — their spin jumps as the crust settles. When the Metronome glitched in 30,772 SR, every calendar in the Weft had to agree, retroactively, that a fraction of a second had not happened. The legal consequences are still being settled at [[anvell|Anvell]]; several hundred contracts were due at exactly that moment.',
      },
    ],
    system: {
      stars: [star('NS', { pulsar: true, temp: 80_000 })],
      planets: [planet('Cuff', 'barren', 0.42, 220, { info: { summary: 'A pulsar planet, stripped and radiation-scoured, used as the Office’s archive vault.' } })],
      structures: [
        { kind: 'beams', count: 2, radius: 1.2 },
        { kind: 'lamps', count: 36, radius: 0.28, label: 'Timing ring' },
      ],
      extent: 0.9,
      traffic: 0.2,
    },
    tags: ['pulsar', 'time', 'bureaucracy', 'kiln'],
    localDay: { name: 'Standard', hours: 24 },
  },
  {
    id: 'qhorrat',
    name: 'Qhorrat',
    aliases: [
      ['Qhorrat', 'Qesh: "the kept fire"'],
      ['Supervised Territory Q-1', 'Accord designation'],
    ],
    designation: 'STQ-1 · Supervised capital',
    category: 'Former imperial capital · Treaty-supervised world',
    icon: 'restricted',
    region: 'kiln',
    faction: 'qesh',
    pos: polarPoint(120, 6_000, -180),
    rank: 1,
    population: '2.1 billion (Qesh 96%)',
    facts: [
      ['Status', 'Supervised under the Accord of the Still Hour, 18,107 years and counting'],
      ['Government', 'The Remnant Assembly, elected; foreign policy reserved to the Plenary'],
      ['Economy', 'Precision instruments, anchor ceramics, heritage tourism (restricted)'],
      ['Language', 'High Qesh, Kiln Qesh, Plenary Standard'],
    ],
    summary:
      'Once the capital of the Qesh Ascendancy, which held the core and nearly broke the galaxy trying to keep it. Qhorrat is now a quiet, deeply cultured world under permanent treaty supervision, whose people have spent eighteen millennia being judged for what their ancestors did — and have opinions about that.',
    sections: [
      {
        title: 'The kept fire',
        body:
          'The Qesh built into their world rather than onto it: Qhorrat’s cities are carved kilometres down into the crust, lit by the planet’s own heat. From orbit the night side shows only sparse red vents. The famous Undervaults — the Ascendancy’s war archive — were sealed by the Accord and are opened once a millennium for inspection by a Warden delegation.',
      },
      {
        title: 'The Breakers’ Field',
        body:
          'The Ascendancy fleet was dismantled in orbit after the war. The pieces were never removed, by mutual agreement: the Plenary wanted a reminder, the Qesh wanted a monument. The Breakers’ Field still circles the planet, slowly spreading into a ring.',
      },
      {
        title: 'The question',
        body:
          'Every ninety years the Remnant Assembly petitions for the end of supervision. The Plenary has come within four votes of granting it. The Hundred Houses of [[hallowmere|Hallowmere]] have never voted in favour, and never will while [[iridane|Iridane]] remains broken. The Remnant counters that the people who broke it have been dead for eighteen thousand years.',
      },
    ],
    chronology: [
      { y: '9,800 SR', t: 'Qesh unify the inner Kiln under the first Ascendant.' },
      { y: '10,450 SR', t: 'Deep anchoring discovered; Qhorrat becomes the richest world in the galaxy.' },
      { y: '14,480 SR', t: 'The core sealed.' },
      { y: '16,104 SR', t: 'Surrender; the Ascendant Court exiled to [[pell-custodial|Pell]].' },
      { y: '33,892 SR', t: 'Latest petition to end supervision fails, 412 to 408.' },
    ],
    system: {
      stars: [star('K', { temp: 4_500 })],
      planets: [
        planet('Qhorrat', 'hollow', 0.34, 190, {
          lights: 0.45,
          palette: ['#3a2a24', '#6b4a3a', '#a4643e'],
          atmosphere: '#c58a60',
          info: { summary: 'The kept fire: a world hollowed into cities, its night side scattered with vent-light.', population: '1.9 billion' },
          structures: [{ kind: 'debris', count: 900, radius: 0.028, spread: 0.008, thickness: 0.002, color: '#8a7a6e', label: 'Breakers’ Field' }],
        }),
        planet('Tzakh', 'barren', 0.6, 400, { info: { summary: 'Mining moonlet-world; closed to outsiders.' } }),
        planet('Qesh-Hollow', 'gas', 0.95, 800, { palette: ['#5a3c2a', '#946244', '#c9a07a'] }),
      ],
      extent: 1.2,
      traffic: 0.25,
    },
    tags: ['qesh', 'capital', 'war', 'restricted', 'politics'],
    localDay: { name: 'Qesh day', hours: 31.4 },
  },
  {
    id: 'harrowdeep',
    name: 'Harrowdeep',
    aliases: [
      ['Harrowdeep', 'Low Tongue, from Qesh Harrakh-dhep, "the deep forge"'],
      ['Foundry One', 'Plenary industrial register'],
    ],
    designation: 'IND-1 · Plenary Foundry',
    category: 'Industrial world · Orbital manufacturing rings',
    icon: 'system',
    region: 'kiln',
    faction: 'plenary',
    pos: polarPoint(165, 7_500, 90),
    rank: 1,
    population: '380 billion, most of them in orbit',
    facts: [
      ['Output', '≈ 14% of all hulls and 31% of all anchor housings in the Weft'],
      ['Rings', 'Three, inclined; combined surface area 60× the planet'],
      ['Owner', 'Plenary Foundry Trust (formerly the Ascendancy Arsenal)'],
      ['Air quality', 'Improved since 28,000 SR. Locals disagree.'],
    ],
    summary:
      'A super-Earth wrapped in three inclined manufacturing rings, built by the Qesh as the Ascendancy Arsenal and converted after the war into the largest civil foundry in the galaxy. Harrowdeep makes the anchor housings every thread depends on, and it has never stopped working — not even during the Dim, when it made plough blades.',
    sections: [
      {
        title: 'Three rings',
        body:
          'The inner ring (Anvil) smelts; the middle ring (Loom) forms; the outer ring (Keel) assembles hulls up to 90 kilometres long. Traffic between them is so dense that from a distance the planet appears to be wrapped in moving gauze. The planet itself is mostly used for housing, agriculture and, officially, rest.',
      },
      {
        title: 'Foundry culture',
        body:
          'Harrowdeepers are famous for their work songs, their contempt for the Tickwardens of [[metronome|the Metronome]] (who "count what we make"), and the Longest Shift — a festival held every 400 years in which the rings stop for a single day. The silence is said to be unbearable.',
      },
    ],
    system: {
      stars: [star('G', { temp: 5_400 })],
      planets: [
        planet('Harrowdeep', 'city', 0.4, 210, {
          radius: 0.013,
          lights: 0.9,
          palette: ['#4c4038', '#7a6656', '#b6a490'],
          atmosphere: '#b39a7e',
          ring: { inner: 0.019, outer: 0.0225, color: '#c9b08a', style: 'industry', tilt: 0.3 },
          rings: [
            { inner: 0.0245, outer: 0.0275, color: '#b8a080', style: 'industry', tilt: -0.22 },
            { inner: 0.0295, outer: 0.033, color: '#a89478', style: 'industry', tilt: 0.08 },
          ],
          structures: [{ kind: 'shipyard', radius: 0.03, count: 40, label: 'Keel ring yards' }],
          moons: [moon('Slag', 'barren', 0.045, 40)],
          info: {
            summary: 'The Foundry. Three rings, one planet, no rest.',
            population: '380 billion',
            facts: [['Rings', 'Anvil · Loom · Keel']],
          },
        }),
        planet('Coke', 'lava', 0.2, 90, { info: { summary: 'An inner world mined for metals until its crust began to fail.' } }),
        planet('Ashfall', 'gas', 0.8, 620, { palette: ['#6b5642', '#a38364', '#d6bb98'] }),
      ],
      structures: [{ kind: 'belt', count: 1_400, radius: 0.6, spread: 0.06, color: '#8b7b6a' }],
      extent: 1.1,
      traffic: 0.95,
    },
    tags: ['industry', 'shipyard', 'kiln', 'qesh legacy'],
    localDay: { name: 'Shift', hours: 12 },
  },
  {
    id: 'ammat',
    name: 'The Forges of Ammat',
    aliases: [
      ['Ammat', 'Ossic, a pre-Qesh place name of unknown meaning'],
      ['The Lifted Stars', 'common usage'],
    ],
    designation: 'IND-7 · Star-lifting concession',
    category: 'Industrial stellar engineering · Star-lifting',
    icon: 'structure',
    region: 'kiln',
    faction: 'plenary',
    pos: polarPoint(280, 3_500, -300),
    rank: 2,
    population: '9 million (automated works; human staff on rotation)',
    facts: [
      ['Method', 'Magnetic funnels draw plasma off the stellar poles'],
      ['Yield', 'Heavy elements, hydrogen feedstock, anchor-grade ceramics'],
      ['Legal basis', 'Accord Article IX exemption (no star to be harmed "beyond its natural span")'],
    ],
    summary:
      'An old orange star being slowly lifted: great magnetic funnels at both poles draw its substance off into orbiting refineries. It is legal only because the Plenary’s lawyers argued, successfully, that lifting lengthens a star’s life. The Qesh, who invented the technique for war, find this very funny.',
    sections: [
      {
        title: 'The loophole',
        body:
          'The [[event:accord|Accord]] forbids harming a star. Star-lifting removes mass, which makes a star burn slower and live longer; therefore, the Plenary argued in 22,901 SR, lifting is a kindness. The ruling is taught in every law school in the Weft as either a triumph of reason or a monument to bad faith. At [[qhorrat|Qhorrat]] it is taught as a comedy.',
      },
    ],
    system: {
      stars: [star('K', { temp: 4_800, lifted: true, radius: 0.04 })],
      planets: [],
      structures: [
        { kind: 'stations', count: 70, radius: 0.35, spread: 0.1, color: '#f2c38a', label: 'Refineries' },
        { kind: 'belt', count: 600, radius: 0.7, spread: 0.08, color: '#9a8878' },
      ],
      extent: 0.9,
      traffic: 0.6,
    },
    tags: ['stellar engineering', 'industry', 'law', 'kiln'],
  },
];
