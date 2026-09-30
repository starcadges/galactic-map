import type { Landmark, PlanetDef, SystemDef, Vec3 } from './types';
import { CORE } from './landmarks/core';
import { HEART } from './landmarks/heart';
import { RING } from './landmarks/ring';
import { HALLOWMERE } from './landmarks/hallowmere';
import { TETHRI } from './landmarks/tethri';
import { RIM } from './landmarks/rim';
import { REGIONS, REGION_BY_ID, FACTIONS } from './polities';
import { EVENTS } from './history';
import { generateCharted, proceduralSystem, type ChartedSystem, TYPE_LABEL } from './procedural';
import { ROUTES } from './routes';

export const LANDMARKS: Landmark[] = [...CORE, ...HEART, ...RING, ...HALLOWMERE, ...TETHRI, ...RIM];
export const LANDMARK_BY_ID: Record<string, Landmark> = Object.fromEntries(LANDMARKS.map((l) => [l.id, l]));

export const CHARTED: ChartedSystem[] = generateCharted(
  LANDMARKS.map((l) => l.pos),
  LANDMARKS.flatMap((l) => [l.name, ...l.system.planets.map((p) => p.name)]),
);
export const CHARTED_BY_ID: Record<string, ChartedSystem> = Object.fromEntries(CHARTED.map((c) => [c.id, c]));

const sysCache = new Map<string, SystemDef>();
export function systemFor(id: string): SystemDef | null {
  const lm = LANDMARK_BY_ID[id];
  if (lm) return lm.system;
  const cs = CHARTED_BY_ID[id];
  if (cs) {
    let s = sysCache.get(id);
    if (!s) {
      s = proceduralSystem(cs.seed, cs.starKind, cs.temp, cs.population > 0, cs.type);
      s.planets.forEach((p, i) => {
        p.name = `${cs.name} ${ROMAN[i] ?? i + 1}`;
        p.moons?.forEach((m, j) => (m.name = `${cs.name} ${ROMAN[i] ?? i + 1}${'abcdefg'[j]}`));
      });
      sysCache.set(id, s);
    }
    return s;
  }
  return null;
}

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export function posOf(id: string): Vec3 | null {
  return LANDMARK_BY_ID[id]?.pos ?? CHARTED_BY_ID[id]?.pos ?? null;
}

/** body ids look like  b|<systemId>|<planetIndex>[|<moonIndex>] */
export function bodyId(sys: string, p: number, m?: number) {
  return m === undefined ? `b|${sys}|${p}` : `b|${sys}|${p}|${m}`;
}
export function parseBody(id: string): { sys: string; p: number; m?: number } | null {
  if (!id.startsWith('b|')) return null;
  const parts = id.split('|');
  return { sys: parts[1], p: Number(parts[2]), m: parts[3] !== undefined ? Number(parts[3]) : undefined };
}
export function bodyDef(id: string): { planet: PlanetDef; moon?: NonNullable<PlanetDef['moons']>[number]; sys: string } | null {
  const b = parseBody(id);
  if (!b) return null;
  const s = systemFor(b.sys);
  const planet = s?.planets[b.p];
  if (!planet) return null;
  return { planet, moon: b.m !== undefined ? planet.moons?.[b.m] : undefined, sys: b.sys };
}

export function nameOf(id: string): string {
  if (LANDMARK_BY_ID[id]) return LANDMARK_BY_ID[id].name;
  if (CHARTED_BY_ID[id]) return CHARTED_BY_ID[id].name;
  if (id.startsWith('region:')) return REGION_BY_ID[id.slice(7)]?.name ?? id;
  const b = bodyDef(id);
  if (b) return b.moon?.name ?? b.planet.name;
  return id;
}

// --- Search ---------------------------------------------------------------

export interface SearchEntry {
  id: string;
  name: string;
  sub: string;
  kind: 'landmark' | 'charted' | 'body' | 'region' | 'event' | 'route';
  hay: string;
  rank: number;
}

export const SEARCH: SearchEntry[] = [];
for (const l of LANDMARKS) {
  SEARCH.push({
    id: l.id,
    name: l.name,
    sub: `${l.category} · ${REGION_BY_ID[l.region]?.name ?? ''}`,
    kind: 'landmark',
    hay: [l.name, ...(l.aliases ?? []).map((a) => a[0]), l.category, l.designation, ...(l.tags ?? []), FACTIONS[l.faction]?.short].join(' ').toLowerCase(),
    rank: l.rank,
  });
  l.system.planets.forEach((p, i) => {
    if (!p.info) return;
    SEARCH.push({ id: bodyId(l.id, i), name: p.name, sub: `World · ${l.name}`, kind: 'body', hay: `${p.name} ${l.name} ${p.type}`.toLowerCase(), rank: 3 });
    p.moons?.forEach((m, j) => {
      if (!m.info) return;
      SEARCH.push({ id: bodyId(l.id, i, j), name: m.name, sub: `Moon of ${p.name} · ${l.name}`, kind: 'body', hay: `${m.name} ${p.name} ${l.name}`.toLowerCase(), rank: 3 });
    });
  });
}
for (const r of REGIONS) {
  SEARCH.push({ id: `region:${r.id}`, name: r.name, sub: `Region · ${r.aliases ?? ''}`, kind: 'region', hay: `${r.name} ${r.aliases ?? ''} region`.toLowerCase(), rank: 1 });
}
for (const e of EVENTS) {
  SEARCH.push({ id: `event:${e.id}`, name: e.title, sub: `Event · ${e.yearLabel ?? e.year.toLocaleString('en-US') + ' SR'}`, kind: 'event', hay: `${e.title} ${e.text}`.toLowerCase().replace(/\[\[[^|\]]*\|?/g, ''), rank: 2 });
}
for (const r of ROUTES) {
  SEARCH.push({ id: `route:${r.id}`, name: r.name, sub: `Route · ${r.status}`, kind: 'route', hay: `${r.name} ${r.cls} route thread`.toLowerCase(), rank: 2 });
}
for (const c of CHARTED) {
  SEARCH.push({
    id: c.id,
    name: c.name,
    sub: `${TYPE_LABEL[c.type]} · ${c.designation}`,
    kind: 'charted',
    hay: `${c.name} ${c.designation} ${TYPE_LABEL[c.type]}`.toLowerCase(),
    rank: 4,
  });
}

export function search(q: string, limit = 9): SearchEntry[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const scored: [number, SearchEntry][] = [];
  for (const e of SEARCH) {
    const n = e.name.toLowerCase();
    let score = -1;
    if (n === s) score = 100;
    else if (n.startsWith(s)) score = 80;
    else if (n.split(/[\s’'-]+/).some((w) => w.startsWith(s))) score = 60;
    else if (n.includes(s)) score = 45;
    else if (e.hay.includes(s)) score = 25;
    if (score < 0) continue;
    score -= e.rank * 3;
    if (e.kind === 'charted') score -= 22;
    scored.push([score, e]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  // keep the register from drowning out the atlas
  const out: SearchEntry[] = [];
  let charted = 0;
  for (const [, e] of scored) {
    if (e.kind === 'charted') {
      if (charted >= 4) continue;
      charted++;
    }
    out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}

export { REGIONS, REGION_BY_ID, FACTIONS, EVENTS, ROUTES };
