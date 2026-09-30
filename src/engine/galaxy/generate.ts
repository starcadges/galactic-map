import {
  GALAXY,
  STREAM_SPINE,
  armAngle,
  armStrength,
  catmull,
  kelvinToRgb,
  ringStrength,
  smooth,
  warpY,
} from '../../world/galaxyModel';
import { gauss, mulberry32, type Rng } from '../../world/rng';

// Deterministic generation of the galaxy-scale populations.
// Seeds are fixed: the galaxy looks identical on every visit.

export interface StarCloud {
  count: number;
  position: Float32Array;
  color: Float32Array;
  lum: Float32Array;
  phase: Float32Array;
}

export interface SplatSet {
  count: number;
  center: Float32Array;
  axisA: Float32Array;
  axisB: Float32Array;
  axisC: Float32Array;
  color: Float32Array;
  params: Float32Array; // strength, seed, kind, sharpness
}

const lin = (c: number) => Math.pow(c, 2.2);

function tempColor(k: number, out: Float32Array, i: number, sat = 0.85) {
  const [r, g, b] = kelvinToRgb(k);
  const l = 0.3 * r + 0.55 * g + 0.15 * b;
  out[i * 3] = lin(l + (r - l) * sat);
  out[i * 3 + 1] = lin(l + (g - l) * sat);
  out[i * 3 + 2] = lin(l + (b - l) * sat);
}

function sech2(rng: Rng, h: number) {
  const u = Math.min(Math.max(rng(), 1e-6), 1 - 1e-6);
  return h * Math.atanh(2 * u - 1);
}

function bulgePoint(rng: Rng, scale: number, cap: number): [number, number, number] {
  // Hernquist radial CDF inversion: M(<r) ∝ r²/(r+a)²
  let r = cap + 1;
  while (r > cap) {
    const s = Math.sqrt(rng() * 0.985);
    r = (scale * s) / (1 - s);
  }
  const u = rng() * 2 - 1;
  const ph = rng() * Math.PI * 2;
  const q = Math.sqrt(1 - u * u);
  let x = q * Math.cos(ph) * r * GALAXY.barStretch;
  const y = u * r * GALAXY.bulgeFlatten;
  let z = q * Math.sin(ph) * r;
  const c = Math.cos(GALAXY.barAngle);
  const sn = Math.sin(GALAXY.barAngle);
  const rx = x * c - z * sn;
  const rz = x * sn + z * c;
  x = rx;
  z = rz;
  return [x, y, z];
}

