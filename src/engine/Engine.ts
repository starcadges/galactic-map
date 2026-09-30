import * as THREE from 'three';
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from 'postprocessing';
import { CameraRig } from './CameraRig';
import { Input } from './Input';
import { GalaxyLayer } from './galaxy/GalaxyLayer';
import { Background } from './Background';
import { LocalField } from './LocalField';
import { Markers } from './Markers';
import { Labels, type LabelCandidate } from './Labels';
import { Routes } from './Routes';
import { Territories } from './Territories';
import { SystemView, type BodyHandle } from './system/SystemView';
import { getState, useStore } from '../store';
import {
  CHARTED,
  CHARTED_BY_ID,
  LANDMARKS,
  LANDMARK_BY_ID,
  REGIONS,
  REGION_BY_ID,
  bodyDef,
  parseBody,
  systemFor,
} from '../world';
import { EVENT_BY_ID, ERAS } from '../world/history';
import { catalogStar, proceduralSystem, type CatalogStar } from '../world/procedural';
import type { RouteDef, SystemDef } from '../world/types';
import { hashString } from '../world/rng';
import { TERRITORY_FACTIONS, factionAt } from '../world/territory';

export type EntityKind = 'landmark' | 'charted' | 'catalog' | 'body' | 'star' | 'region' | 'route' | 'extra' | 'event';

export function kindOf(id: string): EntityKind {
  if (id.startsWith('b|')) return 'body';
  if (id.startsWith('star|')) return 'star';
  if (id.startsWith('cat-')) return 'catalog';
  if (id.startsWith('cs-')) return 'charted';
  if (id.startsWith('region:')) return 'region';
  if (id.startsWith('route:')) return 'route';
  if (id.startsWith('event:')) return 'event';
  if (id.startsWith('extra:')) return 'extra';
  return 'landmark';
}

/** Which star system an entity lives in, if any. */
export function systemIdOf(id: string): string | null {
  const k = kindOf(id);
  if (k === 'landmark' || k === 'charted' || k === 'catalog') return id;
  if (k === 'body') return parseBody(id)!.sys;
  if (k === 'star') return id.split('|')[1];
  return null;
}

function parseYear(s: string | undefined): number {
  if (!s) return 0;
  if (s.includes('million')) return -2_100_000;
  const m = s.replace(/,/g, '').match(/[−-]?\d+/);
  if (!m) return 0;
  return Number(m[0].replace('−', '-'));
}

const LABEL_BOOST: Record<string, number> = {
  orrhune: 24,
  calyx: 14,
  spindle: 10,
  kettobe: 10,
  hallowmere: 10,
  saltwhistle: 9,
  mirrenhall: 7,
  ossaran: 7,
  qhorrat: 5,
  elision: 6,
  aurel: 6,
};

const SCALES: [number, string][] = [
  [150_000, 'Galactic'],
  [30_000, 'Regional'],
  [3_000, 'Sector'],
  [200, 'Stellar neighbourhood'],
  [5, 'Local space'],
  [0.15, 'System'],
  [0, 'Orbital'],
];

