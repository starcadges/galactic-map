import * as THREE from 'three';
import type { StructureDef } from '../../world/types';
import { gauss, mulberry32, type Rng } from '../../world/rng';
import { LIGHT_POINTS_FRAG, LIGHT_POINTS_VERT, ORBIT_INST_FRAG, ORBIT_INST_VERT } from './shaders';
import { NOISE_GLSL } from '../shaders/noise';

// Builders for system-scale structures. Everything is built in system-local
// coordinates (ly, star at the origin) and animated on the GPU where possible.

export interface Built {
  object: THREE.Object3D;
  update?: (t: number, dt: number, ctx: UpdateCtx) => void;
  /** materials needing uTime / fades */
  mats: THREE.ShaderMaterial[];
  label?: { text: string; local: THREE.Vector3; radius: number };
  /** points ships may travel to */
  ports?: THREE.Vector3[];
}

export interface UpdateCtx {
  camera: THREE.Camera;
  dpr: number;
  px: number; // pixel scale
  fade: number;
  starCol: THREE.Vector3;
}

const GEO = {
  panel: new THREE.PlaneGeometry(1, 1),
  habitat: new THREE.CylinderGeometry(0.28, 0.28, 1, 6, 1).rotateZ(Math.PI / 2),
  station: new THREE.OctahedronGeometry(0.6, 0),
  rock: new THREE.IcosahedronGeometry(0.5, 0),
  mirror: new THREE.CircleGeometry(0.5, 6),
  dish: new THREE.ConeGeometry(0.5, 0.35, 8, 1, true).rotateX(Math.PI / 2),
  box: new THREE.BoxGeometry(1, 1, 1),
};

export function orbitMaterial(emissive: number, faceStar: boolean): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: ORBIT_INST_VERT,
    fragmentShader: ORBIT_INST_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uFaceStar: { value: faceStar ? 1 : 0 },
      uStarCol: { value: new THREE.Vector3(1, 1, 1) },
      uEmissive: { value: emissive },
    },
    side: THREE.DoubleSide,
  });
}

export function lightMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: LIGHT_POINTS_VERT,
    fragmentShader: LIGHT_POINTS_FRAG,
    uniforms: { uDpr: { value: 1 }, uTime: { value: 0 }, uFade: { value: 1 }, uPx: { value: 1000 } },
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
}

interface OrbitSpec {
  r: number;
  incl: number;
  node: number;
  phase: number;
  speed: number;
  scale: number;
  spin: number;
  color: THREE.Color;
}

function orbitInstances(geo: THREE.BufferGeometry, specs: OrbitSpec[], mat: THREE.ShaderMaterial): THREE.Mesh {
  const g = new THREE.InstancedBufferGeometry();
  g.index = geo.index;
  g.setAttribute('position', geo.getAttribute('position'));
  g.setAttribute('normal', geo.getAttribute('normal'));
  const orbit = new Float32Array(specs.length * 4);
  const misc = new Float32Array(specs.length * 4);
  const col = new Float32Array(specs.length * 3);
  specs.forEach((s, i) => {
    orbit.set([s.r, s.incl, s.node, s.phase], i * 4);
    misc.set([s.speed, s.scale, s.spin, 0], i * 4);
    col.set([s.color.r, s.color.g, s.color.b], i * 3);
  });
  g.setAttribute('iOrbit', new THREE.InstancedBufferAttribute(orbit, 4));
  g.setAttribute('iMisc', new THREE.InstancedBufferAttribute(misc, 4));
  g.setAttribute('iColor', new THREE.InstancedBufferAttribute(col, 3));
  g.instanceCount = specs.length;
  const m = new THREE.Mesh(g, mat);
  m.frustumCulled = false;
  return m;
}

const ORBIT_GLOW_VERT = /* glsl */ `
attribute vec4 iOrbit;
attribute vec4 iMisc;
attribute vec3 color;
uniform float uTime;
uniform float uDpr;
uniform float uFade;
uniform float uPx;
uniform float uGain;
varying vec3 vCol;
mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
void main() {
  float ang = iOrbit.w + uTime * iMisc.x;
  vec3 op = rotY(iOrbit.z) * rotX(iOrbit.y) * vec3(cos(ang) * iOrbit.x, 0.0, sin(ang) * iOrbit.x);
  vec4 mv = modelViewMatrix * vec4(op, 1.0);
  gl_Position = projectionMatrix * mv;
  float d = max(-mv.z, 1e-9);
  float px = iMisc.y * uPx / d;
  gl_PointSize = clamp(px * 1.6 + 1.6, 1.6, 5.0) * uDpr;
  // a glow while unresolved; the mesh takes over once it is several pixels wide
  float w = 1.0 - smoothstep(2.0, 9.0, px);
  vCol = color * uFade * uGain * (0.35 + 0.65 * w);
}`;
const ORBIT_GLOW_FRAG = /* glsl */ `
varying vec3 vCol;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;
  gl_FragColor = vec4(vCol * exp(-r2 * 3.5), 1.0);
}`;

