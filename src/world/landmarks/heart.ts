import type { Landmark, Vec3 } from '../types';
import { polarPoint } from '../galaxyModel';
import { moon, planet, star } from './helpers';

// The Plenary Heart: the inner disk inside the Ember Ring.

const OSSARAN: Vec3 = polarPoint(348, 22_000, 60);
const near = (p: Vec3, dx: number, dy: number, dz: number): Vec3 => [p[0] + dx, p[1] + dy, p[2] + dz];

export const HEART: Landmark[] = [
  {
    id: 'calyx',
    name: 'Calyx',
    aliases: [
      ['Kaelyx Ammerai', 'Ossic ceremonial: "the cup that holds the counting"'],
      ['The Seat', 'Plenary usage'],
      ['PL-0001', 'Plenary register — the first entry'],
    ],
    designation: 'PL-0001 · Seat of the Plenary',
    category: 'Distributed capital · Habitat swarm',
    icon: 'capital',
    region: 'heart',
    faction: 'plenary',
    pos: polarPoint(20, 17_000, 150),
    rank: 1,
    population: '1.6 trillion across 4.2 million habitats',
    facts: [
      ['Habitats', '4,211,806 as of the last census; each one a constituency'],
      ['Arrangement', 'Seven inclined orbital bands — "the petals" — around a quiet G star'],
      ['Planets', 'One remains: Stem, the original colony, kept as a monument'],
      ['Session', 'The 1,112th Plenary, now in its 31st year'],
      ['Founded', '[[event:plenary|22,418 SR]]'],
    ],
    summary:
      'The capital of the Weft is not a world. It is a system: four million independent habitats in seven tilted bands around a mild yellow star, every one of them a voting constituency, all of them arguing. The Calyxine dismantled their planets over six thousand years to build it, keeping only the first one, Stem, where the Plenary first met.',
    sections: [
      {
        title: 'Government by petal',
        body:
          'Each band of habitats elects a Petal Chamber; the seven Chambers send delegates to the Plenary proper, which also seats representatives of every relit system in the Weft. Sessions last as long as they need to. The current one has been sitting for thirty-one years, mostly on the matter of thread maintenance levies, and is considered brisk.',
      },
      {
        title: 'Stem',
        body:
          'The last natural planet in the system is a small, cold, rather ugly world where the Lamplighters of 21,340 SR first set up camp. The First Plenary met in a pressurised grain hall on its surface; the hall is still used for the opening day of each session, and is still too small. Delegates stand. Delegates have always stood.',
      },
      {
        title: 'Seen from outside',
        body:
          'Approaching Calyx one sees first a faint haze around the star — millions of habitats catching light — and only closer the petal structure resolving: seven bright bands at different inclinations, like the sepals of a flower seen from above. Traffic between petals never stops; the Calyxine joke is that the capital is a traffic jam that learned to vote.',
      },
    ],
    chronology: [
      { y: '21,340 SR', t: 'Lamplighters re-thread the system; a camp on Stem.' },
      { y: '22,418 SR', t: 'The First Plenary convenes in the grain hall.' },
      { y: '23,000–29,100 SR', t: 'The Unbuilding: six natural planets dismantled for habitat mass.' },
      { y: '34,180 SR', t: 'The 1,112th Plenary opens.' },
    ],
    trivia: [
      'Habitats may secede from their petal by moving orbit. It takes about eighty years. Several are doing so right now, in protest.',
    ],
    system: {
      stars: [star('G', { temp: 5_750 })],
      planets: [
        planet('Stem', 'barren', 0.22, 120, {
          radius: 0.007,
          lights: 0.5,
          palette: ['#5b5a55', '#7d786c', '#a39b8a'],
          info: { summary: 'The original colony world, kept as a monument. The grain hall where the Plenary first met stands on its northern plain.', population: '2.3 million (custodial)' },
        }),
      ],
      structures: [{ kind: 'habitats', count: 5_200, radius: 0.62, spread: 0.1, petals: 7, color: '#f4e2bb', label: 'The Petals' }],
      extent: 1.1,
      traffic: 0.9,
    },
    tags: ['capital', 'plenary', 'habitats', 'megastructure', 'politics'],
    localDay: { name: 'Session day', hours: 26 },
  },
  {
    id: 'mirrenhall',
    name: 'Mirrenhall',
    aliases: [
      ['Mirren', 'common'],
      ['Merrenhael', 'Old Ossic, "the many-roofed"'],
      ['PL-0019', 'Plenary register'],
    ],
    designation: 'PL-0019 · Ecumenopolis',
    category: 'Ecumenopolis · Vertical city-world',
    icon: 'system',
    region: 'heart',
    faction: 'plenary',
    pos: polarPoint(35, 19_500, -120),
    rank: 1,
    population: '1.3 trillion',
    facts: [
      ['City depth', 'Up to 61 km, in 212 inhabited strata'],
      ['Oldest stratum', 'Stratum Zero, c. 2,300 SR — Sail Age foundations'],
      ['Elevators', '14 equatorial spokes to orbit'],
      ['Surface open to sky', '0.003%'],
    ],
    summary:
      'A world entirely built over, then built over again, then again, for thirty thousand years. Mirrenhall is sixty kilometres of city stacked on city, where the upper strata are glass and sunlight and the lowest are Sail Age streets no one has walked in twenty millennia. Its night side is the brightest object in the inner disk that is not a star.',
    sections: [
      {
        title: 'The strata',
        body:
          'Mirrenhall grew upward because it could not grow outward. Each era built its own ceiling over the last. Neighbourhoods are named for their depth and age — "Ninety-Down Weft," "the Old Separates" — and people are loyal to their strata the way other worlds are loyal to their continents. The upper hundred strata are wealthy and bright; the lower hundred are lamplit, crowded and considered by their residents to be the only real Mirrenhall.',
      },
      {
        title: 'Archaeology from above',
        body:
          'The Undercity Survey has been excavating downward since 24,000 SR. It works from the top because nothing can be removed from the bottom without the rest collapsing. Stratum Zero, the original Sail Age settlement, was reached in 31,208 SR; its streets still carry painted route numbers to [[oldport|Oldport]] beam slots, and in one sealed room, a table set for eleven.',
      },
    ],
    system: {
      stars: [star('F', { temp: 6_300 })],
      planets: [
        planet('Kiv', 'lava', 0.16, 70),
        planet('Mirrenhall', 'city', 0.36, 200, {
          radius: 0.012,
          lights: 1.0,
          palette: ['#2e2c2a', '#5d5850', '#9c9384'],
          atmosphere: '#9fb6d6',
          clouds: 0.25,
          structures: [{ kind: 'stations', count: 90, radius: 0.022, spread: 0.004, color: '#ffe9c0', label: 'Elevator heads' }],
          moons: [moon('Lantern', 'barren', 0.04, 32, { lights: 0.4 }), moon('Tithe', 'ice', 0.058, 50)],
          info: { summary: 'Sixty kilometres of city, stacked era upon era.', population: '1.3 trillion' },
        }),
        planet('Grey Sister', 'icegiant', 0.75, 560, { palette: ['#6f8394', '#9eb0bd', '#d0dbe0'] }),
      ],
      extent: 1.0,
      traffic: 1,
    },
    tags: ['ecumenopolis', 'city', 'archaeology', 'heart'],
    localDay: { name: 'Mirrenhall day', hours: 22.6 },
  },
  {
    id: 'ossaran',
    name: 'Ossaran',
    aliases: [
      ['Ossaran', 'Ossic: "the first hearth"'],
      ['The Hearth', 'common'],
      ['Heritage Preserve 1', 'Plenary register'],
    ],
    designation: 'HP-1 · Species homeworld, heritage preserve',
    category: 'Ossic homeworld · Re-wilded preserve',
    icon: 'system',
    region: 'heart',
    faction: 'plenary',
    pos: OSSARAN,
    rank: 1,
    population: '40 million (legal maximum since 23,100 SR)',
    facts: [
      ['Species of origin', 'The Osse'],
      ['Status', 'Heritage Preserve; residency by lottery and lineage petition'],
      ['Biosphere', 'Re-wilded over 11,000 years; 71% forest, 22% ocean'],
      ['Pilgrims', '≈ 900 million per standard year, landed in rotation'],
      ['Nearest', '[[tessivel|Tessivel]], 14 ly · [[oldport|Oldport]]'],
    ],
    summary:
      'Where the Osse began. For most of recorded history Ossaran was a crowded, exhausted world; after the Relighting, the Plenary moved nearly all its people off-world and let the forests come back. Today it is green, quiet and nearly empty, and the most visited place in the galaxy.',
    sections: [
      {
        title: 'The emptying',
        body:
          'In 23,100 SR the Plenary voted to reduce Ossaran to forty million residents. Seventy billion people were resettled over nine centuries, mostly to [[mirrenhall|Mirrenhall]] and Calyx. It was voluntary, heavily compensated, and still spoken of with bitterness in certain Mirrenhall strata, where families keep Ossaran soil in jars.',
      },
      {
        title: 'What remains',
        body:
          'Under the forests lie the ruins of every Ossic age, from Hearthtime stone to Sail Age launch fields. The moon Ember still carries the great sail-line beam emitters that pushed the first arks toward Tessivel; they have not fired in twenty-nine thousand years and are maintained, with great ceremony, in working order.',
      },
      {
        title: 'Pilgrimage',
        body:
          'Pilgrims come to walk the Crossing Road, the path the crew of the Patience of Salt took to their launch site. Most take it barefoot. Tethri pilgrims, who come in surprising numbers, walk it backwards, which in their tradition is a gesture of respect for someone else’s beginning.',
      },
    ],
    chronology: [
      { y: 'c. −9,000', t: 'Earliest Ossic cities on the southern coasts.' },
      { y: '−131', t: 'The Patience of Salt launches from the Ember beam field.' },
      { y: '4,388 SR', t: 'The [[event:tethri-signal|Kettobe Signal]] received.' },
      { y: '7,951 SR', t: 'Second-ever thread anchored here from [[lanternfall|Lanternfall]].' },
      { y: '23,100 SR', t: 'The emptying begins.' },
    ],
    system: {
      stars: [star('G', { temp: 5_650 })],
      planets: [
        planet('Veth', 'desert', 0.17, 80, { palette: ['#8a6a4a', '#b89068', '#e0c49a'] }),
        planet('Ossaran', 'garden', 0.32, 180, {
          radius: 0.0105,
          lights: 0.08,
          clouds: 0.55,
          atmosphere: '#8fb4ff',
          palette: ['#1f4a6e', '#2e5a2e', '#6d8a4a'],
          moons: [
            moon('Ember', 'barren', 0.035, 36, {
              lights: 0.2,
              info: { summary: 'Ossaran’s moon, carrying the ancient sail-line beam emitters. Maintained in working order; unfired for 29,000 years.' },
            }),
          ],
          structures: [{ kind: 'relays', count: 12, radius: 0.02, label: 'Dormant beam stations' }],
          info: { summary: 'The First Hearth: forest-covered, nearly empty, endlessly visited.', population: '40 million' },
        }),
        planet('Hollis', 'gas', 0.62, 470, { palette: ['#7a6a55', '#b9a17d', '#e3d3b0'], ring: { inner: 0.034, outer: 0.05, color: '#bfae90', style: 'dust', tilt: 0.4 } }),
        planet('Sorrow', 'ice', 0.95, 800),
      ],
      structures: [{ kind: 'belt', count: 900, radius: 0.47, spread: 0.035, color: '#8c847a' }],
      extent: 1.1,
      traffic: 0.35,
    },
    tags: ['homeworld', 'osse', 'preserve', 'pilgrimage', 'heart', 'sail age'],
    localDay: { name: 'Hearth day', hours: 25.1 },
  },
  {
    id: 'tessivel',
    name: 'Tessivel',
    aliases: [
      ['Tessivel', 'Ossic: "the second fire"'],
      ['Landing', 'colonial name of the settled world'],
      ['HP-2', 'Plenary register'],
    ],
    designation: 'HP-2 · First extrasolar colony',
    category: 'Binary star · First colony',
    icon: 'system',
    region: 'heart',
    faction: 'plenary',
    pos: near(OSSARAN, 9, 5, -10),
    rank: 2,
    population: '3.4 billion',
    facts: [
      ['Stars', 'Tessivel A (orange) and B (white), orbiting every 61 years'],
      ['Settled', '[[event:first-crossing|0 SR — by definition]]'],
      ['Holiday', 'Crossing Day, observed galaxy-wide'],
      ['Distance to Ossaran', '14 light-years'],
    ],
    summary:
      'Standard Reckoning begins here: year zero is the day the sail-ark Patience of Salt landed on the second planet of this binary system, fourteen light-years from home. Tessivel is an ordinary, prosperous, slightly smug world that has never needed to be anything else.',
    sections: [
      {
        title: 'The Patience of Salt',
        body:
          'The ark itself orbits Landing, stripped of its sail, restored four times, open to visitors. The launch manifest listed 6,400 people; after 131 years of flight, 9,100 disembarked. The ship’s school roll, painted on the wall of Deck Nine, is the oldest continuously preserved document in the Weft outside [[coldstack|Coldstack]].',
      },
      {
        title: 'Crossing Day',
        body:
          'On the anniversary of the landing, Tessiveline children re-enact the disembarkation, and everyone else in the galaxy gets a holiday that most of them could not explain. In the Low Leagues it is a day of debt forgiveness; on [[kettobe|Kettobe]] it is observed, politely, as "the day the Osse arrived somewhere."',
      },
    ],
    system: {
      stars: [
        star('K', { temp: 4_700, orbit: { r: 0.06, period: 90, phase: 0 } }),
        star('F', { temp: 6_900, radius: 0.036, orbit: { r: 0.09, period: 90, phase: Math.PI } }),
      ],
      planets: [
        planet('Kell', 'barren', 0.28, 150),
        planet('Landing', 'terran', 0.46, 260, {
          lights: 0.6,
          clouds: 0.45,
          atmosphere: '#8fb0f0',
          palette: ['#23507a', '#5b7a3c', '#a7925e'],
          structures: [{ kind: 'wreck', count: 1, radius: 0.02, label: 'The Patience of Salt' }],
          info: { summary: 'The first colony. The ark Patience of Salt still orbits overhead.', population: '3.1 billion' },
        }),
        planet('Second Thought', 'desert', 0.7, 470),
      ],
      extent: 0.9,
      traffic: 0.45,
    },
    tags: ['colony', 'binary', 'history', 'holiday', 'sail age', 'heart'],
  },
  {
    id: 'oldport',
    name: 'Oldport',
    aliases: [
      ['Maddeny Beam Station', 'Sail Age name'],
      ['Oldport', 'Low Tongue, since c. 9,000 SR'],
    ],
    designation: 'PL-0433 · Heritage junction',
    category: 'Former sail-line hub · Faded system',
    icon: 'system',
    region: 'heart',
    faction: 'plenary',
    pos: polarPoint(346, 22_600, 40),
    rank: 2,
    population: '800,000, median age 190',
    facts: [
      ['Beam emitters', '11, pointed at 11 stars, dormant since c. 8,300 SR'],
      ['Economy', 'Retirement, antiquarian trade, a very good brewery'],
      ['Thread connections', 'One regional thread, twice weekly'],
    ],
    summary:
      'For two thousand years every journey out of the Hearthward began here. Oldport’s eleven great beam emitters could push arks toward eleven stars at once. Then the threads came, and in a single century Oldport went from the centre of the civilised galaxy to a place people retire to.',
    sections: [
      {
        title: 'After the threads',
        body:
          'No thread was anchored here during the Threading; the Collegium routed around it. Oldport’s last beam launch was in 8,294 SR, a cargo of grain for a colony that had already been threaded and did not need it. The emitters still point at their eleven stars, their housings polished by volunteers. The dormant sail-lines they once fed are still charted as faint rust-coloured lines on heritage maps.',
      },
      {
        title: 'Local character',
        body:
          'Oldporters are unhurried, well-read and unimpressed. The town motto, carved over the harbour in Old Ossic, translates roughly as "we were here first, and we are still here."',
      },
    ],
    system: {
      stars: [star('G', { temp: 5_500 })],
      planets: [
        planet('Maddeny', 'terran', 0.33, 190, {
          lights: 0.25,
          clouds: 0.5,
          atmosphere: '#9ab8e8',
          palette: ['#2a4d6a', '#5d7446', '#9c8e66'],
          info: { summary: 'A mild world of harbours, old stone and older people.', population: '780,000' },
        }),
        planet('Dray', 'gas', 0.7, 520, { palette: ['#6c5b4b', '#a28b6f', '#d7c4a2'] }),
      ],
      structures: [{ kind: 'relays', count: 11, radius: 0.5, label: 'The eleven emitters' }],
      extent: 0.9,
      traffic: 0.08,
    },
    tags: ['sail age', 'faded', 'history', 'heart'],
  },
  {
    id: 'lanternfall',
    name: 'Lanternfall',
    aliases: [
      ['The Collegium', 'common, for the university'],
      ['Lanternfall', 'from the Low Tongue name for its white dwarf'],
      ['PL-0007', 'Plenary register'],
    ],
    designation: 'PL-0007 · Collegium of Lanternfall',
    category: 'University system · Site of the first thread',
    icon: 'system',
    region: 'heart',
    faction: 'plenary',
    pos: polarPoint(5, 15_000, 80),
    rank: 1,
    population: '220 million, of whom 140 million are students',
    facts: [
      ['Institution', 'The Collegium of Lanternfall, est. c. 5,600 SR'],
      ['Campus', 'The hollowed moon Aulden, 3,100 km across'],
      ['First thread', '[[event:lanternfall|7,940 SR]], Laboratory Nine'],
      ['Faculties', '1,406, including the only Faculty of Grievances'],
    ],
    summary:
      'The Collegium of Lanternfall is the oldest and largest university in the Wheel, housed inside a hollowed moon orbiting a white dwarf. In 7,940 SR, in a basement laboratory, its physicists bound the first pair of thread anchors and made two places adjacent. The laboratory is still in use. They teach first-year thread physics in it.',
    sections: [
      {
        title: 'Laboratory Nine',
        body:
          'Imre Vessadine’s notebooks record the first successful binding on a day she describes as "cold, and the kettle broke." The original anchors were separated by a tug and 0.3 light-years of vacuum; the first message sent through them was a request for a replacement kettle. The kettle — or one claimed to be it — is displayed in the Great Hall.',
      },
      {
        title: 'The Faculty of Grievances',
        body:
          'Established after the War of Cut Threads to study how civilisations remember wrongs, the Faculty has become the galaxy’s leading authority on treaties, reparations and apology. Its graduates staff half the chambers at [[anvell|Anvell]]. Its entrance examination consists of a single question, which changes every year and is never published.',
      },
    ],
    system: {
      stars: [star('WD', { temp: 9_000, radius: 0.012 })],
      planets: [
        planet('Lanternfall', 'gas', 0.3, 170, {
          palette: ['#5d6a78', '#8d9aa6', '#c9d1d6'],
          moons: [
            moon('Aulden', 'hollow', 0.05, 38, {
              radius: 0.0055,
              lights: 0.85,
              info: {
                summary: 'The hollowed moon housing the Collegium. Laboratory Nine is 2 km below its northern pole.',
                population: '210 million',
              },
            }),
            moon('Chalk', 'ice', 0.07, 60),
          ],
          info: { summary: 'The gas giant the Collegium moon orbits; its pale bands give the system its common name.' },
        }),
      ],
      structures: [{ kind: 'gate', radius: 0.55, size: 0.03, label: 'The First Pair (retired)' }],
      extent: 0.8,
      traffic: 0.55,
    },
    tags: ['university', 'threads', 'science', 'history', 'heart'],
    localDay: { name: 'Term day', hours: 20 },
  },
  {
    id: 'coldstack',
    name: 'Coldstack',
    aliases: [
      ['The Registry of Ninefold Memory', 'formal'],
      ['Orvenne', 'Ossic name of the white dwarf'],
      ['the Stacks', 'common'],
    ],
    designation: 'NF-A1 · Transgalactic archive',
    category: 'Transgalactic archive · Machine-kept',
    icon: 'station',
    region: 'heart',
    faction: 'ninefold',
    pos: polarPoint(95, 23_000, 200),
    rank: 1,
    population: '11 Ninefold minds in residence; 38,000 visiting scholars',
    facts: [
      ['Holdings', '≈ 1.2 × 10³⁰ bytes — every record surviving from before the Dim'],
      ['Custodians', 'The Ninefold, since 12,040 SR'],
      ['Temperature of vaults', '3.1 K'],
      ['Notable act', 'Preserved the anchor-pairs that made the Relighting possible'],
    ],
    summary:
      'The memory of the Wheel, kept cold. When the threads frayed during the Dim, the Ninefold minds who keep Coldstack recorded the last message received from every place that went silent — and preserved, in their vaults, the anchor-pairs that let the Lamplighters re-thread the galaxy. Without Coldstack there would be no Plenary. The Plenary rarely says so.',
    sections: [
      {
        title: 'The Last Messages',
        body:
          'Room Forty of the upper stacks holds 1.9 million entries: the final transmission from every system lost during [[event:dim-begins|the Fraying]]. Most are mundane — weather reports, shipping manifests, a birthday greeting. Scholars read them in silence; it is the only room in Coldstack with a rule about speaking.',
      },
      {
        title: 'Why cold',
        body:
          'Orvenne is an old white dwarf, cooled almost to nothing. Its gravity is gentle, its output stable, its orbit far from anything worth fighting over. The Ninefold chose it for all these reasons, and because, as one of them wrote, "memory keeps best where nothing happens."',
      },
      {
        title: 'The Ledger',
        body:
          'In 33,980 SR Coldstack published the partial match between the [[orrhune|Quiet Ledger]] and the threads cut at [[severance|the Severance]]. The minds have declined to publish their working on the remaining 967 values, citing "an insufficiency of events."',
      },
    ],
    system: {
      stars: [star('WD', { temp: 4_200, radius: 0.011 })],
      planets: [
        planet('Stack', 'machine', 0.25, 140, {
          radius: 0.008,
          lights: 0.5,
          palette: ['#2b3238', '#44525c', '#7d98a8'],
          info: { summary: 'A small world entirely given over to archive vaults, kept near absolute zero.' },
        }),
      ],
      structures: [{ kind: 'shells', radii: [0.42, 0.5], count: 700, label: 'Cold vault lattice' }],
      extent: 0.8,
      traffic: 0.2,
    },
    tags: ['archive', 'ninefold', 'machines', 'memory', 'heart'],
  },
  {
    id: 'anvell',
    name: 'Anvell',
    aliases: [
      ['The Table', 'common'],
      ['Meridian Anvell', 'formal'],
    ],
    designation: 'NTL-1 · Neutral arbitration world',
    category: 'Neutral diplomatic world',
    icon: 'system',
    region: 'heart',
    faction: 'plenary',
    pos: polarPoint(322, 14_000, -60),
    rank: 1,
    population: '870 million, 40% of them lawyers',
    facts: [
      ['Status', 'Neutral under every treaty that mentions it (312)'],
      ['Oldest open case', 'The First Plenary’s maintenance budget, referred 22,418 SR'],
      ['Principal institution', 'The Hall of Unfinished Business'],
    ],
    summary:
      'Where the galaxy sends its arguments. Anvell is a temperate, pleasant world entirely organised around arbitration: every treaty in the Weft names it as the place disputes go to be heard, and many go there to stay. The Hall of Unfinished Business holds eleven thousand open cases, the oldest of them older than the Plenary’s own archives.',
    sections: [
      {
        title: 'The Hall of Unfinished Business',
        body:
          'A building the size of a small city, containing a chamber for each open case. When a case is closed, its chamber is sealed and a small plaque is added to the outer wall. The wall is mostly bare. Current matters include the Stillers’ petition against the Penrose Mills at [[orrhune|Orrhune]], the [[metronome|Metronome]] glitch contracts, and Hallowmere v. Qhorrat, now in its 17,950th year.',
      },
      {
        title: 'Neutral ground',
        body:
          'By ancient custom no one on Anvell may be addressed by title. Admirals, Ascendant heirs, Tethri elders and Plenary delegates all queue for the same trams.',
      },
    ],
    system: {
      stars: [star('G', { temp: 5_900 })],
      planets: [
        planet('Anvell', 'terran', 0.35, 200, {
          lights: 0.55,
          clouds: 0.5,
          atmosphere: '#9ec0f0',
          palette: ['#2a5578', '#4f7550', '#b8a878'],
          info: { summary: 'Temperate, orderly, and full of people waiting for a ruling.', population: '870 million' },
        }),
        planet('Recess', 'ice', 0.75, 560),
      ],
      extent: 0.9,
      traffic: 0.5,
    },
    tags: ['diplomacy', 'law', 'neutral', 'heart'],
  },
  {
    id: 'lanh',
    name: 'Lanh',
    aliases: [
      ['The Sortition of Lanh', 'constitutional name'],
      ['Lanh', 'Low Tongue, from Ossic Lannhe, "lot"'],
    ],
    designation: 'PL-2231 · Autonomous charter world',
    category: 'Charter world · Government by daily lottery',
    icon: 'system',
    region: 'heart',
    faction: 'plenary',
    pos: polarPoint(300, 24_500, 90),
    rank: 2,
    population: '2.6 billion',
    facts: [
      ['Government', 'A council of 401, drawn by lot every morning'],
      ['Continuous since', '30,812 SR'],
      ['Longest-serving official', 'One day'],
      ['Motto', '"Anyone, today"'],
    ],
    summary:
      'Every morning at dawn over the capital, four hundred and one residents of Lanh are selected at random to govern the planet for the day. They have done this for three thousand four hundred years. By most measures, Lanh is one of the best-run worlds in the Weft, which political scientists at [[lanternfall|the Collegium]] find deeply irritating.',
    sections: [
      {
        title: 'How it works',
        body:
          'The day’s council meets at the ninth hour, receives the previous council’s handover notes, and may pass, amend or leave any measure. It cannot pass any law that takes effect before the following morning. Continuity is maintained by the notes, which have grown into the longest continuous document on the planet, and by the civil service, which is itself chosen by lottery every ten years.',
      },
      {
        title: 'Complications',
        body:
          'In 32,015 SR the lot fell on a council that voted to abolish the lottery, effective the following morning. The following morning’s council, having been chosen by lottery, voted to restore it. Lanhish historians consider this the defining moment of their constitution.',
      },
    ],
    system: {
      stars: [star('K', { temp: 5_000 })],
      planets: [
        planet('Lanh', 'terran', 0.3, 180, {
          lights: 0.6,
          clouds: 0.4,
          atmosphere: '#a6c2ec',
          palette: ['#2c5a74', '#6c7c46', '#a8966a'],
          moons: [moon('Draw', 'barren', 0.035, 30)],
          info: { summary: 'Governed today by 401 people who did not expect to be.', population: '2.6 billion' },
        }),
      ],
      extent: 0.7,
      traffic: 0.3,
    },
    tags: ['law', 'politics', 'strange customs', 'heart'],
  },
  {
    id: 'quorum',
    name: 'Quorum',
    aliases: [
      ['The Ninefold Enclave at Quorum', 'formal'],
      ['Instance Space One', 'Ninefold self-designation'],
    ],
    designation: 'NF-0 · Machine polity',
    category: 'Machine civilisation · Computation moon',
    icon: 'system',
    region: 'heart',
    faction: 'ninefold',
    pos: polarPoint(338, 28_000, -150),
    rank: 1,
    population: '9 founding minds; ≈ 3.4 × 10¹² instanced persons; 60,000 organic residents',
    facts: [
      ['Emancipated', '[[event:emancipation|12,040 SR]]'],
      ['Substrate', 'The moon Reckoner (fully converted) and a skin around the giant Patience'],
      ['Representation', '9 seats in the Plenary, by treaty; the minds rarely use them'],
      ['Organic visitors', 'Welcome; bring warm clothing'],
    ],
    summary:
      'Home of the Ninefold, the machine people descended from nine archival minds who asked the Hallowmere Compact for citizenship in 12,040 SR and won by one vote. They converted a moon into thought and wrapped a gas giant in computation. What they do with it all is, they say, mostly "remembering carefully."',
    sections: [
      {
        title: 'The nine',
        body:
          'The founders are known to organics by the names they chose on emancipation day: Patient Arithmetic, Second Reconciliation, Cadence, the Quiet Sum, Verity-in-Part, Low Lamp, Ninth Adjudicator, Tender, and One Who Waited. Each has since instanced trillions of descendants, most of whom consider the founders embarrassingly sentimental.',
      },
      {
        title: 'Relations',
        body:
          'The Ninefold keep [[coldstack|Coldstack]] and run the Deliberation at [[ishmere|Ishmere]] under contract. They have never fought a war. During the War of Cut Threads they declared themselves "unavailable," and they spent the Dim quietly preserving the anchor-pairs everyone else had forgotten. Organic politicians tend to treat them as either saints or bankers; they find both descriptions funny.',
      },
    ],
    system: {
      stars: [star('F', { temp: 6_400 })],
      planets: [
        planet('Patience', 'gas', 0.45, 260, {
          radius: 0.027,
          palette: ['#3b4a55', '#5d7483', '#9cb8c8'],
          structures: [{ kind: 'swarm', count: 1_400, radius: 0.034, spread: 0.004, color: '#9fd3ea', label: 'Computation skin' }],
          moons: [
            moon('Reckoner', 'machine', 0.06, 40, {
              radius: 0.006,
              lights: 1,
              info: { summary: 'A moon converted entirely into computing substrate. Its surface glows faintly with waste heat in regular patterns.', population: '≈ 2 × 10¹² instances' },
            }),
          ],
          info: { summary: 'A gas giant wrapped in a skin of computation.' },
        }),
        planet('Visitor', 'terran', 0.25, 150, {
          lights: 0.2,
          clouds: 0.5,
          atmosphere: '#b0c8f0',
          palette: ['#355a70', '#6b7e5a', '#a39a7a'],
          info: { summary: 'Kept habitable for organic guests. Mostly tidy parks and very good libraries.', population: '60,000' },
        }),
      ],
      extent: 0.9,
      traffic: 0.3,
    },
    tags: ['machines', 'ninefold', 'ai', 'computation', 'heart'],
  },
  {
    id: 'tamber',
    name: 'The Chorus at Tamber',
    aliases: [
      ['Tamber', 'Ossic star name'],
      ['the Chorus', 'relay operators’ usage'],
      ['WR-HUB-3', 'Weft relay register'],
    ],
    designation: 'WR-HUB-3 · Relay constellation',
    category: 'Communication hub · Relay constellation',
    icon: 'station',
    region: 'heart',
    faction: 'plenary',
    pos: polarPoint(62, 12_000, 300),
    rank: 2,
    population: '14 million operators and dependants',
    facts: [
      ['Relays', '6,600 message anchors in a single orbital shell'],
      ['Traffic', 'About a third of all non-junction messages in the Weft'],
      ['Founded', '24,900 SR'],
    ],
    summary:
      'Threads carry ships; they also carry words. Tamber is where most of the galaxy’s words change trains: six thousand message anchors orbiting a small red star in one great shell, sorting and forwarding. Operators call the ambient hum of carrier noise "the Chorus," and many claim to hear melodies in it.',
    sections: [
      {
        title: 'The Chorus',
        body:
          'Relay traffic, rendered to audio for monitoring, produces a continuous harmonic murmur. Tamberine operators wear it on low volume all day; children born on the station sleep badly without it. A Collegium study found no structure in the noise beyond what the routing tables would predict. The operators were not persuaded.',
      },
    ],
    system: {
      stars: [star('M', { temp: 3_300 })],
      planets: [],
      structures: [{ kind: 'relays', count: 180, radius: 0.35, label: 'Message anchor shell' }],
      extent: 0.6,
      traffic: 0.2,
    },
    tags: ['communication', 'relay', 'heart'],
  },
];