export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly rig: CameraRig;
  readonly input: Input;
  readonly composer: EffectComposer;
  private bloom: BloomEffect;
  readonly galaxy: GalaxyLayer;
  readonly background: Background;
  readonly field: LocalField;
  readonly markers: Markers;
  readonly routes: Routes;
  readonly territories: Territories;
  readonly labels: Labels;
  private container: HTMLElement;
  private raf = 0;
  private last = performance.now();
  time = 0;
  simTime = 0;
  private dpr = 1;
  pixelScale = 1000;
  private w = 1;
  private h = 1;
  private fpsAcc = 0;
  private fpsFrames = 0;
  private fps = 60;
  private publishAcc = 0;
  private ro: ResizeObserver;
  private disposed = false;

  readonly systems = new Map<string, SystemView>();
  private systemUse = new Map<string, number>();
  readonly catalog = new Map<string, CatalogStar>();
  selectedId: string | null = null;
  hoverId: string | null = null;
  hoverRoute = -1;
  private pointer: { x: number; y: number } | null = null;
  private hoverDirty = false;
  private eventPlaces: string[] = [];
  private labelBuf: LabelCandidate[] = [];
  private neighbours: string[] = [];
  private frameCount = 0;
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  private sisterDir: THREE.Vector3;
  eraId: string | null = null;
  private routeYears: { built: number; cut: number }[];
  onHoverChange?: () => void;

  constructor(container: HTMLElement, canvas: HTMLCanvasElement, labelRoot: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(50, 1, 1, 1e7);
    this.rig = new CameraRig(this.camera);
    this.scene.add(this.camera);

    this.background = new Background();
    this.scene.add(this.background.group);
    this.sisterDir = this.background.named.find((n) => n.id === 'sister')!.dir.clone();
    this.galaxy = new GalaxyLayer();
    this.scene.add(this.galaxy.group);
    this.territories = new Territories();
    this.territories.bake(this.renderer);
    this.scene.add(this.territories.mesh);
    this.field = new LocalField([...LANDMARKS.map((l) => l.pos), ...CHARTED.map((c) => c.pos)]);
    this.scene.add(this.field.group);
    this.markers = new Markers();
    this.scene.add(this.markers.group);
    this.routes = new Routes();
    this.scene.add(this.routes.group);
    this.routeYears = this.routes.routes.map((r) => {
      const built = parseYear(r.def.built);
      let cut = Infinity;
      if (r.def.cls === 'grey') cut = 15_300;
      if (r.def.cls === 'sail') cut = 8_300;
      if (r.def.cls === 'longway') cut = 15_902;
      return { built, cut };
    });
    this.labels = new Labels(labelRoot);

    this.composer = new EffectComposer(this.renderer, { frameBufferType: THREE.HalfFloatType });
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new BloomEffect({
      mipmapBlur: true,
      luminanceThreshold: 0.62,
      luminanceSmoothing: 0.25,
      intensity: 0.85,
      radius: 0.72,
    });
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.AGX });
    const vignette = new VignetteEffect({ darkness: 0.5, offset: 0.34 });
    this.composer.addPass(new EffectPass(this.camera, this.bloom, vignette, tone));

    this.input = new Input(container, this.rig, {
      onHover: (x, y) => {
        this.pointer = { x, y };
        this.hoverDirty = true;
      },
      onHoverEnd: () => {
        this.pointer = null;
        this.setHover(null);
      },
      onClick: (x, y, e) => this.handleClick(x, y, e),
      onDoubleClick: (x, y) => this.handleDoubleClick(x, y),
      zoomAnchor: (ndc) => this.zoomAnchorAt(ndc),
      onKey: (e) => this.handleKey(e),
      onDragState: (d) => {
        container.classList.toggle('dragging', d);
        if (d) this.setHover(null);
      },
    });

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.resize();

    // Arrival: from far outside, falling toward the Wheel.
    this.rig.distance = 1_100_000;
    this.rig.yaw = 0.35;
    this.rig.pitch = 0.9;
    this.rig.apply();
    const reduced = getState().reducedMotion;
    this.rig.flyTo(new THREE.Vector3(0, 0, 0), { distance: 215_000, yaw: 0.95, pitch: 0.6, duration: reduced ? 0.01 : 5.2 });
  }

  // ------------------------------------------------------------------------
  /** adaptive resolution: 1 = native (capped) pixel ratio */
  private resScale = 1;
  private slowFor = 0;
  private fastFor = 0;
  private frameAvg = 1 / 60;

  private adaptResolution(dt: number) {
    this.frameAvg += (dt - this.frameAvg) * 0.05;
    const base = Math.min(window.devicePixelRatio || 1, getState().quality === 'high' ? 2 : 1.25);
    const minScale = Math.max(0.5, 0.75 / base);
    if (this.frameAvg > 1 / 48) {
      this.slowFor += dt;
      this.fastFor = 0;
    } else if (this.frameAvg < 1 / 85) {
      this.fastFor += dt;
      this.slowFor = 0;
    } else {
      this.slowFor = Math.max(0, this.slowFor - dt);
      this.fastFor = Math.max(0, this.fastFor - dt);
    }
    if (this.slowFor > 1.2 && this.resScale > minScale) {
      this.resScale = Math.max(minScale, this.resScale * 0.82);
      this.slowFor = 0;
      this.frameAvg = 1 / 60;
      this.resize();
    } else if (this.fastFor > 4 && this.resScale < 1) {
      this.resScale = Math.min(1, this.resScale * 1.15);
      this.fastFor = 0;
      this.resize();
    }
  }

  resize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const q = getState().quality;
    this.dpr = Math.min(window.devicePixelRatio || 1, q === 'high' ? 2 : 1.25) * this.resScale;
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.w = w;
    this.h = h;
    this.pixelScale = (h * this.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)));
  }

  start() {
    const loop = () => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(loop);
      this.frame();
    };
    this.raf = requestAnimationFrame(loop);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.input.dispose();
    this.labels.clear();
    for (const s of this.systems.values()) s.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }

  // ------------------------------------------------------------------------
  // Entity geometry

  posOf(id: string, out = new THREE.Vector3()): THREE.Vector3 | null {
    const k = kindOf(id);
    if (k === 'landmark') {
      const l = LANDMARK_BY_ID[id];
      return l ? out.set(...l.pos) : null;
    }
    if (k === 'charted') {
      const c = CHARTED_BY_ID[id];
      return c ? out.set(...c.pos) : null;
    }
    if (k === 'catalog') {
      const c = this.catalog.get(id);
      return c ? out.set(...c.pos) : null;
    }
    if (k === 'body' || k === 'star') {
      const sys = systemIdOf(id)!;
      const view = this.ensureSystem(sys);
      if (view) {
        view.group.updateMatrixWorld(true);
        const p = view.bodyWorld(id, out);
        if (p) return p;
      }
      return this.posOf(sys, out);
    }
    if (k === 'region') {
      const r = REGION_BY_ID[id.slice(7)];
      return r ? out.set(...r.center) : null;
    }
    return null;
  }

  systemDef(id: string): SystemDef | null {
    const k = kindOf(id);
    if (k === 'catalog') {
      const c = this.catalog.get(id);
      if (!c) return null;
      return proceduralSystem(c.seed, c.kind, c.temp, false);
    }
    return systemFor(id);
  }

  ensureSystem(id: string): SystemView | null {
    let v = this.systems.get(id);
    if (v) {
      this.systemUse.set(id, this.time);
      return v;
    }
    const def = this.systemDef(id);
    const pos = this.posOf(id);
    if (!def || !pos) return null;
    const lm = LANDMARK_BY_ID[id];
    const name = lm?.name ?? CHARTED_BY_ID[id]?.name ?? this.catalog.get(id)?.designation ?? id;
    v = new SystemView({
      id,
      name,
      def,
      pos,
      gateDirs: this.routes.dirsFrom(id),
      sisterDir: this.sisterDir,
      seed: hashString(id),
    });
    v.group.updateMatrixWorld(true);
    this.scene.add(v.group);
    this.systems.set(id, v);
    this.systemUse.set(id, this.time);
    // keep the cache small
    if (this.systems.size > 4) {
      let oldest: string | null = null;
      let ot = Infinity;
      for (const [k, t] of this.systemUse) {
        if (k === id || k === systemIdOf(this.selectedId ?? '')) continue;
        if (t < ot) {
          ot = t;
          oldest = k;
        }
      }
      if (oldest) this.dropSystem(oldest);
    }
    return v;
  }

  private dropSystem(id: string) {
    const v = this.systems.get(id);
    if (!v) return;
    this.scene.remove(v.group);
    v.dispose();
    this.systems.delete(id);
    this.systemUse.delete(id);
  }

  // ------------------------------------------------------------------------
  // Selection & navigation

  select(id: string | null, fly = true) {
    if (id && kindOf(id) === 'event') {
      this.showEvent(id.slice(6));
      return;
    }
    if (id && kindOf(id) === 'region') {
      this.selectedId = id;
      useStore.setState({ selectedId: id, panelOpen: true });
      if (fly) this.flyToRegion(id.slice(7));
      return;
    }
    if (id && kindOf(id) === 'route') {
      const ri = this.routes.routes.findIndex((r) => r.def.id === id.slice(6));
      this.routes.selected = ri;
      this.selectedId = id;
      useStore.setState({ selectedId: id, panelOpen: true });
      if (fly && ri >= 0) this.frameRoute(ri);
      return;
    }
    this.routes.selected = -1;
    this.selectedId = id;
    const st = getState();
    const trail = id && st.selectedId && st.selectedId !== id ? [...st.trail, st.selectedId].slice(-12) : st.trail;
    useStore.setState({ selectedId: id, panelOpen: id ? true : st.panelOpen, trail, activeEventId: id ? st.activeEventId : null });
    const mi = id ? this.markers.indexOf.get(id) ?? -1 : -1;
    this.markers.glyphMat.uniforms.uSel.value = mi;
    if (id && fly) this.flyToEntity(id);
  }

  flyToEntity(id: string) {
    const k = kindOf(id);
    const reduced = getState().reducedMotion;
    const dur = reduced ? 0.01 : undefined;
    if (k === 'body' || k === 'star') {
      const sys = systemIdOf(id)!;
      const view = this.ensureSystem(sys);
      if (!view) return;
      const b = view.body(id);
      if (!b) return;
      const ring = b.planet?.ring ? b.planet.ring.outer : 0;
      const r = Math.max(b.radius, ring * 0.55);
      const dist = k === 'star' ? r * 9 : r * (b.kind === 'moon' ? 7 : 5.2);
      this.rig.flyTo(() => view.bodyWorld(id, new THREE.Vector3()) ?? view.group.position, {
        distance: dist,
        pitch: 0.22,
        duration: dur,
        follow: () => view.bodyWorld(id, this.tmp2),
        minDistance: b.radius * 1.35,
      });
      return;
    }
    const p = this.posOf(id);
    if (!p) return;
    let dist = 3;
    let pitch = 0.42;
    const def = this.systemDef(id);
    const extent = def?.extent ?? 1;
    if (def) dist = extent * 2.7;
    if (def?.special === 'blackhole') {
      dist = 6.5;
      pitch = 0.22;
    }
    if (def?.special === 'elision') {
      dist = 140;
      pitch = 0.3;
    }
    if (def?.special === 'nebula') dist = extent * 2.2;
    if (k === 'catalog') dist = Math.max(1.6, extent * 2.4);
    this.ensureSystem(id);
    this.rig.flyTo(p.clone(), { distance: dist, pitch, duration: dur, minDistance: 0.0015 });
  }

  flyToRegion(rid: string) {
    const r = REGION_BY_ID[rid];
    if (!r) return;
    this.rig.flyTo(new THREE.Vector3(...r.center), { distance: r.view, pitch: 0.75, minDistance: 0.0015, duration: getState().reducedMotion ? 0.01 : undefined });
  }

  home() {
    this.select(null, false);
    useStore.setState({ activeEventId: null });
    this.eventPlaces = [];
    this.routes.highlightSet.clear();
    this.rig.flyTo(new THREE.Vector3(0, 0, 0), { distance: 250_000, pitch: 0.62, minDistance: 0.0015, duration: getState().reducedMotion ? 0.01 : undefined });
  }

  /** Escape: step outward one level of the hierarchy. */
  back() {
    const id = this.selectedId;
    if (id) {
      const k = kindOf(id);
      if (k === 'body' || k === 'star') {
        this.select(systemIdOf(id), true);
        return;
      }
      const p = this.posOf(id);
      this.select(null, false);
      if (p && (k === 'landmark' || k === 'charted' || k === 'catalog')) {
        this.rig.flyTo(p, { distance: Math.max(this.rig.distance * 30, 160), minDistance: 0.0015 });
        return;
      }
    }
    // no selection: widen the view by an order of magnitude, toward the galaxy
    const D = this.rig.distance;
    if (D > 150_000) return;
    const target = D > 20_000 ? new THREE.Vector3(0, 0, 0) : this.rig.target.clone();
    this.rig.flyTo(target, { distance: Math.min(D * 12, 250_000), minDistance: 0.0015 });
  }

  showEvent(eid: string | null) {
    this.routes.highlightSet.clear();
    if (!eid) {
      this.eventPlaces = [];
      useStore.setState({ activeEventId: null });
      return;
    }
    const e = EVENT_BY_ID[eid];
    if (!e) return;
    this.eventPlaces = e.places.filter((p) => LANDMARK_BY_ID[p]);
    useStore.setState({ activeEventId: eid, selectedId: `event:${eid}`, panelOpen: true });
    this.selectedId = `event:${eid}`;
    this.routes.routes.forEach((r, i) => {
      const hits = r.def.path.filter((p) => typeof p === 'string' && this.eventPlaces.includes(p)).length;
      if (hits >= 1 && (hits >= 2 || this.eventPlaces.length === 1)) this.routes.highlightSet.add(i);
    });
    // frame the involved places
    const pts = this.eventPlaces.map((p) => new THREE.Vector3(...LANDMARK_BY_ID[p].pos));
    if (!pts.length) return;
    const box = new THREE.Box3().setFromPoints(pts);
    const c = box.getCenter(new THREE.Vector3());
    const r = Math.max(box.getSize(new THREE.Vector3()).length() / 2, pts.length === 1 ? 20 : 400);
    this.rig.flyTo(c, { distance: pts.length === 1 ? 40 : r * 2.3, pitch: 0.7, minDistance: 0.0015 });
  }

  /** Travel along a thread from one end to the other. */
  followRoute(routeId: string) {
    const r = this.routes.routes.find((x) => x.def.id === routeId);
    if (!r) return;
    const pts = r.points;
    const D = THREE.MathUtils.clamp(r.length / 9, 400, 9_000);
    const duration = THREE.MathUtils.clamp(8 + r.length / 6_000, 10, 26);
    // arrive at the start first, then travel
    this.rig.flyTo(pts[0].clone(), {
      distance: D,
      pitch: 0.32,
      minDistance: 0.0015,
      onArrive: () => this.rig.followPath(pts, D, duration),
    });
  }

  private frameRoute(ri: number) {
    const r = this.routes.routes[ri];
    const box = new THREE.Box3().setFromPoints(r.points);
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    this.rig.flyTo(c, { distance: size * 1.1, pitch: 0.8, minDistance: 0.0015 });
  }

  setEra(id: string | null) {
    this.eraId = id;
    useStore.setState({ era: id });
  }

  private eraAlpha = (def: RouteDef): number => {
    const i = this.routes.routes.findIndex((r) => r.def === def);
    const y = this.routeYears[i];
    if (!this.eraId) return 1;
    const era = ERAS.find((e) => e.id === this.eraId);
    if (!era) return 1;
    if (y.built > era.end) return 0;
    const activeThen = y.built <= era.end && y.cut >= era.start;
    return activeThen ? (def.cls === 'grey' || def.cls === 'sail' || def.cls === 'longway' ? 2.4 : 1.4) : 0.35;
  };

  // ------------------------------------------------------------------------
  // Picking

  private pickAt(x: number, y: number): { id: string | null; route: number } {
    const rect = this.container.getBoundingClientRect();
    const sx = x - rect.left;
    const sy = y - rect.top;
    const px = this.pixelScale / this.dpr;
    // 1. bodies in visible systems
    let bestBody: { body: BodyHandle; dist: number } | null = null;
    for (const v of this.systems.values()) {
      const p = v.pick(this.camera, sx, sy, this.w, this.h, px);
      if (p && (!bestBody || p.dist < bestBody.dist)) bestBody = p;
    }
    if (bestBody) {
      // a system's star picks the system itself (unless it is a multiple star)
      const b = bestBody.body;
      if (b.kind === 'star') {
        const sys = systemIdOf(b.id)!;
        const multiple = (this.systems.get(sys)?.def.stars.length ?? 1) > 1;
        return { id: multiple && this.selectedId && systemIdOf(this.selectedId) === sys ? b.id : sys, route: -1 };
      }
      return { id: b.id, route: -1 };
    }
    // 2. markers
    const st = getState();
    const cam = this.camera.position;
    let best = -1;
    let bestScore = Infinity;
    const v = this.tmp;
    const ents = this.markers.entries;
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      const d = e.pos.distanceTo(cam);
      const a = this.markers.glyphAlpha(i, d, st.labels !== 'none', true, this.rig.distance);
      if (a < 0.2) {
        // close in, the physical star still counts
        if (!(d < 60 && d > 0.5)) continue;
      }
      v.copy(e.pos).project(this.camera);
      if (v.z > 1) continue;
      const mx = (v.x * 0.5 + 0.5) * this.w;
      const my = (-v.y * 0.5 + 0.5) * this.h;
      const dd = Math.hypot(mx - sx, my - sy);
      const lim = e.kind === 'charted' ? 8 : 14;
      if (dd > lim) continue;
      const score = dd + (e.kind === 'charted' ? 4 : 0) - (4 - e.rank) * 1.5;
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }
    if (best >= 0) return { id: ents[best].id, route: -1 };
    // 3. resolved field stars
    if (this.rig.distance < 4_000) {
      const fs = this.field.pick(this.camera, sx, sy, this.w, this.h, 9);
      if (fs) {
        const id = `cat-${fs.seed}`;
        if (!this.catalog.has(id)) this.catalog.set(id, catalogStar(fs.seed, fs.pos, fs.temp, fs.lum));
        return { id, route: -1 };
      }
    }
    // 4. routes
    if (st.showRoutes) {
      const ri = this.routes.pick(this.camera, sx, sy, this.w, this.h, 5);
      if (ri >= 0) return { id: null, route: ri };
    }
    return { id: null, route: -1 };
  }

  private setHover(id: string | null, route = -1) {
    if (id === this.hoverId && route === this.hoverRoute) {
      if (this.pointer && (id || route >= 0)) this.publishHover();
      return;
    }
    this.hoverId = id;
    this.hoverRoute = route;
    const mi = id ? this.markers.indexOf.get(id) ?? -1 : -1;
    this.markers.glyphMat.uniforms.uHover.value = mi;
    this.routes.hover = route;
    this.container.classList.toggle('pointing', !!id || route >= 0);
    this.publishHover();
  }

  private publishHover() {
    const id = this.hoverId;
    const p = this.pointer;
    if (!p || (!id && this.hoverRoute < 0)) {
      if (getState().hover) useStore.setState({ hover: null });
      return;
    }
    if (this.hoverRoute >= 0 && !id) {
      const r = this.routes.routes[this.hoverRoute].def;
      useStore.setState({ hover: { id: `route:${r.id}`, name: r.name, kind: 'route', sub: r.status, x: p.x, y: p.y } });
      return;
    }
    const info = this.describe(id!);
    const pos = this.posOf(id!, this.tmp2);
    const ref = this.selectedId ? this.posOf(systemIdOf(this.selectedId) ?? this.selectedId, new THREE.Vector3()) : null;
    const dist = pos && ref ? pos.distanceTo(ref) : undefined;
    useStore.setState({ hover: { id: id!, name: info.name, kind: info.kind, sub: info.sub, x: p.x, y: p.y, distanceLy: dist } });
  }

  describe(id: string): { name: string; kind: string; sub: string } {
    const k = kindOf(id);
    if (k === 'landmark') {
      const l = LANDMARK_BY_ID[id];
      return { name: l.name, kind: l.category, sub: l.designation };
    }
    if (k === 'charted') {
      const c = CHARTED_BY_ID[id];
      return { name: c.name, kind: 'Charted system', sub: c.designation };
    }
    if (k === 'catalog') {
      const c = this.catalog.get(id);
      return { name: c?.designation ?? 'Uncatalogued star', kind: `${c?.kind ?? ''}-class star · register only`, sub: '' };
    }
    if (k === 'body') {
      const b = bodyDef(id);
      return { name: b?.moon?.name || b?.planet.name || 'Body', kind: b?.moon ? 'Moon' : 'World', sub: '' };
    }
    if (k === 'star') {
      const sys = systemIdOf(id)!;
      const v = this.systems.get(sys);
      return { name: v?.body(id)?.name ?? 'Star', kind: 'Star', sub: '' };
    }
    return { name: id, kind: '', sub: '' };
  }

  private handleClick(x: number, y: number, e: PointerEvent) {
    const t = e.target as HTMLElement | null;
    const lbl = t?.closest?.('[data-pick]') as HTMLElement | null;
    if (lbl?.dataset.pick) {
      this.select(lbl.dataset.pick);
      return;
    }
    // what the tooltip names is what a click selects
    const near = this.pointer && Math.hypot(this.pointer.x - x, this.pointer.y - y) < 6;
    if (near && this.hoverId) {
      this.select(this.hoverId);
      return;
    }
    if (near && this.hoverRoute >= 0) {
      this.select(`route:${this.routes.routes[this.hoverRoute].def.id}`, false);
      return;
    }
    const hit = this.pickAt(x, y);
    if (hit.id) this.select(hit.id);
    else if (hit.route >= 0) this.select(`route:${this.routes.routes[hit.route].def.id}`, false);
  }

  private raycaster = new THREE.Raycaster();

  /** The world point a zoom should close in on: what is under the cursor. */
  zoomAnchorAt(ndc: { x: number; y: number }): THREE.Vector3 | null {
    if (this.rig.follow) return null;
    if (this.hoverId) {
      const p = this.posOf(this.hoverId);
      if (p) return p.clone();
    }
    this.raycaster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), this.camera);
    const o = this.raycaster.ray.origin;
    const d = this.raycaster.ray.direction;
    const D = this.rig.distance;
    // at large scales the natural surface under the cursor is the galactic plane
    if (D > 2_500 && Math.abs(d.y) > 0.05) {
      const t = -o.y / d.y;
      if (t > 0 && t < D * 3) return o.clone().addScaledVector(d, t);
    }
    // otherwise the depth of the current focus
    const fwd = this.tmp.copy(this.rig.target).sub(o);
    const depth = fwd.length();
    fwd.normalize();
    const t = depth / Math.max(d.dot(fwd), 0.2);
    return o.clone().addScaledVector(d, t);
  }

  private handleDoubleClick(x: number, y: number) {
    const hit = this.pickAt(x, y);
    if (hit.id) return; // the first click already selected and flew
    const rect = this.container.getBoundingClientRect();
    const ndc = { x: ((x - rect.left) / rect.width) * 2 - 1, y: -(((y - rect.top) / rect.height) * 2 - 1) };
    this.rig.zoom(-1.1, this.zoomAnchorAt(ndc));
  }

  private handleKey(e: KeyboardEvent): boolean {
    if (e.key === 'Escape') {
      const st = getState();
      if (st.searchOpen || st.helpOpen || document.querySelector('.layer-menu')) return false;
      if (st.activeEventId) {
        this.showEvent(null);
        this.select(null, false);
        return true;
      }
      this.back();
      return true;
    }
    if (e.key === 'Home' || (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey)) {
      this.home();
      return true;
    }
    return false;
  }

  // ------------------------------------------------------------------------
  // Frame

  private activeSystem(): SystemView | null {
    const D = this.rig.distance;
    const sel = this.selectedId ? systemIdOf(this.selectedId) : null;
    if (sel) {
      const p = this.posOf(sel, this.tmp);
      if (p && p.distanceTo(this.camera.position) < 400) return this.ensureSystem(sel);
    }
    if (D < 60) {
      // wandering near a system without selecting it still reveals it
      const t = this.rig.target;
      let best: string | null = null;
      let bd = 6;
      for (const l of LANDMARKS) {
        const d = Math.hypot(l.pos[0] - t.x, l.pos[1] - t.y, l.pos[2] - t.z);
        const lim = Math.max(3, (l.system.extent ?? 1) * 3);
        if (d < lim && d < bd) {
          bd = d;
          best = l.id;
        }
      }
      if (!best) {
        for (const c of CHARTED) {
          const d = Math.hypot(c.pos[0] - t.x, c.pos[1] - t.y, c.pos[2] - t.z);
          if (d < 3 && d < bd) {
            bd = d;
            best = c.id;
          }
        }
      }
      if (best) return this.ensureSystem(best);
    }
    return null;
  }

  cpuMs = 0;
  private frame() {
    this.frameCount++;
    const now = performance.now();
    const t0 = now;
    let dt = (now - this.last) / 1000;
    this.last = now;
    dt = Math.min(dt, 0.25);
    this.time += dt;
    const st = getState();
    const timeScale = st.reducedMotion ? 0.25 : 1;
    this.simTime += dt * timeScale;
    const t = this.simTime;

    if (this.time > 6) this.adaptResolution(dt);
    this.input.tick(dt);
    this.rig.update(dt);
    const D = this.rig.distance;
    const target = this.rig.target;

    this.markers.rebase(target);
    this.routes.rebase(target);

    const active = this.activeSystem();
    let hideAt: THREE.Vector3 | null = null;
    let hideR = 0;
    let routeHideR = 0;
    if (active && active.presence > 0.05) {
      hideAt = active.group.position;
      const k = THREE.MathUtils.smoothstep(active.presence, 0.05, 0.6);
      hideR = Math.min(active.extent * 1.6, 3) * k;
      routeHideR = Math.min(active.extent * 2.8, 6) * k;
    }

    this.background.update(this.camera, this.dpr, 1);
    this.galaxy.update(t, this.pixelScale, this.dpr, D);
    this.field.update(target, D, this.dpr, t, hideAt, hideR * 0.5);
    this.markers.update(this.dpr, t, hideAt, hideR * 0.3, D);
    this.routes.update(t, this.w, this.h, this.dpr, D, hideAt, routeHideR, st.showRoutes, st.showTraffic, this.eraAlpha);
    const hlFaction = this.selectedId && kindOf(this.selectedId) === 'landmark' ? TERRITORY_FACTIONS.indexOf(LANDMARK_BY_ID[this.selectedId]?.faction) : -1;
    this.territories.update(this.camera, D, this.pixelScale, st.showTerritories && !this.eraId, hlFaction);
    for (const v of this.systems.values()) v.update(t, dt * timeScale, this.camera, this.dpr, this.pixelScale / this.dpr);

    // hover (throttled to once per frame, only when the pointer moved or things move)
    if (this.pointer && (this.hoverDirty || this.rig.isFlying || (this.time * 10) % 1 < dt * 10)) {
      this.hoverDirty = false;
      if (!this.container.classList.contains('dragging')) {
        const h = this.pickAt(this.pointer.x, this.pointer.y);
        this.setHover(h.id, h.route);
      }
    }

    this.updateLabels(dt, D, st.labels);
    this.composer.render(dt);
    this.cpuMs += (performance.now() - t0 - this.cpuMs) * 0.05;

    this.fpsAcc += dt;
    this.fpsFrames++;
    if (this.fpsAcc > 0.5) {
      this.fps = this.fpsFrames / this.fpsAcc;
      this.fpsAcc = 0;
      this.fpsFrames = 0;
    }
    this.publishAcc += dt;
    if (this.publishAcc > 0.12) {
      this.publishAcc = 0;
      let scaleName = 'Orbital';
      for (const [d, n] of SCALES) {
        if (D >= d) {
          scaleName = n;
          break;
        }
      }
      useStore.setState({
        view: {
          distance: D,
          target: [target.x, target.y, target.z],
          scaleName,
          regionId: this.regionAt(target, D),
          fps: this.fps,
        },
      });
    }
  }

  regionAt(p: THREE.Vector3, D: number): string | null {
    if (D > 120_000) return null;
    let best: string | null = null;
    let br = Infinity;
    for (const r of REGIONS) {
      if (r.id === 'halo') continue;
      const d = Math.hypot(p.x - r.center[0], p.y - r.center[1], p.z - r.center[2]);
      if (d < r.radius && r.radius < br) {
        br = r.radius;
        best = r.id;
      }
    }
    if (best) return best;
    const rr = Math.hypot(p.x, p.z);
    if (Math.abs(p.y) > 12_000 || rr > 100_000) return 'halo';
    if (rr < 9_000) return 'kiln';
    if (rr < 28_000) return 'heart';
    if (rr < 40_000) return 'ring';
    if (rr > 70_000) return 'rim';
    const f = factionAt(p.x, p.z).faction;
    if (f === 'hallowmere') return 'hallow';
    if (f === 'tethri') return 'tethri';
    return 'rim';
  }

  private updateLabels(dt: number, D: number, mode: 'all' | 'major' | 'none') {
    const L = this.labels;
    L.global = getState().reducedMotion ? 1 : THREE.MathUtils.smoothstep(this.time, 3.2, 5.4);
    L.begin();
    const cam = this.camera.position;
    const sel = this.selectedId;
    const selSys = sel ? systemIdOf(sel) : null;
    const hov = this.hoverId;

    // regions
    if (mode !== 'none') {
      for (const r of REGIONS) {
        const c = this.tmp.set(...r.center);
        const d = c.distanceTo(cam);
        const lo = r.labelRank === 1 ? r.view * 0.35 : r.view * 0.45;
        const hi = r.labelRank === 1 ? 900_000 : r.view * 5;
        let a = THREE.MathUtils.smoothstep(d, lo, lo * 1.8) * (1 - THREE.MathUtils.smoothstep(d, hi * 0.6, hi));
        a *= THREE.MathUtils.smoothstep(D, 1_500, 6_000);
        if (r.id === 'halo') a *= 0;
        if (a < 0.02) continue;
        L.add({
          key: `region:${r.id}`,
          text: r.name,
          sub: r.aliases,
          cls: 'region',
          world: c.clone(),
          priority: 90 - r.labelRank * 8,
          alpha: a * 0.85,
          pickId: `region:${r.id}`,
        });
      }
    }

    // landmarks & charted
    const ents = this.markers.entries;
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      const d = e.pos.distanceTo(cam);
      const isSel = e.id === selSys;
      const isHov = e.id === hov;
      const isEvent = this.eventPlaces.includes(e.id);
      let a: number;
      if (e.kind === 'landmark') {
        const lim = e.rank === 1 ? 700_000 : e.rank === 2 ? 110_000 : 40_000;
        a = 1 - THREE.MathUtils.smoothstep(d, lim * 0.55, lim);
        const rel = e.rank === 1 ? Math.max(D * 320, 22_000) : Math.max(D * 160, 2_500);
        if (e.id !== 'orrhune') a *= 1 - THREE.MathUtils.smoothstep(d, rel * 0.45, rel);
        if (mode === 'none') a = 0;
      } else {
        a = mode === 'all' ? 1 - THREE.MathUtils.smoothstep(d, Math.min(4_500, D * 0.9 + 60), Math.min(9_000, D * 1.5 + 150)) : 0;
      }
      if (isSel || isHov || isEvent) a = Math.max(a, 1);
      // inside the system the system's own view labels its bodies
      const ext = e.kind === 'landmark' ? LANDMARK_BY_ID[e.id].system.extent ?? 1 : 1;
      const hasBodies = e.kind === 'charted' || (LANDMARK_BY_ID[e.id]?.system.planets.length ?? 0) > 0;
      const inside = hasBodies ? THREE.MathUtils.smoothstep(d, ext * 3.2, ext * 6) : THREE.MathUtils.smoothstep(d, 1.5, 4);
      a *= inside;
      if (a < 0.02) continue;
      const lm = e.kind === 'landmark' ? LANDMARK_BY_ID[e.id] : null;
      const sub = lm && (e.rank === 1 || d < 60_000 || isSel || isHov) ? lm.category.split(' · ')[0] : undefined;
      L.add({
        key: `m:${e.id}`,
        text: e.name,
        sub,
        cls: e.kind === 'landmark' ? 'landmark' : 'charted',
        world: e.pos,
        priority: (e.kind === 'landmark' ? 80 - e.rank * 9 + (LABEL_BOOST[e.id] ?? 0) : 12 + Math.log10(1 + (CHARTED_BY_ID[e.id]?.population ?? 0))) + (isSel ? 120 : 0) + (isHov ? 100 : 0) + (isEvent ? 90 : 0),
        alpha: a,
        pickId: e.id,
        dx: isSel ? 20 : e.kind === 'landmark' ? 14 : 8,
        emph: isSel || isEvent,
      });
    }

    // extragalactic neighbours
    if (mode !== 'none') {
      for (const n of this.background.named) {
        L.add({
          key: `extra:${n.id}`,
          text: n.name,
          sub: n.sub,
          cls: 'extra',
          world: cam.clone().addScaledVector(n.dir, 1000),
          priority: 55,
          alpha: 0.75,
          dx: 30,
        });
      }
    }

    // system bodies
    this.labelBuf.length = 0;
    for (const v of this.systems.values()) v.labelCandidates(this.camera, this.labelBuf, sel);
    for (const c of this.labelBuf) {
      if (mode === 'none' && c.pickId !== sel) continue;
      if (mode === 'major' && c.cls === 'minor') continue;
      L.add(c);
    }

    // the brightest neighbouring suns, named by their register entries
    if (mode === 'all' && D < 60 && !(selSys && LANDMARK_BY_ID[selSys]?.system.special === 'blackhole')) {
      if (this.frameCount % 20 === 0) {
        this.neighbours = this.field.brightest(this.camera, 6).map((s) => {
          const id = `cat-${s.seed}`;
          if (!this.catalog.has(id)) this.catalog.set(id, catalogStar(s.seed, s.pos, s.temp, s.lum));
          return id;
        });
      }
      const na = 0.55 * (1 - THREE.MathUtils.smoothstep(D, 25, 60));
      for (const id of this.neighbours) {
        if (id === hov || id === sel) continue;
        const c = this.catalog.get(id);
        if (!c) continue;
        L.add({ key: `nb:${id}`, text: c.designation, cls: 'minor', world: new THREE.Vector3(...c.pos), priority: 8, alpha: na, dx: 8, pickId: id });
      }
    } else this.neighbours = [];

    // a hovered or selected catalogue star
    for (const id of [hov, sel]) {
      if (!id || kindOf(id) !== 'catalog') continue;
      const c = this.catalog.get(id);
      if (!c) continue;
      const w = new THREE.Vector3(...c.pos);
      const dd = w.distanceTo(cam);
      L.add({
        key: `cat:${id}`,
        text: c.designation,
        sub: `${c.kind}-class`,
        cls: 'star',
        world: w,
        priority: 150,
        alpha: dd < 2 ? THREE.MathUtils.smoothstep(dd, 0.6, 2) : 1,
        dx: id === sel ? 20 : 10,
        pickId: id,
      });
    }
    L.end(this.camera, this.w, this.h, dt);
  }

  /** screen position of an entity (for DOM reticles) */
  screenOf(id: string): { x: number; y: number; r: number; visible: boolean } | null {
    const p = this.posOf(id, this.tmp);
    if (!p) return null;
    const d = p.distanceTo(this.camera.position);
    const v = p.clone().project(this.camera);
    const k = kindOf(id);
    let radius = 0;
    if (k === 'body' || k === 'star') {
      const sys = this.systems.get(systemIdOf(id)!);
      radius = sys?.body(id)?.radius ?? 0;
    }
    const r = (radius * this.pixelScale) / this.dpr / Math.max(d, 1e-9);
    return { x: (v.x * 0.5 + 0.5) * this.w, y: (-v.y * 0.5 + 0.5) * this.h, r, visible: v.z < 1 && v.z > -1 };
  }

  setQuality(q: 'high' | 'balanced') {
    useStore.setState({ quality: q });
    this.bloom.intensity = q === 'high' ? 0.85 : 0.6;
    this.resize();
  }
}
