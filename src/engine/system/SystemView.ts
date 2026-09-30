import * as THREE from 'three';
import type { BodyInfo, PlanetDef, StarDef, SystemDef } from '../../world/types';
import { kelvinToRgb } from '../../world/galaxyModel';
import { mulberry32 } from '../../world/rng';
import { bodyId } from '../../world';
import {
  ATMOS_FRAG,
  BODY_VERT,
  GLOW_FRAG,
  GLOW_VERT,
  PLANET_FRAG,
  PLANET_TYPES,
  RING_FRAG,
  RING_VERT,
  STAR_FRAG,
} from './shaders';
import { buildStructure, type Built, lightMaterial } from './structures';
import { BlackHole } from './BlackHole';
import { makeStarPointMaterial, starColorLinear } from '../shaders/starPoints';
import { Traffic, type Port } from './Traffic';
import type { LabelCandidate } from '../Labels';

// One explorable star system, built in local coordinates at its galactic position.

const SPHERE_HI = new THREE.SphereGeometry(1, 96, 64);
const SPHERE_LO = new THREE.SphereGeometry(1, 48, 32);
const QUAD = new THREE.PlaneGeometry(2, 2);

export interface BodyHandle {
  id: string;
  name: string;
  kind: 'planet' | 'moon' | 'star' | 'structure';
  radius: number;
  obj: THREE.Object3D;
  info?: BodyInfo;
  planet?: PlanetDef;
  parentName?: string;
}

interface StarRuntime {
  def: StarDef;
  holder: THREE.Object3D;
  color: THREE.Vector3; // linear
  bright: number;
  surf?: THREE.ShaderMaterial;
  glow?: THREE.ShaderMaterial;
  glowK?: number;
  update?: (t: number) => void;
}

interface PlanetRuntime {
  def: PlanetDef;
  pivot: THREE.Object3D;
  holder: THREE.Object3D;
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  atmo?: THREE.ShaderMaterial;
  rings: THREE.ShaderMaterial[];
  moons: { def: NonNullable<PlanetDef['moons']>[number]; pivot: THREE.Object3D; holder: THREE.Object3D; mat: THREE.ShaderMaterial }[];
  orbitLine?: THREE.LineLoop;
  built: Built[];
  plume?: THREE.Mesh;
  spin: number;
  phase: number;
}

const lin = (c: number) => Math.pow(c, 2.2);
function linColor(hex: string) {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b); // THREE.Color already linearises sRGB hex
}

const DEFAULT_PAL: Record<string, [string, string, string]> = {
  terran: ['#1c4a6e', '#4f6e3c', '#a48e62'],
  garden: ['#1e4a66', '#2f5a30', '#6f8a4c'],
  ocean: ['#123e5e', '#2a6a7a', '#a8a080'],
  reef: ['#10405a', '#1e6a78', '#c0b08a'],
  desert: ['#9a6a42', '#c08c5c', '#e0c498'],
  terraform: ['#9a5a38', '#c98a55', '#4d7340'],
  ice: ['#c8d4de', '#e0e8ee', '#8a9aa8'],
  lava: ['#1a1210', '#3a2418', '#ff6a20'],
  gas: ['#7a6048', '#c09a70', '#e8d0a8'],
  icegiant: ['#4e7890', '#86aec0', '#c8dce4'],
  city: ['#3a3632', '#6a6258', '#a89c88'],
  barren: ['#4a4642', '#6a6660', '#8e8880'],
  twilight: ['#c8d6e0', '#48683e', '#a88450'],
  toxic: ['#7a7a30', '#a09a48', '#c8c070'],
  machine: ['#1e262c', '#34424c', '#7aa0b8'],
  bloom: ['#2a5e58', '#8a4e8e', '#d8c070'],
  glass: ['#8aa0a8', '#b8c8cc', '#e0e8ea'],
  hollow: ['#3a2a24', '#6b4a3a', '#a4643e'],
  rogue: ['#0a141e', '#1a2e40', '#4a7a9a'],
};

export class SystemView {
  readonly group = new THREE.Group();
  readonly id: string;
  readonly name: string;
  readonly def: SystemDef;
  readonly extent: number;
  readonly bodies: BodyHandle[] = [];
  private stars: StarRuntime[] = [];
  private planets: PlanetRuntime[] = [];
  private built: Built[] = [];
  private fadeMats: THREE.ShaderMaterial[] = [];
  private orbitMats: THREE.LineBasicMaterial[] = [];
  private traffic: Traffic | null = null;
  readonly blackHole: BlackHole | null = null;
  private labels: { text: string; obj: THREE.Object3D; local: THREE.Vector3; radius: number }[] = [];
  private starViews: THREE.Vector3[] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  private starCols: THREE.Vector3[] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  presence = 0;
  private elisionMat: THREE.ShaderMaterial | null = null;
  private frayMat: THREE.ShaderMaterial | null = null;

