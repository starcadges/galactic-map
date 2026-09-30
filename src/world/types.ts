export type Vec3 = [number, number, number];

export type FactionId =
  | 'plenary'
  | 'hallowmere'
  | 'leagues'
  | 'tethri'
  | 'ninefold'
  | 'qesh'
  | 'exclusion'
  | 'freeholds'
  | 'pell'
  | 'none';

export interface Faction {
  id: FactionId;
  name: string;
  short: string;
  color: string;
  blurb: string;
  /** Territory influence seeds (x, z, radius). */
  seeds: [number, number, number][];
  dashed?: boolean;
}

export interface Region {
  id: string;
  name: string;
  aliases?: string;
  center: Vec3;
  radius: number;
  /** Distance to frame the region from. */
  view: number;
  blurb: string;
  labelRank: 1 | 2;
}

export type StarKind = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M' | 'WD' | 'NS' | 'RG' | 'ART' | 'BD' | 'BH';

export interface StarDef {
  kind: StarKind;
  temp: number;
  /** visual radius, ly */
  radius: number;
  name?: string;
  /** binary/trinary orbit around system barycentre */
  orbit?: { r: number; period: number; phase?: number; incl?: number };
  flicker?: number;
  /** strength of periodic occlusion (computation swarms) */
  occlusion?: number;
  pulsar?: boolean;
  /** artificial containment lattice / damage flags */
  lattice?: 'intact' | 'broken';
  lifted?: boolean;
}

export type PlanetType =
  | 'terran'
  | 'garden'
  | 'ocean'
  | 'reef'
  | 'desert'
  | 'terraform'
  | 'ice'
  | 'lava'
  | 'gas'
  | 'icegiant'
  | 'city'
  | 'barren'
  | 'twilight'
  | 'toxic'
  | 'machine'
  | 'bloom'
  | 'glass'
  | 'hollow'
  | 'rogue';

export interface RingDef {
  inner: number;
  outer: number;
  color: string;
  /** 'dust' natural ring, 'city' inhabited orbital ring */
  style: 'dust' | 'city' | 'industry' | 'lattice';
  tilt?: number;
  opacity?: number;
}

export interface BodyInfo {
  summary: string;
  population?: string;
  facts?: [string, string][];
}

export interface MoonDef {
  name: string;
  type: PlanetType;
  radius: number;
  orbit: number;
  period: number;
  phase?: number;
  incl?: number;
  lights?: number;
  info?: BodyInfo;
  seed?: number;
}

export interface PlanetDef {
  name: string;
  type: PlanetType;
  radius: number;
  orbit: number;
  period: number;
  phase?: number;
  incl?: number;
  ecc?: number;
  palette?: [string, string, string];
  seed?: number;
  lights?: number;
  clouds?: number;
  atmosphere?: string;
  ring?: RingDef;
  /** additional rings (inclined industrial rings, etc.) */
  rings?: RingDef[];
  moons?: MoonDef[];
  structures?: StructureDef[];
  info?: BodyInfo;
  /** radial drift outward per second (Red Vigil's walking worlds) */
  engine?: boolean;
  tidalLock?: boolean;
  spin?: number;
}

export type StructureDef =
  | { kind: 'swarm'; count: number; radius: number; spread: number; color?: string; lobes?: number; shells?: number; label?: string }
  | { kind: 'habitats'; count: number; radius: number; spread: number; petals?: number; color?: string; label?: string }
  | { kind: 'stations'; count: number; radius: number; spread?: number; color?: string; label?: string; dish?: boolean }
  | { kind: 'gate'; radius: number; size: number; dormant?: boolean; label?: string; phase?: number; incl?: number }
  | { kind: 'debris'; count: number; radius: number; spread: number; thickness?: number; color?: string; label?: string }
  | { kind: 'belt'; count: number; radius: number; spread: number; thickness?: number; color?: string; label?: string }
  | { kind: 'shipyard'; radius: number; count: number; label?: string }
  | { kind: 'ringworld'; radius: number; width: number; complete: number; label?: string }
  | { kind: 'shells'; radii: number[]; count: number; label?: string }
  | { kind: 'beams'; count: number; radius: number; label?: string }
  | { kind: 'cordon'; radius: number; count: number; label?: string }
  | { kind: 'plumb'; length: number; label?: string }
  | { kind: 'lens'; count: number; radius: number; label?: string }
  | { kind: 'spindle'; count: number; radius: number; label?: string }
  | { kind: 'nebula'; radius: number; color: string; color2: string; density?: number; label?: string }
  | { kind: 'fleet'; count: number; length: number; label?: string }
  | { kind: 'pillars'; count: number; radius: number; label?: string }
  | { kind: 'relays'; count: number; radius: number; label?: string }
  | { kind: 'wreck'; count: number; radius: number; label?: string }
  | { kind: 'engines'; label?: string }
  | { kind: 'lamps'; count: number; radius: number; label?: string };

export interface SystemDef {
  stars: StarDef[];
  planets: PlanetDef[];
  structures?: StructureDef[];
  /** visual radius of the system in ly, used for framing */
  extent?: number;
  /** 0..1 */
  traffic?: number;
  special?: 'blackhole' | 'elision' | 'cluster' | 'fleet' | 'nebula' | 'void';
  /** no central star rendering (rogue planet, fleet) */
  starless?: boolean;
}

export interface Chrono {
  y: string;
  t: string;
}

export interface Landmark {
  id: string;
  name: string;
  aliases?: [string, string][];
  designation: string;
  category: string;
  icon: 'system' | 'capital' | 'blackhole' | 'structure' | 'anomaly' | 'ruin' | 'cluster' | 'fleet' | 'nebula' | 'station' | 'restricted';
  region: string;
  faction: FactionId;
  pos: Vec3;
  rank: 1 | 2 | 3;
  population?: string;
  facts: [string, string][];
  summary: string;
  sections?: { title: string; body: string }[];
  chronology?: Chrono[];
  warning?: string;
  trivia?: string[];
  system: SystemDef;
  tags?: string[];
  /** local calendar descriptor for the HUD clock */
  localDay?: { name: string; hours: number };
}

export type RouteClass =
  | 'trunk'
  | 'thread'
  | 'songline'
  | 'sail'
  | 'grey'
  | 'vey'
  | 'unanswered'
  | 'restricted'
  | 'longway';

export interface RouteDef {
  id: string;
  name: string;
  cls: RouteClass;
  /** landmark ids or raw coordinates */
  path: (string | Vec3)[];
  traffic: number; // 0..1
  built?: string;
  status: string;
  note?: string;
}

export interface Era {
  id: string;
  name: string;
  start: number;
  end: number;
  blurb: string;
}

export interface HistEvent {
  id: string;
  year: number;
  yearLabel?: string;
  title: string;
  era: string;
  places: string[];
  text: string;
}
