import type { Landmark } from '../types';
import { armPoint, polarPoint } from '../galaxyModel';
import { moon, planet, star } from './helpers';

// The Tethri Reach (the southern arm), plus remote inter-arm places nearby.

export const TETHRI: Landmark[] = [
  {
    id: 'kettobe',
    name: 'Kettobe',
    aliases: [
      ['Kettobe', 'Tethri: "the water that answers"'],
      ['Tethri Home', 'Ossic usage'],
      ['TM-1', 'Moot register'],
    ],
    designation: 'TM-1 · Species homeworld',
    category: 'Tethri homeworld · Reef-city ocean world',
    icon: 'capital',
    region: 'tethri',
    faction: 'tethri',
    pos: armPoint(0, 48_000, 0, 40),
    rank: 1,
    population: '6.8 billion Tethri; 90 million others',
    facts: [
      ['Species of origin', 'The Tethri'],
      ['Surface', '94% ocean; three moons; tides up to 80 m'],
      ['Cities', 'Grown, not built — living reefs shaped over centuries'],
      ['Government', 'The Moot, which meets every 90 standard years'],
      ['Calendar', 'Tidal; the "great tide" of all three moons recurs every 211 days'],
    ],
    summary:
      'An ocean world under three moons, where the tides are measured in tens of metres and the cities are alive. The Tethri grew their first towns as reefs and never stopped; their capital, Ammo Kettre, is a coral structure the size of a continent, shaped by forty thousand years of patient gardening. In 4,388 SR its tide tables, broadcast into space, became the first message another people ever received from them.',
    sections: [
      {
        title: 'The Tethri',
        body:
          'Long-lived — nine hundred standard years is ordinary — and deliberate in all things, the Tethri consider the Osse charming, fast and slightly exhausting. They govern themselves through the Moot, which meets once every ninety years and prefers to decide nothing until it has to. Tethri do not have a word for "hurry"; the nearest translation is "to be Ossic about it."',
      },
      {
        title: 'The Signal',
        body:
          'The [[event:tethri-signal|Kettobe Signal]] was not meant as a greeting. It was a tide table, broadcast by harbour masters for their own shipping, which leaked into space for six thousand years. When an answer arrived from [[ossaran|Ossaran]], the Moot took two sessions — 180 years — to agree on a reply. It was a corrected tide table, with a note apologising for the error in the first one.',
      },
      {
        title: 'The songlines',
        body:
          'Tethri threads are braided: several anchor-pairs wound together so that each strengthens the others. They are slower to build and almost impossible to cut. Every Tethri songline out of Kettobe survived the War of Cut Threads intact, which is part of why the relief of [[vantreth|Vantreth]] was possible at all — and part of why the Tethri have been quietly smug about it ever since.',
      },
    ],
    chronology: [
      { y: 'c. −36,000', t: 'Earliest known reef-towns on the Ammo shelf.' },
      { y: '4,388 SR', t: 'The Kettobe Signal detected on Ossaran.' },
      { y: '8,406 SR', t: '[[opened-hand|The Opened Hand]]: first meeting with the Osse.' },
      { y: '15,871 SR', t: 'The relief fleet departs for Vantreth by the Long Way.' },
      { y: '34,140 SR', t: 'The 380th Moot adjourns, having resolved nothing, as intended.' },
    ],
    system: {
      stars: [star('G', { temp: 5_300 })],
      planets: [
        planet('Kettobe', 'reef', 0.36, 220, {
          radius: 0.0115,
          lights: 0.55,
          clouds: 0.45,
          atmosphere: '#8fd0d8',
          palette: ['#11405a', '#1d6a78', '#c7b38a'],
          moons: [
            moon('Imbe', 'barren', 0.035, 26, { radius: 0.0028 }),
            moon('Sarro', 'ice', 0.05, 44, { radius: 0.0032 }),
            moon('Tollo', 'barren', 0.068, 70, { radius: 0.0022 }),
          ],
          info: { summary: 'Ocean, tide and living reef. Home of the Tethri.', population: '6.9 billion' },
        }),
        planet('Hesso', 'gas', 0.8, 600, { palette: ['#3d5a58', '#6c8a80', '#b8ccbe'] }),
      ],
      structures: [{ kind: 'gate', radius: 0.6, size: 0.035, label: 'Braided anchor' }],
      extent: 1.0,
      traffic: 0.55,
    },
    tags: ['homeworld', 'tethri', 'ocean', 'reef', 'capital'],
    localDay: { name: 'Tide', hours: 12.9 },
  },
  {
    id: 'tul-varra',
    name: 'Tul Varra',
    aliases: [
      ['Tul Varra', 'Tethri–Ossic compound, "the two that turn"'],
      ['The Twinned', 'common'],
    ],
    designation: 'TM-14 · Double world',
    category: 'Double planet · Mixed Ossic–Tethri civilisation',
    icon: 'system',
    region: 'tethri',
    faction: 'tethri',
    pos: armPoint(0, 43_500, 1_500, -80),
    rank: 2,
    population: '3.2 billion across both worlds',
    facts: [
      ['Bodies', 'Tul (ocean, Tethri) and Varra (arid, Ossic) orbit each other every 9 days'],
      ['Language', 'Twin Speech — the only true Ossic–Tethri creole'],
      ['Transit', 'A tether-shuttle crosses between the worlds every 40 minutes'],
    ],
    summary:
      'Two worlds that orbit one another like dancers: Tul, a Tethri ocean, and Varra, a dry Ossic upland, settled at nearly the same time in the early Threading and never quite able to leave each other alone. Most families on Tul Varra have members on both; its creole, Twin Speech, is the only language in the galaxy that both peoples speak natively.',
    sections: [
      {
        title: 'Twin Speech',
        body:
          'Twin Speech uses Ossic word roots with Tethri grammar, which gives it the unusual property of forcing its speakers to say how long ago they began thinking about something before they are allowed to say it. The Colloquy at [[senn|Senn]] considers it one of the most beautiful languages in the Weft and one of the slowest.',
      },
    ],
    system: {
      stars: [star('K', { temp: 4_900 })],
      planets: [
        planet('Tul', 'ocean', 0.38, 230, {
          lights: 0.5,
          clouds: 0.5,
          atmosphere: '#8fc8e0',
          palette: ['#154a66', '#2a6e80', '#b0a888'],
          moons: [
            moon('Varra', 'desert', 0.04, 18, {
              radius: 0.0072,
              lights: 0.6,
              info: { summary: 'The Ossic half of the pair: dry uplands, terraced towns, a sky full of ocean.', population: '1.4 billion' },
            }),
          ],
          info: { summary: 'The Tethri half of the pair: shallow seas and reef-towns.', population: '1.8 billion' },
        }),
      ],
      extent: 0.7,
      traffic: 0.4,
    },
    tags: ['double planet', 'tethri', 'osse', 'language', 'culture'],
  },
  {
    id: 'ambo-sarre',
    name: 'Ambo Sarre',
    aliases: [
      ['Ambo Sarre', 'Tethri: "the garden that waits"'],
      ['TM-Preserve 3', 'Moot register'],
    ],
    designation: 'TM-P3 · Biological preserve',
    category: 'Biological preserve · Twenty-thousand-year forest',
    icon: 'system',
    region: 'tethri',
    faction: 'tethri',
    pos: armPoint(0, 55_000, -1_000, 60),
    rank: 2,
    population: '31,000 gardeners',
    facts: [
      ['Planted', '19,850 SR, during the Dim'],
      ['Designed to mature', 'c. 40,000 SR'],
      ['Species', '≈ 2.2 million, mostly engineered for succession over millennia'],
      ['Access', 'Gardeners only; visitors may watch from orbit'],
    ],
    summary:
      'During the Dim, when the network had failed and no one knew whether it would return, a Tethri gardening lineage began planting a forest designed to take twenty thousand years to reach maturity. It is now about three-quarters grown. Ambo Sarre is the most ambitious biological project in the galaxy and one of the quietest, and its gardeners intend to see it finished.',
    sections: [
      {
        title: 'Succession',
        body:
          'The forest is designed in waves: pioneer species that lived and died in the first millennium to build soil; canopy trees now twelve thousand years old; and the final generation, the "patient oaks," whose seeds have been waiting in vaults since the planting and will be sown only when the canopy allows. A gardener’s job is mostly to wait, and to write down what they saw while waiting.',
      },
    ],
    system: {
      stars: [star('G', { temp: 5_700 })],
      planets: [
        planet('Ambo Sarre', 'garden', 0.33, 200, {
          lights: 0.02,
          clouds: 0.55,
          atmosphere: '#98c8b0',
          palette: ['#1e4058', '#244e2e', '#4e7a3e'],
          info: { summary: 'A forest three-quarters of the way through a twenty-thousand-year life.', population: '31,000' },
        }),
      ],
      extent: 0.6,
      traffic: 0.05,
    },
    tags: ['preserve', 'forest', 'tethri', 'long projects'],
  },
  {
    id: 'hesk',
    name: 'Hesk',
    aliases: [
      ['Hesk', 'Tethri: "held"'],
      ['Quarantine Q-9', 'Moot and Plenary joint register'],
      ['the Bloom', 'common'],
    ],
    designation: 'Q-9 · Quarantined system',
    category: 'Quarantine · Runaway biosphere',
    icon: 'restricted',
    region: 'tethri',
    faction: 'tethri',
    pos: armPoint(0, 58_500, 2_600, 180),
    rank: 1,
    population: 'Unknown. The colony of 1.2 million was lost in 19,400 SR.',
    facts: [
      ['Event', '[[event:hesk-bloom|The Hesk Bloom]], 19,400 SR'],
      ['Cordon', '300 Tethri watch-buoys at 0.9 ly; no landing, no overflight'],
      ['Surface', 'Covered in a single iridescent organism, pattern-shifting'],
      ['Last change of pattern', '34,196 SR'],
    ],
    summary:
      'A terraforming reef-organism, left running unsupervised through the Dim, did its job too well. By 19,400 SR it had covered the continents, then the seas, then the colony. Since then Hesk has been held behind a Tethri cordon. The planet is beautiful from a distance — iridescent, banded, slowly changing — and no one has been closer than a light-year in fourteen thousand years.',
    sections: [
      {
        title: 'The patterns',
        body:
          'Every few decades the organism rearranges its surface colours across the whole planet in a matter of days. Cordon watchers log each new pattern. The Moot’s official position is that the changes are seasonal. The watchers’ unofficial position, shared over drinks, is that nothing on Hesk has had a season in a very long time.',
      },
    ],
    warning: 'Quarantine. No vessel may cross the cordon. Violations are dealt with by the Moot directly.',
    system: {
      stars: [star('F', { temp: 6_200 })],
      planets: [
        planet('Hesk', 'bloom', 0.34, 200, {
          atmosphere: '#b0e0c8',
          palette: ['#2a5e58', '#8a4e8e', '#d8c070'],
          info: { summary: 'Covered in a single organism. Held behind a cordon for 14,000 years.' },
        }),
        planet('Watch', 'barren', 0.6, 420, { lights: 0.2 }),
      ],
      structures: [{ kind: 'cordon', radius: 0.9, count: 120, label: 'The cordon' }],
      extent: 1.0,
      traffic: 0.04,
    },
    tags: ['quarantine', 'biology', 'hazard', 'tethri', 'mystery'],
  },
  {
    id: 'long-choir',
    name: 'The Long Choir',
    aliases: [
      ['The Long Choir', 'common'],
      ['Amme Sorro Tollo', 'Tethri: "those who go slowly singing"'],
      ['FLT-0', 'Plenary register (a moving entry)'],
    ],
    designation: 'FLT-0 · Nomadic fleet',
    category: 'Nomadic civilisation · Sublight fleet',
    icon: 'fleet',
    region: 'tethri',
    faction: 'freeholds',
    pos: armPoint(0, 62_000, -3_500, 300),
    rank: 1,
    population: '≈ 34 million aboard 90,000 vessels',
    facts: [
      ['Underway since', '23,190 SR'],
      ['Speed', '11% of lightspeed, between stars'],
      ['Belief', 'Threads are wounds; one should travel as light does'],
      ['Broadcast', 'Continuous music for 11,000 years, never repeated'],
    ],
    summary:
      'Ninety thousand ships travelling together along the southern arm, slower than light and by choice. The Long Choir believes — since the Severance — that threads wound space, and that a decent people should travel the way light does. They have been under way for eleven thousand years, stopping at gas giants to refuel, and they have been singing the entire time.',
    sections: [
      {
        title: 'The song',
        body:
          'The Choir broadcasts continuous music on every band it can reach. Each ship contributes a voice; each generation composes its own movement; nothing is ever repeated. Radio astronomers in systems the fleet passed centuries ago can still hear it, fading, as it spreads outward at the speed of light.',
      },
      {
        title: 'Joining',
        body:
          'Anyone may join the Choir at a refuelling stop. They must bring a song and leave behind anything that uses a thread. Most who join are young and leave within a decade. Some stay nine hundred years.',
      },
    ],
    system: {
      stars: [],
      planets: [],
      starless: true,
      special: 'fleet',
      structures: [{ kind: 'fleet', count: 2_400, length: 1.6, label: 'The fleet' }],
      extent: 1.2,
      traffic: 0.6,
    },
    tags: ['nomads', 'fleet', 'music', 'religion', 'sublight', 'tethri'],
  },
  {
    id: 'shoals',
    name: 'The Magnetar Shoals',
    aliases: [
      ['The Shoals', 'common'],
      ['Tresse Kado', 'Tethri: "the teeth"'],
    ],
    designation: 'HZD-4 · Navigation hazard',
    category: 'Neutron star field · Salvage grounds',
    icon: 'anomaly',
    region: 'tethri',
    faction: 'freeholds',
    pos: armPoint(0, 67_000, 800, -120),
    rank: 2,
    population: '≈ 400,000 Shoal-runners and salvagers',
    facts: [
      ['Objects', 'Three magnetars within 6 light-years of one another'],
      ['Hazard', 'Magnetic fields strong enough to wreck an anchor at a light-day'],
      ['Wrecks', 'Uncounted; the Shoals are a salvage economy'],
    ],
    summary:
      'Three magnetars — neutron stars with magnetic fields a quadrillion times Kettobe’s — sit close together in the outer southern arm, and no thread can be anchored anywhere near them. Ships crossing the region fly by hand, and many do not make it. The Shoal-runners who guide them, and the salvagers who pick over the ones who did not, are the roughest people in the Tethri Reach.',
    sections: [
      {
        title: 'Shoal-running',
        body:
          'A runner’s fee is paid half on departure and half on arrival, and runners who lose a ship are not paid the second half, which is considered by the Shoals to be all the regulation required. The best runners are Tethri; they are not faster, but they are patient enough to wait for a starquake to pass.',
      },
    ],
    warning: 'No anchoring within 6 ly. Starquakes can occur without warning.',
    system: {
      stars: [
        star('NS', { temp: 90_000, pulsar: true }),
        star('NS', { temp: 70_000, pulsar: true, orbit: { r: 0.8, period: 3000, phase: 1 } }),
        star('NS', { temp: 70_000, pulsar: true, orbit: { r: 1.2, period: 4400, phase: 3.5 } }),
      ],
      planets: [],
      structures: [
        { kind: 'wreck', count: 14, radius: 0.9, label: 'Wrecks' },
        { kind: 'beams', count: 2, radius: 1.3 },
      ],
      extent: 1.4,
      traffic: 0.12,
    },
    tags: ['neutron stars', 'hazard', 'salvage', 'tethri'],
  },
  {
    id: 'oum',
    name: 'The Bell of Oum',
    aliases: [
      ['Oum', 'Freehold name'],
      ['the Bell', 'common'],
    ],
    designation: 'FH-221 · Freehold',
    category: 'Geological anomaly · Nearly uninhabited world',
    icon: 'system',
    region: 'rim',
    faction: 'freeholds',
    pos: polarPoint(195, 45_000, 400),
    rank: 2,
    population: '900 (bell-keepers, and those who came to hear it)',
    facts: [
      ['The Bell', 'A hollow mountain 11 km high that rings every 41 hours'],
      ['Cause', 'Atmospheric tides resonating in a natural cavity. Probably.'],
      ['Audible', 'Across the whole planet, and faintly from orbit via the atmosphere'],
    ],
    summary:
      'An unremarkable, windswept world between the arms — except for a single hollow mountain that rings. Every forty-one hours the atmospheric tide drives air through a cavity in its peak and the whole world hums a low, clear note for about nine minutes. Nine hundred people live on Oum. Almost all of them came to hear it once and stayed.',
    sections: [
      {
        title: 'The keepers',
        body:
          'The bell-keepers have no duties, since the Bell rings on its own. They keep a log of every ringing — pitch, duration, weather — going back 14,000 years. The pitch has dropped by a quarter-tone over that time. The keepers regard this as the Bell growing old, and are not interested in other explanations.',
      },
    ],
    system: {
      stars: [star('K', { temp: 4_400 })],
      planets: [
        planet('Oum', 'desert', 0.3, 190, {
          lights: 0.03,
          clouds: 0.2,
          atmosphere: '#c8b8a0',
          palette: ['#6a5a4a', '#8e7a62', '#b8a48a'],
          info: { summary: 'A windswept world with a mountain that sings.', population: '900' },
        }),
      ],
      extent: 0.6,
      traffic: 0.02,
    },
    tags: ['geology', 'remote', 'low population', 'freeholds'],
  },
];
