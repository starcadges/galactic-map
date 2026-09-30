import * as THREE from 'three';
import { LANDMARKS, CHARTED } from '../world';
import { FACTIONS } from '../world/polities';
import type { Landmark } from '../world/types';
import { makeStarPointMaterial, starColorLinear } from './shaders/starPoints';

// Landmark and charted-system markers. Two layers share one index space:
//  - glyphs: crisp cartographic symbols, constant pixel size, fading by rank/distance
//  - stars:  the physical star at each location, visible when close enough to matter

export const ICON_CODE: Record<Landmark['icon'] | 'charted', number> = {
  system: 0,
  capital: 1,
  blackhole: 2,
  structure: 3,
  anomaly: 4,
  ruin: 5,
  cluster: 6,
  fleet: 7,
  nebula: 8,
  station: 9,
  restricted: 10,
  charted: 11,
};

export interface MarkerEntry {
  id: string;
  kind: 'landmark' | 'charted';
  pos: THREE.Vector3;
  rank: number;
  name: string;
}

const LUM: Record<string, number> = { O: 40_000, B: 1_500, A: 25, F: 3.5, G: 1, K: 0.45, M: 0.06, WD: 0.02, NS: 0.8, RG: 250, ART: 1.2, BD: 0.01, BH: 0 };

