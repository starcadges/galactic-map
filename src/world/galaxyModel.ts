// The physical model of the galaxy. Shared by the renderer (star sampling,
// local star fields) and by the world data (so authored places sit on the
// actual arms, rings and streams they are described as belonging to).
//
// Units: light-years. Disk lies in the XZ plane, +Y is galactic north.
// Azimuth θ is measured from +X toward +Z.

export const GALAXY = {
  diskRadius: 100_000,
  diskScaleLength: 17_000,
  thinScaleHeight: 700,
  thickScaleHeight: 2_200,
  bulgeScale: 2_600,
  bulgeFlatten: 0.62,
  barAngle: (22 * Math.PI) / 180,
  barStretch: 1.35,
  armR0: 11_000,
  armWind: 2.9, // 1 / tan(pitch ≈ 19°)
  armPhase: [0.35, 0.35 + Math.PI],
  ringRadius: 33_000,
  ringWidth: 3_300,
  ringOffset: [1_400, 0, -900] as const,
  breachStart: (248 * Math.PI) / 180,
  breachEnd: (286 * Math.PI) / 180,
  warpStart: 58_000,
  warpAmp: 7_500,
  warpPhase: 0.9,
  // Satellites and halo structures
  pell: [13_000, -9_000, 15_000] as const, // compact elliptical (M32 analogue)
  paleCompanion: [-52_000, 38_000, 64_000] as const, // diffuse dwarf (M110 analogue)
  aurel: [-72_000, 58_000, -96_000] as const, // the silent globular cluster
};

export const TAU = Math.PI * 2;

export function wrapAngle(a: number): number {
  a = (a + Math.PI) % TAU;
  if (a < 0) a += TAU;
  return a - Math.PI;
}

export function armAngle(r: number, arm: number): number {
  return GALAXY.armPhase[arm] + GALAXY.armWind * Math.log(Math.max(r, 1) / GALAXY.armR0);
}

/** 0..1 strength of spiral-arm structure at (r, θ). */
export function armStrength(r: number, theta: number): number {
  if (r < 6_000) return 0;
  const w = 1_900 + r * 0.045;
  let best = 0;
  for (let arm = 0; arm < 2; arm++) {
    const d = wrapAngle(theta - armAngle(r, arm)) * r;
    const f = Math.exp(-(d / w) * (d / w));
    if (f > best) best = f;
  }
  const inFade = smooth(8_000, 15_000, r);
  const outFade = 1 - smooth(70_000, 92_000, r);
  return best * inFade * outFade;
}

/** Signed offset of a point relative to the nearest arm crest (arc-length, ly). */
export function armOffset(r: number, theta: number): number {
  let best = Infinity;
  for (let arm = 0; arm < 2; arm++) {
    const d = wrapAngle(theta - armAngle(r, arm)) * r;
    if (Math.abs(d) < Math.abs(best)) best = d;
  }
  return best;
}

export function ringStrength(x: number, z: number): number {
  const dx = x - GALAXY.ringOffset[0];
  const dz = z - GALAXY.ringOffset[2];
  const r = Math.hypot(dx, dz);
  const t = (r - GALAXY.ringRadius) / GALAXY.ringWidth;
  let f = Math.exp(-t * t);
  // The Breach: the ring is torn where the compact companion passed through.
  let th = Math.atan2(dz, dx);
  if (th < 0) th += TAU;
  const mid = (GALAXY.breachStart + GALAXY.breachEnd) / 2;
  const half = (GALAXY.breachEnd - GALAXY.breachStart) / 2;
  const g = Math.abs(th - mid) / half;
  if (g < 1.4) f *= 0.1 + 0.9 * smooth(0.55, 1.4, g);
  return f;
}

export function warpY(r: number, theta: number): number {
  if (r < GALAXY.warpStart) return 0;
  const t = (r - GALAXY.warpStart) / 40_000;
  return GALAXY.warpAmp * t * t * Math.sin(theta - GALAXY.warpPhase);
}