export function generateStars(): StarCloud {
  const rng = mulberry32(0xa11d0);
  const cap = 360_000;
  const position = new Float32Array(cap * 3);
  const color = new Float32Array(cap * 3);
  const lum = new Float32Array(cap);
  const phase = new Float32Array(cap);
  let n = 0;

  const push = (x: number, y: number, z: number, kelvin: number, l: number, sat = 0.85) => {
    if (n >= cap) return;
    position[n * 3] = x;
    position[n * 3 + 1] = y;
    position[n * 3 + 2] = z;
    tempColor(kelvin, color, n, sat);
    lum[n] = l;
    phase[n] = rng() * 1000;
    n++;
  };

  // 1 — Bulge: old, warm, dense. The Kiln.
  for (let i = 0; i < 92_000; i++) {
    const [x, y, z] = bulgePoint(rng, GALAXY.bulgeScale, 26_000);
    const k = 3_600 + rng() * 1_700 + (rng() < 0.03 ? 3_000 : 0);
    push(x, y, z, k, Math.exp(gauss(rng) * 0.55) * 0.9);
  }

  // 2 — Old disk, modulated by arms and the ring.
  let made = 0;
  while (made < 112_000) {
    const r = -GALAXY.diskScaleLength * Math.log(rng() * rng() + 1e-12) * 1.05;
    if (r > 108_000 || r < 1_500) continue;
    const th = rng() * Math.PI * 2;
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    const arm = armStrength(r, th) * (0.35 + 0.65 * smooth(26_000, 38_000, r));
    const ring = ringStrength(x, z);
    const p = (0.4 + 0.5 * arm + 1.25 * ring) / 2.1;
    if (rng() > p) continue;
    const h = r > 60_000 ? 1_000 : GALAXY.thinScaleHeight;
    const y = sech2(rng, rng() < 0.15 ? GALAXY.thickScaleHeight : h) + warpY(r, th);
    const fade = 1 - smooth(70_000, 108_000, r) * 0.6;
    const k = 4_000 + rng() * 2_800 + arm * 1_500;
    push(x, y, z, k, Math.exp(gauss(rng) * 0.6) * 0.75 * fade);
    made++;
  }

  // 3 — Young associations: clumps of hot stars strung along the arms and the Ember Ring.
  made = 0;
  let guard = 0;
  while (made < 3_100 && guard++ < 400_000) {
    const onRing = rng() < 0.64;
    let x: number;
    let z: number;
    let r: number;
    let th: number;
    if (onRing) {
      th = rng() * Math.PI * 2;
      const rr = GALAXY.ringRadius + gauss(rng) * GALAXY.ringWidth * 0.5;
      x = GALAXY.ringOffset[0] + Math.cos(th) * rr;
      z = GALAXY.ringOffset[2] + Math.sin(th) * rr;
      if (rng() > ringStrength(x, z) * 1.1) continue;
      r = Math.hypot(x, z);
      th = Math.atan2(z, x);
    } else {
      r = 37_000 + Math.pow(rng(), 1.1) * 40_000;
      const arm = rng() < 0.5 ? 0 : 1;
      th = armAngle(r, arm) + (gauss(rng) * (2_200 + r * 0.05)) / r;
      x = Math.cos(th) * r;
      z = Math.sin(th) * r;
    }
    // associations cluster in beads along the arms, leaving gaps between
    if (!onRing && rng() > 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(r / 2_600 + th * 3.0), 2)) continue;
    const cy = sech2(rng, 220) + warpY(r, th);
    const members = 8 + Math.floor(rng() * rng() * 46);
    const spread = 180 + rng() * 520;
    const hot = rng();
    for (let m = 0; m < members; m++) {
      const k = hot > 0.3 ? 8_000 + rng() * 20_000 : 6_000 + rng() * 6_000;
      push(
        x + gauss(rng) * spread,
        cy + gauss(rng) * spread * 0.35,
        z + gauss(rng) * spread,
        k,
        Math.exp(gauss(rng) * 0.7) * 1.9,
        0.95,
      );
    }
    made++;
  }

  // 4 — Stellar halo: sparse and ancient.
  for (let i = 0; i < 11_000; i++) {
    const r = 14_000 + -Math.log(rng() + 1e-9) * 55_000;
    if (r > 320_000) continue;
    const u = rng() * 2 - 1;
    const ph = rng() * Math.PI * 2;
    const q = Math.sqrt(1 - u * u);
    push(q * Math.cos(ph) * r, u * r * 0.8, q * Math.sin(ph) * r, 4_200 + rng() * 1_800, Math.exp(gauss(rng) * 0.5) * 0.55);
  }

  // 5 — Globular clusters: hundreds of tight ancient knots around the disk.
  const gcRng = mulberry32(0x61ab);
  for (let c = 0; c < 280; c++) {
    const r = 9_000 + -Math.log(gcRng() + 1e-9) * 38_000;
    const u = gcRng() * 2 - 1;
    const ph = gcRng() * Math.PI * 2;
    const q = Math.sqrt(1 - u * u);
    const cx = q * Math.cos(ph) * r;
    const cy = u * r * 0.85;
    const cz = q * Math.sin(ph) * r;
    const members = 26 + Math.floor(gcRng() * 40);
    const core = 90 + gcRng() * 200;
    for (let m = 0; m < members; m++) {
      const s = core / Math.sqrt(Math.max(0.02, Math.pow(gcRng(), -2 / 3) - 1));
      const uu = gcRng() * 2 - 1;
      const pp = gcRng() * Math.PI * 2;
      const qq = Math.sqrt(1 - uu * uu);
      push(cx + qq * Math.cos(pp) * s, cy + uu * s, cz + qq * Math.sin(pp) * s, 4_400 + gcRng() * 1_600, 0.9);
    }
  }
  // Aurel — the great silent cluster.
  for (let m = 0; m < 900; m++) {
    const s = 140 / Math.sqrt(Math.max(0.01, Math.pow(rng(), -2 / 3) - 1));
    const uu = rng() * 2 - 1;
    const pp = rng() * Math.PI * 2;
    const qq = Math.sqrt(1 - uu * uu);
    push(
      GALAXY.aurel[0] + qq * Math.cos(pp) * s,
      GALAXY.aurel[1] + uu * s,
      GALAXY.aurel[2] + qq * Math.sin(pp) * s,
      4_600 + rng() * 1_400,
      1.1,
    );
  }

  // 6 — Pell (compact elliptical companion).
  for (let i = 0; i < 9_000; i++) {
    const s = 1_100 / Math.sqrt(Math.max(0.004, Math.pow(rng(), -2 / 3) - 1));
    if (s > 16_000) continue;
    const uu = rng() * 2 - 1;
    const pp = rng() * Math.PI * 2;
    const qq = Math.sqrt(1 - uu * uu);
    push(
      GALAXY.pell[0] + qq * Math.cos(pp) * s * 1.1,
      GALAXY.pell[1] + uu * s * 0.85,
      GALAXY.pell[2] + qq * Math.sin(pp) * s,
      3_900 + rng() * 1_400,
      Math.exp(gauss(rng) * 0.5) * 1.0,
    );
  }

  // 7 — The Pale Companion (diffuse dwarf, elongated).
  for (let i = 0; i < 7_000; i++) {
    const s = 6_000 * Math.sqrt(-2 * Math.log(rng() + 1e-9)) * 0.8;
    const uu = rng() * 2 - 1;
    const pp = rng() * Math.PI * 2;
    const qq = Math.sqrt(1 - uu * uu);
    const lx = qq * Math.cos(pp) * s * 1.6;
    const ly = uu * s * 0.7;
    const lz = qq * Math.sin(pp) * s;
    // tilt
    const a = 0.7;
    push(
      GALAXY.paleCompanion[0] + lx * Math.cos(a) - ly * Math.sin(a),
      GALAXY.paleCompanion[1] + lx * Math.sin(a) + ly * Math.cos(a),
      GALAXY.paleCompanion[2] + lz,
      4_300 + rng() * 1_500 + (rng() < 0.02 ? 9_000 : 0),
      Math.exp(gauss(rng) * 0.5) * 0.22,
    );
  }

  // 8 — The Drowned Road: tidal debris of a devoured dwarf galaxy.
  for (let i = 0; i < 7_000; i++) {
    const t = Math.pow(rng(), 0.85);
    const p = catmull(STREAM_SPINE, t);
    const w = 3_200 + t * 15_000;
    push(
      p[0] + gauss(rng) * w,
      p[1] + gauss(rng) * w * 0.6,
      p[2] + gauss(rng) * w * 0.8,
      4_000 + rng() * 2_000,
      Math.exp(gauss(rng) * 0.5) * (0.42 - t * 0.2),
    );
  }

  // 9 — Nuclear cluster around Orrhune, and the False Heart's eccentric disk.
  for (let i = 0; i < 7_000; i++) {
    const s = 160 / Math.sqrt(Math.max(0.003, Math.pow(rng(), -2 / 3) - 1));
    if (s > 4_000) continue;
    const uu = rng() * 2 - 1;
    const pp = rng() * Math.PI * 2;
    const qq = Math.sqrt(1 - uu * uu);
    const hot = s < 60 && rng() < 0.5;
    push(qq * Math.cos(pp) * s, uu * s * 0.7, qq * Math.sin(pp) * s, hot ? 14_000 : 3_900 + rng() * 1_200, hot ? 2.2 : 1.0);
  }
  for (let i = 0; i < 3_000; i++) {
    // eccentric disk: orbits with shared periapsis, apoapsis stacked on the far side
    const a = 150 + rng() * 380;
    const e = 0.55 + rng() * 0.2;
    const E = rng() * Math.PI * 2;
    const ox = a * (Math.cos(E) - e);
    const oz = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const tilt = 0.5;
    push(ox - 90, gauss(rng) * 18 + oz * Math.sin(tilt) * 0.3, oz * Math.cos(tilt), 3_700 + rng() * 900, 0.9);
  }

  return {
    count: n,
    position: position.subarray(0, n * 3),
    color: color.subarray(0, n * 3),
    lum: lum.subarray(0, n),
    phase: phase.subarray(0, n),
  };
}

