import * as THREE from 'three';
import { ROUTES, ROUTE_STYLE, ELISION_CENTER, ELISION_BEND_RADIUS } from '../world/routes';
import { LANDMARK_BY_ID } from '../world';
import type { RouteDef, Vec3 } from '../world/types';

// Threads and dead roads as screen-space ribbons, plus moving traffic.

const RIBBON_VERT = /* glsl */ `
attribute vec3 other;
attribute float side;
attribute float along;
attribute float rIdx;
attribute float isEnd;
uniform vec2 uRes;
uniform float uDpr;
uniform float uWidth[64];
varying float vSide;
varying float vAlong;
varying float vIdx;
varying vec3 vLocal;
varying float vDepth;
void main() {
  vec4 a = modelViewMatrix * vec4(position, 1.0);
  vec4 b = modelViewMatrix * vec4(other, 1.0);
  // clip the segment against the near plane (view space z < -near)
  float nearZ = -0.0001;
  if (a.z > nearZ && b.z > nearZ) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  if (a.z > nearZ) { float t = (nearZ - b.z) / (a.z - b.z); a = mix(b, a, t); }
  if (b.z > nearZ) { float t = (nearZ - a.z) / (b.z - a.z); b = mix(a, b, t); }
  vec4 ca = projectionMatrix * a;
  vec4 cb = projectionMatrix * b;
  vec2 sa = ca.xy / ca.w * uRes;
  vec2 sb = cb.xy / cb.w * uRes;
  // always the segment's a→b direction, so both ends agree on which side is which
  vec2 dir = normalize((isEnd > 0.5 ? sa - sb : sb - sa) + vec2(1e-6));
  vec2 nrm = vec2(-dir.y, dir.x);
  int i = int(rIdx + 0.5);
  float w = uWidth[i] * uDpr;
  vec2 off = nrm * side * w / uRes;
  gl_Position = ca + vec4(off * ca.w, 0.0, 0.0);
  vSide = side;
  vAlong = along;
  vIdx = rIdx;
  vLocal = position;
  vDepth = -a.z;
}`;

const RIBBON_FRAG = /* glsl */ `
uniform vec3 uColor[64];
uniform vec4 uStyle[64]; // alpha, dash, pulse, highlight
uniform float uTime;
uniform float uScale;   // world units per "screen unit" (∝ view distance)
uniform vec3 uHideAt;
uniform float uHideR;
uniform float uFade;
uniform float uNear;
varying float vSide;
varying float vAlong;
varying float vIdx;
varying vec3 vLocal;
varying float vDepth;
void main() {
  int i = int(vIdx + 0.5);
  vec4 st = uStyle[i];
  float edge = 1.0 - smoothstep(0.35, 1.0, abs(vSide));
  float a = st.x * edge;
  float dashLen = uScale * 0.018;
  if (st.y > 0.0) {
    float f = fract(vAlong / dashLen);
    a *= step(st.y, 1.0 - f) + (st.y > 0.9 ? smoothstep(0.93, 0.95, f) * 2.0 : 0.0);
  }
  float pulse = 0.0;
  if (st.z > 0.0 && uNear > 0.5) {
    float period = uScale * 0.45;
    float ph = fract(vAlong / period - uTime * 0.22 * (0.6 + st.z));
    pulse = exp(-pow((ph - 0.5) / 0.05, 2.0)) * st.z * 0.55;
  }
  float hide = uHideR > 0.0 ? smoothstep(uHideR * 0.4, uHideR, length(vLocal - uHideAt)) : 1.0;
  float hl = st.w;
  // close in, a thread is a faint line to somewhere else, not a road
  float closeFade = mix(0.28, 1.0, uNear);
  vec3 col = uColor[i] * (a * (1.0 + hl * 1.4) * closeFade + pulse * 0.9 * edge * uNear);
  gl_FragColor = vec4(col * hide * uFade, 1.0);
}`;

