import * as THREE from 'three';
import { mulberry32, type Rng } from '../../world/rng';

// Local ship traffic: small craft moving between ports along gentle arcs, with
// short fading trails. Simulated on the CPU (at most a few hundred ships).

export type Port = () => THREE.Vector3;

interface Ship {
  from: Port;
  to: Port;
  ctrl: THREE.Vector3;
  t: number;
  dur: number;
  a: THREE.Vector3;
  b: THREE.Vector3;
}

const VERT = /* glsl */ `
attribute float alpha;
uniform float uDpr;
uniform float uFade;
varying float vA;
void main() {
  vA = alpha * uFade;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = 2.2 * uDpr;
}`;
const FRAG = /* glsl */ `
uniform vec3 uColor;
varying float vA;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;
  gl_FragColor = vec4(uColor * vA * exp(-r2 * 3.0), 1.0);
}`;
const TRAIL_VERT = /* glsl */ `
attribute float alpha;
uniform float uFade;
varying float vA;
void main() {
  vA = alpha * uFade;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const TRAIL_FRAG = /* glsl */ `
uniform vec3 uColor;
varying float vA;
void main() { gl_FragColor = vec4(uColor * vA, 1.0); }`;

export class Traffic {
  readonly group = new THREE.Group();
  private ships: Ship[] = [];
  private ports: Port[];
  private rng: Rng;
  private pos: Float32Array;
  private alpha: Float32Array;
  private tpos: Float32Array;
  private talpha: Float32Array;
  private pts: THREE.Points;
  private lines: THREE.LineSegments;
  readonly mats: THREE.ShaderMaterial[];
  private tmp = new THREE.Vector3();
  private prev = new THREE.Vector3();
  private scale: number;

  constructor(ports: Port[], count: number, seed: number, scale: number) {
    this.ports = ports;
    this.rng = mulberry32(seed);
    this.scale = scale;
    this.pos = new Float32Array(count * 3);
    this.alpha = new Float32Array(count);
    this.tpos = new Float32Array(count * 6);
    this.talpha = new Float32Array(count * 2);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    const pm = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uDpr: { value: 1 }, uFade: { value: 1 }, uColor: { value: new THREE.Color('#fff0d8') } },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    this.pts = new THREE.Points(g, pm);
    this.pts.frustumCulled = false;
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.BufferAttribute(this.tpos, 3).setUsage(THREE.DynamicDrawUsage));
    tg.setAttribute('alpha', new THREE.BufferAttribute(this.talpha, 1).setUsage(THREE.DynamicDrawUsage));
    const tm = new THREE.ShaderMaterial({
      vertexShader: TRAIL_VERT,
      fragmentShader: TRAIL_FRAG,
      uniforms: { uFade: { value: 1 }, uColor: { value: new THREE.Color('#d8e2f0') } },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    this.lines = new THREE.LineSegments(tg, tm);
    this.lines.frustumCulled = false;
    this.group.add(this.pts, this.lines);
    this.mats = [pm, tm];
    for (let i = 0; i < count; i++) {
      const s = this.spawn();
      s.t = this.rng();
      this.ships.push(s);
    }
  }

  private spawn(): Ship {
    const r = this.rng;
    const from = this.ports[Math.floor(r() * this.ports.length)];
    let to = this.ports[Math.floor(r() * this.ports.length)];
    if (to === from && this.ports.length > 1) to = this.ports[(this.ports.indexOf(from) + 1) % this.ports.length];
    const a = from().clone();
    const b = to().clone();
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const d = a.distanceTo(b);
    const ctrl = mid.add(new THREE.Vector3(r() - 0.5, (r() - 0.5) * 0.5, r() - 0.5).multiplyScalar(d * 0.6 + this.scale * 0.05));
    return { from, to, ctrl, t: 0, dur: 8 + (d / this.scale) * 30 + r() * 8, a, b };
  }

  private at(s: Ship, t: number, out: THREE.Vector3) {
    const b = s.to();
    const u = 1 - t;
    return out.set(
      u * u * s.a.x + 2 * u * t * s.ctrl.x + t * t * b.x,
      u * u * s.a.y + 2 * u * t * s.ctrl.y + t * t * b.y,
      u * u * s.a.z + 2 * u * t * s.ctrl.z + t * t * b.z,
    );
  }

  update(dt: number, fade: number, dpr: number, camLocal?: THREE.Vector3) {
    for (let i = 0; i < this.ships.length; i++) {
      let s = this.ships[i];
      s.t += dt / s.dur;
      if (s.t >= 1) {
        s = this.ships[i] = this.spawn();
      }
      const e = s.t * s.t * (3 - 2 * s.t);
      this.at(s, e, this.tmp);
      this.at(s, Math.max(0, e - 0.012), this.prev);
      if (camLocal) {
        // trails stay short on screen however close the camera is
        const maxLen = this.tmp.distanceTo(camLocal) * 0.035;
        const len = this.prev.distanceTo(this.tmp);
        if (len > maxLen) this.prev.sub(this.tmp).multiplyScalar(maxLen / len).add(this.tmp);
      }
      const a = Math.min(1, s.t * 8, (1 - s.t) * 8);
      this.pos[i * 3] = this.tmp.x;
      this.pos[i * 3 + 1] = this.tmp.y;
      this.pos[i * 3 + 2] = this.tmp.z;
      this.alpha[i] = a;
      this.tpos.set([this.tmp.x, this.tmp.y, this.tmp.z, this.prev.x, this.prev.y, this.prev.z], i * 6);
      this.talpha[i * 2] = a * 0.3;
      this.talpha[i * 2 + 1] = 0;
    }
    for (const g of [this.pts.geometry, this.lines.geometry]) {
      (g.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      (g.getAttribute('alpha') as THREE.BufferAttribute).needsUpdate = true;
    }
    this.mats[0].uniforms.uFade.value = fade;
    this.mats[0].uniforms.uDpr.value = dpr;
    this.mats[1].uniforms.uFade.value = fade;
  }
}
