import * as THREE from 'three';
import { sampleDensity } from '../world/galaxyModel';
import { hash3, mulberry32, type Rng } from '../world/rng';
import { makeStarPointMaterial, starColorLinear } from './shaders/starPoints';
import { ELISION_CENTER } from '../world/routes';

// The resolved stellar neighbourhood. Stars are generated deterministically in
// nested cell grids around the point of focus: faint dwarfs in small cells close
// in, rare luminous giants in large cells further out. Every star has a stable
// identity derived from its cell, so any of them can be selected and visited.

interface LevelDef {
  cell: number;
  rc: number;
  perCell: number;
  lum: [number, number];
  cap: number;
  visMax: number;
}

const LEVELS: LevelDef[] = [
  { cell: 12, rc: 3, perCell: 0.75, lum: [0.004, 0.7], cap: 14_000, visMax: 220 },
  { cell: 40, rc: 3, perCell: 1.1, lum: [0.4, 5], cap: 20_000, visMax: 900 },
  { cell: 130, rc: 3, perCell: 1.4, lum: [3, 90], cap: 24_000, visMax: 3_500 },
  { cell: 420, rc: 3, perCell: 1.6, lum: [60, 12_000], cap: 26_000, visMax: 14_000 },
];

export interface FieldStar {
  level: number;
  index: number;
  seed: number;
  pos: [number, number, number];
  temp: number;
  lum: number;
}

function poisson(rng: Rng, lambda: number): number {
  if (lambda <= 0) return 0;
  if (lambda > 25) return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * (rng() + rng() + rng() - 1.5) * 2));
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}

function tempFor(level: number, rng: Rng, youth: number): { t: number; giant: boolean } {
  const u = rng();
  switch (level) {
    case 0:
      if (u < 0.05) return { t: 7_000 + rng() * 9_000, giant: false }; // white dwarf
      return { t: u < 0.72 ? 2_700 + rng() * 1_100 : 3_800 + rng() * 1_400, giant: false };
    case 1:
      return { t: u < 0.4 ? 4_000 + rng() * 1_200 : u < 0.8 ? 5_200 + rng() * 800 : 6_000 + rng() * 1_300, giant: false };
    case 2: {
      const hot = 0.1 + youth * 0.3;
      if (u < hot) return { t: 10_500 + rng() * 9_000, giant: false };
      if (u < hot + 0.3) return { t: 7_200 + rng() * 2_800, giant: false };
      if (u < hot + 0.55) return { t: 6_000 + rng() * 1_300, giant: false };
      return { t: 3_900 + rng() * 900, giant: true };
    }
    default: {
      const hot = 0.25 + youth * 0.4;
      if (u < hot * 0.12) return { t: 30_000 + rng() * 12_000, giant: false };
      if (u < hot) return { t: 11_000 + rng() * 15_000, giant: false };
      if (u < hot + 0.08) return { t: 7_800 + rng() * 2_000, giant: true };
      return { t: 3_300 + rng() * 1_400, giant: true };
    }
  }
}

class Level {
  def: LevelDef;
  index: number;
  points: THREE.Points;
  geo: THREE.BufferGeometry;
  mat: THREE.ShaderMaterial;
  pos: Float32Array;
  col: Float32Array;
  lum: Float32Array;
  phase: Float32Array;
  temp: Float32Array;
  seeds: Uint32Array;
  count = 0;
  cellKey = '';
  origin = new THREE.Vector3();