export function smooth(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export interface DensitySample {
  /** Relative stellar number density; 1 ≈ an ordinary mid-disk neighbourhood. */
  density: number;
  /** 0 = old population (bulge/halo), 1 = young (arms, ring). */
  youth: number;
  /** Rough share contributed by bulge. */
  bulge: number;
}

/** Bulge (Hernquist) density in its own flattened, barred frame. */
function bulgeDensity(x: number, y: number, z: number): number {
  const c = Math.cos(-GALAXY.barAngle);
  const s = Math.sin(-GALAXY.barAngle);
  const bx = (x * c - z * s) / GALAXY.barStretch;
  const bz = x * s + z * c;
  const by = y / GALAXY.bulgeFlatten;
  const m = Math.sqrt(bx * bx + by * by + bz * bz);
  const a = GALAXY.bulgeScale;
  return (a / Math.max(m, 40)) * Math.pow(a / (m + a), 3);
}

export function sampleDensity(x: number, y: number, z: number): DensitySample {
  const r = Math.hypot(x, z);
  const theta = Math.atan2(z, x);
  const yw = y - warpY(r, theta);

  const bulge = bulgeDensity(x, y, z) * 55;

  const radial = Math.exp(-r / GALAXY.diskScaleLength) * (1 - smooth(85_000, 115_000, r));
  const thin = 1 / Math.cosh(yw / GALAXY.thinScaleHeight) ** 2;
  const thick = 0.12 / Math.cosh(yw / GALAXY.thickScaleHeight) ** 2;
  const arm = armStrength(r, theta);
  const ring = ringStrength(x, z);
  const structure = 0.45 + 1.3 * arm + 1.6 * ring;
  const disk = radial * (thin * structure + thick) * 7.5;

  const rr = Math.sqrt(x * x + y * y + z * z);
  const halo = 0.004 * Math.pow(12_000 / Math.max(rr, 12_000), 3.2);

  // satellites
  const pell = satellite(x, y, z, GALAXY.pell, 1_300, 14);
  const pale = satellite(x, y, z, GALAXY.paleCompanion, 7_000, 1.2);
  const aurel = satellite(x, y, z, GALAXY.aurel, 160, 60);

  const density = bulge + disk + halo + pell + pale + aurel;
  const youth = density > 0 ? Math.min(1, (disk * (arm * 0.9 + ring * 1.1) * thin) / density) : 0;
  return { density, youth, bulge: bulge / Math.max(density, 1e-9) };
}

function satellite(
  x: number,
  y: number,
  z: number,
  c: readonly [number, number, number],
  scale: number,
  peak: number,
): number {
  const dx = x - c[0];
  const dy = y - c[1];
  const dz = z - c[2];
  const d2 = (dx * dx + dy * dy + dz * dz) / (scale * scale);
  if (d2 > 60) return 0;
  return peak / Math.pow(1 + d2, 2);
}

/** Point on a spiral arm crest. `along` is galactocentric radius. */
export function armPoint(arm: number, r: number, offsetLy = 0, y = 0): [number, number, number] {
  const th = armAngle(r, arm) + offsetLy / r;
  return [Math.cos(th) * r, y + warpY(r, th), Math.sin(th) * r];
}

/** Point on the Ember Ring at azimuth (degrees, measured around the ring's own centre). */
export function ringPoint(deg: number, radialOffset = 0, y = 0): [number, number, number] {
  const th = (deg * Math.PI) / 180;
  const r = GALAXY.ringRadius + radialOffset;
  return [GALAXY.ringOffset[0] + Math.cos(th) * r, y, GALAXY.ringOffset[2] + Math.sin(th) * r];
}

export function polarPoint(deg: number, r: number, y = 0): [number, number, number] {
  const th = (deg * Math.PI) / 180;
  return [Math.cos(th) * r, y + warpY(r, th), Math.sin(th) * r];
}

// ---------------------------------------------------------------------------
// The Drowned Road — the tidal stream of the dwarf galaxy Andromeda devoured.
// A Catmull-Rom spine the stream's stars (and the Vey ruins) are strewn along.
export const STREAM_SPINE: [number, number, number][] = [
  [6_000, -4_000, 9_000],
  [15_000, -18_000, 24_000],
  [27_000, -46_000, 40_000],
  [40_000, -86_000, 52_000],
  [54_000, -136_000, 58_000],
  [64_000, -188_000, 56_000],
  [70_000, -236_000, 48_000],
];

export function catmull(points: [number, number, number][], t: number): [number, number, number] {
  const n = points.length - 1;
  const f = Math.min(Math.max(t, 0), 0.99999) * n;
  const i = Math.floor(f);
  const u = f - i;
  const p0 = points[Math.max(i - 1, 0)];
  const p1 = points[i];
  const p2 = points[Math.min(i + 1, n)];
  const p3 = points[Math.min(i + 2, n)];
  const out: [number, number, number] = [0, 0, 0];
  const u2 = u * u;
  const u3 = u2 * u;
  for (let k = 0; k < 3; k++) {
    out[k] =
      0.5 *
      (2 * p1[k] +
        (-p0[k] + p2[k]) * u +
        (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 +
        (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3);
  }
  return out;
}

export function streamPoint(t: number, lateral = 0, vertical = 0): [number, number, number] {
  const p = catmull(STREAM_SPINE, t);
  return [p[0] + lateral, p[1] + vertical, p[2] - lateral * 0.4];
}

// ---------------------------------------------------------------------------
// Stellar colour from temperature (approximate blackbody → sRGB, softened).
export function kelvinToRgb(k: number): [number, number, number] {
  const t = k / 100;
  let r: number;
  let g: number;
  let b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  const c = (v: number) => Math.min(255, Math.max(0, v)) / 255;
  return [c(r), c(g), c(b)];
}

/** Spectral class letter for a temperature. */
export function spectralClass(k: number): string {
  if (k >= 30_000) return 'O';
  if (k >= 10_000) return 'B';
  if (k >= 7_500) return 'A';
  if (k >= 6_000) return 'F';
  if (k >= 5_200) return 'G';
  if (k >= 3_700) return 'K';
  return 'M';
}
