import { FACTIONS } from './polities';
import type { FactionId } from './types';

// Territory resolution from influence seeds (a weighted power diagram).
// The same seeds drive the shader overlay, so text and map always agree.

export interface Seed {
  x: number;
  z: number;
  r: number;
  faction: FactionId;
  index: number;
}

export const TERRITORY_FACTIONS: FactionId[] = ['plenary', 'hallowmere', 'leagues', 'tethri', 'ninefold', 'qesh', 'exclusion'];

export const SEEDS: Seed[] = [];
for (const f of TERRITORY_FACTIONS) {
  for (const s of FACTIONS[f].seeds) {
    SEEDS.push({ x: s[0], z: s[1], r: s[2], faction: f, index: TERRITORY_FACTIONS.indexOf(f) });
  }
}

/** The polity owning (x, z) — the same influence-field math as the map overlay. */
export function factionAt(x: number, z: number): { faction: FactionId; score: number } {
  const acc = new Array(TERRITORY_FACTIONS.length).fill(0);
  for (const s of SEEDS) {
    const dx = (x - s.x) / s.r;
    const dz = (z - s.z) / s.r;
    const d2 = dx * dx + dz * dz;
    if (d2 < 12) acc[s.index] += Math.exp(-2.4 * d2);
  }
  let best = -1;
  let bv = 0;
  acc.forEach((v, i) => {
    const w = i === 4 || i === 6 ? v * 1.6 : v;
    if (w > bv) {
      bv = w;
      best = i;
    }
  });
  if (best < 0 || bv < 0.34) return { faction: 'none', score: 1 };
  return { faction: TERRITORY_FACTIONS[best], score: 0.34 / bv };
}