  constructor(opts: {
    id: string;
    name: string;
    def: SystemDef;
    pos: THREE.Vector3;
    gateDirs: THREE.Vector3[];
    sisterDir: THREE.Vector3;
    seed: number;
  }) {
    this.id = opts.id;
    this.name = opts.name;
    this.def = opts.def;
    this.extent = opts.def.extent ?? 1;
    this.group.position.copy(opts.pos);
    const rng = mulberry32(opts.seed);
    const coreDir = opts.pos.clone().negate().normalize();
    if (!isFinite(coreDir.x)) coreDir.set(1, 0, 0);

    // --- stars
    opts.def.stars.forEach((s, i) => {
      if (s.kind === 'BH') {
        const bh = new BlackHole(0.1);
        (this as { blackHole: BlackHole | null }).blackHole = bh;
        this.group.add(bh.mesh);
        const holder = new THREE.Object3D();
        this.group.add(holder);
        this.bodies.push({ id: `star|${this.id}|${i}`, name: this.name, kind: 'star', radius: 0.26, obj: holder });
        return;
      }
      this.stars.push(this.buildStar(s, i, rng));
    });

    // --- planets
    opts.def.planets.forEach((p, i) => this.planets.push(this.buildPlanet(p, i, rng, opts, coreDir)));

    // --- structures
    for (const sd of opts.def.structures ?? []) {
      const b = buildStructure(sd, rng, {
        starCol: new THREE.Color(1, 1, 1),
        sisterDir: opts.sisterDir,
        coreDir,
        gateDirs: opts.gateDirs,
      });
      if (!b) {
        if (sd.kind === 'beams') this.addPulsarBeams(sd.radius);
        continue;
      }
      this.group.add(b.object);
      this.built.push(b);
      this.fadeMats.push(...b.mats);
      if (b.label) this.labels.push({ text: b.label.text, obj: b.object, local: b.label.local, radius: b.label.radius });
    }

    // --- specials
    if (opts.def.special === 'elision') this.buildElision();
    if (opts.def.special === 'void') this.buildFrays(rng);
    if (opts.def.special === 'cluster') this.buildStarBall(rng);

    // --- traffic
    const traffic = opts.def.traffic ?? 0;
    if (traffic > 0.01) {
      const ports: Port[] = [];
      for (const p of this.planets) {
        const h = p.holder;
        const v = new THREE.Vector3();
        ports.push(() => h.getWorldPosition(v).sub(this.group.position));
      }
      for (const b of this.built) for (const pt of b.ports ?? []) ports.push(() => pt);
      if (ports.length < 2) {
        const e = this.extent;
        for (let k = 0; k < 4; k++) {
          const a = rng() * Math.PI * 2;
          const v = new THREE.Vector3(Math.cos(a) * e * 0.7, (rng() - 0.5) * e * 0.2, Math.sin(a) * e * 0.7);
          ports.push(() => v);
        }
      }
      this.traffic = new Traffic(ports, Math.round(20 + traffic * 150), opts.seed ^ 0x77, this.extent);
      this.group.add(this.traffic.group);
    }
  }