// ---------------------------------------------------------------------------
// Splats: diffuse starlight (haze), dust, and HII nebulae.

class SplatBuilder {
  center: number[] = [];
  a: number[] = [];
  b: number[] = [];
  c: number[] = [];
  color: number[] = [];
  params: number[] = [];
  add(
    cx: number,
    cy: number,
    cz: number,
    // tangent direction in the plane (unit, xz), lengths
    tx: number,
    tz: number,
    lenT: number,
    lenR: number,
    lenY: number,
    col: [number, number, number],
    strength: number,
    seed: number,
    kind: number,
    sharp = 1,
  ) {
    this.center.push(cx, cy, cz);
    this.a.push(tx * lenT, 0, tz * lenT);
    this.b.push(-tz * lenR, 0, tx * lenR);
    this.c.push(0, lenY, 0);
    this.color.push(col[0], col[1], col[2]);
    this.params.push(strength, seed, kind, sharp);
  }
  addRaw(
    center: [number, number, number],
    A: [number, number, number],
    B: [number, number, number],
    C: [number, number, number],
    col: [number, number, number],
    strength: number,
    seed: number,
    kind: number,
    sharp = 1,
  ) {
    this.center.push(...center);
    this.a.push(...A);
    this.b.push(...B);
    this.c.push(...C);
    this.color.push(...col);
    this.params.push(strength, seed, kind, sharp);
  }
  build(): SplatSet {
    return {
      count: this.center.length / 3,
      center: new Float32Array(this.center),
      axisA: new Float32Array(this.a),
      axisB: new Float32Array(this.b),
      axisC: new Float32Array(this.c),
      color: new Float32Array(this.color),
      params: new Float32Array(this.params),
    };
  }
}