function orbitGlow(specs: OrbitSpec[], color: THREE.Color, gain: number): { pts: THREE.Points; mat: THREE.ShaderMaterial } {
  const g = new THREE.BufferGeometry();
  const n = specs.length;
  const orbit = new Float32Array(n * 4);
  const misc = new Float32Array(n * 4);
  const col = new Float32Array(n * 3);
  specs.forEach((s, i) => {
    orbit.set([s.r, s.incl, s.node, s.phase], i * 4);
    misc.set([s.speed, s.scale, s.spin, 0], i * 4);
    const k = 0.6 + ((i * 7919) % 100) / 250;
    col.set([color.r * k, color.g * k, color.b * k], i * 3);
  });
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('iOrbit', new THREE.BufferAttribute(orbit, 4));
  g.setAttribute('iMisc', new THREE.BufferAttribute(misc, 4));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.ShaderMaterial({
    vertexShader: ORBIT_GLOW_VERT,
    fragmentShader: ORBIT_GLOW_FRAG,
    uniforms: { uTime: { value: 0 }, uDpr: { value: 1 }, uFade: { value: 1 }, uPx: { value: 1000 }, uGain: { value: gain } },
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 12;
  return { pts, mat };
}

function withGlow(mesh: THREE.Mesh, specs: OrbitSpec[], color: string, gain: number, mats: THREE.ShaderMaterial[]): THREE.Group {
  const grp = new THREE.Group();
  grp.add(mesh);
  const { pts, mat } = orbitGlow(specs, new THREE.Color(color), gain);
  grp.add(pts);
  mats.push(mat);
  return grp;
}

/** Kepler-ish angular speed in rad/s: slow enough to follow, faster inside. */
export function orbitSpeed(r: number): number {
  return (Math.PI * 2) / (70 * Math.pow(Math.max(r, 0.02) / 0.3, 1.5));
}

function lightPoints(positions: THREE.Vector3[], color: THREE.Color, size: number, blink: boolean, rng: Rng) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(positions.length * 3);
  const c = new Float32Array(positions.length * 3);
  const s = new Float32Array(positions.length);
  const ph = new Float32Array(positions.length);
  positions.forEach((v, i) => {
    p.set([v.x, v.y, v.z], i * 3);
    c.set([color.r, color.g, color.b], i * 3);
    s[i] = size;
    ph[i] = blink ? rng() : -1;
  });
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  g.setAttribute('size', new THREE.BufferAttribute(s, 1));
  g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
  const mat = lightMaterial();
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  return { pts, mat };
}

const NEB_VERT = /* glsl */ `
attribute vec4 iData; // xyz offset, size
attribute vec3 iColor;
attribute float iSeed;
uniform float uFade;
varying vec2 vUv;
varying vec3 vCol;
varying float vSeed;
varying float vA;
void main() {
  vec4 c = modelViewMatrix * vec4(iData.xyz, 1.0);
  float d = length(c.xyz);
  float nearF = smoothstep(iData.w * 0.4, iData.w * 1.6, d);
  c.xy += position.xy * iData.w;
  vUv = position.xy;
  vCol = iColor;
  vSeed = iSeed;
  vA = nearF * uFade;
  gl_Position = projectionMatrix * c;
}`;
const NEB_FRAG = /* glsl */ `
varying vec2 vUv;
varying vec3 vCol;
varying float vSeed;
varying float vA;
uniform float uTime;
${NOISE_GLSL}
void main() {
  float r = length(vUv);
  if (r > 1.0) discard;
  float n = fbm2(vUv * 1.6 + vSeed * 13.0 + uTime * 0.01);
  float n2 = vnoise2(vUv * 4.3 - vSeed * 7.0);
  float w = smoothstep(0.42, 0.9, n) * (0.55 + 0.9 * smoothstep(0.35, 0.8, n2));
  // bright ionisation fronts where the cloud thins
  float rim = smoothstep(0.02, 0.0, abs(n - 0.52)) * 0.8;
  float a = (1.0 - smoothstep(0.15, 1.0, r)) * (w + rim) * vA;
  gl_FragColor = vec4(vCol * a, 1.0);
}`;

export function buildStructure(s: StructureDef, rng: Rng, env: { starCol: THREE.Color; sisterDir: THREE.Vector3; coreDir: THREE.Vector3; gateDirs: THREE.Vector3[] }): Built | null {
  switch (s.kind) {
    case 'swarm': {
      const specs: OrbitSpec[] = [];
      const lobes = s.lobes ?? 0;
      const col = new THREE.Color(s.color ?? '#9fb8d8');
      for (let i = 0; i < s.count; i++) {
        const lobe = lobes ? i % lobes : 0;
        const r = s.radius + gauss(rng) * s.spread * 0.5;
        specs.push({
          r,
          incl: lobes ? 0.08 + lobe * 0.05 + gauss(rng) * 0.04 : Math.acos(1 - 2 * rng()) - Math.PI / 2,
          node: lobes ? lobe * 0.4 + gauss(rng) * 0.05 : rng() * Math.PI * 2,
          phase: lobes ? (lobe / lobes) * Math.PI * 2 + gauss(rng) * 0.32 : rng() * Math.PI * 2,
          speed: orbitSpeed(s.radius) * (lobes ? 1 : 0.6 + rng() * 0.8),
          scale: s.radius * 0.013 * (0.6 + rng() * 0.9),
          spin: 0,
          color: col.clone().multiplyScalar(0.55 + rng() * 0.3),
        });
      }
      const mat = orbitMaterial(0.35, true);
      const mats = [mat];
      const m = withGlow(orbitInstances(GEO.panel, specs, mat), specs, s.color ?? '#9fb8d8', 0.35, mats);
      return { object: m, mats, label: s.label ? { text: s.label, local: new THREE.Vector3(s.radius, 0, 0), radius: s.radius } : undefined };
    }
    case 'habitats': {
      const specs: OrbitSpec[] = [];
      const col = new THREE.Color(s.color ?? '#e8d8b8');
      const petals = s.petals ?? 0;
      for (let i = 0; i < s.count; i++) {
        const k = petals ? i % petals : 0;
        const r = s.radius + gauss(rng) * s.spread * (petals ? 0.12 : 0.45);
        specs.push({
          r,
          incl: petals ? 0.62 + gauss(rng) * 0.008 : gauss(rng) * 0.35,
          node: petals ? (k / petals) * Math.PI * 2 + gauss(rng) * 0.008 : rng() * Math.PI * 2,
          phase: rng() * Math.PI * 2,
          speed: orbitSpeed(r),
          scale: Math.max(0.0012, s.radius * 0.0055) * (0.5 + rng()),
          spin: 0.3,
          color: col.clone().multiplyScalar(0.6 + rng() * 0.5),
        });
      }
      const mat = orbitMaterial(0.9, false);
      const mats = [mat];
      const m = withGlow(orbitInstances(GEO.habitat, specs, mat), specs, '#ffd49a', 1.1, mats);
      const ports = specs.slice(0, 12).map((sp) => new THREE.Vector3(Math.cos(sp.phase) * sp.r, 0, Math.sin(sp.phase) * sp.r));
      return { object: m, mats, ports, label: s.label ? { text: s.label, local: new THREE.Vector3(0, s.radius * 0.55, s.radius * 0.9), radius: s.radius } : undefined };
    }
    case 'stations': {
      const specs: OrbitSpec[] = [];
      const col = new THREE.Color(s.color ?? '#d8d0c0');
      const spread = s.spread ?? 0.05;
      for (let i = 0; i < s.count; i++) {
        const r = s.radius + gauss(rng) * spread * 0.5;
        specs.push({
          r,
          incl: gauss(rng) * (spread > 0.05 ? 0.3 : 0.04) + (s.count > 300 ? 0 : 0),
          node: rng() * Math.PI * 2,
          phase: rng() * Math.PI * 2,
          speed: orbitSpeed(r) * 0.5,
          scale: Math.max(0.00015, s.radius * (s.dish ? 0.006 : 0.011)) * (0.6 + rng() * 0.8),
          spin: 0.5 + rng(),
          color: col.clone().multiplyScalar(0.7 + rng() * 0.4),
        });
      }
      const mat = orbitMaterial(s.dish ? 0.5 : 1.2, !!s.dish);
      const mats = [mat];
      const m = withGlow(orbitInstances(s.dish ? GEO.dish : GEO.station, specs, mat), specs, s.color ?? '#ffe2b8', s.dish ? 0.9 : 1.3, mats);
      const ports = specs.slice(0, 10).map((sp) => new THREE.Vector3(Math.cos(sp.phase) * sp.r, 0, Math.sin(sp.phase) * sp.r));
      return { object: m, mats, ports, label: s.label ? { text: s.label, local: new THREE.Vector3(0, s.radius * 0.15, s.radius), radius: s.radius } : undefined };
    }
    case 'belt':
    case 'debris': {
      const specs: OrbitSpec[] = [];
      const base = new THREE.Color(s.color ?? '#8a8278');
      const thick = s.thickness ?? s.spread * 0.2;
      for (let i = 0; i < s.count; i++) {
        const r = s.radius + gauss(rng) * s.spread * 0.5;
        specs.push({
          r,
          incl: gauss(rng) * (thick / Math.max(r, 0.01)),
          node: rng() * Math.PI * 2,
          phase: rng() * Math.PI * 2,
          speed: orbitSpeed(r) * (s.kind === 'debris' ? 0.7 : 0.5),
          scale: s.radius * (s.kind === 'debris' ? 0.0022 : 0.0013) * (Math.pow(rng(), 2.4) * 3 + 0.25),
          spin: (rng() - 0.5) * 3,
          color: base.clone().multiplyScalar(0.55 + rng() * 0.6),
        });
      }
      const mat = orbitMaterial(0, false);
      const mats = [mat];
      const m = withGlow(orbitInstances(GEO.rock, specs, mat), specs, s.kind === 'debris' ? '#8f8478' : '#7d7266', 0.28, mats);
      return { object: m, mats, label: s.label ? { text: s.label, local: new THREE.Vector3(-s.radius, 0, 0), radius: s.radius } : undefined };
    }
    case 'shells': {
      const group = new THREE.Group();
      const mats: THREE.ShaderMaterial[] = [];
      s.radii.forEach((rad, k) => {
        const specs: OrbitSpec[] = [];
        const warm = s.radii.length > 1 ? k / (s.radii.length - 1) : 0.5;
        const col = new THREE.Color().setHSL(0.08 - warm * 0.05, 0.4 + warm * 0.2, 0.75 - warm * 0.3);
        const per = Math.floor(s.count / s.radii.length);
        for (let i = 0; i < per; i++) {
          specs.push({
            r: rad * (1 + gauss(rng) * 0.015),
            incl: Math.acos(1 - 2 * rng()) - Math.PI / 2,
            node: rng() * Math.PI * 2,
            phase: rng() * Math.PI * 2,
            speed: orbitSpeed(rad) * 0.7,
            scale: rad * 0.012 * (0.5 + rng()),
            spin: 0,
            color: col.clone().multiplyScalar(0.6 + rng() * 0.4),
          });
        }
        const mat = orbitMaterial(0.55, true);
        mats.push(mat);
        group.add(withGlow(orbitInstances(GEO.panel, specs, mat), specs, '#' + col.getHexString(), 0.9, mats));
      });
      const rmax = Math.max(...s.radii);
      return { object: group, mats, label: s.label ? { text: s.label, local: new THREE.Vector3(0, rmax * 0.7, rmax * 0.8), radius: rmax } : undefined };
    }
    case 'gate': {
      const g = new THREE.Group();
      const dir = env.gateDirs.length ? env.gateDirs[Math.floor(rng() * env.gateDirs.length)] : new THREE.Vector3(Math.cos(rng() * 6.28), 0.1, Math.sin(rng() * 6.28)).normalize();
      g.position.copy(dir).multiplyScalar(s.radius);
      g.lookAt(dir.clone().multiplyScalar(s.radius * 2));
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(s.size, s.size * 0.09, 10, 72),
        new THREE.MeshBasicMaterial({ color: s.dormant ? 0x55504a : 0xb9a888 }),
      );
      g.add(torus);
      const mats: THREE.ShaderMaterial[] = [];
      if (!s.dormant) {
        const mm = new THREE.ShaderMaterial({
          uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
          vertexShader: `varying vec2 vUv; void main(){ vUv = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
          fragmentShader: `uniform float uTime; uniform float uFade; varying vec2 vUv; void main(){ float r = length(vUv); if (r > 1.0) discard; float a = atan(vUv.y, vUv.x); float sw = 0.5 + 0.5 * sin(a * 3.0 - r * 14.0 + uTime * 2.0); float c = (1.0 - r) * (0.25 + 0.5 * sw) + smoothstep(0.85, 1.0, r) * 0.8; gl_FragColor = vec4(vec3(0.95, 0.85, 0.62) * c * 0.7 * uFade, 1.0); }`,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        mats.push(mm);
        g.add(new THREE.Mesh(new THREE.CircleGeometry(s.size * 0.95, 48), mm));
      }
      return { object: g, mats, ports: [g.position.clone()], label: s.label ? { text: s.label, local: g.position.clone(), radius: s.size * 3 } : undefined };
    }
    case 'shipyard': {
      const g = new THREE.Group();
      const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 0.3, 0.3));
      const lm = new THREE.LineBasicMaterial({ color: 0xc9b89a, transparent: true, opacity: 0.8 });
      for (let i = 0; i < s.count; i++) {
        const a = (i / s.count) * Math.PI * 2;
        const frame = new THREE.LineSegments(edges, lm);
        const len = s.radius * (0.05 + rng() * 0.07);
        frame.scale.set(len, len, len);
        frame.position.set(Math.cos(a) * s.radius, gauss(rng) * s.radius * 0.02, Math.sin(a) * s.radius);
        frame.lookAt(0, 0, 0);
        frame.rotateY(Math.PI / 2);
        g.add(frame);
        if (rng() < 0.6) {
          const hull = new THREE.Mesh(GEO.box, new THREE.MeshBasicMaterial({ color: 0x6a645c }));
          hull.scale.set(len * 0.8, len * 0.12, len * 0.12);
          hull.position.copy(frame.position);
          hull.quaternion.copy(frame.quaternion);
          g.add(hull);
        }
      }
      return {
        object: g,
        mats: [],
        update: (t) => {
          g.rotation.y = t * 0.05;
        },
        label: s.label ? { text: s.label, local: new THREE.Vector3(s.radius, 0, 0), radius: s.radius } : undefined,
      };
    }
    case 'ringworld': {
      const g = new THREE.Group();
      const arc = Math.PI * 2 * s.complete;
      const band = new THREE.CylinderGeometry(s.radius, s.radius, s.width, 360, 1, true, 0, arc);
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uStarCol: { value: new THREE.Vector3(1, 1, 1) }, uVey: { value: s.complete >= 1 ? 1 : 0 } },
        vertexShader: `varying vec3 vP; varying vec3 vN; varying vec2 vUv; void main(){ vP = position; vN = normal; vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          uniform vec3 uStarCol; uniform float uTime; uniform float uVey;
          varying vec3 vP; varying vec3 vN; varying vec2 vUv;
          ${NOISE_GLSL}
          void main(){
            vec3 L = normalize(-vP);
            bool inner = !gl_FrontFacing;
            vec3 n = gl_FrontFacing ? normalize(vN) : -normalize(vN);
            float ndl = max(dot(n, L), 0.0);
            vec3 col;
            if (uVey > 0.5) {
              float glyph = step(0.8, fract(vUv.x * 144.0)) * 0.6 + step(0.92, fract(vUv.y * 9.0)) * 0.3;
              col = vec3(0.16, 0.15, 0.17) * (ndl + 0.1) + vec3(0.9, 0.75, 0.5) * glyph * 0.08;
            } else if (inner) {
              float land = fbm2(vec2(vUv.x * 900.0, vUv.y * 6.0));
              float sea = smoothstep(0.45, 0.5, land);
              vec3 c = mix(vec3(0.12, 0.25, 0.35), mix(vec3(0.25, 0.38, 0.2), vec3(0.5, 0.45, 0.32), smoothstep(0.55, 0.8, land)), sea);
              float cloud = smoothstep(0.55, 0.8, fbm2(vec2(vUv.x * 1400.0 + uTime * 0.2, vUv.y * 9.0)));
              c = mix(c, vec3(0.9), cloud * 0.6);
              float wall = smoothstep(0.08, 0.0, vUv.y) + smoothstep(0.92, 1.0, vUv.y);
              c = mix(c, vec3(0.35, 0.33, 0.3), clamp(wall, 0.0, 1.0));
              col = c * (uStarCol * 0.9 + 0.05);
            } else {
              col = vec3(0.12, 0.12, 0.13) * (0.2 + ndl) + vec3(1.0, 0.7, 0.4) * step(0.985, fract(vUv.x * 700.0)) * step(0.5, fract(vUv.y * 3.0)) * 0.5;
            }
            gl_FragColor = vec4(col, 1.0);
          }`,
        side: THREE.DoubleSide,
      });
      g.add(new THREE.Mesh(band, mat));
      if (s.complete < 1) {
        const scaffold = new THREE.CylinderGeometry(s.radius, s.radius, s.width, Math.floor((1 - s.complete) * 90), 2, true, arc, Math.PI * 2 - arc);
        const wire = new THREE.LineSegments(new THREE.EdgesGeometry(scaffold, 1), new THREE.LineBasicMaterial({ color: 0x8a8070, transparent: true, opacity: 0.55 }));
        const wire2 = new THREE.LineSegments(new THREE.WireframeGeometry(scaffold), new THREE.LineBasicMaterial({ color: 0x6a6258, transparent: true, opacity: 0.25 }));
        g.add(wire, wire2);
      }
      g.rotation.x = 0.08;
      return {
        object: g,
        mats: [mat],
        update: (t) => {
          g.rotation.y = t * 0.01;
        },
        label: s.label ? { text: s.label, local: new THREE.Vector3(s.radius, s.width, 0), radius: s.radius } : undefined,
      };
    }
    case 'cordon': {
      const pts: THREE.Vector3[] = [];
      const sphere = s.radius > 5;
      for (let i = 0; i < s.count; i++) {
        if (sphere) {
          const u = rng() * 2 - 1;
          const a = rng() * Math.PI * 2;
          const q = Math.sqrt(1 - u * u);
          pts.push(new THREE.Vector3(q * Math.cos(a), u, q * Math.sin(a)).multiplyScalar(s.radius));
        } else {
          const a = (i / s.count) * Math.PI * 2;
          pts.push(new THREE.Vector3(Math.cos(a) * s.radius, gauss(rng) * s.radius * 0.03, Math.sin(a) * s.radius));
        }
      }
      const { pts: p, mat } = lightPoints(pts, new THREE.Color(sphere ? '#ffe2b0' : '#ff8870'), sphere ? 0.12 : 0.01, true, rng);
      return { object: p, mats: [mat], label: s.label ? { text: s.label, local: pts[0].clone(), radius: s.radius } : undefined };
    }
    case 'relays':
    case 'lens': {
      const specs: OrbitSpec[] = [];
      const isLens = s.kind === 'lens';
      for (let i = 0; i < s.count; i++) {
        const r = isLens ? s.radius * Math.sqrt(rng()) : s.radius * (1 + gauss(rng) * 0.03);
        specs.push({
          r,
          incl: isLens ? 0 : Math.acos(1 - 2 * rng()) - Math.PI / 2,
          node: rng() * Math.PI * 2,
          phase: rng() * Math.PI * 2,
          speed: isLens ? 0.004 : orbitSpeed(r) * 0.4,
          scale: isLens ? s.radius * 0.018 : s.radius * 0.03,
          spin: 0,
          color: new THREE.Color(isLens ? '#dfe8f0' : '#c9c2b0'),
        });
      }
      const mat = orbitMaterial(isLens ? 0.1 : 0.8, isLens);
      const mats = [mat];
      const m = withGlow(orbitInstances(isLens ? GEO.mirror : GEO.dish, specs, mat), specs, isLens ? '#cfe0f0' : '#ffe0b0', isLens ? 0.5 : 0.8, mats);
      const holder = new THREE.Group();
      holder.add(m);
      if (isLens) {
        // the array's plane faces the Sister
        holder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), env.sisterDir);
      }
      return { object: holder, mats, label: s.label ? { text: s.label, local: new THREE.Vector3(0, s.radius * 0.3, s.radius), radius: s.radius } : undefined };
    }
    case 'plumb': {
      const g = new THREE.Group();
      const dir = env.coreDir.clone();
      const top = dir.clone().multiplyScalar(-s.length * 0.35);
      const station = new THREE.Mesh(GEO.station, new THREE.MeshBasicMaterial({ color: 0xc8b8a0 }));
      station.scale.setScalar(0.035);
      station.position.copy(top);
      g.add(station);
      const pts: THREE.Vector3[] = [];
      const n = 60;
      for (let i = 0; i <= n; i++) pts.push(top.clone().addScaledVector(dir, (i / n) * s.length));
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xb0a590, transparent: true, opacity: 0.7 }));
      g.add(line);
      const massPts = pts.filter((_, i) => i % 3 === 0);
      const { pts: lights, mat } = lightPoints(massPts, new THREE.Color('#ffd9a0'), 0.006, false, rng);
      g.add(lights);
      return {
        object: g,
        mats: [mat],
        update: (t) => {
          g.rotation.z = Math.sin(t * 0.2) * 0.004;
        },
        label: s.label ? { text: s.label, local: top.clone().addScaledVector(dir, s.length * 0.6), radius: s.length } : undefined,
      };
    }
    case 'spindle': {
      const g = new THREE.Group();
      const mats: THREE.ShaderMaterial[] = [];
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x8c7c5e });
      for (let i = 0; i < s.count; i++) {
        const t = i / (s.count - 1);
        const y = (t - 0.5) * s.radius * 3.2;
        const env0 = Math.sin(t * Math.PI) * s.radius * 0.6 + s.radius * 0.08;
        const a = t * Math.PI * 10;
        const torus = new THREE.Mesh(new THREE.TorusGeometry(s.radius * 0.07, s.radius * 0.006, 6, 32), ringMat);
        torus.position.set(Math.cos(a) * env0, y, Math.sin(a) * env0);
        torus.lookAt(0, y, 0);
        g.add(torus);
      }
      // converging threads
      const lines: THREE.Vector3[] = [];
      for (let i = 0; i < 90; i++) {
        const d = new THREE.Vector3(gauss(rng), gauss(rng) * 0.6, gauss(rng)).normalize();
        const y = (rng() - 0.5) * s.radius * 3;
        lines.push(new THREE.Vector3(0, y, 0), d.multiplyScalar(s.radius * 6).add(new THREE.Vector3(0, y, 0)));
      }
      const lg = new THREE.BufferGeometry().setFromPoints(lines);
      const lmat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
        vertexShader: `attribute float lineT; varying float vD; void main(){ vD = length(position.xz); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform float uTime; uniform float uFade; varying float vD; void main(){ float p = pow(0.5 + 0.5 * sin(vD * 20.0 - uTime * 3.0), 6.0); gl_FragColor = vec4(vec3(0.95, 0.82, 0.55) * (0.035 + 0.25 * p) * uFade * exp(-vD * 0.6), 1.0); }`,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });
      mats.push(lmat);
      g.add(new THREE.LineSegments(lg, lmat));
      g.rotation.z = 0.35;
      return {
        object: g,
        mats,
        update: (t) => {
          g.rotation.y = t * 0.06;
        },
        ports: [new THREE.Vector3(0, s.radius, 0), new THREE.Vector3(0, -s.radius, 0)],
        label: s.label ? { text: s.label, local: new THREE.Vector3(0, s.radius * 1.7, 0), radius: s.radius } : undefined,
      };
    }
    case 'nebula': {
      const n = Math.floor(150 * (s.density ?? 1)) + 40;
      const g = new THREE.InstancedBufferGeometry();
      const q = new THREE.PlaneGeometry(2, 2);
      g.index = q.index;
      g.setAttribute('position', q.getAttribute('position'));
      const data = new Float32Array(n * 4);
      const col = new Float32Array(n * 3);
      const seed = new Float32Array(n);
      const c1 = new THREE.Color(s.color);
      const c2 = new THREE.Color(s.color2);
      for (let i = 0; i < n; i++) {
        const shell = s.kind === 'nebula' && (s.density ?? 1) < 0.6;
        let v: THREE.Vector3;
        if (shell) {
          v = new THREE.Vector3(gauss(rng), gauss(rng), gauss(rng)).normalize().multiplyScalar(s.radius * (0.85 + rng() * 0.25));
        } else {
          v = new THREE.Vector3(gauss(rng), gauss(rng) * 0.6, gauss(rng)).multiplyScalar(s.radius * 0.45);
        }
        data.set([v.x, v.y, v.z, s.radius * (0.22 + rng() * 0.4)], i * 4);
        const mix = shell ? rng() : THREE.MathUtils.clamp(v.length() / s.radius + gauss(rng) * 0.2, 0, 1);
        const c = c2.clone().lerp(c1, mix).multiplyScalar(0.03 + rng() * 0.035);
        col.set([c.r, c.g, c.b], i * 3);
        seed[i] = rng();
      }
      g.setAttribute('iData', new THREE.InstancedBufferAttribute(data, 4));
      g.setAttribute('iColor', new THREE.InstancedBufferAttribute(col, 3));
      g.setAttribute('iSeed', new THREE.InstancedBufferAttribute(seed, 1));
      g.instanceCount = n;
      const mat = new THREE.ShaderMaterial({
        vertexShader: NEB_VERT,
        fragmentShader: NEB_FRAG,
        uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });
      const m = new THREE.Mesh(g, mat);
      m.frustumCulled = false;
      m.renderOrder = 8;
      return { object: m, mats: [mat], label: s.label ? { text: s.label, local: new THREE.Vector3(0, s.radius * 0.7, 0), radius: s.radius } : undefined };
    }
    case 'fleet': {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < s.count; i++) {
        const t = rng() - 0.5;
        const w = 0.06 + Math.abs(gauss(rng)) * 0.05 * (1 - Math.abs(t));
        const a = rng() * Math.PI * 2;
        pts.push(new THREE.Vector3(t * s.length, Math.cos(a) * w * 0.6, Math.sin(a) * w));
      }
      const { pts: p, mat } = lightPoints(pts, new THREE.Color('#ffe6c0'), 0.004, false, rng);
      const g = new THREE.Group();
      g.add(p);
      // the song: slow pulses running along the column
      const pulseMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uFade: { value: 1 }, uLen: { value: s.length } },
        vertexShader: `varying float vX; void main(){ vX = position.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uTime; uniform float uFade; uniform float uLen; varying float vX; void main(){ float p = pow(0.5 + 0.5 * sin(vX / uLen * 40.0 - uTime * 1.3), 8.0); gl_FragColor = vec4(vec3(0.7, 0.95, 0.8) * p * 0.35 * uFade, 1.0); }`,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });
      const axis = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(Array.from({ length: 200 }, (_, i) => new THREE.Vector3((i / 199 - 0.5) * s.length, 0, 0))),
        pulseMat,
      );
      g.add(axis);
      g.rotation.y = 0.6;
      return {
        object: g,
        mats: [mat, pulseMat],
        update: (t) => {
          p.position.x = ((t * 0.004) % 0.2) - 0.1;
        },
        label: s.label ? { text: s.label, local: new THREE.Vector3(s.length * 0.45, 0.1, 0), radius: s.length } : undefined,
      };
    }
    case 'pillars': {
      const g = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({ color: 0x1c1a18 });
      const lp: THREE.Vector3[] = [];
      for (let i = 0; i < s.count; i++) {
        const a = (i / s.count) * Math.PI * 2;
        const frame = new THREE.Group();
        const beam = new THREE.Mesh(GEO.box, mat);
        beam.scale.set(s.radius * 0.5, s.radius * 0.012, s.radius * 0.012);
        beam.position.set(-s.radius * 0.25, 0, 0);
        frame.add(beam);
        const head = new THREE.Mesh(GEO.box, mat);
        head.scale.set(s.radius * 0.03, s.radius * 0.14, s.radius * 0.03);
        frame.add(head);
        frame.position.set(Math.cos(a) * s.radius, 0, Math.sin(a) * s.radius);
        frame.rotation.y = -a;
        g.add(frame);
        lp.push(frame.position.clone().multiplyScalar(0.55));
      }
      const { pts, mat: lm } = lightPoints(lp, new THREE.Color('#9fd0ff'), 0.02, true, rng);
      g.add(pts);
      return {
        object: g,
        mats: [lm],
        update: (t) => {
          g.rotation.y = t * 0.18;
        },
        label: s.label ? { text: s.label, local: new THREE.Vector3(s.radius, s.radius * 0.2, 0), radius: s.radius } : undefined,
      };
    }
    case 'wreck': {
      const g = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({ color: 0x4a4744 });
      const upd: ((t: number) => void)[] = [];
      for (let i = 0; i < s.count; i++) {
        const hull = new THREE.Group();
        const len = 0.012 + rng() * 0.02;
        const body = new THREE.Mesh(GEO.box, mat);
        body.scale.set(len, len * 0.18, len * 0.22);
        hull.add(body);
        const fin = new THREE.Mesh(GEO.box, mat);
        fin.scale.set(len * 0.3, len * 0.5, len * 0.04);
        fin.position.x = -len * 0.35;
        hull.add(fin);
        const a = rng() * Math.PI * 2;
        const r = s.radius * (0.8 + rng() * 0.4);
        hull.position.set(Math.cos(a) * r, gauss(rng) * 0.02, Math.sin(a) * r);
        const sx = (rng() - 0.5) * 0.2;
        const sy = (rng() - 0.5) * 0.2;
        upd.push((t) => {
          hull.rotation.set(t * sx, t * sy, 0.3);
        });
        g.add(hull);
      }
      return {
        object: g,
        mats: [],
        update: (t) => upd.forEach((f) => f(t)),
        label: s.label ? { text: s.label, local: g.children[0]?.position.clone() ?? new THREE.Vector3(), radius: s.radius } : undefined,
      };
    }
    case 'lamps': {
      const g = new THREE.Group();
      const mats: THREE.ShaderMaterial[] = [];
      if (s.count === 1 && s.radius < 0.05) {
        // a precursor beacon: a cold violet pulse, and a shell of light expanding from it
        const { pts, mat } = lightPoints([new THREE.Vector3()], new THREE.Color('#d8d0ff'), 0.004, false, rng);
        g.add(pts);
        mats.push(mat);
        const shellMat = new THREE.ShaderMaterial({
          uniforms: { uFade: { value: 1 }, uPhase: { value: 0 } },
          vertexShader: `varying vec2 vUv; uniform float uPhase; void main(){ vUv = position.xy; vec4 c = modelViewMatrix * vec4(0.0,0.0,0.0,1.0); c.xy += position.xy * (0.004 + uPhase * 0.28); gl_Position = projectionMatrix * c; }`,
          fragmentShader: `uniform float uFade; uniform float uPhase; varying vec2 vUv; void main(){ float r = length(vUv); if (r > 1.0) discard; float ring = smoothstep(0.955, 0.99, r) * (1.0 - smoothstep(0.99, 1.0, r)) + smoothstep(0.7, 1.0, r) * 0.04; gl_FragColor = vec4(vec3(0.75, 0.72, 1.0) * ring * pow(1.0 - uPhase, 2.0) * 0.45 * uFade, 1.0); }`,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
        });
        mats.push(shellMat);
        const shell = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shellMat);
        shell.frustumCulled = false;
        g.add(shell);
        return {
          object: g,
          mats,
          update: (t, _dt, ctx) => {
            const ph = (t / 9) % 1;
            shellMat.uniforms.uPhase.value = ph;
            mat.uniforms.uFade.value = (0.25 + 4 * Math.pow(1 - ph, 30)) * ctx.fade;
          },
          label: s.label ? { text: s.label, local: new THREE.Vector3(0.02, 0, 0), radius: 0.05 } : undefined,
        };
      }
      if (s.count === 1) {
        // a lighthouse: one bright flash, a sweeping beam
        const pos = new THREE.Vector3(s.radius, 0, 0);
        const { pts, mat } = lightPoints([pos], new THREE.Color('#fff1d0'), 0.02, false, rng);
        g.add(pts);
        mats.push(mat);
        const beamMat = new THREE.ShaderMaterial({
          uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
          vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
          fragmentShader: `uniform float uTime; uniform float uFade; varying vec3 vP; void main(){ float d = length(vP.xz); float a = atan(vP.z, vP.x); float sweep = pow(max(0.0, cos(a - uTime * 0.571)), 60.0); gl_FragColor = vec4(vec3(1.0, 0.93, 0.78) * sweep * 0.5 * exp(-d * 1.5) * uFade, 1.0); }`,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        mats.push(beamMat);
        const disc = new THREE.Mesh(new THREE.CircleGeometry(3, 96).rotateX(-Math.PI / 2), beamMat);
        disc.position.copy(pos);
        g.add(disc);
        return {
          object: g,
          mats,
          update: (t, _dt, ctx) => {
            const flash = Math.pow(Math.max(0, Math.cos((t * Math.PI * 2) / 11)), 40);
            mat.uniforms.uFade.value = (0.3 + flash * 3) * ctx.fade;
          },
          label: s.label ? { text: s.label, local: pos, radius: 0.05 } : undefined,
        };
      }
      if (s.count <= 6) {
        const mm = new THREE.MeshBasicMaterial({ color: 0x9c8a70 });
        for (let i = 0; i < s.count; i++) {
          const t = new THREE.Mesh(new THREE.TorusGeometry(s.radius * (1 + i * 0.25), s.radius * 0.015, 8, 96), mm);
          t.rotation.x = Math.PI / 2 + (i - s.count / 2) * 0.25;
          g.add(t);
        }
        return { object: g, mats, label: s.label ? { text: s.label, local: new THREE.Vector3(s.radius * 1.5, 0, 0), radius: s.radius } : undefined };
      }
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < s.count; i++) {
        const a = (i / s.count) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * s.radius, 0, Math.sin(a) * s.radius));
      }
      const { pts: p, mat } = lightPoints(pts, new THREE.Color('#ffeccc'), 0.006, false, rng);
      g.add(p);
      return {
        object: g,
        mats: [mat],
        update: (t, _dt, ctx) => {
          mat.uniforms.uFade.value = (0.35 + 1.5 * Math.pow(0.5 + 0.5 * Math.cos(t * Math.PI * 4), 12)) * ctx.fade;
        },
        label: s.label ? { text: s.label, local: pts[0], radius: s.radius } : undefined,
      };
    }
    case 'engines':
    case 'beams':
      return null; // handled by the planet/star builders
  }
  return null;
}

export function mulberry(seed: number) {
  return mulberry32(seed);
}
