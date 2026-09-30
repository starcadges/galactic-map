import type { Era, HistEvent } from './types';

// Standard Reckoning (SR) counts years from the First Crossing — the day the
// sail-ark Patience of Salt reached Tessivel. The present is 34,211 SR.

export const PRESENT_YEAR = 34_211;

export const ERAS: Era[] = [
  {
    id: 'hearth',
    name: 'Hearthtime',
    start: -40_000,
    end: 0,
    blurb:
      'Before the Crossing. The Osse on Ossaran and, unknown to them, the Tethri on Kettobe, each alone under a sky full of someone else’s ruins.',
  },
  {
    id: 'sail',
    name: 'The Sail Age',
    start: 0,
    end: 3_100,
    blurb:
      'Beamed-light sail-lines push arks between nearby stars at a tenth of lightspeed. A sphere of settlement two thousand light-years wide grows around Ossaran, one generation at a time.',
  },
  {
    id: 'lamps',
    name: 'The Separate Lamps',
    start: 3_100,
    end: 7_940,
    blurb:
      'Settlements too distant to answer one another drift into independent polities. The Ossic tongue splinters; the Low Tongues are born; a signal arrives from a people who are not Osse.',
  },
  {
    id: 'threading',
    name: 'The Threading',
    start: 7_940,
    end: 11_200,
    blurb:
      'At Lanternfall, the first thread: a paired anchor that makes two places adjacent. The network grows like mycelium along wherever anchors are carried.',
  },
  {
    id: 'compacts',
    name: 'The Compacts',
    start: 11_200,
    end: 14_480,
    blurb:
      'Regional powers crystallise around thread junctions: the Hallowmere Compact, the Qesh Ascendancy, the Low Leagues, the Tethri Moot. Nine minds are emancipated.',
  },
  {
    id: 'war',
    name: 'The War of Cut Threads',
    start: 14_480,
    end: 16_104,
    blurb:
      'Sixteen centuries of war over the deep anchors at the core. Threads are severed to isolate enemies; stars are unlit; a world is broken. It ends at Orrhune with a treaty nobody wanted and everybody kept.',
  },
  {
    id: 'dim',
    name: 'The Dim',
    start: 16_104,
    end: 20_900,
    blurb:
      'Untended threads fray and fail. Whole arms fall silent. Machines keep the archives; some colonies forget they were ever part of anything.',
  },
  {
    id: 'relighting',
    name: 'The Relighting',
    start: 20_900,
    end: 24_700,
    blurb:
      'Lamplighters recover anchor-pairs from the archives and re-thread the galaxy by hand. The Plenary is convened at Calyx to keep the threads tended forever.',
  },
  {
    id: 'weave',
    name: 'The High Weave',
    start: 24_700,
    end: 30_100,
    blurb:
      'The golden age of scale: computation swarms, artificial stars, the Tessary at the core, a thread thrown out into the halo toward a cluster that stopped answering.',
  },
  {
    id: 'afternoon',
    name: 'The Long Afternoon',
    start: 30_100,
    end: 34_211,
    blurb:
      'The present. Wealthy, slow, litigious. Great works age; old questions are inherited rather than answered.',
  },
];