  constructor(def: LevelDef, index: number) {
    this.def = def;
    this.index = index;
    this.pos = new Float32Array(def.cap * 3);
    this.col = new Float32Array(def.cap * 3);
    this.lum = new Float32Array(def.cap);
    this.phase = new Float32Array(def.cap);
    this.temp = new Float32Array(def.cap);
    this.seeds = new Uint32Array(def.cap);
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('lum', new THREE.BufferAttribute(this.lum, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('phase', new THREE.BufferAttribute(this.phase, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setDrawRange(0, 0);
    this.mat = makeStarPointMaterial(60);
    this.mat.uniforms.uRadius.value = def.cell * def.rc;
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
  }
}

export class LocalField {
  readonly group = new THREE.Group();
  private levels: Level[];
  private avoid: Map<string, [number, number, number][]> = new Map();
  private tmp = new THREE.Vector3();
  enabled = true;

  constructor(avoidPositions: [number, number, number][]) {
    this.levels = LEVELS.map((d, i) => new Level(d, i));
    for (const l of this.levels) this.group.add(l.points);
    for (const p of avoidPositions) {
      const k = this.avoidKey(p[0], p[1], p[2]);
      const arr = this.avoid.get(k) ?? [];
      arr.push(p);
      this.avoid.set(k, arr);
    }
  }

  private avoidKey(x: number, y: number, z: number) {
    return `${Math.floor(x / 20)},${Math.floor(y / 20)},${Math.floor(z / 20)}`;
  }

  private nearSystem(x: number, y: number, z: number, r: number): boolean {
    const cx = Math.floor(x / 20);
    const cy = Math.floor(y / 20);
    const cz = Math.floor(z / 20);
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++)
        for (let k = -1; k <= 1; k++) {
          const arr = this.avoid.get(`${cx + i},${cy + j},${cz + k}`);
          if (!arr) continue;
          for (const p of arr) if (Math.hypot(p[0] - x, p[1] - y, p[2] - z) < r) return true;
        }
    return false;
  }

  private regen(l: Level, cx: number, cy: number, cz: number) {
    const { cell, rc, perCell, lum, cap } = l.def;
    l.origin.set(cx * cell, cy * cell, cz * cell);
    l.points.position.copy(l.origin);
    let n = 0;
    const eX = ELISION_CENTER[0];
    const eY = ELISION_CENTER[1];
    const eZ = ELISION_CENTER[2];
    for (let i = -rc; i <= rc && n < cap; i++)
      for (let j = -rc; j <= rc && n < cap; j++)
        for (let k = -rc; k <= rc && n < cap; k++) {
          const gx = cx + i;
          const gy = cy + j;
          const gz = cz + k;
          const wx = (gx + 0.5) * cell;
          const wy = (gy + 0.5) * cell;
          const wz = (gz + 0.5) * cell;
          const ds = sampleDensity(wx, wy, wz);
          const rng = mulberry32(hash3(gx, gy, gz, 9173 + l.index * 7919));
          const count = Math.min(60, poisson(rng, perCell * Math.min(ds.density, 80)));
          for (let s = 0; s < count && n < cap; s++) {
            const px = (gx + rng()) * cell;
            const py = (gy + rng()) * cell;
            const pz = (gz + rng()) * cell;
            const { t, giant } = tempFor(l.index, rng, ds.youth);
            let L = Math.exp(Math.log(lum[0]) + rng() * (Math.log(lum[1]) - Math.log(lum[0])));
            if (giant) L *= 3;
            if (l.index === 0 && t > 7_000) L *= 0.05; // white dwarfs are faint
            const ph = rng() * 1000;
            if (l.index < 2 && this.nearSystem(px, py, pz, 4)) continue;
            if (Math.hypot(px - eX, py - eY, pz - eZ) < 26) continue;
            l.pos[n * 3] = px - l.origin.x;
            l.pos[n * 3 + 1] = py - l.origin.y;
            l.pos[n * 3 + 2] = pz - l.origin.z;
            starColorLinear(t, l.col, n);
            l.lum[n] = L;
            l.phase[n] = ph;
            l.temp[n] = t;
            l.seeds[n] = hash3(gx, gy, gz, l.index * 1000 + s + 1);
            n++;
          }
        }
    l.count = n;
    l.geo.setDrawRange(0, n);
    for (const name of ['position', 'color', 'lum', 'phase']) {
      const a = l.geo.getAttribute(name) as THREE.BufferAttribute;
      a.clearUpdateRanges();
      a.addUpdateRange(0, n * a.itemSize);
      a.needsUpdate = true;
    }
  }

  update(target: THREE.Vector3, D: number, dpr: number, time: number, hideAt: THREE.Vector3 | null, hideR: number) {
    for (const l of this.levels) {
      const fade = this.enabled ? 1 - THREE.MathUtils.smoothstep(D, l.def.visMax * 0.45, l.def.visMax) : 0;
      l.points.visible = fade > 0.001;
      if (!l.points.visible) continue;
      const c = l.def.cell;
      const cx = Math.floor(target.x / c);
      const cy = Math.floor(target.y / c);
      const cz = Math.floor(target.z / c);
      const key = `${cx},${cy},${cz}`;
      if (key !== l.cellKey) {
        l.cellKey = key;
        this.regen(l, cx, cy, cz);
      }
      const u = l.mat.uniforms;
      u.uFade.value = fade;
      u.uDpr.value = dpr;
      u.uTime.value = time;
      (u.uFocus.value as THREE.Vector3).copy(target).sub(l.origin);
      u.uNearHide.value = Math.min(D * 0.02, 0.05);
      if (hideAt) {
        (u.uHideAt.value as THREE.Vector3).copy(hideAt).sub(l.origin);
        u.uHideR.value = hideR;
      } else u.uHideR.value = 0;
    }
  }

  /** The n most prominent stars on screen (for labelling the neighbourhood). */
  brightest(camera: THREE.Camera, n: number): FieldStar[] {
    const out: { s: FieldStar; F: number }[] = [];
    const camPos = camera.position;
    const v = this.tmp;
    for (const l of this.levels) {
      if (!l.points.visible) continue;
      const fade = l.mat.uniforms.uFade.value as number;
      const focus = l.mat.uniforms.uFocus.value as THREE.Vector3;
      const R = l.def.cell * l.def.rc;
      for (let i = 0; i < l.count; i++) {
        const lx = l.pos[i * 3];
        const ly = l.pos[i * 3 + 1];
        const lz = l.pos[i * 3 + 2];
        if (Math.hypot(lx - focus.x, ly - focus.y, lz - focus.z) > R * 0.6) continue;
        const wx = lx + l.origin.x;
        const wy = ly + l.origin.y;
        const wz = lz + l.origin.z;
        const d2 = (wx - camPos.x) ** 2 + (wy - camPos.y) ** 2 + (wz - camPos.z) ** 2;
        const F = ((60 * l.lum[i]) / d2) * fade;
        if (F < 0.25 || (out.length >= n && F < out[out.length - 1].F)) continue;
        v.set(wx, wy, wz).project(camera);
        if (v.z > 1 || Math.abs(v.x) > 0.95 || Math.abs(v.y) > 0.92) continue;
        out.push({ s: { level: l.index, index: i, seed: l.seeds[i], pos: [wx, wy, wz], temp: l.temp[i], lum: l.lum[i] }, F });
        out.sort((a, b) => b.F - a.F);
        if (out.length > n) out.length = n;
      }
    }
    return out.map((o) => o.s);
  }

  /** Screen-space pick of the most prominent star near (sx, sy). */
  pick(camera: THREE.Camera, sx: number, sy: number, w: number, h: number, radiusPx: number): FieldStar | null {
    let best: FieldStar | null = null;
    let bestScore = Infinity;
    const v = this.tmp;
    const camPos = camera.position;
    for (const l of this.levels) {
      if (!l.points.visible) continue;
      const fade = l.mat.uniforms.uFade.value as number;
      const focus = l.mat.uniforms.uFocus.value as THREE.Vector3;
      const R = l.def.cell * l.def.rc;
      for (let i = 0; i < l.count; i++) {
        const lx = l.pos[i * 3];
        const ly = l.pos[i * 3 + 1];
        const lz = l.pos[i * 3 + 2];
        const rr = Math.hypot(lx - focus.x, ly - focus.y, lz - focus.z);
        if (rr > R * 0.9) continue;
        const wx = lx + l.origin.x;
        const wy = ly + l.origin.y;
        const wz = lz + l.origin.z;
        const d = Math.hypot(wx - camPos.x, wy - camPos.y, wz - camPos.z);
        const F = (60 * l.lum[i]) / (d * d) * fade;
        if (F < 0.012) continue;
        v.set(wx, wy, wz).project(camera);
        if (v.z > 1) continue;
        const px = (v.x * 0.5 + 0.5) * w;
        const py = (-v.y * 0.5 + 0.5) * h;
        const dd = Math.hypot(px - sx, py - sy);
        if (dd > radiusPx) continue;
        const score = dd - Math.log10(F + 1) * 6;
        if (score < bestScore) {
          bestScore = score;
          best = { level: l.index, index: i, seed: l.seeds[i], pos: [wx, wy, wz], temp: l.temp[i], lum: l.lum[i] };
        }
      }
    }
    return best;
  }
}