function armTangent(r: number, th: number): [number, number] {
  // tangent of log spiral: direction rotated by pitch from circular
  const pitch = Math.atan(1 / GALAXY.armWind);
  const circ = th + Math.PI / 2;
  const a = circ - pitch;
  return [Math.cos(a), Math.sin(a)];
}

export function generateHaze(): SplatSet {
  const rng = mulberry32(0x4a2e);
  const sb = new SplatBuilder();

  // Bulge glow: nested triaxial ellipsoids following the bar.
  const bc = Math.cos(GALAXY.barAngle);
  const bs = Math.sin(GALAXY.barAngle);
  const bulgeLayers: [number, number][] = [
    [600, 5.0],
    [1_400, 2.3],
    [3_000, 1.05],
    [6_000, 0.42],
    [11_000, 0.16],
    [19_000, 0.05],
  ];
  for (const [s, k] of bulgeLayers) {
    const warm: [number, number, number] = [lin(1.0), lin(0.84), lin(0.62)];
    sb.addRaw(
      [0, 0, 0],
      [bc * s * GALAXY.barStretch, 0, bs * s * GALAXY.barStretch],
      [-bs * s, 0, bc * s],
      [0, s * GALAXY.bulgeFlatten, 0],
      warm,
      k,
      rng(),
      0,
      1,
    );
  }
  // Scattered bulge fill for texture
  for (let i = 0; i < 1_600; i++) {
    const [x, y, z] = bulgePoint(rng, GALAXY.bulgeScale * 1.2, 22_000);
    const s = 900 + rng() * 2_200;
    sb.addRaw(
      [x, y, z],
      [s, 0, 0],
      [0, 0, s],
      [0, s * 0.7, 0],
      [lin(1.0), lin(0.8), lin(0.58)],
      0.028,
      rng(),
      0,
      1,
    );
  }

  // Disk light: splats elongated along the local spiral direction.
  let made = 0;
  while (made < 9_000) {
    const r = -GALAXY.diskScaleLength * Math.log(rng() * rng() + 1e-12);
    if (r > 100_000 || r < 3_000) continue;
    const th = rng() * Math.PI * 2;
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    const arm = armStrength(r, th) * (0.25 + 0.75 * smooth(26_000, 38_000, r));
    const ring = ringStrength(x, z);
    const p = (0.35 + arm + 1.1 * ring) / 2.4;
    if (rng() > p) continue;
    const [tx, tz] = armTangent(r, th);
    const lenT = 1_300 + rng() * 2_000 + r * 0.012;
    const lenR = 1_000 + rng() * 1_300;
    const lenY = r > 60_000 ? 900 : 650;
    const young = Math.min(1, arm * 0.8 + ring);
    const col: [number, number, number] = [
      lin(0.98 - young * 0.22),
      lin(0.86 - young * 0.04),
      lin(0.7 + young * 0.28),
    ];
    const fade = 1 - smooth(55_000, 100_000, r) * 0.8;
    sb.add(x, warpY(r, th) + gauss(rng) * 150, z, tx, tz, lenT, lenR, lenY, col, 0.016 * fade * (0.55 + young * 0.7), rng(), 0);
    made++;
  }

  // Halo glow and satellites
  sb.addRaw([...GALAXY.pell], [1_600, 0, 0], [0, 0, 1_500], [0, 1_300, 0], [lin(1), lin(0.85), lin(0.66)], 2.2, 0.3, 0);
  sb.addRaw([...GALAXY.pell], [4_500, 0, 0], [0, 0, 4_200], [0, 3_800, 0], [lin(1), lin(0.85), lin(0.66)], 0.25, 0.4, 0);
  sb.addRaw(
    [...GALAXY.paleCompanion],
    [9_000, 6_000, 0],
    [0, 0, 7_000],
    [-3_000, 4_500, 0],
    [lin(0.95), lin(0.85), lin(0.72)],
    0.03,
    0.5,
    0,
  );
  sb.addRaw([...GALAXY.aurel], [260, 0, 0], [0, 0, 260], [0, 260, 0], [lin(1), lin(0.9), lin(0.75)], 0.35, 0.6, 0);
  // Smooth exponential disk underlayer, so structure sits on continuous light.
  for (const [s, k, h] of [
    [9_000, 0.05, 700],
    [20_000, 0.03, 800],
    [36_000, 0.018, 900],
    [58_000, 0.008, 1_000],
  ] as [number, number, number][]) {
    sb.addRaw([0, 0, 0], [s, 0, 0], [0, 0, s], [0, h, 0], [lin(0.97), lin(0.86), lin(0.72)], k, 0.1, 0);
  }
  // The Ember Ring's own glow: young light, bluer.
  for (let i = 0; i < 90; i++) {
    const th = (i / 90) * Math.PI * 2;
    const x = GALAXY.ringOffset[0] + Math.cos(th) * GALAXY.ringRadius;
    const z = GALAXY.ringOffset[2] + Math.sin(th) * GALAXY.ringRadius;
    const k = ringStrength(x, z);
    if (k < 0.08) continue;
    sb.add(x, 0, z, -Math.sin(th), Math.cos(th), 2_600, 2_300, 600, [lin(0.78), lin(0.84), lin(1.0)], 0.022 * k, rng(), 0);
  }
  // Stream glow
  for (let i = 0; i < 140; i++) {
    const t = i / 140;
    const p = catmull(STREAM_SPINE, t);
    const q = catmull(STREAM_SPINE, Math.min(1, t + 0.01));
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const dz = q[2] - p[2];
    const l = Math.hypot(dx, dy, dz) || 1;
    const w = 2_500 + t * 11_000;
    const L = 6_000 + t * 6_000;
    sb.addRaw(
      [p[0] + gauss(rng) * w * 0.3, p[1] + gauss(rng) * w * 0.3, p[2] + gauss(rng) * w * 0.3],
      [(dx / l) * L, (dy / l) * L, (dz / l) * L],
      [w, 0, 0],
      [0, 0, w * 0.8],
      [lin(0.95), lin(0.82), lin(0.66)],
      0.0016 * (1 - t * 0.6),
      rng(),
      0,
    );
  }
  return sb.build();
}