const glyphVert = /* glsl */ `
attribute float kind;
attribute float icon;
attribute float idx;
attribute vec3 uiColor;
uniform float uDpr;
uniform float uHover;
uniform float uSel;
uniform float uCharted;
uniform float uLand;
uniform float uTime;
uniform float uFocusIdx;
uniform float uFocusFade;
uniform float uD;
uniform float uBeacon;
varying vec3 vCol;
varying float vA;
varying float vIcon;
varying float vHover;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float d = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
  float maxD = kind < 0.5 ? 4.0e6 : kind < 1.5 ? 1.9e5 : kind < 2.5 ? 7.0e4 : 1.3e4;
  float a = 1.0 - smoothstep(maxD * 0.5, maxD, d);
  // in close views, far-off markers crowd the horizon: keep them proportional to the view
  float rel = kind < 0.5 ? max(uD * 400.0, 30000.0) : max(uD * 200.0, 3000.0);
  if (abs(idx - uBeacon) > 0.5) a *= 1.0 - smoothstep(rel * 0.45, rel, d);
  float isC = step(2.5, kind);
  a *= mix(uLand, uCharted, isC);
  // fade out as we arrive inside the system; the system view takes over
  a *= smoothstep(1.2, 5.0, d);
  float hov = 1.0 - step(0.5, abs(idx - uHover));
  float sel = 1.0 - step(0.5, abs(idx - uSel));
  if (abs(idx - uFocusIdx) < 0.5) a *= uFocusFade;
  float size = isC > 0.5 ? 11.0 : (kind < 0.5 ? 22.0 : kind < 1.5 ? 19.0 : 16.0);
  size *= 1.0 + hov * 0.35;
  a = max(a, hov * 0.9 * step(0.02, a + 0.02));
  gl_PointSize = size * uDpr;
  vCol = uiColor * (0.75 + 0.5 * hov + 0.3 * sel);
  vA = a * (isC > 0.5 ? 0.75 : 1.0);
  vIcon = icon;
  vHover = hov;
  if (a < 0.01) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;

const glyphFrag = /* glsl */ `
varying vec3 vCol;
varying float vA;
varying float vIcon;
varying float vHover;
float ring(float r, float rad, float w) { return 1.0 - smoothstep(w * 0.5, w * 0.5 + 0.06, abs(r - rad)); }
float dot0(float r, float rad) { return 1.0 - smoothstep(rad, rad + 0.08, r); }
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  p.y = -p.y;
  float r = length(p);
  float ang = atan(p.y, p.x);
  float a = 0.0;
  int ic = int(vIcon + 0.5);
  if (ic == 11) {
    a = dot0(r, 0.2) * 0.85 + ring(r, 0.62, 0.1) * 0.55;
  } else if (ic == 1) { // capital: double ring
    a = ring(r, 0.62, 0.08) + ring(r, 0.44, 0.06) * 0.8 + dot0(r, 0.12);
  } else if (ic == 2) { // black hole: ring with four ticks
    a = ring(r, 0.5, 0.07);
    float tick = step(0.62, r) * step(r, 0.9) * (1.0 - smoothstep(0.035, 0.07, min(abs(p.x), abs(p.y))));
    a = max(a, tick);
  } else if (ic == 3) { // structure: rounded square
    vec2 q = abs(p) - vec2(0.44);
    float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.08;
    a = 1.0 - smoothstep(0.03, 0.09, abs(sd));
    a += dot0(r, 0.1);
  } else if (ic == 4) { // anomaly: dashed ring
    float dash = step(0.0, sin(ang * 6.0));
    a = ring(r, 0.58, 0.08) * dash + dot0(r, 0.1) * 0.6;
  } else if (ic == 5) { // ruin: broken ring
    float gap = step(0.35, abs(sin(ang * 1.5 + 0.6)));
    a = ring(r, 0.56, 0.07) * gap;
    a += dot0(r, 0.09) * 0.7;
  } else if (ic == 6) { // cluster: three dots
    a = dot0(length(p - vec2(0.0, 0.3)), 0.14) + dot0(length(p - vec2(-0.28, -0.18)), 0.14) + dot0(length(p - vec2(0.28, -0.18)), 0.14);
  } else if (ic == 7) { // fleet: chevrons
    float c1 = 1.0 - smoothstep(0.04, 0.1, abs(abs(p.x) * 0.8 - p.y + 0.05));
    a = c1 * step(abs(p.x), 0.55) * step(abs(p.y), 0.6);
  } else if (ic == 8) { // nebula: soft
    a = ring(r, 0.55, 0.06) * 0.6 + (1.0 - smoothstep(0.0, 0.5, r)) * 0.35;
  } else if (ic == 9) { // station: diamond
    float dd = abs(p.x) + abs(p.y);
    a = 1.0 - smoothstep(0.04, 0.1, abs(dd - 0.52));
    a += dot0(r, 0.09);
  } else if (ic == 10) { // restricted: ring with bar
    a = ring(r, 0.56, 0.07) + (1.0 - smoothstep(0.04, 0.09, abs(p.x + p.y) * 0.7071)) * step(r, 0.5);
  } else { // system
    a = ring(r, 0.56, 0.07) + dot0(r, 0.12);
  }
  a = clamp(a, 0.0, 1.0) * vA;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vCol * a, a);
}`;

export class Markers {
  readonly group = new THREE.Group();
  readonly entries: MarkerEntry[] = [];
  readonly indexOf = new Map<string, number>();
  private glyphGeo = new THREE.BufferGeometry();
  private starGeo = new THREE.BufferGeometry();
  readonly glyphMat: THREE.ShaderMaterial;
  readonly starMat: THREE.ShaderMaterial;
  private glyphPos: Float32Array;
  private starPos: Float32Array;
  private starIndex: number[] = [];
  readonly origin = new THREE.Vector3(1e9, 0, 0);
  private glyphs: THREE.Points;
  private stars: THREE.Points;

  constructor() {
    const n = LANDMARKS.length + CHARTED.length;
    this.glyphPos = new Float32Array(n * 3);
    const kind = new Float32Array(n);
    const icon = new Float32Array(n);
    const idx = new Float32Array(n);
    const ui = new Float32Array(n * 3);
    const starCol: number[] = [];
    const starLum: number[] = [];
    const starPhase: number[] = [];
    const tmpC = new THREE.Color();
    const col = new Float32Array(3);

    const add = (e: MarkerEntry, k: number, ic: number, color: THREE.Color, starTemp: number | null, lum: number) => {
      const i = this.entries.length;
      this.entries.push(e);
      this.indexOf.set(e.id, i);
      kind[i] = k;
      icon[i] = ic;
      idx[i] = i;
      ui[i * 3] = color.r;
      ui[i * 3 + 1] = color.g;
      ui[i * 3 + 2] = color.b;
      if (starTemp !== null && lum > 0) {
        this.starIndex.push(i);
        starColorLinear(starTemp, col, 0);
        starCol.push(col[0], col[1], col[2]);
        starLum.push(lum);
        starPhase.push(Math.random() * 1000);
      }
    };

    const ivory = new THREE.Color('#efe3c6');
    for (const l of LANDMARKS) {
      const fc = new THREE.Color(FACTIONS[l.faction]?.color ?? '#cccccc');
      let c = ivory.clone().lerp(fc, 0.35);
      if (l.icon === 'anomaly') c = new THREE.Color('#cfc8ea');
      if (l.icon === 'ruin') c = new THREE.Color('#c9a58c');
      if (l.icon === 'restricted') c = new THREE.Color('#d88a74');
      if (l.icon === 'blackhole') c = new THREE.Color('#fff4de');
      const primary = l.system.stars[0];
      const lum = primary ? (LUM[primary.kind] ?? 1) * 2.5 : 0;
      add(
        { id: l.id, kind: 'landmark', pos: new THREE.Vector3(...l.pos), rank: l.rank, name: l.name },
        l.rank - 1,
        ICON_CODE[l.icon],
        c,
        primary && primary.kind !== 'BH' ? primary.temp : null,
        lum,
      );
    }
    for (const cs of CHARTED) {
      tmpC.set(FACTIONS[cs.faction]?.color ?? '#9a958b').lerp(ivory, 0.25);
      add({ id: cs.id, kind: 'charted', pos: new THREE.Vector3(...cs.pos), rank: 4, name: cs.name }, 3, ICON_CODE.charted, tmpC.clone(), cs.temp, (LUM[cs.starKind] ?? 1) * 1.6);
    }

    this.glyphGeo.setAttribute('position', new THREE.BufferAttribute(this.glyphPos, 3));
    this.glyphGeo.setAttribute('kind', new THREE.BufferAttribute(kind, 1));
    this.glyphGeo.setAttribute('icon', new THREE.BufferAttribute(icon, 1));
    this.glyphGeo.setAttribute('idx', new THREE.BufferAttribute(idx, 1));
    this.glyphGeo.setAttribute('uiColor', new THREE.BufferAttribute(ui, 3));
    this.glyphMat = new THREE.ShaderMaterial({
      vertexShader: glyphVert,
      fragmentShader: glyphFrag,
      uniforms: {
        uDpr: { value: 1 },
        uHover: { value: -1 },
        uSel: { value: -1 },
        uCharted: { value: 1 },
        uLand: { value: 1 },
        uTime: { value: 0 },
        uFocusIdx: { value: -1 },
        uFocusFade: { value: 1 },
        uD: { value: 1e6 },
        uBeacon: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    this.glyphs = new THREE.Points(this.glyphGeo, this.glyphMat);
    this.glyphs.frustumCulled = false;
    this.glyphs.renderOrder = 50;

    this.starPos = new Float32Array(this.starIndex.length * 3);
    this.starGeo.setAttribute('position', new THREE.BufferAttribute(this.starPos, 3));
    this.starGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(starCol), 3));
    this.starGeo.setAttribute('lum', new THREE.BufferAttribute(new Float32Array(starLum), 1));
    this.starGeo.setAttribute('phase', new THREE.BufferAttribute(new Float32Array(starPhase), 1));
    this.starMat = makeStarPointMaterial(60);
    this.stars = new THREE.Points(this.starGeo, this.starMat);
    this.stars.frustumCulled = false;
    this.stars.renderOrder = 6;

    this.group.add(this.stars, this.glyphs);
  }

  /** Keep vertex coordinates small near the focus: rebase when the focus drifts. */
  rebase(target: THREE.Vector3) {
    if (this.origin.distanceTo(target) < 2_500) return;
    const s = 2_000;
    this.origin.set(Math.round(target.x / s) * s, Math.round(target.y / s) * s, Math.round(target.z / s) * s);
    this.entries.forEach((e, i) => {
      this.glyphPos[i * 3] = e.pos.x - this.origin.x;
      this.glyphPos[i * 3 + 1] = e.pos.y - this.origin.y;
      this.glyphPos[i * 3 + 2] = e.pos.z - this.origin.z;
    });
    this.starIndex.forEach((ei, j) => {
      const e = this.entries[ei];
      this.starPos[j * 3] = e.pos.x - this.origin.x;
      this.starPos[j * 3 + 1] = e.pos.y - this.origin.y;
      this.starPos[j * 3 + 2] = e.pos.z - this.origin.z;
    });
    (this.glyphGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.starGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    this.group.position.copy(this.origin);
  }

  update(dpr: number, time: number, hideAt: THREE.Vector3 | null, hideR: number, D = 1e6) {
    const g = this.glyphMat.uniforms;
    g.uD.value = D;
    g.uBeacon.value = this.indexOf.get('orrhune') ?? -1;
    g.uDpr.value = dpr;
    g.uTime.value = time;
    const s = this.starMat.uniforms;
    s.uDpr.value = dpr;
    s.uTime.value = time;
    if (hideAt) {
      (s.uHideAt.value as THREE.Vector3).copy(hideAt).sub(this.origin);
      s.uHideR.value = hideR;
    } else s.uHideR.value = 0;
  }

  /** Opacity of a glyph, mirroring the shader logic, for picking and labels. */
  glyphAlpha(i: number, dist: number, showCharted: boolean, showLand: boolean, D = 1e6): number {
    const e = this.entries[i];
    const k = e.kind === 'charted' ? 3 : e.rank - 1;
    const maxD = k === 0 ? 4e6 : k === 1 ? 1.9e5 : k === 2 ? 7e4 : 1.3e4;
    let a = 1 - THREE.MathUtils.smoothstep(dist, maxD * 0.5, maxD);
    const rel = k === 0 ? Math.max(D * 400, 30_000) : Math.max(D * 200, 3_000);
    if (e.id !== 'orrhune') a *= 1 - THREE.MathUtils.smoothstep(dist, rel * 0.45, rel);
    a *= k === 3 ? (showCharted ? 1 : 0) : showLand ? 1 : 0;
    a *= THREE.MathUtils.smoothstep(dist, 1.2, 5);
    return a;
  }
}
