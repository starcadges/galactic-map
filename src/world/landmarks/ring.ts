import type { Landmark } from '../types';
import { ringPoint } from '../galaxyModel';
import { moon, planet, star } from './helpers';

// The Ember Ring: the great circle of young stars.

export const RING: Landmark[] = [
  {
    id: 'ishmere',
    name: 'Ishmere',
    aliases: [
      ['Ishmere', 'Ossic: "the patient light"'],
      ['the Hush', 'Low Tongue, for the eclipses'],
      ['PL-0880', 'Plenary register'],
    ],
    designation: 'PL-0880 · Contracted computation site',
    category: 'Computation swarm · Periodically occluded star',
    icon: 'structure',
    region: 'ring',
    faction: 'plenary',
    pos: ringPoint(15, 400, 120),
    rank: 1,
    population: '41 million organic residents; the Deliberation itself is not counted',
    facts: [
      ['Swarm', 'The Deliberation: ≈ 9 × 10¹¹ computing elements in three lobes'],
      ['Eclipse', 'Starlight drops by 62% every 19 h 11 m as a lobe transits'],
      ['Commissioned by', 'The Plenary, 25,300 SR; operated by the Ninefold under contract'],
      ['Question', 'The optimal maintenance schedule of the Weft, in perpetuity'],
    ],
    summary:
      'From anywhere in the Ring you can watch Ishmere wink. Three lobes of a computation swarm — the Deliberation — orbit the star, and every nineteen hours one of them passes in front and the light falls by almost two thirds. The swarm was switched on in 25,300 SR to answer a single question for the Plenary. It is still thinking.',
    sections: [
      {
        title: 'The question',
        body:
          'The Plenary asked for the optimal schedule to maintain every thread in the Weft for the next hundred thousand years, accounting for traffic, fraying, politics and weather. The Deliberation publishes interim results every century. They are consistently excellent and slightly different each time. A persistent rumour holds that the problem was solved long ago and that the [[quorum|Ninefold]] keep the swarm running for purposes of their own; the Ninefold respond that maintenance is, by its nature, never finished.',
      },
      {
        title: 'Living in the Hush',
        body:
          'The people of Lesser Ishmere organise their lives around the eclipses. A "hush" is both the dimming and the unit of time between them; children are born "in the light" or "in the hush" and are said to carry the temperament of each. The hush is quiet by law. Visitors are advised not to schedule meetings during one.',
      },
    ],
    trivia: ['The eclipses were first used as a navigation beacon by Low League pilots during the Dim, before the Deliberation existed — by the old Sail Age mirror swarm it replaced.'],
    system: {
      stars: [star('F', { temp: 6_500, occlusion: 0.62 })],
      planets: [
        planet('Lesser Ishmere', 'terran', 0.5, 300, {
          lights: 0.55,
          clouds: 0.5,
          atmosphere: '#9fbde8',
          palette: ['#2b536e', '#58704a', '#a8986a'],
          info: { summary: 'Home of the Hushers, who live by the swarm’s eclipses.', population: '41 million' },
        }),
        planet('Thrum', 'gas', 0.85, 640, { palette: ['#5e6b5a', '#8e9a84', '#c8cfb8'] }),
      ],
      structures: [{ kind: 'swarm', count: 16_000, radius: 0.24, spread: 0.035, lobes: 3, color: '#b8d8ff', label: 'The Deliberation' }],
      extent: 1.0,
      traffic: 0.4,
    },
    tags: ['megastructure', 'computation', 'ninefold', 'swarm', 'ring'],
    localDay: { name: 'Hush', hours: 19.18 },
  },
  {
    id: 'serrathe',
    name: 'Serrathe',
    aliases: [
      ['Serrathe', 'Ossic: "the belted one"'],
      ['The Girdle', 'common, for the ring'],
      ['PL-1204', 'Plenary register'],
    ],
    designation: 'PL-1204 · Orbital ring world',
    category: 'Inhabited world · Equatorial orbital ring',
    icon: 'system',
    region: 'ring',
    faction: 'plenary',
    pos: ringPoint(50, -600, -80),
    rank: 1,
    population: '96 billion (81 billion on the Girdle)',
    facts: [
      ['Ring radius', '4.1 planetary radii; 41,000 km wide'],
      ['Built', '26,200–27,900 SR'],
      ['Spokes', '64 tethers to the equator'],
      ['Visible from', 'Roughly half a light-hour before the planet itself'],
    ],
    summary:
      'Serrathe’s equatorial ring is so large and so bright that approaching ships see it long before they can make out the planet: a lit hoop four times wider than the world it circles, tied to the equator by sixty-four spokes. Most Serrathine have never set foot on the surface. They call it "the Floor."',
    sections: [
      {
        title: 'The Girdle',
        body:
          'Built during the High Weave by a consortium of Ring cities, the Girdle is a continuous habitat with its own weather, rivers and time zones. Its inner face is open land under a glass roof; its outer face is docks. It is the busiest port in the northern Ring, and the only place in the galaxy where you can take a tram through a sunrise.',
      },
      {
        title: 'The Shadowbelt',
        body:
          'The ring casts a permanent band of shadow on the planet below. The towns under it, collectively the Shadowbelt, are cold, cheap and famous for musicians. Girdle-dwellers go there to feel like they are slumming; Shadowbelters go to the Girdle to feel like they are selling out. Both are right.',
      },
    ],
    system: {
      stars: [star('G', { temp: 5_900 })],
      planets: [
        planet('Tallis', 'lava', 0.18, 90),
        planet('Serrathe', 'terran', 0.44, 260, {
          radius: 0.01,
          lights: 0.7,
          clouds: 0.45,
          atmosphere: '#9ec2f0',
          palette: ['#244e70', '#5d7547', '#a48e62'],
          ring: { inner: 0.036, outer: 0.043, color: '#f5e6c4', style: 'city', tilt: 0.12 },
          moons: [moon('Buckle', 'barren', 0.07, 60)],
          info: { summary: 'A world belted by its own city. The planet is called the Floor.', population: '96 billion' },
        }),
        planet('Hem', 'icegiant', 0.8, 600, { palette: ['#5b7d8f', '#86a8b8', '#c3d7df'] }),
      ],
      extent: 1.0,
      traffic: 0.8,
    },
    tags: ['megastructure', 'orbital ring', 'city', 'ring'],
    localDay: { name: 'Girdle day', hours: 27 },
  },
  {
    id: 'cinderwake',
    name: 'Cinderwake',
    aliases: [
      ['Cinderwake Nebula', 'Low Tongue'],
      ['Ashvel Nursery', 'Ossic astronomical name'],
      ['the Wicks', 'for its floating towns'],
    ],
    designation: 'LL-N12 · Nebular settlement',
    category: 'Stellar nursery · Nebular settlements',
    icon: 'nebula',
    region: 'ring',
    faction: 'leagues',
    pos: ringPoint(80, 300, 60),
    rank: 1,
    population: '12 million, in ≈ 3,000 drifting towns',
    facts: [
      ['Nebula', 'Emission nebula, ~40 ly across, lit by a dozen young stars'],
      ['Settlements', 'The Wicks: pressure-towns that drift through the gas harvesting it'],
      ['Exports', 'Deuterium, rare isotopes, pigments, a famous red dye'],
      ['Navigation', 'No threads anchor inside; towns are reached by slow tug'],
    ],
    summary:
      'A stellar nursery forty light-years across, glowing red where young stars ionise the gas. Inside it drift the Wicks: three thousand small pressure-towns that trawl the nebula for its isotopes, moving with the currents, never anchored. They are among the most isolated and most tightly knit communities in the Ring.',
    sections: [
      {
        title: 'The Wicks',
        body:
          'A Wick is a sphere of habitation strung beneath a harvesting sail. Towns follow the gas, which follows the stars, which are still being born. Wickfolk measure distance in "glows" — how long it takes the nebula’s light to change colour around you — and consider the rest of the galaxy both too bright and too still.',
      },
      {
        title: 'Cinderwake red',
        body:
          'The dye extracted from the nebula’s iron-rich dust is the colour of Low League flags, Hallowmere mourning bands and, by an accident of trade, the cuffs of senior Tickwardens at [[metronome|the Metronome]]. All three institutions claim it first.',
      },
    ],
    system: {
      stars: [
        star('B', { temp: 21_000, orbit: { r: 0.9, period: 1400, phase: 0.3 } }),
        star('B', { temp: 16_000, radius: 0.06, orbit: { r: 1.3, period: 2000, phase: 2.4 } }),
        star('A', { temp: 9_500, orbit: { r: 1.6, period: 2600, phase: 4.2 } }),
      ],
      planets: [],
      structures: [
        { kind: 'nebula', radius: 3.4, color: '#ff6a70', color2: '#6ab8ff', density: 1, label: 'Cinderwake Nebula' },
        { kind: 'habitats', count: 260, radius: 1.3, spread: 1.0, color: '#ffd6a0', label: 'The Wicks' },
      ],
      extent: 2.6,
      traffic: 0.3,
      special: 'nebula',
    },
    tags: ['nebula', 'nursery', 'settlement', 'leagues', 'ring'],
  },
  {
    id: 'saltwhistle',
    name: 'Saltwhistle',
    aliases: [
      ['Saltwhistle', 'Low Tongue, for the whistle of the first harbour’s air-seals'],
      ['Ammur Seth', 'Ossic survey name'],
      ['LL-0001', 'League register'],
    ],
    designation: 'LL-0001 · Free Port, Seat of the Leagues',
    category: 'Freeport · Trade junction · League capital',
    icon: 'capital',
    region: 'ring',
    faction: 'leagues',
    pos: ringPoint(130, 200, -40),
    rank: 1,
    population: '290 billion (including 11 billion Vauren in the upper atmosphere of Gullet)',
    facts: [
      ['Threads', '412 anchored — second only to [[spindle|the Spindle]]'],
      ['Tariffs', 'None. Fees: many.'],
      ['Institutions', 'The Counting Houses; the League Moot; the Harbour of Last Resort'],
      ['Languages', 'Low Tongue (37 dialects), Standard, Vauren tone-song'],
    ],
    summary:
      'The loudest place in the Ring. Saltwhistle is a free port built across an asteroid belt and a gas giant, anchored by four hundred threads and run by the Low Leagues’ Counting Houses, which lend money to half the galaxy and remember every loan. Its motto is "Everything passes through." Its unofficial motto is "and pays."',
    sections: [
      {
        title: 'The Counting Houses',
        body:
          'Nine hereditary banking houses founded the Leagues in the Separate Lamps era and still run them. Their ledgers survived the Dim on physical media, sealed in the belt rocks; when the Lamplighters arrived in 21,812 SR, the Houses presented them with an itemised bill for storage. The Plenary’s founding loan came from Saltwhistle, and the interest is still being paid.',
      },
      {
        title: 'The Vauren of Gullet',
        body:
          'The gas giant Gullet is home to the Vauren, a floating people who live in its upper clouds and speak in tone-song. They were here before the Osse arrived and consider the entire port a noisy but tolerable reef growing on their sky. The League pays them rent; the Vauren spend it on nothing anyone can identify.',
      },
    ],
    system: {
      stars: [star('K', { temp: 5_100 })],
      planets: [
        planet('Gullet', 'gas', 0.4, 240, {
          radius: 0.03,
          palette: ['#6b4f3a', '#b9875a', '#e7c697'],
          lights: 0.2,
          moons: [moon('Tally', 'barren', 0.05, 40, { lights: 0.7 }), moon('Brine', 'ice', 0.072, 62, { lights: 0.4 })],
          info: { summary: 'Gas giant home of the Vauren, who float in its upper clouds.', population: '11 billion Vauren' },
        }),
        planet('Harbour', 'barren', 0.22, 110, { lights: 0.9, info: { summary: 'An airless world paved in docks.' } }),
      ],
      structures: [
        { kind: 'belt', count: 2_600, radius: 0.72, spread: 0.08, color: '#a08a70', label: 'The Salt Belt' },
        { kind: 'habitats', count: 600, radius: 0.72, spread: 0.08, color: '#ffcf8a', label: 'Belt towns' },
        { kind: 'gate', radius: 1.0, size: 0.04, label: 'Harbour Gate' },
      ],
      extent: 1.1,
      traffic: 1,
    },
    tags: ['trade', 'hub', 'capital', 'leagues', 'vauren', 'ring'],
    localDay: { name: 'Market day', hours: 18 },
  },
  {
    id: 'marrows-patience',
    name: 'Marrow’s Patience',
    aliases: [
      ['Marrow’s Patience', 'Low Tongue, after Ilse Marrow'],
      ['Terraforming Charter 44', 'League register'],
    ],
    designation: 'LL-T44 · Terraforming charter',
    category: 'Terraforming experiment · Half-green desert world',
    icon: 'system',
    region: 'ring',
    faction: 'leagues',
    pos: ringPoint(165, -300, 90),
    rank: 2,
    population: '71 million',
    facts: [
      ['Plan', '40,000 years; now in year 6,112'],
      ['Progress', 'Northern hemisphere 58% habitable; southern 4%'],
      ['Administered by', 'The Patience Office, which has had 219 directors'],
      ['Visible boundary', 'The Line — a 9,000 km front of spreading green'],
    ],
    summary:
      'Ilse Marrow persuaded the Low Leagues to fund a terraforming project that would outlive the Leagues themselves. Six thousand years later the northern half of the world is green, the southern half is still red desert, and the boundary between them — the Line — advances about forty metres a year. People come from across the Ring to watch it not move.',
    sections: [
      {
        title: 'The Line',
        body:
          'The front where the planted biosphere meets bare desert is marked, in places, by stone posts recording its position each century. Families picnic at the Line on Marrow’s birthday. It is considered bad luck to step across it into the desert; it is considered worse luck to plant anything on the wrong side.',
      },
      {
        title: 'The Office',
        body:
          'The Patience Office has kept the project running through the Dim, two League bankruptcies and a war of succession among its own directors. Its archive of soil samples is second only to [[coldstack|Coldstack]] in continuity and first in smell.',
      },
    ],
    system: {
      stars: [star('G', { temp: 5_600 })],
      planets: [
        planet('Marrow’s Patience', 'terraform', 0.36, 210, {
          lights: 0.3,
          clouds: 0.3,
          atmosphere: '#a7b9d9',
          palette: ['#9a5a38', '#c98a55', '#4d7340'],
          moons: [moon('Spade', 'barren', 0.04, 34)],
          info: { summary: 'Half green, half red, advancing forty metres a year.', population: '71 million' },
        }),
        planet('Crock', 'icegiant', 0.8, 620, { info: { summary: 'Source of the ice the Office still imports by the megaton.' } }),
      ],
      extent: 0.9,
      traffic: 0.35,
    },
    tags: ['terraforming', 'leagues', 'long projects', 'ring'],
  },
  {
    id: 'hathe',
    name: 'The Scree of Hathe',
    aliases: [
      ['Hathe', 'Low Tongue star name'],
      ['the Scree', 'miners’ usage'],
    ],
    designation: 'LL-M3 · Mining district',
    category: 'Mining region · Debris disk',
    icon: 'system',
    region: 'ring',
    faction: 'leagues',
    pos: ringPoint(190, 500, -130),
    rank: 2,
    population: '380 million, rotating; about 2 million Scree-born',
    facts: [
      ['Disk', 'A young star’s unfinished planetary debris, rich in metals'],
      ['Claims', '≈ 1.1 million registered'],
      ['Law', 'League charter, plus "the Scree custom"'],
      ['Hazard', 'Collisions; claim-jumpers; the food'],
    ],
    summary:
      'A young star still wrapped in the rubble of planets that never formed, and the richest metal field in the southern Ring. Hathe is a place of hard hours and harder bargains: a million mining claims, a thousand drifting camp-towns, and a culture of Scree-born miners who consider solid ground an unnecessary luxury.',
    sections: [
      {
        title: 'The Scree custom',
        body:
          'League law governs ownership; the Scree custom governs everything else. Its rules are unwritten but widely known: a light left on means come in, no one mines on a funeral day, and a claim abandoned for nine years belongs to whoever notices first. Disputes are settled by the oldest person on the nearest rock, who is usually delighted to be asked.',
      },
    ],
    system: {
      stars: [star('A', { temp: 8_200 })],
      planets: [planet('Firstcut', 'barren', 0.3, 170, { lights: 0.5, info: { summary: 'The only proper world in the system; claim office and hospital.' } })],
      structures: [
        { kind: 'belt', count: 5_200, radius: 0.62, spread: 0.3, thickness: 0.03, color: '#9f8b74', label: 'The Scree' },
        { kind: 'stations', count: 90, radius: 0.62, spread: 0.3, color: '#ffc27a', label: 'Camp-towns' },
      ],
      extent: 1.1,
      traffic: 0.6,
    },
    tags: ['mining', 'leagues', 'industry', 'ring'],
  },
  {
    id: 'opened-hand',
    name: 'Kettle Point',
    aliases: [
      ['The Opened Hand', 'commemorative name'],
      ['Kettle Point', 'Low Tongue, original survey name'],
      ['Ttemo Akko', 'Tethri: "the rock where we waited"'],
    ],
    designation: 'HP-9 · Heritage site',
    category: 'First-contact site · Refuelling asteroid',
    icon: 'station',
    region: 'ring',
    faction: 'tethri',
    pos: ringPoint(218, 0, 40),
    rank: 1,
    population: '1,300 (custodians, a canteen, a small hotel)',
    facts: [
      ['Event', '[[event:opened-hand|The Opened Hand]], 8,406 SR'],
      ['Artefact', 'The Crate — a standard fuel-cell crate, Ossic manufacture'],
      ['Holiday', 'Hand Day, observed by Osse and Tethri alike'],
      ['Jurisdiction', 'Jointly Tethri and Plenary, alternating by century'],
    ],
    summary:
      'An unremarkable ice-and-rock refuelling stop where, in 8,406 SR, an Ossic thread-carrier and a Tethri survey ship happened to arrive within a day of one another. After four thousand years of exchanging slow signals, the two peoples met here in person — across a fuel crate, which both crews used as a table. The crate is still there. So is the canteen.',
    sections: [
      {
        title: 'The meeting',
        body:
          'Neither crew was diplomatic. The Ossic carrier Undue Haste was lost and low on fuel; the Tethri surveyor Long Listening had stopped to repair a pump. Records from both ships agree that the first exchange was an attempt by the Ossic engineer to borrow a wrench, and that the Tethri captain opened her hand, palm up, to show she was holding nothing, which the Osse took for a request for payment. They paid. The misunderstanding took forty years to explain, and both peoples now celebrate it.',
      },
      {
        title: 'Hand Day',
        body:
          'On Hand Day, Osse and Tethri visit one another’s homes and ask for something small — a tool, a cup, a recipe. It must be given, and it must be paid for, and the payment must be slightly too much.',
      },
    ],
    system: {
      stars: [star('M', { temp: 3_400 })],
      planets: [
        planet('Kettle', 'ice', 0.2, 130, {
          radius: 0.005,
          lights: 0.3,
          info: { summary: 'The rock itself. The Crate sits in a pressurised hall on its sunward face.', population: '1,300' },
        }),
      ],
      structures: [{ kind: 'belt', count: 500, radius: 0.35, spread: 0.06, color: '#99a0a8' }],
      extent: 0.6,
      traffic: 0.2,
    },
    tags: ['first contact', 'tethri', 'osse', 'holiday', 'history', 'ring'],
  },
  {
    id: 'triadh',
    name: 'Triadh',
    aliases: [
      ['Triadh', 'Ossic: "three seats"'],
      ['The Rotating Crown', 'common'],
    ],
    designation: 'PL-3310 · Autonomous trinary',
    category: 'Trinary system · Rotating sovereignty',
    icon: 'system',
    region: 'ring',
    faction: 'plenary',
    pos: ringPoint(240, 900, 150),
    rank: 2,
    population: '14 billion',
    facts: [
      ['Stars', 'Ember (red), Lamp (yellow), Coal (orange) — a hierarchical triple'],
      ['Government', 'Three Courts; sovereignty passes to the Court whose star is nearest'],
      ['Handover interval', 'Irregular — between 4 and 19 years'],
      ['Transfers since founding', '2,114'],
    ],
    summary:
      'Three stars, three courts, one planet, and a constitution written by astronomers. On Triadh, sovereignty belongs to whichever of the three Courts is aligned with the star currently nearest the inhabited world. Because the orbits are chaotic, no one can predict a handover more than a few years ahead, and the entire planetary economy is built around guessing.',
    sections: [
      {
        title: 'The Handover',
        body:
          'When the orbital calculations confirm a new nearest star, the outgoing Court has exactly one local day to hand over the seals. Handovers are occasions of enormous public festivity and very little actual change, because all three Courts long ago learned to leave the others’ laws in place. The real power on Triadh belongs to the orbital actuaries.',
      },
    ],
    system: {
      stars: [
        star('M', { temp: 3_300, orbit: { r: 0.12, period: 70, phase: 0 } }),
        star('G', { temp: 5_700, orbit: { r: 0.12, period: 70, phase: Math.PI } }),
        star('K', { temp: 4_400, orbit: { r: 0.42, period: 260, phase: 1.3 } }),
      ],
      planets: [
        planet('Court', 'terran', 0.78, 520, {
          lights: 0.6,
          clouds: 0.4,
          atmosphere: '#b0c6ee',
          palette: ['#2d5670', '#6a7650', '#b39a6a'],
          info: { summary: 'The seat of three Courts, each waiting for its star.', population: '14 billion' },
        }),
      ],
      extent: 1.0,
      traffic: 0.45,
    },
    tags: ['trinary', 'politics', 'strange customs', 'ring'],
  },
  {
    id: 'breachlight',
    name: 'Breachlight',
    aliases: [
      ['Breachlight', 'Low Tongue'],
      ['The Aumery Light', 'after the keeping family'],
    ],
    designation: 'NAV-B1 · Optical beacon',
    category: 'Navigation beacon · Lighthouse station',
    icon: 'station',
    region: 'breach',
    faction: 'plenary',
    pos: ringPoint(267, 0, 0),
    rank: 1,
    population: '212',
    facts: [
      ['Keepers', 'The Aumery family, continuously since 17,040 SR'],
      ['Beacon', 'An optical flash, visible for 900 ly, every 11 seconds'],
      ['Nearest inhabited system', '1,400 ly'],
      ['Supply', 'One visit per standard year, by regional thread'],
    ],
    summary:
      'In the Breach — the torn, empty gap in the Ember Ring — there are too few stars to anchor threads, and during the Dim ships crossing it navigated by sight. The Aumery family built a lighthouse. Nine thousand years later there are still threads everywhere and nobody needs the light. The Aumerys still keep it.',
    sections: [
      {
        title: 'Why it still burns',
        body:
          'The Plenary has offered, eleven times, to automate the beacon. Each time the Aumerys have politely declined, and each time the Plenary has quietly renewed their stipend. The light is not strictly necessary. Pilots on the long regional thread across the Breach still flash their running lights when they pass within sight, and the keepers still log every one.',
      },
      {
        title: 'The keepers',
        body:
          'Two hundred and twelve people live on the station, all Aumerys by birth or marriage. They keep the log, the lamp, a hydroponic orchard, and a library of letters from pilots who passed. The oldest letter reads, in full: "Saw your light. Found our way. Thank you." It is framed over the lamp-room door.',
      },
    ],
    system: {
      stars: [star('M', { temp: 3_100, radius: 0.02 })],
      planets: [],
      structures: [{ kind: 'lamps', count: 1, radius: 0.2, label: 'The Light' }],
      extent: 0.5,
      traffic: 0.03,
    },
    tags: ['lighthouse', 'low population', 'navigation', 'breach', 'family'],
    localDay: { name: 'Watch', hours: 6 },
  },
  {
    id: 'orrelband',
    name: 'Orrelband',
    aliases: [
      ['Orrel’s Band', 'formal'],
      ['the Unfinished', 'common'],
      ['PL-5516', 'Plenary register'],
    ],
    designation: 'PL-5516 · Ring habitat (incomplete)',
    category: 'Ringworld-class habitat · Unfinished',
    icon: 'structure',
    region: 'ring',
    faction: 'plenary',
    pos: ringPoint(300, -700, -60),
    rank: 1,
    population: '44 billion on the completed arc',
    facts: [
      ['Completion', '71% of circumference'],
      ['Begun', '28,200 SR by the Orrel Consortium'],
      ['Halted', '29,106 SR, on the Consortium’s bankruptcy'],
      ['Ownership', 'Disputed among 12,000 creditors'],
    ],
    summary:
      'A band of engineered land encircling its star at the distance of a habitable world, open to the sky and a thousand times the surface area of a planet — or it would be, if it were finished. Seventy-one per cent of the circle is complete and inhabited. The rest is scaffolding, and has been for five thousand years, because nobody can agree who owns it.',
    sections: [
      {
        title: 'The gap',
        body:
          'Where the finished arc ends, the land simply stops at a wall three hundred kilometres high, and beyond it the bare frame continues around the star, catching sunlight like a cage. The people of the end-towns can see the far end of their own world across the gap, rising into the sky on the other side of the sun.',
      },
      {
        title: 'The creditors',
        body:
          'The Orrel Consortium borrowed from everyone, including nine of the Counting Houses of [[saltwhistle|Saltwhistle]] and several Ninefold instances. The case has been at [[anvell|Anvell]] since 29,110 SR. Local residents refer to it as "the weather."',
      },
    ],
    system: {
      stars: [star('G', { temp: 5_800 })],
      planets: [],
      structures: [{ kind: 'ringworld', radius: 0.55, width: 0.045, complete: 0.71, label: 'The Band' }],
      extent: 0.9,
      traffic: 0.6,
    },
    tags: ['megastructure', 'ringworld', 'unfinished', 'law', 'ring'],
  },
  {
    id: 'esk',
    name: 'Esk',
    aliases: [
      ['Esk', 'Ossic: "the unbuilt"'],
      ['The Unbuilt Worlds', 'common'],
    ],
    designation: 'PL-0671 · Nested habitat swarm',
    category: 'Nested habitat civilisation · Dismantled system',
    icon: 'structure',
    region: 'ring',
    faction: 'plenary',
    pos: ringPoint(335, 300, 200),
    rank: 1,
    population: '≈ 210 trillion — the most populous system in the Wheel',
    facts: [
      ['Planets dismantled', 'All eleven, over 7,000 years'],
      ['Shells', 'Five concentric swarms of habitats, the outermost 1.4 light-hours across'],
      ['Starlight reaching the outside', '≈ 9%'],
      ['Governance', 'Each shell is sovereign; the Plenary treats Esk as five members'],
    ],
    summary:
      'The Esk took their system apart. Every natural planet — eleven of them — was dismantled and rebuilt as habitats, arranged in five concentric shells around the star so dense that from outside Esk is a dim, warm, reddish ball of light. More people live here than in the rest of the Ember Ring combined. Few of them have ever seen their sun directly.',
    sections: [
      {
        title: 'Life in the shells',
        body:
          'Each shell lives on the light the inner shells let through. The innermost, the Scald, is hot, bright and technical; the outermost, the Umber, lives on dim red starlight and waste heat, and is famous for its gardens of shade plants and its patient, rather melancholy poetry. Moving outward is called "going cool," and it is what Esk people do when they retire.',
      },
      {
        title: 'Politics',
        body:
          'Esk sends five delegations to [[calyx|Calyx]], one per shell, which frequently vote against one another. Calyxine delegates privately regard the Esk as proof of what happens when you let a system grow without a plan. Esk delegates regard Calyx as a village.',
      },
    ],
    system: {
      stars: [star('K', { temp: 5_000 })],
      planets: [],
      structures: [{ kind: 'shells', radii: [0.2, 0.3, 0.42, 0.56, 0.72], count: 14_000, label: 'The five shells' }],
      extent: 1.0,
      traffic: 0.8,
    },
    tags: ['megastructure', 'dyson swarm', 'habitats', 'population', 'ring'],
  },
];