const TRAFFIC_VERT = /* glsl */ `
attribute float rIdx;
attribute float offset;
attribute float speed;
uniform sampler2D uPath;
uniform float uTime;
uniform float uSamples;
uniform float uDpr;
uniform float uFade;
uniform vec3 uColor[64];
uniform vec4 uStyle[64];
varying vec3 vCol;
void main() {
  float s = fract(offset + uTime * speed);
  float fx = s * (uSamples - 1.0);
  float x0 = floor(fx);
  float t = fx - x0;
  int row = int(rIdx + 0.5);
  vec3 p0 = texelFetch(uPath, ivec2(int(x0), row), 0).xyz;
  vec3 p1 = texelFetch(uPath, ivec2(min(int(x0) + 1, int(uSamples) - 1), row), 0).xyz;
  vec3 p = mix(p0, p1, t);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = 2.4 * uDpr;
  float edgeFade = smoothstep(0.0, 0.03, s) * (1.0 - smoothstep(0.97, 1.0, s));
  vCol = mix(uColor[row], vec3(1.0, 0.95, 0.85), 0.5) * uFade * edgeFade * (uStyle[row].x > 0.0 ? 1.0 : 0.0);
}`;
const TRAFFIC_FRAG = /* glsl */ `
varying vec3 vCol;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;
  gl_FragColor = vec4(vCol * exp(-r2 * 3.0) * 0.9, 1.0);
}`;

export interface RouteRuntime {
  def: RouteDef;
  points: THREE.Vector3[]; // world, double precision
  length: number;
}

const SAMPLES = 256;

function resolve(p: string | Vec3): THREE.Vector3 {
  if (typeof p === 'string') {
    const l = LANDMARK_BY_ID[p];
    if (!l) throw new Error(`route references unknown landmark ${p}`);
    return new THREE.Vector3(...l.pos);
  }
  return new THREE.Vector3(...p);
}

function bend(v: THREE.Vector3) {
  const R = ELISION_BEND_RADIUS;
  const dx = v.x - ELISION_CENTER[0];
  const dz = v.z - ELISION_CENTER[2];
  const d = Math.hypot(dx, dz);
  if (d > 2 * R || d < 1e-6) return;
  const target = Math.sqrt(d * d + (0.95 * R) * (0.95 * R));
  const w = 1 - THREE.MathUtils.smoothstep(d, R, 2 * R);
  const nd = d + (target - d) * w;
  v.x = ELISION_CENTER[0] + (dx / d) * nd;
  v.z = ELISION_CENTER[2] + (dz / d) * nd;
}

export class Routes {
  readonly group = new THREE.Group();
  readonly routes: RouteRuntime[] = [];
  private ribbonGeo = new THREE.BufferGeometry();
  private ribbonMat: THREE.ShaderMaterial;
  private trafficMat: THREE.ShaderMaterial;
  private trafficPts: THREE.Points;
  private pathTex: THREE.DataTexture;
  private pathData: Float32Array;
  private ribbonPos!: Float32Array;
  private ribbonOther!: Float32Array;
  private segWorld: { a: THREE.Vector3; b: THREE.Vector3 }[] = [];
  readonly origin = new THREE.Vector3(1e9, 0, 0);
  readonly styleArr: THREE.Vector4[] = [];
  readonly baseAlpha: number[] = [];
  hover = -1;
  selected = -1;
  highlightSet = new Set<number>();