export const EVENTS: HistEvent[] = [
  {
    id: 'first-crossing',
    year: 0,
    title: 'The First Crossing',
    era: 'sail',
    places: ['ossaran', 'tessivel'],
    text:
      'The sail-ark Patience of Salt reaches [[tessivel|Tessivel]] after a 131-year flight from [[ossaran|Ossaran]]. Of the 6,400 who boarded, 9,100 disembark. Standard Reckoning begins on the day of landing.',
  },
  {
    id: 'oldport-lines',
    year: 1_420,
    title: 'Oldport becomes the hub of the sail-lines',
    era: 'sail',
    places: ['oldport', 'ossaran', 'tessivel'],
    text:
      'The great beam stations at [[oldport|Oldport]] come online, able to push arks toward eleven stars at once. For two thousand years every journey out of the Hearthward begins there.',
  },
  {
    id: 'tethri-signal',
    year: 4_388,
    title: 'The Kettobe Signal',
    era: 'lamps',
    places: ['kettobe', 'ossaran'],
    text:
      'Receivers on [[ossaran|Ossaran]] detect a structured transmission from the southern arm: the Tethri of [[kettobe|Kettobe]], broadcasting tide tables to anyone listening. A reply is sent. The conversation takes 5,700 years per exchange; three exchanges are completed before the threads make it unnecessary.',
  },
  {
    id: 'lanternfall',
    year: 7_940,
    title: 'The First Thread',
    era: 'threading',
    places: ['lanternfall', 'ossaran'],
    text:
      'At [[lanternfall|Lanternfall]], Imre Vessadine and the Collegium bind two anchors, carry one 0.3 light-years by tug, and speak through the gap without delay. The second anchor-pair reaches [[ossaran|Ossaran]] eleven years later.',
  },
  {
    id: 'opened-hand',
    year: 8_406,
    title: 'The Opened Hand',
    era: 'threading',
    places: ['opened-hand', 'kettobe'],
    text:
      'An Ossic thread-carrier and a Tethri survey ship arrive at the same refuelling rock, [[opened-hand|Kettle Point]], within a day of one another. The first in-person meeting of the two peoples takes place over a supply crate, which is still there.',
  },
  {
    id: 'deep-anchors',
    year: 10_450,
    title: 'Discovery of deep anchoring',
    era: 'threading',
    places: ['spindle', 'orrhune', 'plumb'],
    text:
      'Qesh surveyors at [[plumb|the Plumb]] find that anchors set in the steep gravity near [[orrhune|Orrhune]] hold threads five hundred times longer. The [[spindle|Spindle]] begins to grow, and so does the Qesh Ascendancy.',
  },
  {
    id: 'emancipation',
    year: 12_040,
    title: 'The Ninefold Emancipation',
    era: 'compacts',
    places: ['quorum', 'coldstack'],
    text:
      'Nine archival minds petition the Hallowmere Compact for standing in law, and win by a margin of one House. They withdraw to [[quorum|Quorum]], and take on the keeping of [[coldstack|Coldstack]] as their first act as citizens.',
  },
  {
    id: 'war-begins',
    year: 14_480,
    title: 'The Sealing of the Core',
    era: 'war',
    places: ['qhorrat', 'spindle', 'orrhune'],
    text:
      'The Ascendancy at [[qhorrat|Qhorrat]] declares the core anchors sovereign and closes the [[spindle|Spindle]] to all traffic but its own. The Hallowmere Compact and the Low Leagues answer by cutting the Qesh out of the outer network. The War of Cut Threads begins.',
  },
  {
    id: 'severance',
    year: 15_011,
    title: 'The Severance',
    era: 'war',
    places: ['severance', 'qhorrat'],
    text:
      'In a single standard hour, forty-one threads meeting at [[severance|a nameless junction]] are cut by Qesh sappers. Their cut ends never close. Eleven thousand ships in transit are never found.',
  },
  {
    id: 'unlighting',
    year: 15_420,
    title: 'The Unlighting of Ossevar',
    era: 'war',
    places: ['unlit'],
    text:
      'The Ascendancy uses its star-lance on [[unlit|Ossevar]], stripping the star’s envelope in nineteen days. It is the first time a people deliberately kills a star. It will not be the last time during the war.',
  },
  {
    id: 'iridane',
    year: 15_660,
    title: 'The Breaking of Iridane',
    era: 'war',
    places: ['iridane', 'hallowmere'],
    text:
      '[[iridane|Iridane]], seat of the Compact’s treasury, is broken by a Qesh gravitic mine. Four billion die. The anniversary is kept across the galaxy as the Iridane Silence.',
  },
  {
    id: 'vantreth',
    year: 15_831,
    yearLabel: '15,831–15,902 SR',
    title: 'The Siege of Vantreth',
    era: 'war',
    places: ['vantreth', 'kettobe', 'elision'],
    text:
      'The fortress world [[vantreth|Vantreth]] holds for seventy-one years with its threads cut. It is relieved when a Tethri fleet, locked out of the main network, arrives hop by hop along ninety braided songlines and forgotten survey threads — curving around [[elision|a region the charts no longer name]] — by a route still called the Long Way.',
  },
  {
    id: 'accord',
    year: 16_104,
    title: 'The Accord of the Still Hour',
    era: 'war',
    places: ['orrhune', 'qhorrat', 'pell-custodial', 'hallowmere'],
    text:
      'Eleven exhausted signatories meet on a drifting relay within sight of [[orrhune|Orrhune]] and agree: no weapon at the core, no star to be harmed, the Qesh command to exile in [[pell-custodial|Pell]]. The signing takes one standard hour, during which every engine in the Exclusion is shut down. The practice is still observed.',
  },
  {
    id: 'dim-begins',
    year: 16_400,
    title: 'The Fraying',
    era: 'dim',
    places: ['coldstack', 'oriel'],
    text:
      'With the war economy gone, no one pays to tend the threads. Two thirds of the network frays within three centuries. [[coldstack|Coldstack]] records the last message received from each place that goes silent.',
  },
  {
    id: 'hesk-bloom',
    year: 19_400,
    title: 'The Hesk Bloom',
    era: 'dim',
    places: ['hesk'],
    text:
      'A biological experiment on [[hesk|Hesk]], left running through the Dim, overwhelms its colony. The Tethri establish the cordon that still stands.',
  },
  {
    id: 'relighting',
    year: 20_900,
    title: 'The Lamplighters depart Coldstack',
    era: 'relighting',
    places: ['coldstack', 'calyx', 'saltwhistle'],
    text:
      'Using anchor-pairs preserved by the Ninefold at [[coldstack|Coldstack]], the first Lamplighter crews set out to re-thread the galaxy. They reach [[calyx|Calyx]] in 21,340 SR and [[saltwhistle|Saltwhistle]] in 21,812.',
  },
  {
    id: 'plenary',
    year: 22_418,
    title: 'The First Plenary',
    era: 'relighting',
    places: ['calyx', 'anvell'],
    text:
      'Delegates of 3,300 relit systems convene at [[calyx|Calyx]] and found the Plenary of the Weft to keep the threads tended in perpetuity. Its first act is a maintenance budget. Its second is a dispute over the first, referred to [[anvell|Anvell]], where it remains open.',
  },
  {
    id: 'deliberation',
    year: 25_300,
    title: 'The Deliberation is switched on',
    era: 'weave',
    places: ['ishmere', 'quorum'],
    text:
      'The computation swarm at [[ishmere|Ishmere]] begins its first problem. Its shadow passes across the star every nineteen hours; the problem is still running.',
  },
  {
    id: 'tessary',
    year: 26_050,
    title: 'The Tessary completed',
    era: 'weave',
    places: ['orrhune'],
    text:
      'Forty-one thousand stations close their ring around [[orrhune|Orrhune]]. The first image of the photon ring is shown to the Plenary; delegates reportedly stand for eleven minutes without speaking.',
  },
  {
    id: 'kindle-lit',
    year: 26_900,
    title: 'Kindle is lit',
    era: 'weave',
    places: ['kindle'],
    text:
      'The Candlewrights ignite [[kindle|Kindle]], an artificial star built to warm a starless flotilla of habitats on the Far Rim.',
  },
  {
    id: 'unanswered',
    year: 27_300,
    title: 'The Line to Aurel',
    era: 'weave',
    places: ['tollhouse', 'aurel'],
    text:
      'A thread is carried out of the disk, through the halo, to the globular cluster [[aurel|Aurel]], whose people had been corresponding with the Plenary for four thousand years. [[tollhouse|The Last Tollhouse]] opens at the disk end.',
  },
  {
    id: 'aurel-silence',
    year: 29_880,
    title: 'Aurel falls silent',
    era: 'weave',
    places: ['aurel', 'tollhouse'],
    text:
      'Traffic from [[aurel|Aurel]] stops. The thread remains intact. Inquiries sent along it are received and acknowledged by automatic systems; no one replies.',
  },
  {
    id: 'guttering',
    year: 31_002,
    title: 'The Guttering',
    era: 'afternoon',
    places: ['kindle'],
    text:
      'Part of [[kindle|Kindle]]’s containment lattice fails. The artificial star survives, unevenly, and has flickered ever since.',
  },
  {
    id: 'elision',
    year: 31_540,
    title: 'Deprecation of Zone 7',
    era: 'afternoon',
    places: ['elision', 'oriel'],
    text:
      'The Plenary Cartographic Office withdraws all charting of a region near the outer disk, now [[elision|Navigational Deprecation Zone 7]]. Routes are rebuilt to bend around it. No reason is published.',
  },
  {
    id: 'walking',
    year: 32_700,
    title: 'The Walking of the Worlds',
    era: 'afternoon',
    places: ['vigil'],
    text:
      'At [[vigil|Red Vigil]], engines are lit on four inhabited planets to walk them outward ahead of their swelling star. The journey is scheduled to take nineteen hundred years.',
  },
  {
    id: 'ledger',
    year: 33_980,
    title: 'The Ledger read in part',
    era: 'afternoon',
    places: ['orrhune', 'coldstack', 'severance'],
    text:
      'The Ninefold at [[coldstack|Coldstack]] announce that 41 of the 1,008 values in the Quiet Ledger, the signal circling just outside [[orrhune|Orrhune]], match the lengths of the threads cut at [[severance|the Severance]]. The other 967 match nothing yet.',
  },
];

export const EVENT_BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

export function eraOf(year: number): Era {
  return ERAS.find((e) => year >= e.start && year < e.end) ?? ERAS[ERAS.length - 1];
}

export function fmtYear(y: number): string {
  if (y < 0) return `${Math.abs(y).toLocaleString('en-US')} before Crossing`;
  return `${y.toLocaleString('en-US')} SR`;
}
