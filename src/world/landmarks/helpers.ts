import type { MoonDef, PlanetDef, PlanetType, StarDef, StarKind } from '../types';

const STAR_R: Record<StarKind, number> = {
  O: 0.085,
  B: 0.068,
  A: 0.054,
  F: 0.046,
  G: 0.04,
  K: 0.034,
  M: 0.025,
  WD: 0.01,
  NS: 0.006,
  RG: 0.19,
  ART: 0.03,
  BD: 0.018,
  BH: 0.12,
};

const STAR_T: Record<StarKind, number> = {
  O: 34_000,
  B: 17_000,
  A: 8_600,
  F: 6_600,
  G: 5_700,
  K: 4_600,
  M: 3_300,
  WD: 11_000,
  NS: 60_000,
  RG: 3_700,
  ART: 6_200,
  BD: 1_600,
  BH: 0,
};

export function star(kind: StarKind, extra: Partial<StarDef> = {}): StarDef {
  return { kind, temp: extra.temp ?? STAR_T[kind], radius: extra.radius ?? STAR_R[kind], ...extra };
}

const R: Record<PlanetType, number> = {
  terran: 0.0095,
  garden: 0.0095,
  ocean: 0.01,
  reef: 0.01,
  desert: 0.0088,
  terraform: 0.009,
  ice: 0.008,
  lava: 0.0078,
  gas: 0.026,
  icegiant: 0.019,
  city: 0.0105,
  barren: 0.006,
  twilight: 0.0092,
  toxic: 0.009,
  machine: 0.007,
  bloom: 0.0095,
  glass: 0.0085,
  hollow: 0.0095,
  rogue: 0.011,
};

/** planet(name, type, orbit, period, extra) — sensible visual radius by type. */
export function planet(
  name: string,
  type: PlanetType,
  orbit: number,
  period: number,
  extra: Partial<PlanetDef> = {},
): PlanetDef {
  return { name, type, orbit, period, radius: extra.radius ?? R[type], ...extra };
}

export function moon(name: string, type: PlanetType, orbit: number, period: number, extra: Partial<MoonDef> = {}): MoonDef {
  return { name, type, orbit, period, radius: extra.radius ?? R[type] * 0.32, ...extra };
}