  // ------------------------------------------------------------------------
  private buildStar(s: StarDef, i: number, rng: () => number): StarRuntime {
    const holder = new THREE.Object3D();
    this.group.add(holder);
    const [r, g, b] = kelvinToRgb(s.temp);
    const color = new THREE.Vector3(lin(r), lin(g), lin(b));
    const bright = s.kind === 'WD' ? 2.4 : s.kind === 'NS' ? 3.5 : s.kind === 'RG' ? 1.25 : s.kind === 'ART' ? 1.7 : 1.55;
    const surf = new THREE.ShaderMaterial({
      vertexShader: BODY_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: {
        uColor: { value: color.clone() },
        uTime: { value: 0 },
        uBright: { value: bright },
        uSeed: { value: rng() * 10 },
        uScale: { value: s.kind === 'RG' ? 3.2 : 7.0 },
      },
    });
    const sphere = new THREE.Mesh(SPHERE_HI, surf);
    sphere.scale.setScalar(s.radius);
    holder.add(sphere);
    const glow = new THREE.ShaderMaterial({
      vertexShader: GLOW_VERT,
      fragmentShader: GLOW_FRAG,
      uniforms: {
        uColor: { value: color.clone() },
        uBright: { value: 1 },
        uSize: { value: s.radius * (s.kind === 'RG' ? 3.2 : s.kind === 'WD' || s.kind === 'NS' ? 14 : 6.5) },
        uCore: { value: s.kind === 'RG' ? 0.34 : 0.16 },
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const glowMesh = new THREE.Mesh(QUAD, glow);
    glowMesh.frustumCulled = false;
    glowMesh.renderOrder = 20;
    holder.add(glowMesh);
    this.fadeMats.push(glow);
    // cold remnants barely glow
    const glowK = s.kind === 'WD' ? THREE.MathUtils.clamp((s.temp - 2_500) / 9_000, 0.08, 1) : 1;
    glow.uniforms.uBright.value = glowK;
    const rt: StarRuntime = { def: s, holder, color, bright: bright * (s.kind === 'WD' ? Math.max(glowK, 0.3) : 1), surf, glow };
    rt.glowK = glowK;
    this.bodies.push({
      id: `star|${this.id}|${i}`,
      name: s.name ?? (this.def.stars.length > 1 ? `${this.name} ${'ABC'[i]}` : this.name),
      kind: 'star',
      radius: s.radius,
      obj: holder,
    });

    if (s.lifted) {
      const jetMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uFade: { value: 1 }, uColor: { value: color.clone() }, uR: { value: s.radius } },
        vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uTime; uniform float uFade; uniform vec3 uColor; uniform float uR; varying vec3 vP; void main(){ float h = (abs(vP.y) - uR * 0.7) / uR; float r = length(vP.xz) / uR; float flick = 0.75 + 0.25 * sin(h * 6.0 - uTime * 5.0); float core = exp(-r * r / (0.1 + 0.05 * max(h, 0.0))); float a = core * exp(-max(h, 0.0) * 0.35) * smoothstep(-0.4, 0.4, h) * (1.0 - smoothstep(3.5, 6.2, h)) * flick; gl_FragColor = vec4(mix(uColor, vec3(1.0, 0.62, 0.35), 0.5) * a * 1.6 * uFade, 1.0); }`,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      this.fadeMats.push(jetMat);
      const jetGeo = new THREE.CylinderGeometry(s.radius * 1.4, s.radius * 0.25, s.radius * 7, 24, 8, true);
      for (const sgn of [1, -1]) {
        const jet = new THREE.Mesh(jetGeo, jetMat);
        jet.position.y = sgn * s.radius * 4.2;
        if (sgn < 0) jet.rotation.z = Math.PI;
        holder.add(jet);
      }
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x8a7a66 });
      for (const sgn of [1, -1]) {
        const t = new THREE.Mesh(new THREE.TorusGeometry(s.radius * 1.9, s.radius * 0.05, 8, 64), ringMat);
        t.rotation.x = Math.PI / 2;
        t.position.y = sgn * s.radius * 1.5;
        holder.add(t);
      }
    }
    if (s.lattice) {
      const ico = new THREE.IcosahedronGeometry(s.radius * 1.9, 1);
      const edges = new THREE.EdgesGeometry(ico);
      const pos = edges.getAttribute('position') as THREE.BufferAttribute;
      const keep: number[] = [];
      for (let k = 0; k < pos.count; k += 2) {
        const broken = s.lattice === 'broken' && pos.getY(k) > s.radius * 0.6 && pos.getX(k) > -s.radius * 0.2;
        if (!broken) keep.push(pos.getX(k), pos.getY(k), pos.getZ(k), pos.getX(k + 1), pos.getY(k + 1), pos.getZ(k + 1));
      }
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3));
      const lat = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xcfb58a, transparent: true, opacity: 0.85 }));
      holder.add(lat);
      // arcs of escaping plasma where the lattice has failed
      const arcMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
        vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uTime; uniform float uFade; varying vec3 vP; void main(){ float f = 0.5 + 0.5 * sin(uTime * 3.0 + vP.x * 200.0); gl_FragColor = vec4(vec3(1.0, 0.7, 0.35) * f * 0.9 * uFade, 1.0); }`,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });
      this.fadeMats.push(arcMat);
      const arcPts: THREE.Vector3[] = [];
      for (let k = 0; k < 5; k++) {
        const a0 = 0.3 + k * 0.25;
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(Math.cos(a0), 0.7, Math.sin(a0)).multiplyScalar(s.radius),
          new THREE.Vector3(Math.cos(a0 + 0.2) * 2.6, 2.6, Math.sin(a0 + 0.2) * 2.6).multiplyScalar(s.radius),
          new THREE.Vector3(Math.cos(a0 + 0.5), 0.8, Math.sin(a0 + 0.5)).multiplyScalar(s.radius),
        );
        const cp = curve.getPoints(24);
        for (let q = 0; q < cp.length - 1; q++) arcPts.push(cp[q], cp[q + 1]);
      }
      holder.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(arcPts), arcMat));
      rt.update = (t) => {
        lat.rotation.y = t * 0.02;
      };
    }
    if (s.pulsar) this.addPulsarBeams(1.2, holder, rng() * 6);
    return rt;
  }

  private addPulsarBeams(len: number, holder?: THREE.Object3D, phase = 0) {
    const target = holder ?? this.stars[0]?.holder ?? this.group;
    const mat = new THREE.ShaderMaterial({
      uniforms: { uFade: { value: 1 }, uTime: { value: 0 } },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform float uFade; varying vec3 vP; void main(){ float h = abs(vP.y); float r = length(vP.xz); float a = exp(-r * 30.0 / (0.05 + h)) * exp(-h * 1.6); gl_FragColor = vec4(vec3(0.75, 0.85, 1.0) * a * 1.6 * uFade, 1.0); }`,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.fadeMats.push(mat);
    const spinner = new THREE.Object3D();
    const tilt = new THREE.Object3D();
    tilt.rotation.z = 0.45;
    spinner.add(tilt);
    const geo = new THREE.CylinderGeometry(len * 0.12, 0.002, len, 24, 6, true);
    for (const sgn of [1, -1]) {
      const b = new THREE.Mesh(geo, mat);
      b.position.y = (sgn * len) / 2;
      if (sgn < 0) b.rotation.z = Math.PI;
      tilt.add(b);
    }
    target.add(spinner);
    const prevUpdate = this.beamSpinners;
    prevUpdate.push({ obj: spinner, phase });
  }
  private beamSpinners: { obj: THREE.Object3D; phase: number }[] = [];

  private buildPlanet(p: PlanetDef, i: number, rng: () => number, opts: { gateDirs: THREE.Vector3[]; sisterDir: THREE.Vector3 }, coreDir: THREE.Vector3): PlanetRuntime {
    const pivot = new THREE.Object3D();
    pivot.rotation.set(p.incl ?? (rng() - 0.5) * 0.08, rng() * Math.PI * 2, 0, 'YXZ');
    this.group.add(pivot);
    const holder = new THREE.Object3D();
    pivot.add(holder);
    const pal = p.palette ?? DEFAULT_PAL[p.type] ?? DEFAULT_PAL.terran;
    const mat = this.planetMaterial(p.type, pal, p.seed ?? rng() * 100, p.lights ?? 0, p.clouds ?? (['terran', 'garden', 'ocean', 'reef'].includes(p.type) ? 0.5 : 0.2));
    const mesh = new THREE.Mesh(p.radius > 0.015 ? SPHERE_HI : SPHERE_HI, mat);
    mesh.scale.setScalar(p.radius);
    holder.add(mesh);
    const rt: PlanetRuntime = { def: p, pivot, holder, mesh, mat, rings: [], moons: [], built: [], spin: (Math.PI * 2) / (18 + rng() * 40), phase: p.phase ?? rng() * Math.PI * 2 };
    if (p.atmosphere) {
      const am = new THREE.ShaderMaterial({
        vertexShader: BODY_VERT,
        fragmentShader: ATMOS_FRAG,
        uniforms: {
          uColor: { value: linColor(p.atmosphere) },
          uStarPos: { value: this.starViews },
          uStarN: { value: 0 },
          uStrength: { value: 1.3 },
        },
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });
      const shell = new THREE.Mesh(SPHERE_LO, am);
      shell.scale.setScalar(p.radius * 1.04);
      holder.add(shell);
      rt.atmo = am;
    }
    for (const ringDef of [p.ring, ...(p.rings ?? [])]) {
      if (!ringDef) continue;
      const rg = new THREE.RingGeometry(ringDef.inner, ringDef.outer, 180, 1);
      const style = { dust: 0, city: 1, industry: 2, lattice: 3 }[ringDef.style];
      const rm = new THREE.ShaderMaterial({
        vertexShader: RING_VERT,
        fragmentShader: RING_FRAG,
        uniforms: {
          uColor: { value: new THREE.Color(ringDef.color) },
          uInner: { value: ringDef.inner },
          uOuter: { value: ringDef.outer },
          uStyle: { value: style },
          uTime: { value: 0 },
          uStarPos: { value: new THREE.Vector3() },
          uOpacity: { value: ringDef.opacity ?? 1 },
          uPlanetPosV: { value: new THREE.Vector3() },
          uPlanetR: { value: p.radius },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: style === 1 ? THREE.NormalBlending : THREE.NormalBlending,
      });
      const ringMesh = new THREE.Mesh(rg, rm);
      ringMesh.rotation.x = -Math.PI / 2 + (ringDef.tilt ?? 0);
      ringMesh.rotation.y = (ringDef.tilt ?? 0) * 1.7;
      ringMesh.renderOrder = 10;
      holder.add(ringMesh);
      rt.rings.push(rm);
    }
    (p.moons ?? []).forEach((m, j) => {
      const mp = new THREE.Object3D();
      mp.rotation.set(m.incl ?? (rng() - 0.5) * 0.3, rng() * 6, 0, 'YXZ');
      holder.add(mp);
      const mh = new THREE.Object3D();
      mp.add(mh);
      const mpal = DEFAULT_PAL[m.type] ?? DEFAULT_PAL.barren;
      const mmat = this.planetMaterial(m.type, mpal, m.seed ?? rng() * 100, m.lights ?? 0, 0);
      const mm = new THREE.Mesh(SPHERE_LO, mmat);
      mm.scale.setScalar(m.radius);
      mh.add(mm);
      rt.moons.push({ def: m, pivot: mp, holder: mh, mat: mmat });
      this.bodies.push({ id: bodyId(this.id, i, j), name: m.name || `${p.name} ${'abcdefg'[j]}`, kind: 'moon', radius: m.radius, obj: mh, info: m.info, parentName: p.name });
    });
    if (p.engine) {
      const pm = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
        vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uTime; uniform float uFade; varying vec3 vP; void main(){ float h = -vP.y; float r = length(vP.xz); float a = exp(-r * 6.0 / (0.02 + h * 0.4)) * exp(-h * 0.35) * (0.8 + 0.2 * sin(uTime * 20.0 + h * 3.0)); gl_FragColor = vec4(vec3(0.6, 0.8, 1.0) * a * 1.5 * uFade, 1.0); }`,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      this.fadeMats.push(pm);
      const plume = new THREE.Mesh(new THREE.CylinderGeometry(p.radius * 0.5, p.radius * 2.2, p.radius * 9, 20, 6, true), pm);
      plume.geometry.translate(0, -p.radius * 5.2, 0);
      holder.add(plume);
      rt.plume = plume;
    }
    for (const sd of p.structures ?? []) {
      const b = buildStructure(sd, rng, { starCol: new THREE.Color(1, 1, 1), sisterDir: opts.sisterDir, coreDir, gateDirs: opts.gateDirs });
      if (!b) continue;
      holder.add(b.object);
      rt.built.push(b);
      this.fadeMats.push(...b.mats);
      if (b.label) this.labels.push({ text: b.label.text, obj: b.object, local: b.label.local, radius: b.label.radius });
    }
    if (p.orbit > 0) {
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k < 256; k++) {
        const a = (k / 256) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * p.orbit, 0, Math.sin(a) * p.orbit));
      }
      const om = new THREE.LineBasicMaterial({ color: 0xe8dcc0, transparent: true, opacity: 0.12, depthWrite: false });
      const ol = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), om);
      pivot.add(ol);
      rt.orbitLine = ol;
      this.orbitMats.push(om);
    }
    this.bodies.push({ id: bodyId(this.id, i), name: p.name, kind: 'planet', radius: p.radius, obj: holder, info: p.info, planet: p });
    return rt;
  }

  private planetMaterial(type: string, pal: [string, string, string], seed: number, lights: number, clouds: number) {
    return new THREE.ShaderMaterial({
      vertexShader: BODY_VERT,
      fragmentShader: PLANET_FRAG,
      uniforms: {
        uType: { value: Math.max(0, PLANET_TYPES.indexOf(type as (typeof PLANET_TYPES)[number])) },
        uC0: { value: linColor(pal[0]) },
        uC1: { value: linColor(pal[1]) },
        uC2: { value: linColor(pal[2]) },
        uSeed: { value: seed % 97 },
        uLights: { value: lights },
        uClouds: { value: clouds },
        uTime: { value: 0 },
        uStarPos: { value: this.starViews },
        uStarCol: { value: this.starCols },
        uStarN: { value: 0 },
        uAmbient: { value: 0.012 },
      },
    });
  }

  private buildElision() {
    // Nothing is here. A faint absence dims the sky behind it.
    const mat = new THREE.ShaderMaterial({
      uniforms: { uFade: { value: 1 } },
      vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uFade; varying vec3 vN; varying vec3 vV; void main(){ float f = smoothstep(0.05, 0.6, max(dot(normalize(vN), normalize(vV)), 0.0)); float a = f * 0.82 * uFade; gl_FragColor = vec4(vec3(a), 1.0); }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.ZeroFactor,
      blendDst: THREE.OneMinusSrcColorFactor,
    });
    this.elisionMat = mat;
    this.fadeMats.push(mat);
    const m = new THREE.Mesh(new THREE.SphereGeometry(24, 48, 32), mat);
    m.renderOrder = 40;
    this.group.add(m);
    // light that should not bend, bending: a faint cold rim with nothing inside it
    const rim = new THREE.ShaderMaterial({
      uniforms: { uFade: { value: 1 }, uTime: { value: 0 } },
      vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uFade; uniform float uTime; varying vec3 vN; varying vec3 vV; void main(){ float mu = max(dot(normalize(vN), normalize(vV)), 0.0); float ring = exp(-pow((mu - 0.16) / 0.13, 2.0)); float shimmer = 0.8 + 0.2 * sin(uTime * 0.5 + mu * 23.0); gl_FragColor = vec4(vec3(0.62, 0.7, 0.95) * ring * 0.055 * shimmer * uFade, 1.0); }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.fadeMats.push(rim);
    const rm = new THREE.Mesh(new THREE.SphereGeometry(26, 64, 40), rim);
    rm.renderOrder = 41;
    this.group.add(rm);
  }

  /** A globular cluster seen from inside: a sky crowded with old suns. */
  private buildStarBall(rng: () => number) {
    const n = 9_000;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const lum = new Float32Array(n);
    const ph = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const s = 9 / Math.sqrt(Math.max(0.004, Math.pow(rng(), -2 / 3) - 1));
      const u = rng() * 2 - 1;
      const a = rng() * Math.PI * 2;
      const q = Math.sqrt(1 - u * u);
      const r = Math.max(s, 1.2);
      pos.set([q * Math.cos(a) * r, u * r, q * Math.sin(a) * r], i * 3);
      const giant = rng() < 0.12;
      starColorLinear(giant ? 3_600 + rng() * 900 : 4_700 + rng() * 1_500, col, i);
      lum[i] = giant ? 20 + rng() * 120 : 0.3 + rng() * 2;
      ph[i] = rng() * 1000;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('lum', new THREE.BufferAttribute(lum, 1));
    g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
    const mat = makeStarPointMaterial(60);
    mat.uniforms.uNearHide.value = 0.05;
    this.starBall = mat;
    const pts = new THREE.Points(g, mat);
    pts.frustumCulled = false;
    pts.renderOrder = 5;
    this.group.add(pts);
  }
  private starBall: THREE.ShaderMaterial | null = null;

  private buildFrays(rng: () => number) {
    const pts: number[] = [];
    const seeds: number[] = [];
    for (let i = 0; i < 41; i++) {
      const d = new THREE.Vector3(rng() - 0.5, (rng() - 0.5) * 0.4, rng() - 0.5).normalize();
      const len = 0.3 + rng() * 1.1;
      const segs = 24;
      for (let k = 0; k < segs; k++) {
        const a = d.clone().multiplyScalar((k / segs) * len + 0.08);
        const b = d.clone().multiplyScalar(((k + 1) / segs) * len + 0.08);
        pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
        seeds.push(i + k / segs, i + (k + 1) / segs);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.setAttribute('seed', new THREE.Float32BufferAttribute(seeds, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
      vertexShader: `attribute float seed; uniform float uTime; varying float vS; varying float vF; void main(){ vS = seed; float k = fract(seed); vec3 p = position + normalize(position) * sin(uTime * 2.0 + seed * 9.0) * 0.02 * k; p += vec3(sin(seed*31.0 + uTime*7.0), cos(seed*17.0 + uTime*5.0), sin(seed*7.0 + uTime*3.0)) * 0.012 * k; vF = k; gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }`,
      fragmentShader: `uniform float uTime; uniform float uFade; varying float vS; varying float vF; void main(){ float id = floor(vS); float flick = step(0.35, fract(sin(id * 12.9 + floor(uTime * 6.0 + id)) * 437.5)); float fade = 1.0 - vF; float glitch = 0.5 + 0.5 * sin(vF * 60.0 - uTime * 10.0 + id); vec3 c = mix(vec3(0.75, 0.7, 1.0), vec3(0.6, 1.0, 0.95), fract(id * 0.37)); gl_FragColor = vec4(c * fade * (0.25 + 0.75 * glitch) * flick * 0.9 * uFade, 1.0); }`,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    this.frayMat = mat;
    this.fadeMats.push(mat);
    this.group.add(new THREE.LineSegments(g, mat));
    this.labels.push({ text: 'The frayed ends', obj: this.group, local: new THREE.Vector3(0.6, 0.15, 0), radius: 1 });
  }

  // ------------------------------------------------------------------------

  update(t: number, dt: number, camera: THREE.PerspectiveCamera, dpr: number, px: number) {
    const camDist = camera.position.distanceTo(this.group.position);
    const e = this.extent;
    this.presence = 1 - THREE.MathUtils.smoothstep(camDist, e * 7, e * 18);
    if (this.def.special === 'elision') this.presence = 1 - THREE.MathUtils.smoothstep(camDist, 120, 400);
    if (this.starBall) {
      this.presence = Math.max(this.presence, 0.004);
      const u = this.starBall.uniforms;
      u.uFade.value = 1 - THREE.MathUtils.smoothstep(camDist, 300, 1_500);
      u.uDpr.value = dpr;
      u.uTime.value = t;
    }
    this.group.visible = this.presence > 0.002;
    if (!this.group.visible) return;
    const fade = this.presence;
    const orbitFade = fade * (1 - THREE.MathUtils.smoothstep(camDist, e * 2.2, e * 7));
    const sc0 = this.starCols[0];
    for (const m of this.fadeMats) {
      const u = m.uniforms;
      if (u.uTime) u.uTime.value = t;
      if (u.uFade) u.uFade.value = fade;
      if (u.uDpr) u.uDpr.value = dpr;
      if (u.uPx) u.uPx.value = px;
      if (u.uStarCol) (u.uStarCol.value as THREE.Vector3).copy(this.stars.length ? sc0 : this.tmp.set(0.3, 0.3, 0.3)).multiplyScalar(0.7);
    }

    // stars: positions, brightness modulation
    let n = 0;
    const view = camera.matrixWorldInverse;
    for (const s of this.stars) {
      if (s.def.orbit) {
        const o = s.def.orbit;
        const a = (o.phase ?? 0) + (t / o.period) * Math.PI * 2;
        s.holder.position.set(Math.cos(a) * o.r, Math.sin(a) * o.r * (o.incl ?? 0), Math.sin(a) * o.r);
      }
      let dim = 1;
      if (s.def.occlusion) {
        // a lobe of the swarm transits every ~31 s (the Hush)
        const ph = (t / 31) % 1;
        dim *= 1 - s.def.occlusion * Math.exp(-Math.pow((ph - 0.5) * 9, 2));
      }
      if (s.def.flicker) {
        dim *= 1 - s.def.flicker * (0.5 + 0.5 * Math.sin(t * 1.7) * Math.sin(t * 0.63 + 1.3)) * (0.6 + 0.4 * Math.sin(t * 7.1));
      }
      s.surf!.uniforms.uTime.value = t;
      s.surf!.uniforms.uBright.value = s.bright * (0.55 + 0.45 * dim);
      s.glow!.uniforms.uBright.value = dim * fade * (s.glowK ?? 1);
      s.update?.(t);
      if (n < 3) {
        this.tmp.copy(s.holder.position).add(this.group.position).applyMatrix4(view);
        this.starViews[n].copy(this.tmp);
        const k = s.def.kind === 'WD' ? 0.7 : s.def.kind === 'NS' ? 0.35 : s.def.kind === 'RG' ? 1.3 : 1.0;
        this.starCols[n].copy(s.color).multiplyScalar(k * dim * 1.15);
        n++;
      }
    }
    for (const b of this.beamSpinners) b.obj.rotation.y = t * 9 + b.phase;

    // planets
    for (const p of this.planets) {
      const d = p.def;
      if (d.orbit > 0) {
        const a = p.phase + (t / d.period) * Math.PI * 2;
        p.holder.position.set(Math.cos(a) * d.orbit, 0, Math.sin(a) * d.orbit);
        if (d.tidalLock) p.mesh.rotation.y = Math.PI - a;
        else p.mesh.rotation.y = t * p.spin * 0.5;
        if (p.plume) {
          // plume trails the orbital motion
          p.plume.rotation.set(0, -a, Math.PI / 2);
        }
      } else {
        p.mesh.rotation.y = t * 0.05;
      }
      this.setLight(p.mat, n);
      p.mat.uniforms.uTime.value = t;
      if (p.atmo) p.atmo.uniforms.uStarN.value = n;
      if (p.rings.length) {
        p.holder.getWorldPosition(this.tmp2).applyMatrix4(view);
        for (const rm of p.rings) {
          rm.uniforms.uTime.value = t;
          (rm.uniforms.uStarPos.value as THREE.Vector3).copy(n > 0 ? this.starViews[0] : this.tmp.set(0, 1e9, 0));
          (rm.uniforms.uPlanetPosV.value as THREE.Vector3).copy(this.tmp2);
        }
      }
      for (const m of p.moons) {
        const a = (m.def.phase ?? 0) + (t / m.def.period) * Math.PI * 2;
        m.holder.position.set(Math.cos(a) * m.def.orbit, 0, Math.sin(a) * m.def.orbit);
        this.setLight(m.mat, n);
        m.mat.uniforms.uTime.value = t;
      }
      for (const b of p.built) b.update?.(t, dt, { camera, dpr, px, fade, starCol: this.starCols[0] });
    }
    for (const b of this.built) b.update?.(t, dt, { camera, dpr, px, fade, starCol: this.starCols[0] });
    for (const om of this.orbitMats) om.opacity = 0.13 * orbitFade;
    if (this.blackHole) this.blackHole.update(camera, t, 1 - THREE.MathUtils.smoothstep(camDist, 30, 80));
    this.traffic?.update(dt, fade * (1 - THREE.MathUtils.smoothstep(camDist, e * 3, e * 9)), dpr, this.tmp2.copy(camera.position).sub(this.group.position));
  }

  private setLight(m: THREE.ShaderMaterial, n: number) {
    m.uniforms.uStarN.value = n;
    m.uniforms.uAmbient.value = n === 0 ? 0.03 : 0.012;
  }

  labelCandidates(camera: THREE.Camera, out: LabelCandidate[], focusId: string | null) {
    if (!this.group.visible) return;
    const camDist = camera.position.distanceTo(this.group.position);
    const e = this.extent;
    const bodyAlpha = this.presence * (1 - THREE.MathUtils.smoothstep(camDist, e * 3, e * 8));
    for (const b of this.bodies) {
      if (b.kind === 'star' && this.def.stars.length < 2) continue;
      const w = b.obj.getWorldPosition(new THREE.Vector3());
      const d = camera.position.distanceTo(w);
      let a = bodyAlpha;
      if (b.kind === 'moon') a *= 1 - THREE.MathUtils.smoothstep(d, b.radius * 30, b.radius * 90);
      const isFocus = focusId === b.id;
      if (isFocus) a = Math.min(a, 1 - THREE.MathUtils.smoothstep(d, 0, b.radius * 3));
      if (a < 0.02) continue;
      out.push({
        key: `body:${b.id}`,
        text: b.name,
        sub: b.kind === 'moon' ? 'moon' : b.planet ? b.planet.type === 'city' ? 'ecumenopolis' : b.planet.info ? typeLabel(b.planet.type) : '' : '',
        cls: 'body',
        world: w,
        priority: (b.kind === 'planet' ? 40 : b.kind === 'star' ? 45 : 20) + (b.info ? 10 : 0) + (isFocus ? 30 : 0),
        alpha: a,
        pickId: b.id,
        dx: isFocus ? 20 : 10,
      });
    }
    const la = this.presence * (1 - THREE.MathUtils.smoothstep(camDist, e * 3.5, e * 9));
    for (const l of this.labels) {
      const w = l.obj.localToWorld(l.local.clone());
      out.push({ key: `struct:${this.id}:${l.text}`, text: l.text, cls: 'minor', world: w, priority: 15, alpha: la * 0.85, dx: 8 });
    }
  }

  pick(camera: THREE.Camera, sx: number, sy: number, w: number, h: number, px: number): { body: BodyHandle; dist: number } | null {
    if (!this.group.visible || this.presence < 0.3) return null;
    let best: BodyHandle | null = null;
    let bestD = Infinity;
    const v = new THREE.Vector3();
    for (const b of this.bodies) {
      b.obj.getWorldPosition(v);
      const d = camera.position.distanceTo(v);
      v.project(camera);
      if (v.z > 1) continue;
      const x = (v.x * 0.5 + 0.5) * w;
      const y = (-v.y * 0.5 + 0.5) * h;
      const rPx = (b.radius * px) / d;
      const dd = Math.hypot(x - sx, y - sy);
      const lim = Math.max(10, rPx + 5);
      if (dd < lim && dd - rPx < bestD) {
        bestD = dd - rPx;
        best = b;
      }
    }
    return best ? { body: best, dist: bestD } : null;
  }

  bodyWorld(id: string, out: THREE.Vector3): THREE.Vector3 | null {
    const b = this.bodies.find((x) => x.id === id);
    if (!b) return null;
    return b.obj.getWorldPosition(out);
  }

  body(id: string) {
    return this.bodies.find((x) => x.id === id) ?? null;
  }

  dispose() {
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry && m.geometry !== SPHERE_HI && m.geometry !== SPHERE_LO && m.geometry !== QUAD) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
  }
}

export function typeLabel(t: string): string {
  const m: Record<string, string> = {
    terran: 'temperate world',
    garden: 'garden world',
    ocean: 'ocean world',
    reef: 'reef world',
    desert: 'desert world',
    terraform: 'terraforming',
    ice: 'ice world',
    lava: 'molten world',
    gas: 'gas giant',
    icegiant: 'ice giant',
    city: 'ecumenopolis',
    barren: 'airless world',
    twilight: 'tidally locked',
    toxic: 'toxic world',
    machine: 'computation moon',
    bloom: 'quarantined',
    glass: 'glass world',
    hollow: 'hollowed world',
    rogue: 'rogue planet',
  };
  return m[t] ?? t;
}

export { lightMaterial };
