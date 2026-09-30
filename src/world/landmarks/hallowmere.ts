import type { Landmark } from '../types';
import { armPoint, polarPoint } from '../galaxyModel';
import { moon, planet, star } from './helpers';

// Hallowmere Arm (the northern arm) and the Graveyard Reach inside it.

export const HALLOWMERE: Landmark[] = [
  {
    id: 'hallowmere',
    name: 'Hallowmere',
    aliases: [
      ['Hallowmere', 'Ossic: "the lake of evening"'],
      ['The Evening Seat', 'ceremonial'],
      ['HH-1', 'Houses register'],
    ],
    designation: 'HH-1 · Seat of the Hundred Houses',
    category: 'Tidally locked world · Terminator civilisation',
    icon: 'capital',
    region: 'hallow',
    faction: 'hallowmere',
    pos: armPoint(1, 46_000, 0, 80),
    rank: 1,
    population: '8.2 billion, all within 900 km of the terminator',
    facts: [
      ['Rotation', 'Tidally locked: one face in permanent day, one in permanent night'],
      ['Habitable band', 'The Evening — a twilight ring 1,800 km wide'],
      ['Government', 'The Hundred Houses (94 extant); a Speaker chosen by the Houses every 41 years'],
      ['Mourning colour', 'Cinderwake red, since 15,660 SR'],
    ],
    summary:
      'A world where the sun never moves. Hallowmere keeps one face to its star, so that half the planet is a glassy desert under endless noon and half is a glacier under endless night. Between them runs the Evening — a ring of permanent twilight, watered by meltwater, where the Hundred Houses built their cities and have never once, in eleven thousand years, seen a sunset.',
    sections: [
      {
        title: 'The Evening',
        body:
          'Hallowmerine architecture faces the sun: every hall, every window, every grave turns toward the low, unmoving light on the day-side horizon. Their calendar has no days, only the slow orbit of the year and the House rotations. Their poetry is obsessed with the idea of night falling, which for them is a metaphor for death, and with the idea of dawn, which they consider vulgar.',
      },
      {
        title: 'The Hundred Houses',
        body:
          'Formerly the Hallowmere Compact, the Houses were the only great power never conquered during the War of Cut Threads — thanks largely to [[oriel|Bastion Oriel]] and to the Tethri who relieved [[vantreth|Vantreth]]. They lost [[iridane|Iridane]] and four billion people. Hallowmere remains formally autonomous within the Weft and has voted against ending the supervision of [[qhorrat|Qhorrat]] in every session for eighteen thousand years.',
      },
    ],
    chronology: [
      { y: 'c. 9,100 SR', t: 'Settled by Ossic House-lines arriving along the first northern threads.' },
      { y: '11,640 SR', t: 'The Hallowmere Compact proclaimed.' },
      { y: '15,660 SR', t: 'The [[event:iridane|Breaking of Iridane]].' },
      { y: '16,104 SR', t: 'Signatory to the [[event:accord|Accord]].' },
      { y: '24,300 SR', t: 'Enters the Plenary as an autonomous member, on terms still being argued.' },
    ],
    system: {
      stars: [star('K', { temp: 4_300 })],
      planets: [
        planet('Hallowmere', 'twilight', 0.26, 170, {
          radius: 0.0105,
          lights: 0.8,
          tidalLock: true,
          atmosphere: '#e2a488',
          palette: ['#c9d7e0', '#4c6a4a', '#b8844e'],
          moons: [moon('Vesper', 'barren', 0.04, 34, { lights: 0.3 })],
          info: { summary: 'Day on one face, night on the other, and every city in between.', population: '8.2 billion' },
        }),
        planet('Lantern of Houses', 'gas', 0.62, 470, { palette: ['#5a4a58', '#8e7a8a', '#c8b8c2'] }),
      ],
      extent: 0.9,
      traffic: 0.55,
    },
    tags: ['capital', 'tidally locked', 'hallowmere', 'aristocracy', 'war'],
    localDay: { name: 'House rotation', hours: 41 },
  },
  {
    id: 'oriel',
    name: 'Bastion Oriel',
    aliases: [
      ['Oriel', 'Ossic: "the window"'],
      ['The Oriel Line', 'for its defences'],
      ['NVY-4', 'Plenary Navy register'],
    ],
    designation: 'NVY-4 · Fortress system',
    category: 'Military fortress · Navy yard',
    icon: 'system',
    region: 'hallow',
    faction: 'hallowmere',
    pos: armPoint(1, 41_000, -1_500, -100),
    rank: 1,
    population: '310 million (garrison, yard workers, families)',
    facts: [
      ['Defences', 'The Oriel Line: 1,200 platforms in three inclined shells'],
      ['Record', 'Besieged four times. Never taken.'],
      ['Current role', 'Joint Hallowmere garrison and Plenary Navy yard; museum'],
      ['Motto', '"We are the window; you are outside it."'],
    ],
    summary:
      'The gate of the Hallowmere Arm. During the War of Cut Threads the Qesh Ascendancy tried four times to break through Bastion Oriel into the northern arm and failed each time against the Oriel Line — twelve hundred fortified platforms englobing the star. The Line still stands. It is the most heavily armed place in the Weft, and one of the most peaceful.',
    sections: [
      {
        title: 'The Line',
        body:
          'The platforms are arranged in three shells at different inclinations so that any approach faces fire from two of them. Many date to the war and have been rebuilt so often that nothing of the original remains but the names, which are painted by hand on each hull every century: Stubborn, Unwelcome, Still Here, the Vessadine’s Kettle, and one called simply No.',
      },
      {
        title: 'After the war',
        body:
          'Oriel has not fired a shot in anger since 16,081 SR. Its garrison now trains Plenary and House navies together, runs the galaxy’s largest naval museum, and maintains a watch on [[elision|Zone 7]], which lies within sensor range and which the Bastion, uniquely, is permitted to observe.',
      },
    ],
    system: {
      stars: [star('F', { temp: 6_100 })],
      planets: [
        planet('Oriel', 'terran', 0.4, 240, {
          lights: 0.5,
          clouds: 0.35,
          atmosphere: '#a9c0e6',
          palette: ['#34566a', '#62704f', '#9a8a6a'],
          info: { summary: 'The garrison world, mostly barracks, yards and museum.', population: '240 million' },
        }),
      ],
      structures: [
        { kind: 'stations', count: 480, radius: 0.72, spread: 0.02, color: '#d7b8a4', label: 'The Oriel Line' },
        { kind: 'shipyard', radius: 0.55, count: 18, label: 'Navy yards' },
      ],
      extent: 1.0,
      traffic: 0.5,
    },
    tags: ['military', 'fortress', 'war', 'hallowmere'],
  },
  {
    id: 'seren',
    name: 'Seren',
    aliases: [
      ['Seren', 'Ossic: "the white"'],
      ['Amberlight', 'since the Dimming'],
      ['HH-12', 'Houses register'],
    ],
    designation: 'HH-12 · Engineered star',
    category: 'Stellar engineering · Sacred star',
    icon: 'structure',
    region: 'hallow',
    faction: 'hallowmere',
    pos: armPoint(1, 52_500, 1_200, 150),
    rank: 1,
    population: '1.1 billion',
    facts: [
      ['Original type', 'White F star'],
      ['Present type', 'Amber K-like, by mass removal'],
      ['The Dimming', '24,900–27,800 SR'],
      ['Mass removed', '≈ 21% of the original star'],
    ],
    summary:
      'Seren was white. The Houses of the northern arm made it amber — lifting a fifth of its mass away over three thousand years until the star cooled to the colour of evening light in the old Ossic hymns. It was an act of devotion, engineering and aesthetics in equal measure, and it made Seren the only star in the galaxy whose colour was chosen.',
    sections: [
      {
        title: 'The Dimming',
        body:
          'Hallowmerine theology holds that the proper light for living is evening light. In 24,900 SR the Houses voted to give one star that light permanently. The lifting rings that did the work are still in orbit, idle, kept as relics. Pilgrims come from across the arm to stand on the world Hymnal and see a noon that looks like a sunset.',
      },
      {
        title: 'The argument',
        body:
          'The Qesh Remnant has noted, repeatedly and in writing, that the Houses deliberately altered a star while demanding eternal penance from the people who invented the method. The Houses reply that they made Seren live longer and that the Qesh made stars die. The exchange is published annually by the Faculty of Grievances at [[lanternfall|Lanternfall]] as a teaching text.',
      },
    ],
    system: {
      stars: [star('K', { temp: 3_900, radius: 0.042, lifted: true })],
      planets: [
        planet('Hymnal', 'garden', 0.3, 180, {
          lights: 0.45,
          clouds: 0.5,
          atmosphere: '#e0b890',
          palette: ['#2e4a5e', '#6a6a3a', '#b08a58'],
          info: { summary: 'A garden world lit by a star turned amber on purpose.', population: '1.05 billion' },
        }),
        planet('Choir', 'gas', 0.7, 520, { palette: ['#6a4a3a', '#a07a5a', '#d8b890'] }),
      ],
      structures: [{ kind: 'lamps', count: 4, radius: 0.12, label: 'Lifting rings (idle)' }],
      extent: 0.9,
      traffic: 0.35,
    },
    tags: ['stellar engineering', 'religion', 'hallowmere', 'aesthetics'],
  },
  {
    id: 'senn',
    name: 'Senn',
    aliases: [
      ['The Colloquy of Senn', 'formal'],
      ['Senn', 'from Ossic Sennai, "the speaking"'],
    ],
    designation: 'HH-40 · Linguistic foundation',
    category: 'Scholarly world · Linguistic archive',
    icon: 'system',
    region: 'hallow',
    faction: 'hallowmere',
    pos: armPoint(1, 58_000, -800, -60),
    rank: 2,
    population: '420 million; 11,300 living languages spoken daily',
    facts: [
      ['Institution', 'The Colloquy, est. 12,300 SR'],
      ['Language families catalogued', 'Ossic (and its Hallowmerine, Hearthward and Low branches), Qesh, Tethri, Vauren tone-song, Ninefold formal, and the undeciphered Vey'],
      ['The Silent Chair', 'Reserved for the first speaker of Vey'],
    ],
    summary:
      'Every language spoken in the Wheel is spoken on Senn, by law. The Colloquy maintains living communities of speakers for eleven thousand tongues, including several that exist nowhere else any more, and translates the treaties, contracts and love letters of the galaxy between them. It is the reason a Qesh engineer and a Tethri elder can argue in their own languages and both lose.',
    sections: [
      {
        title: 'Layers of names',
        body:
          'Colloquy scholars will tell you that every old place in the Weft has at least four names: an indigenous one, a colonial one, a navigation register number, and whatever the pilots call it. Ossaran is also the Hearth and HP-1; the Spindle is also Vell-Tharun, CJ-1 and the Knot. Ossic supplies the ceremonial layer, the Low Tongues the practical one, and the Plenary register the one nobody says aloud.',
      },
      {
        title: 'The Silent Chair',
        body:
          'At every session of the Colloquy one chair is left empty for a speaker of Vey, the language of the vanished builders of Veyrhal. The script survives on the [[stillwater|Stillwater]] engines along [[region:stream|the Drowned Road]]; the sounds, if there ever were any, do not.',
      },
    ],
    system: {
      stars: [star('G', { temp: 5_500 })],
      planets: [
        planet('Senn', 'terran', 0.34, 200, {
          lights: 0.55,
          clouds: 0.5,
          atmosphere: '#a8c4ec',
          palette: ['#2c5270', '#58704c', '#a89468'],
          moons: [moon('Gloss', 'ice', 0.045, 36)],
          info: { summary: 'World of the Colloquy, where every language is kept alive.', population: '420 million' },
        }),
      ],
      extent: 0.7,
      traffic: 0.3,
    },
    tags: ['language', 'scholarship', 'hallowmere'],
  },
  {
    id: 'vigil',
    name: 'Red Vigil',
    aliases: [
      ['Vigil', 'from House Vigil, which holds it'],
      ['Amarre', 'Ossic star name'],
    ],
    designation: 'HH-66 · Evacuating system',
    category: 'Dying star · Planetary migration',
    icon: 'system',
    region: 'hallow',
    faction: 'hallowmere',
    pos: armPoint(1, 64_000, 2_000, 200),
    rank: 1,
    population: '5.4 billion on four moving worlds',
    facts: [
      ['Star', 'Red giant, expanding; will engulf the inner system within ~4,000 years'],
      ['Response', 'The Walking of the Worlds: engines on four planets, begun 32,700 SR'],
      ['Duration', '1,900 years planned; 1,511 years to go'],
      ['Speed', 'About 60 metres per second outward, per world'],
    ],
    summary:
      'Red Vigil’s star is dying — swelling into a red giant that will swallow the inner planets. The Hallowmerine House that holds the system refused to evacuate. Instead, in 32,700 SR, it lit engines on four inhabited worlds and began walking them outward, very slowly, ahead of the sun. Their fusion plumes are visible from neighbouring systems.',
    sections: [
      {
        title: 'The Walking',
        body:
          'Each world carries a ring of engines along its trailing hemisphere, fired continuously for nineteen centuries. The acceleration is imperceptible; the seasons are not. Every year is slightly longer and slightly colder than the last, and the Walkers have added a month to their calendar twice already.',
      },
      {
        title: 'Why not leave',
        body:
          'House Vigil’s answer is carved above the engine halls on Watchful: "The Houses do not abandon a seat." Critics call it the most expensive act of stubbornness in the galaxy. Its supporters point out that it is working.',
      },
    ],
    system: {
      stars: [star('RG', { temp: 3_400, radius: 0.22, flicker: 0.1 })],
      planets: [
        planet('Watchful', 'terran', 0.46, 300, {
          engine: true,
          lights: 0.6,
          clouds: 0.35,
          atmosphere: '#e0a080',
          palette: ['#34506a', '#6a6a44', '#a8845a'],
          info: { summary: 'The first walking world; engine halls line its trailing hemisphere.', population: '2.8 billion' },
        }),
        planet('Patient', 'ocean', 0.62, 420, {
          engine: true,
          lights: 0.4,
          clouds: 0.5,
          atmosphere: '#c8a090',
          palette: ['#1d3d5c', '#2a5a6a', '#6a8a7a'],
          info: { summary: 'An ocean world under way.', population: '1.6 billion' },
        }),
        planet('Longing', 'ice', 0.8, 580, { engine: true, lights: 0.3 }),
        planet('Last Door', 'barren', 0.98, 760, { engine: true, lights: 0.25 }),
      ],
      structures: [{ kind: 'engines' }],
      extent: 1.2,
      traffic: 0.35,
    },
    tags: ['dying star', 'migration', 'engines', 'hallowmere'],
  },
  // --- The Graveyard Reach -------------------------------------------------
  {
    id: 'vantreth',
    name: 'Vantreth',
    aliases: [
      ['Vantreth', 'Ossic: "the unbent"'],
      ['GR-Memorial 2', 'Plenary register'],
    ],
    designation: 'GR-M2 · War memorial',
    category: 'Fortress ruin · Siege site',
    icon: 'ruin',
    region: 'graveyard',
    faction: 'hallowmere',
    pos: polarPoint(125, 26_000, 60),
    rank: 1,
    population: '90,000 (memorial custodians and a stubborn farming town)',
    facts: [
      ['Siege', '[[event:vantreth|15,831–15,902 SR]] — 71 years, threads cut'],
      ['Relieved by', 'A Tethri fleet via the Long Way'],
      ['Debris', '≈ 40,000 tracked fragments of the siege fleets'],
      ['Grey threads', '9 cut threads still terminate here'],
    ],
    summary:
      'For seventy-one years Vantreth held with its threads cut, surrounded, supplied by nothing but its own fields and foundries. It fell silent to the rest of the galaxy for two generations — and then a Tethri fleet that had crossed the outer disk the slow way appeared in its sky. The orbital plane is still full of the wreckage of both sides.',
    sections: [
      {
        title: 'The siege',
        body:
          'The Qesh cut every thread into Vantreth in 15,831 SR and parked a fleet in orbit. The defenders dug into the crust and farmed under lamps. Two generations were born who had never seen an outside ship that was not hostile. When the relief fleet from [[kettobe|Kettobe]] arrived, having threaded its way around the outer disk and around [[elision|a region nobody would chart]], the defenders at first refused to open their doors.',
      },
      {
        title: 'The Long Way',
        body:
          'The Tethri route to Vantreth — thirty-one years of hops along braided songlines and abandoned survey threads that the Qesh had never bothered to cut — is still charted as a dormant route and walked by pilgrims in reverse, from Vantreth back toward the south. Several systems along it were settled by Tethri veterans afterwards, which is why a string of Tethri-named worlds lies improbably far from the southern arm.',
      },
    ],
    system: {
      stars: [star('K', { temp: 4_700 })],
      planets: [
        planet('Vantreth', 'barren', 0.34, 200, {
          radius: 0.0095,
          lights: 0.15,
          palette: ['#4a4038', '#6e6254', '#948674'],
          atmosphere: '#a89080',
          info: { summary: 'Scarred, cratered, and still farmed. The deep halls are a museum.', population: '90,000' },
        }),
      ],
      structures: [
        { kind: 'debris', count: 2_600, radius: 0.34, spread: 0.12, thickness: 0.02, color: '#8a8074', label: 'Siege wreckage' },
        { kind: 'wreck', count: 6, radius: 0.5, label: 'Hulks' },
        { kind: 'gate', radius: 0.7, size: 0.03, dormant: true, label: 'Cut anchor' },
      ],
      extent: 0.9,
      traffic: 0.08,
    },
    tags: ['war', 'ruin', 'siege', 'memorial', 'tethri', 'graveyard'],
  },
  {
    id: 'iridane',
    name: 'Iridane',
    aliases: [
      ['Iridane', 'Ossic: "the treasured"'],
      ['the Shatter', 'common'],
      ['GR-Memorial 1', 'Plenary register'],
    ],
    designation: 'GR-M1 · Destroyed world, memorial',
    category: 'Destroyed planet · War memorial',
    icon: 'ruin',
    region: 'graveyard',
    faction: 'hallowmere',
    pos: polarPoint(140, 20_000, -90),
    rank: 1,
    population: 'None. Visits by lottery, one ship per day.',
    facts: [
      ['Destroyed', '[[event:iridane|15,660 SR]] by a Qesh gravitic mine'],
      ['Dead', '≈ 4.1 billion'],
      ['Remains', 'A debris ring along the former orbit; the core fragment, "the Heart-Stone"'],
      ['Observance', 'The Iridane Silence, galaxy-wide, each year'],
    ],
    summary:
      'Iridane was the treasury world of the Hallowmere Compact — rich, beautiful and far from the front. In 15,660 SR a Qesh gravitic mine broke it apart. Its fragments have since spread into a ring along its old orbit, circling a star that still shines as though nothing happened. It is the largest grave in the galaxy.',
    sections: [
      {
        title: 'The Silence',
        body:
          'Once a standard year, every thread junction in the Weft pauses traffic for one minute. Hallowmere asked for a day; the Plenary offered a second; they settled on a minute in 22,500 SR, and the Houses have never forgiven the haggling. At [[qhorrat|Qhorrat]], the Silence is observed too — privately, in the Undervaults, and never with foreign guests.',
      },
      {
        title: 'The Heart-Stone',
        body:
          'The largest surviving fragment is 900 kilometres across and still bears, on its broken face, a section of the Treasury Library’s foundations. Nothing is permitted to land on it. Each year one visiting ship, chosen by lottery, may approach within sight.',
      },
    ],
    system: {
      stars: [star('G', { temp: 5_800 })],
      planets: [planet('Eune', 'barren', 0.2, 110)],
      structures: [
        { kind: 'debris', count: 6_000, radius: 0.42, spread: 0.03, thickness: 0.006, color: '#9a8e82', label: 'The Shatter' },
        { kind: 'wreck', count: 1, radius: 0.42, label: 'The Heart-Stone' },
      ],
      extent: 0.9,
      traffic: 0.03,
    },
    tags: ['war', 'destroyed world', 'memorial', 'hallowmere', 'graveyard'],
  },
  {
    id: 'unlit',
    name: 'The Unlit',
    aliases: [
      ['Ossevar', 'Ossic: "the steady one" — its name before'],
      ['The Unlit', 'common since 15,420 SR'],
      ['GR-Memorial 3', 'Plenary register'],
    ],
    designation: 'GR-M3 · Killed star',
    category: 'Stripped stellar core · Frozen system',
    icon: 'ruin',
    region: 'graveyard',
    faction: 'none',
    pos: polarPoint(110, 24_000, 140),
    rank: 1,
    population: '≈ 2,000 archaeologists in season',
    facts: [
      ['Killed', '[[event:unlighting|15,420 SR]], by Qesh star-lance, over 19 days'],
      ['Remnant', 'A naked stellar core inside the expanding shell of its own envelope'],
      ['Planets', 'Three, frozen; cities preserved under 14,000 years of ice'],
    ],
    summary:
      'The first star anyone ever killed on purpose. The Qesh star-lance stripped Ossevar’s outer layers away in nineteen days, and what is left is a small, fierce, dying core inside a slowly expanding bubble of its own former self. Its three inhabited worlds froze within a year. Their cities are still there, under the ice, exactly as they were.',
    sections: [
      {
        title: 'The frozen cities',
        body:
          'On Ossevar Second the capital, Tellane, lies beneath forty metres of frozen atmosphere. Excavations have reached streets with vehicles still parked in them and shops with their shutters half-drawn. The Collegium rules require archaeologists to leave every excavated room as they found it, apart from the ice.',
      },
      {
        title: 'The shell',
        body:
          'The stripped envelope still glows faintly as it expands — a thin, rust-and-teal bubble now several light-years across. From inside, the dead system looks like it is sitting at the centre of an enormous, slowly opening eye.',
      },
    ],
    system: {
      stars: [star('WD', { temp: 60_000, radius: 0.014 })],
      planets: [
        planet('Ossevar First', 'ice', 0.2, 130, { palette: ['#b8c4cc', '#d8dfe4', '#8a98a4'] }),
        planet('Ossevar Second', 'ice', 0.34, 210, {
          lights: 0.05,
          palette: ['#a8b8c4', '#d0dce4', '#7a8a98'],
          info: { summary: 'The frozen capital world; the city of Tellane lies under forty metres of ice.', population: '≈ 2,000 in season' },
        }),
        planet('Ossevar Third', 'ice', 0.56, 360),
      ],
      structures: [{ kind: 'nebula', radius: 2.4, color: '#ff8a60', color2: '#60d8c8', density: 0.45, label: 'Envelope shell' }],
      extent: 1.4,
      traffic: 0.02,
      special: 'nebula',
    },
    tags: ['war', 'dead star', 'archaeology', 'ruin', 'graveyard'],
  },
  {
    id: 'severance',
    name: 'The Severance',
    aliases: [
      ['The Severance', 'common'],
      ['Junction Null', 'Plenary register — it had no name before'],
      ['the Frays', 'pilots’ usage'],
    ],
    designation: 'HZD-1 · Navigation hazard',
    category: 'Anomaly · Site of 41 cut threads',
    icon: 'anomaly',
    region: 'graveyard',
    faction: 'none',
    pos: polarPoint(152, 17_000, 30),
    rank: 1,
    population: 'None. A Collegium observation post keeps its distance.',
    facts: [
      ['Cut', '[[event:severance|15,011 SR]], within a single standard hour'],
      ['Threads', '41 severed ends that never closed'],
      ['Lost in transit', '≈ 11,000 ships, never found'],
      ['Hazard', 'Unpredictable spatial folding within 2 ly of the ends'],
    ],
    summary:
      'Threads are meant to close when cut, like a wound. These did not. In 15,011 SR Qesh sappers severed forty-one threads meeting at an unnamed junction in the same hour, and the forty-one cut ends are still open — flickering scars in space that fold and unfold, and that occasionally, faintly, emit fragments of traffic eighteen thousand years old.',
    sections: [
      {
        title: 'The ghost traffic',
        body:
          'The Collegium post records, every few years, a burst of signal from one of the ends: a docking request, a cargo manifest, a voice asking for clearance. All of it dates from the hour of the cut. None of it has ever been answered, by regulation. The post’s staff are rotated every two years for their own sake.',
      },
      {
        title: 'The Ledger',
        body:
          'In 33,980 SR the Ninefold matched the lengths of these forty-one threads to values in the [[orrhune|Quiet Ledger]] circling Orrhune. No one has explained why a signal at the edge of a black hole should be counting them.',
      },
    ],
    warning: 'Hazard zone. Do not approach within 2 ly of the frayed ends. Unanswered signals are to be logged, not answered.',
    system: {
      stars: [star('M', { temp: 3_000, radius: 0.018 })],
      planets: [],
      structures: [{ kind: 'gate', radius: 0.4, size: 0.02, dormant: true, label: 'Observation post' }],
      extent: 1.4,
      traffic: 0,
      special: 'void',
    },
    tags: ['anomaly', 'war', 'threads', 'hazard', 'mystery', 'graveyard'],
  },
];