export function generateDust(): SplatSet {
  const rng = mulberry32(0xd057);
  const sb = new SplatBuilder();
  // Lanes trail the arms on their concave (inner) side, and line the Ember Ring.
  let made = 0;
  while (made < 5_200) {
    const choice = rng();
    let x: number;
    let z: number;
    let r: number;
    let th: number;
    if (choice < 0.5) {
      th = rng() * Math.PI * 2;
      const rr = GALAXY.ringRadius - GALAXY.ringWidth * 0.3 + gauss(rng) * GALAXY.ringWidth * 0.55;
      x = GALAXY.ringOffset[0] + Math.cos(th) * rr;
      z = GALAXY.ringOffset[2] + Math.sin(th) * rr;
      if (rng() > ringStrength(x, z) * 1.3) continue;
      r = Math.hypot(x, z);
      th = Math.atan2(z, x);
    } else if (choice < 0.72) {
      r = 37_000 + Math.pow(rng(), 0.9) * 36_000;
      const arm = rng() < 0.5 ? 0 : 1;
      th = armAngle(r, arm) - (900 + r * 0.02) / r + (gauss(rng) * (1_100 + r * 0.03)) / r;
      x = Math.cos(th) * r;
      z = Math.sin(th) * r;
    } else if (choice < 0.9) {
      // flocculent dust of the inner disk, loosely following the old arm pattern
      r = 6_000 + rng() * 24_000;
      const arm = rng() < 0.5 ? 0 : 1;
      th = armAngle(r, arm) + (gauss(rng) * (3_000 + r * 0.08)) / r;
      x = Math.cos(th) * r;
      z = Math.sin(th) * r;
    } else {
      // inner dust ring hugging the bulge
      th = rng() * Math.PI * 2;
      const rr = 3_300 + gauss(rng) * 400;
      x = Math.cos(th) * rr * 1.2 + 500;
      z = Math.sin(th) * rr;
      r = Math.hypot(x, z);
    }
    const [tx, tz] = armTangent(r, th);
    const lenT = 900 + rng() * 2_600;
    const lenR = 260 + rng() * 520;
    const lenY = 140 + rng() * 120;
    const fade = 1 - smooth(55_000, 80_000, r);
    sb.add(x, warpY(r, th) + gauss(rng) * 60, z, tx, tz, lenT, lenR, lenY, [0.16, 0.09, 0.05], (0.1 + rng() * 0.45) * fade + 0.03, rng(), 2);
    made++;
  }
  return sb.build();
}

