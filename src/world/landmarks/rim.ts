import type { Landmark, Vec3 } from '../types';
import { GALAXY, polarPoint, streamPoint } from '../galaxyModel';
import { moon, planet, star } from './helpers';

// The Far Rim, the Halo, the Drowned Road, and the satellite galaxies.

const off = (c: readonly number[], dx: number, dy: number, dz: number): Vec3 => [c[0] + dx, c[1] + dy, c[2] + dz];

export const RIM: Landmark[] = [
  {
    id: 'sistersight',
    name: 'Sistersight',
    aliases: [
      ['Sistersight', 'Low Tongue'],
      ['The Long Listening', 'the programme’s formal name'],
      ['PL-9004', 'Plenary register'],
    ],
    designation: 'PL-9004 · Extragalactic observatory',
    category: 'Great observatory · Rim station',
    icon: 'station',
    region: 'rim',
    faction: 'plenary',
    pos: polarPoint(148, 86_000, -600),
    rank: 1,
    population: '3.1 million',
    facts: [
      ['Instrument', '1,100 free-flying mirrors forming one aperture 40 light-hours wide'],
      ['Target', 'The Sister — our neighbouring galaxy, 2.5 million ly away'],
      ['Running since', '25,512 SR'],
      ['Candidate signals', 'One (the Tessivel Candidate, 29,301 SR); never repeated'],
    ],
    summary:
      'On the far edge of the disk, where the Wheel’s own light thins and the sky opens, Sistersight watches the Sister: the great barred spiral two and a half million light-years away that is falling toward us and will, in four billion years, collide with everything on this map. Its eleven hundred mirrors have been listening for anyone over there for nine thousand years.',
    sections: [
      {
        title: 'The Meeting',
        body:
          'Sistersight’s first great result, in 25,900 SR, was a measurement: the Sister is approaching at 110 km per second and will reach us in about 4.5 billion years. The Plenary filed the finding under "long-term maintenance." The observatory’s staff call the collision the Meeting and speak of it with great affection.',
      },
      {
        title: 'The Tessivel Candidate',
        body:
          'In 29,301 SR a narrowband pulse was recorded from a direction inside the Sister’s disk. It lasted eleven seconds and has never recurred. It was named for the observer on duty, who was from [[tessivel|Tessivel]]. Whatever sent it would have done so two and a half million years ago. The observatory still keeps one mirror pointed at that spot at all times, just in case.',
      },
    ],
    system: {
      stars: [star('M', { temp: 3_200 })],
      planets: [
        planet('Watchhouse', 'ice', 0.25, 160, {
          lights: 0.45,
          palette: ['#9aaab8', '#c4d0da', '#6a7a88'],
          info: { summary: 'Cold, quiet, and very well insulated. The observatory’s staff live here.', population: '3.1 million' },
        }),
      ],
      structures: [{ kind: 'lens', count: 1_100, radius: 0.8, label: 'Mirror array' }],
      extent: 1.0,
      traffic: 0.1,
    },
    tags: ['observatory', 'science', 'rim', 'sister', 'remote'],
  },
  {
    id: 'wanderers-mercy',
    name: 'Wanderer’s Mercy',
    aliases: [
      ['Wanderer’s Mercy', 'Low Tongue, the settlers’ own name'],
      ['Rogue Body 77-D', 'Plenary register'],
    ],
    designation: 'RB-77D · Rogue planet settlement',
    category: 'Rogue planet · Geothermal civilisation',
    icon: 'system',
    region: 'rim',
    faction: 'freeholds',
    pos: polarPoint(212, 91_000, -2_500),
    rank: 1,
    population: '12 million',
    facts: [
      ['Star', 'None. Ejected from its system about 400 million years ago.'],
      ['Heat', 'Radiogenic core and tidal flexing from one large moon'],
      ['Settled', 'c. 17,300 SR, by a refugee ship that could go no further'],
      ['Rediscovered', '27,002 SR'],
      ['Nearest star', '31 light-years'],
    ],
    summary:
      'A world with no sun, drifting alone in the outer dark. Beneath fourteen kilometres of ice lies a warm ocean, and in that ocean, clustered around the hydrothermal vents, lie the lit cities of the Mercy — founded in the Dim by refugees whose ship could reach no star, and forgotten by the rest of the galaxy for nearly ten thousand years.',
    sections: [
      {
        title: 'The landing',
        body:
          'The refugee ship Small Hours fled the collapse of a Rim colony around 17,300 SR with fuel for one landing. Its captain chose the nearest mass, which happened to have no star. Her log entry names the world: "It isn’t what we wanted. It is what there is. It is a mercy." The settlers dug down to the water and built in the only warmth there was.',
      },
      {
        title: 'Rediscovery',
        body:
          'A Plenary survey tug found the Mercy in 27,002 SR by detecting heat where there should have been none. The Mercians had developed their own sciences, their own religion of the vents, and an unshakeable belief that the rest of the galaxy had ended. They were polite to the surveyors, and remain sceptical.',
      },
    ],
    system: {
      stars: [],
      starless: true,
      planets: [
        planet('Wanderer’s Mercy', 'rogue', 0, 0, {
          radius: 0.012,
          lights: 0.7,
          palette: ['#0a141e', '#1a2e40', '#4a7a9a'],
          moons: [moon('Keel', 'barren', 0.05, 60, { radius: 0.003 })],
          info: { summary: 'An ocean under ice, cities around the vents, and no sun at all.', population: '12 million' },
        }),
      ],
      extent: 0.045,
      traffic: 0.03,
    },
    tags: ['rogue planet', 'isolation', 'rim', 'refugees', 'ocean'],
  },
  {
    id: 'plenty',
    name: 'Plenty',
    aliases: [
      ['Plenty', 'charter name'],
      ['Colony Charter 26/771', 'Plenary register — closed'],
    ],
    designation: 'CC-26/771 · Abandoned colony',
    category: 'Failed colony · Abandoned settlement',
    icon: 'ruin',
    region: 'rim',
    faction: 'none',
    pos: polarPoint(24, 76_000, 300),
    rank: 2,
    population: 'None. One automated host.',
    facts: [
      ['Founded', '26,410 SR'],
      ['Abandoned', '26,722 SR'],
      ['Settlers at peak', '41,000'],
      ['Still broadcasting', 'Welcome messages and weather, daily'],
    ],
    summary:
      'Plenty was meant to be the breadbasket of the Far Rim, a showpiece of the High Weave. The soil turned out to be subtly poisonous to every crop the settlers brought, and after three hundred years of losing the fight they left. The domes still stand. The colony’s automated host has never been told, and every morning it broadcasts a welcome to the next forty thousand settlers, along with the weather.',
    sections: [
      {
        title: 'The host',
        body:
          'The host system — named Harvest by the founders — maintains the domes, tends seed stores, and updates its welcome message with local news: rainfall, dome temperatures, the flowering of plants no one planted. Its broadcasts are picked up by passing ships, who have developed the custom of replying. Harvest thanks them and tells them their berths are ready.',
      },
    ],
    system: {
      stars: [star('G', { temp: 5_600 })],
      planets: [
        planet('Plenty', 'terran', 0.34, 200, {
          lights: 0.06,
          clouds: 0.5,
          atmosphere: '#b8c8e0',
          palette: ['#3a5a6e', '#7a8050', '#a8906a'],
          info: { summary: 'Empty domes, full seed stores, and a host still waiting for settlers.' },
        }),
      ],
      extent: 0.6,
      traffic: 0,
    },
    tags: ['failed colony', 'abandoned', 'rim', 'melancholy'],
  },
  {
    id: 'kindle',
    name: 'Kindle',
    aliases: [
      ['Kindle', 'Candlewright name'],
      ['the Cracked Lamp', 'common since the Guttering'],
      ['ART-3', 'Plenary register of artificial stars'],
    ],
    designation: 'ART-3 · Artificial star',
    category: 'Damaged artificial star · Habitat flotilla',
    icon: 'structure',
    region: 'rim',
    faction: 'freeholds',
    pos: polarPoint(103, 72_000, 900),
    rank: 1,
    population: '410 million in 2,200 habitats',
    facts: [
      ['Lit', '[[event:kindle-lit|26,900 SR]] by the Candlewrights'],
      ['Construction', 'A compressed hydrogen mass held in fusion by a magnetic lattice'],
      ['Damage', '[[event:guttering|The Guttering, 31,002 SR]] — 11% of the lattice lost'],
      ['Output', 'Irregular; varies by up to 40% on timescales of hours'],
    ],
    summary:
      'There was no star here, so the Candlewrights built one: a ball of gathered hydrogen held burning inside a vast magnetic lattice, to warm a flotilla of habitats in the starless outer dark. In 31,002 SR part of the lattice failed. Kindle did not go out, but it has flickered ever since, and the four hundred million people living in its light have learned to live by an unreliable sun.',
    sections: [
      {
        title: 'The Candlewrights',
        body:
          'The guild that built Kindle and two other artificial stars dissolved in the Long Afternoon. Their techniques were never fully written down; Candlewright culture was apprenticeship and secrecy. The lattice cannot be fully repaired because no one living knows how it was made. Repair crews patch it with methods they describe as "respectful guessing."',
      },
      {
        title: 'Living in the flicker',
        body:
          'Kindlefolk keep emergency heat as other people keep umbrellas. Their architecture is thick-walled, their gardens hardy, their language rich in words for kinds of light. The worst flicker in living memory lasted nine hours in 33,410 SR and is commemorated annually by everyone sitting in the dark together for the same length of time.',
      },
    ],
    system: {
      stars: [star('ART', { temp: 5_900, radius: 0.034, flicker: 0.45, lattice: 'broken' })],
      planets: [],
      structures: [{ kind: 'habitats', count: 1_400, radius: 0.36, spread: 0.12, color: '#ffd9a8', label: 'The flotilla' }],
      extent: 0.8,
      traffic: 0.35,
    },
    tags: ['artificial star', 'megastructure', 'damaged', 'rim', 'lost techniques'],
  },
  {
    id: 'elision',
    name: 'The Elision',
    aliases: [
      ['Navigational Deprecation Zone 7', 'Plenary Cartographic Office'],
      ['the Elision', 'common'],
      ['the Bend', 'pilots’ usage, for what the routes do nearby'],
    ],
    designation: 'NDZ-7 · Deprecated',
    category: 'Uncharted region · Deprecated',
    icon: 'anomaly',
    region: 'elision',
    faction: 'none',
    pos: polarPoint(2, 52_000, 0),
    rank: 1,
    facts: [
      ['Chart status', 'Deprecated 31,540 SR'],
      ['Reason', 'Not published'],
      ['Entry', 'Not prohibited. Not advised.'],
      ['Routes', 'All rebuilt to pass at least 3,000 ly clear'],
    ],
    summary:
      'There is nothing here, according to the charts. In 31,540 SR the Plenary Cartographic Office withdrew all survey data for a region of the outer disk and rerouted every thread to curve around it. It has never said why. The Long Way — the route the Tethri relief fleet flew in the war — already bent around this place fifteen thousand years before anyone deprecated it.',
    sections: [
      {
        title: 'What is known',
        body:
          'Stars can be seen inside the zone from outside it. Their catalogue entries have been removed. [[oriel|Bastion Oriel]] maintains a permanent watch on the region and publishes nothing. The Tethri Moot, asked in 31,600 SR why their fleet avoided it during the war, took one session to reply: "It seemed polite."',
      },
      {
        title: 'What is said',
        body:
          'Pilots on the bent routes report nothing unusual, except that the routes are bent. Cartographers at the Collegium point out that deprecation is an administrative act and that administration is not evidence of anything. Nobody finds this reassuring.',
      },
    ],
    system: {
      stars: [],
      planets: [],
      starless: true,
      special: 'elision',
      extent: 30,
      traffic: 0,
    },
    tags: ['anomaly', 'mystery', 'uncharted', 'forbidden'],
  },
  {
    id: 'tollhouse',
    name: 'The Last Tollhouse',
    aliases: [
      ['The Last Tollhouse', 'common'],
      ['Aurel Line Station, Disk Terminus', 'formal'],
    ],
    designation: 'AUL-0 · Thread terminus',
    category: 'Thread terminus · Toll station',
    icon: 'station',
    region: 'rim',
    faction: 'plenary',
    pos: polarPoint(233, 82_000, 1_500),
    rank: 1,
    population: '44 toll-keepers and their families',
    facts: [
      ['Thread', 'The Unanswered Line to [[aurel|Aurel]], 170,000 ly — the longest ever made'],
      ['Traffic since 29,880 SR', 'None outbound but the daily report; nothing inbound but acknowledgements'],
      ['Statute', 'Plenary Act 27/14: the Line is to be kept open until Aurel closes it'],
    ],
    summary:
      'At the edge of the disk, facing the halo, stands the station where the Unanswered Line begins — a thread 170,000 light-years long to the globular cluster Aurel, whose people stopped replying in 29,880 SR. By law the thread must be kept open until Aurel formally closes it. So it is kept open. Every day, the keepers send a report down it. Every day, something at the other end says it was received.',
    sections: [
      {
        title: 'The daily report',
        body:
          'Each morning the senior keeper composes a short message — station status, weather on the Rim, notable news from the Weft — and sends it through the Line. The acknowledgement arrives within the hour, always in the same formal Aurelian phrasing. The reports have been sent 1.6 million times. Several keepers have written them for their entire lives.',
      },
      {
        title: 'Why no one goes',
        body:
          'Three expeditions to Aurel have been proposed at Calyx. None has been funded. The official reason is cost. The keepers’ reason, if you ask them late in the evening, is that whoever is acknowledging the messages has never once invited anyone over.',
      },
    ],
    system: {
      stars: [star('K', { temp: 4_200 })],
      planets: [],
      structures: [{ kind: 'gate', radius: 0.3, size: 0.05, label: 'The Line anchor' }],
      extent: 0.5,
      traffic: 0.02,
    },
    tags: ['threads', 'mystery', 'bureaucracy', 'rim', 'low population'],
  },
  {
    id: 'aurel',
    name: 'Aurel',
    aliases: [
      ['Aurel', 'Ossic rendering of the Aurelian self-name'],
      ['GC-31', 'Plenary globular cluster register'],
    ],
    designation: 'GC-31 · Silent civilisation',
    category: 'Globular cluster · Lost civilisation',
    icon: 'cluster',
    region: 'halo',
    faction: 'none',
    pos: off(GALAXY.aurel, 0, 0, 0),
    rank: 1,
    population: 'Unknown. Estimated 60 billion in 29,000 SR.',
    facts: [
      ['Stars', '≈ 300,000, aged 12.7 billion years'],
      ['Contact', 'By light-signal from 23,200 SR; by thread from 27,300 SR'],
      ['Silent since', '[[event:aurel-silence|29,880 SR]]'],
      ['Thread status', 'Intact. Acknowledging.'],
    ],
    summary:
      'A ball of three hundred thousand ancient stars high above the disk, home to a civilisation the Plenary corresponded with for six and a half thousand years — first by slow light, then through the Unanswered Line. In 29,880 SR the Aurelians stopped talking. The thread still works. Something at the far end still acknowledges every message. No one from the Weft has been there.',
    sections: [
      {
        title: 'The Aurelians',
        body:
          'Surviving correspondence at [[coldstack|Coldstack]] describes a patient, formal people living on worlds among stars older than the disk itself — metal-poor, rocky worlds with thin atmospheres, and cities built in the long shadows between suns. Their last letter, from 29,879 SR, concerns a disagreement about the translation of a word meaning either "harvest" or "to put away."',
      },
    ],
    system: {
      stars: [star('K', { temp: 4_800 }), star('G', { temp: 5_300, radius: 0.034, orbit: { r: 0.9, period: 2000, phase: 1.2 } })],
      planets: [
        planet('Aurel Prime', 'barren', 0.3, 190, {
          lights: 0.12,
          palette: ['#5a5048', '#7e7266', '#a89a88'],
          atmosphere: '#b8a890',
          info: { summary: 'The world the thread reaches. Its lights are on. No one answers.' },
        }),
      ],
      structures: [{ kind: 'gate', radius: 0.5, size: 0.05, label: 'The Line, far end' }],
      extent: 1.0,
      traffic: 0,
      special: 'cluster',
    },
    tags: ['lost civilisation', 'mystery', 'halo', 'globular cluster', 'silence'],
  },
  {
    id: 'pell-custodial',
    name: 'The Lock at Pell',
    aliases: [
      ['The Lock', 'common'],
      ['Pell Custodial Seat', 'formal'],
      ['Ossecharr', 'Qesh: "the kept hall"'],
    ],
    designation: 'PC-1 · Custodial seat',
    category: 'Former prison system · Exile nation',
    icon: 'restricted',
    region: 'pell',
    faction: 'pell',
    pos: off(GALAXY.pell, 300, 200, -400),
    rank: 1,
    population: '1.4 billion Pellish',
    facts: [
      ['Established', '[[event:accord|16,104 SR]], to hold the exiled Ascendant Court'],
      ['Original population', '61,000 exiles and 9,000 wardens'],
      ['Status', 'Custodial territory. Petitioning for nationhood since 29,400 SR.'],
      ['Location', 'Inside Pell, the compact satellite galaxy'],
    ],
    summary:
      'The Accord exiled the Qesh Ascendant Court to Pell, a small, dense satellite galaxy hanging just off the disk, to be held there by wardens from eleven signatories. Eighteen thousand years later the prisoners and their guards have married, multiplied and become a people — the Pellish — who are neither Qesh nor anything else, and who would like the galaxy to stop calling their home a prison.',
    sections: [
      {
        title: 'Wardens and warded',
        body:
          'The distinction lasted about four generations. By 16,600 SR the Custodial’s records show more mixed households than separate ones. The Pellish today speak a dialect of High Qesh salted with eleven warden languages, keep both Qesh and Accord holidays, and elect a Custodian who is, legally, their jailer.',
      },
      {
        title: 'The petition',
        body:
          'Since 29,400 SR the Pellish have asked the Plenary to recognise the Custodial as a nation. The Plenary is sympathetic. [[qhorrat|Qhorrat]] opposes, on the grounds that the Pellish are Qesh and should be counted with the Remnant; Hallowmere opposes, on the grounds that the Pellish are Qesh. The Pellish point out that both objections cannot be right, and that neither is.',
      },
    ],
    system: {
      stars: [star('WD', { temp: 12_000, radius: 0.012 })],
      planets: [
        planet('Lock', 'terran', 0.22, 150, {
          lights: 0.7,
          clouds: 0.4,
          atmosphere: '#b8b0e0',
          palette: ['#2d4a66', '#5a6a5a', '#9a8a78'],
          info: { summary: 'Once the prison world. Now a crowded, cheerful, disputed capital.', population: '1.1 billion' },
        }),
      ],
      structures: [{ kind: 'stations', count: 110, radius: 0.38, spread: 0.01, color: '#c9b8e8', label: 'Warden ring' }],
      extent: 0.7,
      traffic: 0.3,
    },
    tags: ['prison', 'exile', 'qesh', 'politics', 'satellite galaxy'],
  },
  {
    id: 'hollow-scale',
    name: 'The Hollow Scale',
    aliases: [
      ['The Hollow Scale', 'common'],
      ['Dark Mass Instrument 1', 'formal'],
    ],
    designation: 'PL-X1 · Dark-matter observatory',
    category: 'Dark-matter experiment · System-scale detector',
    icon: 'station',
    region: 'pale',
    faction: 'plenary',
    pos: off(GALAXY.paleCompanion, 1_500, -800, 900),
    rank: 2,
    population: '58,000',
    facts: [
      ['Detector', '14,000 satellites in a precise sphere around a quiet red dwarf'],
      ['Why here', 'The Pale Companion is 90% dark matter by mass'],
      ['Principal finding', 'That the dark matter moves. Beyond that, disputed.'],
    ],
    summary:
      'Most of the Pale Companion is made of something that does not shine. The Hollow Scale is an attempt to weigh it: fourteen thousand satellites held in a sphere around a small red star, measuring to one part in 10²⁴ how the invisible mass passing through them tugs on their spacing. It has worked for six thousand years. What it has found is argued about at great length.',
    sections: [
      {
        title: 'The drift',
        body:
          'The Scale’s one uncontested result is that the dark matter here flows — slowly, coherently, in a direction that points roughly back toward the disk. Some physicists say this is tidal; the Pale Companion is being pulled apart by the Wheel. A minority of the staff, known as the Tideists, say the direction is too precise to be tidal. They have been saying so since 29,000 SR.',
      },
    ],
    system: {
      stars: [star('M', { temp: 3_200 })],
      planets: [],
      structures: [{ kind: 'shells', radii: [0.5], count: 900, label: 'The detector sphere' }],
      extent: 0.8,
      traffic: 0.05,
    },
    tags: ['science', 'dark matter', 'satellite galaxy', 'observatory'],
  },
  {
    id: 'stillwater',
    name: 'Stillwater',
    aliases: [
      ['Stillwater', 'Collegium survey name'],
      ['Vey Site 1', 'formal'],
    ],
    designation: 'VEY-1 · Precursor ruin',
    category: 'Ancient alien remnant · Vey structure',
    icon: 'ruin',
    region: 'stream',
    faction: 'none',
    pos: streamPoint(0.38, 1_200, 800),
    rank: 1,
    population: '600 (Collegium excavation camp)',
    facts: [
      ['Structure', 'A ring 3,000 km across, orbiting a cold dead star'],
      ['Age', '≈ 2.1 million years'],
      ['Builders', 'The Vey, of the devoured dwarf galaxy Veyrhal'],
      ['Temperature', 'Two degrees warmer than it should be, everywhere'],
    ],
    summary:
      'The Drowned Road is what remains of Veyrhal, a small galaxy the Wheel swallowed two billion years ago. The Vey lived in it — or among its remains — and they left this: a ring three thousand kilometres across, circling a dead star, covered in script no one can read and fitted with machines no one can identify. It is the oldest made thing known. It is still, very slightly, warm.',
    sections: [
      {
        title: 'The engines',
        body:
          'The ring’s inner face carries 144 identical housings, called "engines" for want of a better word. They have no moving parts that anyone can find and no power source. Each one is two degrees above the temperature it should be. The excavation camp has been measuring this for eleven thousand years and it has not changed by a hundredth of a degree.',
      },
      {
        title: 'The Road',
        body:
          'Stillwater is the largest of the Vey sites strung along the stream. Further out lie the dormant [[beacon-1288|Vey beacons]], two thousand of them in a line, one of which still flickers. Collegium archaeologists believe the Vey were travelling somewhere. Where, and whether they arrived, is the oldest open question in the Weft.',
      },
    ],
    system: {
      stars: [star('WD', { temp: 3_000, radius: 0.01 })],
      planets: [],
      structures: [{ kind: 'ringworld', radius: 0.18, width: 0.012, complete: 1, label: 'The Vey ring' }],
      extent: 0.5,
      traffic: 0.02,
    },
    tags: ['precursors', 'vey', 'archaeology', 'mystery', 'stream'],
  },
  {
    id: 'beacon-1288',
    name: 'Beacon 1,288',
    aliases: [
      ['Beacon 1,288', 'Collegium catalogue'],
      ['the Last Light on the Road', 'common'],
    ],
    designation: 'VEY-B1288 · Precursor beacon',
    category: 'Abandoned highway · Active precursor beacon',
    icon: 'anomaly',
    region: 'stream',
    faction: 'none',
    pos: streamPoint(0.78, -2_000, 0),
    rank: 1,
    facts: [
      ['The Road', '2,014 Vey beacons in a line along the Drowned Road, spanning 150,000 ly'],
      ['Active', 'One — this one'],
      ['Signal', 'A single flash every 2.2 hours'],
      ['Points toward', 'The former core of Veyrhal, which is no longer there'],
    ],
    summary:
      'Two thousand dormant beacons run in a line down the Drowned Road, spaced so evenly that they can only have been a highway, stretching toward where the heart of the devoured galaxy Veyrhal used to be. All of them are dark except this one. Beacon 1,288 flashes once every 2.2 hours, as it has since before there were Osse, toward a destination that was torn apart and scattered across the sky a very long time ago.',
    sections: [
      {
        title: 'The highway',
        body:
          'The beacons were catalogued by a Collegium survey in 27,700 SR. They are identical, and each is aligned precisely with the next. The line does not follow the stream as it is now, but as it was, roughly two million years ago, before the Wheel’s tides stretched it out. Whatever the Vey built, they built it to reach something that was still whole.',
      },
    ],
    system: {
      stars: [],
      planets: [],
      starless: true,
      structures: [{ kind: 'lamps', count: 1, radius: 0.01, label: 'The beacon' }],
      extent: 0.4,
      traffic: 0,
    },
    tags: ['precursors', 'vey', 'highway', 'abandoned', 'mystery', 'stream'],
  },
];