  constructor() {
    ROUTES.forEach((r) => {
      const ctrl = r.path.map(resolve);
      // lift each segment into a gentle arc so the network reads in 3D
      const pts: THREE.Vector3[] = [ctrl[0].clone()];
      for (let i = 0; i < ctrl.length - 1; i++) {
        const a = ctrl[i];
        const b = ctrl[i + 1];
        const len = a.distanceTo(b);
        const lift = r.cls === 'vey' || r.cls === 'unanswered' ? 0 : len * 0.035;
        const mid = a.clone().add(b).multiplyScalar(0.5);
        mid.y += lift;
        pts.push(mid, b.clone());
      }
      const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
      const total = curve.getLength();
      const n = THREE.MathUtils.clamp(Math.round(total / 120), 24, 900);
      const sampled = curve.getSpacedPoints(n);
      if (r.cls !== 'vey' && r.cls !== 'unanswered') sampled.forEach(bend);
      let length = 0;
      for (let i = 1; i < sampled.length; i++) length += sampled[i].distanceTo(sampled[i - 1]);
      this.routes.push({ def: r, points: sampled, length });
    });

    // ribbon geometry
    let segCount = 0;
    for (const r of this.routes) segCount += r.points.length - 1;
    this.ribbonPos = new Float32Array(segCount * 4 * 3);
    this.ribbonOther = new Float32Array(segCount * 4 * 3);
    const side = new Float32Array(segCount * 4);
    const along = new Float32Array(segCount * 4);
    const ridx = new Float32Array(segCount * 4);
    const isEnd = new Float32Array(segCount * 4);
    const index: number[] = [];
    let v = 0;
    this.routes.forEach((r, ri) => {
      let acc = 0;
      for (let i = 0; i < r.points.length - 1; i++) {
        const a = r.points[i];
        const b = r.points[i + 1];
        const len = a.distanceTo(b);
        this.segWorld.push({ a, b });
        // 4 verts: a+, a-, b, b ; other = the opposite endpoint. At b the screen
        // direction is reversed, so the same side sign lands on the opposite edge.
        const sides = [1, -1, -1, 1];
        const alongs = [acc, acc, acc + len, acc + len];
        for (let k = 0; k < 4; k++) {
          side[v + k] = sides[k];
          along[v + k] = alongs[k];
          ridx[v + k] = ri;
          isEnd[v + k] = k < 2 ? 0 : 1;
        }
        index.push(v, v + 1, v + 2, v, v + 2, v + 3);
        v += 4;
        acc += len;
      }
    });
    const g = this.ribbonGeo;
    g.setAttribute('position', new THREE.BufferAttribute(this.ribbonPos, 3));
    g.setAttribute('other', new THREE.BufferAttribute(this.ribbonOther, 3));
    g.setAttribute('side', new THREE.BufferAttribute(side, 1));
    g.setAttribute('along', new THREE.BufferAttribute(along, 1));
    g.setAttribute('rIdx', new THREE.BufferAttribute(ridx, 1));
    g.setAttribute('isEnd', new THREE.BufferAttribute(isEnd, 1));
    g.setIndex(index);

    const colors: THREE.Vector3[] = [];
    const widths: number[] = [];
    for (let i = 0; i < 64; i++) {
      const r = this.routes[i];
      const st = r ? ROUTE_STYLE[r.def.cls] : null;
      const c = new THREE.Color(st?.color ?? '#ffffff');
      colors.push(new THREE.Vector3(c.r, c.g, c.b));
      widths.push(st ? st.width * (1 + 0.35 * (r.def.traffic ?? 0)) : 1);
      this.styleArr.push(new THREE.Vector4(st?.alpha ?? 0, st?.dash ?? 0, st ? st.pulse * Math.max(0.2, r.def.traffic) : 0, 0));
      this.baseAlpha.push(st?.alpha ?? 0);
    }
    this.ribbonMat = new THREE.ShaderMaterial({
      vertexShader: RIBBON_VERT,
      fragmentShader: RIBBON_FRAG,
      uniforms: {
        uRes: { value: new THREE.Vector2(800, 600) },
        uDpr: { value: 1 },
        uWidth: { value: widths },
        uColor: { value: colors },
        uStyle: { value: this.styleArr },
        uTime: { value: 0 },
        uScale: { value: 1000 },
        uHideAt: { value: new THREE.Vector3() },
        uHideR: { value: 0 },
        uFade: { value: 1 },
        uNear: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(g, this.ribbonMat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 40;

    // traffic
    this.pathData = new Float32Array(SAMPLES * 64 * 4);
    this.pathTex = new THREE.DataTexture(this.pathData, SAMPLES, 64, THREE.RGBAFormat, THREE.FloatType);
    this.pathTex.needsUpdate = true;
    const tIdx: number[] = [];
    const tOff: number[] = [];
    const tSpd: number[] = [];
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    this.routes.forEach((r, ri) => {
      const count = Math.round(r.def.traffic * Math.min(260, r.length / 70));
      for (let k = 0; k < count; k++) {
        tIdx.push(ri);
        tOff.push(rnd());
        const dir = rnd() < 0.5 ? 1 : -1;
        tSpd.push((dir * (380 + rnd() * 500)) / r.length);
      }
    });
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tIdx.length * 3), 3));
    tg.setAttribute('rIdx', new THREE.BufferAttribute(new Float32Array(tIdx), 1));
    tg.setAttribute('offset', new THREE.BufferAttribute(new Float32Array(tOff), 1));
    tg.setAttribute('speed', new THREE.BufferAttribute(new Float32Array(tSpd), 1));
    this.trafficMat = new THREE.ShaderMaterial({
      vertexShader: TRAFFIC_VERT,
      fragmentShader: TRAFFIC_FRAG,
      uniforms: {
        uPath: { value: this.pathTex },
        uTime: { value: 0 },
        uSamples: { value: SAMPLES },
        uDpr: { value: 1 },
        uFade: { value: 1 },
        uColor: { value: colors },
        uStyle: { value: this.styleArr },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    this.trafficPts = new THREE.Points(tg, this.trafficMat);
    this.trafficPts.frustumCulled = false;
    this.trafficPts.renderOrder = 41;
    this.group.add(mesh, this.trafficPts);
  }

  rebase(target: THREE.Vector3) {
    if (this.origin.distanceTo(target) < 2_500) return;
    const s = 2_000;
    this.origin.set(Math.round(target.x / s) * s, Math.round(target.y / s) * s, Math.round(target.z / s) * s);
    const o = this.origin;
    let v = 0;
    for (const seg of this.segWorld) {
      const ax = seg.a.x - o.x;
      const ay = seg.a.y - o.y;
      const az = seg.a.z - o.z;
      const bx = seg.b.x - o.x;
      const by = seg.b.y - o.y;
      const bz = seg.b.z - o.z;
      // a+, a-, b+, b-
      this.ribbonPos.set([ax, ay, az, ax, ay, az, bx, by, bz, bx, by, bz], v * 3);
      this.ribbonOther.set([bx, by, bz, bx, by, bz, ax, ay, az, ax, ay, az], v * 3);
      v += 4;
    }
    (this.ribbonGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.ribbonGeo.getAttribute('other') as THREE.BufferAttribute).needsUpdate = true;
    this.routes.forEach((r, ri) => {
      // resample uniformly by arc length into the texture row
      const pts = r.points;
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
      let j = 0;
      for (let k = 0; k < SAMPLES; k++) {
        const target = (k / (SAMPLES - 1)) * r.length;
        while (j < pts.length - 2 && cum[j + 1] < target) j++;
        const t = (target - cum[j]) / Math.max(cum[j + 1] - cum[j], 1e-9);
        const x = pts[j].x + (pts[j + 1].x - pts[j].x) * t - o.x;
        const y = pts[j].y + (pts[j + 1].y - pts[j].y) * t - o.y;
        const z = pts[j].z + (pts[j + 1].z - pts[j].z) * t - o.z;
        this.pathData.set([x, y, z, 1], (ri * SAMPLES + k) * 4);
      }
    });
    this.pathTex.needsUpdate = true;
    this.group.position.copy(this.origin);
  }

  update(time: number, w: number, h: number, dpr: number, D: number, hideAt: THREE.Vector3 | null, hideR: number, show: boolean, showTraffic: boolean, eraAlpha: (r: RouteDef) => number) {
    const u = this.ribbonMat.uniforms;
    (u.uRes.value as THREE.Vector2).set(w / 2, h / 2);
    u.uDpr.value = dpr;
    u.uTime.value = time;
    u.uScale.value = Math.max(D, 0.5);
    u.uNear.value = THREE.MathUtils.smoothstep(D, 30, 1_500);
    u.uFade.value = show ? 1 : 0;
    this.group.visible = show;
    if (hideAt) {
      (u.uHideAt.value as THREE.Vector3).copy(hideAt).sub(this.origin);
      u.uHideR.value = hideR;
    } else u.uHideR.value = 0;
    this.routes.forEach((r, i) => {
      const st = this.styleArr[i];
      const hl = i === this.hover || i === this.selected || this.highlightSet.has(i) ? 1 : 0;
      st.x = this.baseAlpha[i] * eraAlpha(r.def) * (this.highlightSet.size && !this.highlightSet.has(i) ? 0.4 : 1);
      st.w = hl;
    });
    const t = this.trafficMat.uniforms;
    t.uTime.value = time;
    t.uDpr.value = dpr;
    t.uFade.value = showTraffic ? THREE.MathUtils.smoothstep(D, 300, 3_000) : 0;
    this.trafficPts.visible = showTraffic && D > 300;
  }

  /** nearest route to a screen point, for hover */
  pick(camera: THREE.Camera, sx: number, sy: number, w: number, h: number, maxPx: number): number {
    let best = -1;
    let bestD = maxPx;
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    for (let ri = 0; ri < this.routes.length; ri++) {
      if (this.styleArr[ri].x < 0.05) continue;
      const pts = this.routes[ri].points;
      const step = Math.max(1, Math.floor(pts.length / 80));
      for (let i = 0; i < pts.length - step; i += step) {
        a.copy(pts[i]).project(camera);
        b.copy(pts[i + step]).project(camera);
        if (a.z > 1 || b.z > 1 || a.z < -1 || b.z < -1) continue;
        const ax = (a.x * 0.5 + 0.5) * w;
        const ay = (-a.y * 0.5 + 0.5) * h;
        const bx = (b.x * 0.5 + 0.5) * w;
        const by = (-b.y * 0.5 + 0.5) * h;
        const dx = bx - ax;
        const dy = by - ay;
        const l2 = dx * dx + dy * dy;
        const t = l2 > 0 ? THREE.MathUtils.clamp(((sx - ax) * dx + (sy - ay) * dy) / l2, 0, 1) : 0;
        const d = Math.hypot(sx - (ax + dx * t), sy - (ay + dy * t));
        if (d < bestD) {
          bestD = d;
          best = ri;
        }
      }
    }
    return best;
  }

  /** directions (unit, world) of routes leaving a landmark */
  dirsFrom(id: string): THREE.Vector3[] {
    const out: THREE.Vector3[] = [];
    const l = LANDMARK_BY_ID[id];
    if (!l) return out;
    const p = new THREE.Vector3(...l.pos);
    for (const r of this.routes) {
      const pts = r.points;
      if (pts[0].distanceTo(p) < 1) out.push(pts[Math.min(3, pts.length - 1)].clone().sub(p).normalize());
      else if (pts[pts.length - 1].distanceTo(p) < 1) out.push(pts[Math.max(0, pts.length - 4)].clone().sub(p).normalize());
      else {
        // pass-through: nearest sample
        let bi = -1;
        let bd = 400;
        for (let i = 1; i < pts.length - 1; i++) {
          const d = pts[i].distanceTo(p);
          if (d < bd) {
            bd = d;
            bi = i;
          }
        }
        if (bi > 0) {
          const f = Math.min(pts.length - 1, bi + 2);
          const b = Math.max(0, bi - 2);
          out.push(pts[f].clone().sub(p).normalize(), pts[b].clone().sub(p).normalize());
        }
      }
    }
    return out;
  }

  routesAt(id: string): RouteRuntime[] {
    return this.routes.filter((r) => r.def.path.includes(id));
  }
}