export function generateNebulae(): SplatSet {
  const rng = mulberry32(0x7e61);
  const sb = new SplatBuilder();
  let made = 0;
  while (made < 900) {
    const onRing = rng() < 0.62;
    let x: number;
    let z: number;
    let r: number;
    let th: number;
    if (onRing) {
      th = rng() * Math.PI * 2;
      const rr = GALAXY.ringRadius + gauss(rng) * GALAXY.ringWidth * 0.4;
      x = GALAXY.ringOffset[0] + Math.cos(th) * rr;
      z = GALAXY.ringOffset[2] + Math.sin(th) * rr;
      if (rng() > ringStrength(x, z)) continue;
      r = Math.hypot(x, z);
      th = Math.atan2(z, x);
    } else {
      r = 37_000 + rng() * 38_000;
      const arm = rng() < 0.5 ? 0 : 1;
      th = armAngle(r, arm) + (gauss(rng) * 1_600) / r;
      x = Math.cos(th) * r;
      z = Math.sin(th) * r;
    }
    const s = 160 + Math.pow(rng(), 2.2) * 1_300;
    const kindRoll = rng();
    const col: [number, number, number] =
      kindRoll < 0.8
        ? [lin(1.0), lin(0.46 + rng() * 0.1), lin(0.5 + rng() * 0.1)] // hydrogen-alpha pink
        : kindRoll < 0.93
          ? [lin(0.45), lin(0.62), lin(1.0)] // reflection blue
          : [lin(0.5), lin(0.9), lin(0.85)]; // ionised oxygen teal, rare
    const y = warpY(r, th) + gauss(rng) * 120;
    const u = rng() * Math.PI;
    sb.addRaw(
      [x, y, z],
      [Math.cos(u) * s, 0, Math.sin(u) * s],
      [-Math.sin(u) * s * 0.7, 0, Math.cos(u) * s * 0.7],
      [0, s * 0.55, 0],
      col,
      0.3 + rng() * 0.55,
      rng(),
      1,
    );
    made++;
  }
  return sb.build();
}
