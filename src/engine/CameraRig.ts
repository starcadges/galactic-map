import * as THREE from 'three';

// Orbit camera with inertia, logarithmic zoom and cinematic cross-scale flights.
//
// All state lives in JS doubles; only camera-relative matrices ever reach the GPU,
// so the same rig can hover 250,000 ly above the disk or 0.004 ly from a moon.

const RHO = Math.SQRT2;
const RHO2 = RHO * RHO;
const RHO4 = RHO2 * RHO2;

export interface FlightOptions {
  distance: number;
  yaw?: number;
  pitch?: number;
  /** Seconds; if omitted it is derived from the length of the zoom path. */
  duration?: number;
  /** Live target provider (for orbiting bodies). */
  follow?: () => THREE.Vector3 | null;
  onArrive?: () => void;
  minDistance?: number;
}

interface Flight {
  c0: THREE.Vector3;
  w0: number;
  endFn: () => THREE.Vector3;
  w1: number;
  yaw0: number;
  yaw1: number;
  pitch0: number;
  pitch1: number;
  t: number;
  duration: number;
  onArrive?: () => void;
}

/** van Wijk & Nuij smooth zoom-pan path. Returns (u ∈ [0,1] along the chord, width). */
function zoomPath(d: number, w0: number, w1: number) {
  if (d < 1e-9 * Math.max(w0, w1)) {
    const S = Math.log(w1 / w0) / RHO;
    return {
      S: Math.abs(S),
      at: (s: number) => ({ u: s, w: w0 * Math.exp(RHO * s * S) }),
    };
  }
  const b0 = (w1 * w1 - w0 * w0 + RHO4 * d * d) / (2 * w0 * RHO2 * d);
  const b1 = (w1 * w1 - w0 * w0 - RHO4 * d * d) / (2 * w1 * RHO2 * d);
  const r0 = -Math.asinh(b0);
  const r1 = -Math.asinh(b1);
  const S = (r1 - r0) / RHO;
  const coshr0 = Math.cosh(r0);
  const sinhr0 = Math.sinh(r0);
  return {
    S,
    at: (t: number) => {
      const s = t * S;
      const u = (w0 / (RHO2 * d)) * (coshr0 * Math.tanh(RHO * s + r0) - sinhr0);
      const w = (w0 * coshr0) / Math.cosh(RHO * s + r0);
      return { u, w };
    },
  };
}

function shortestAngle(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return from + d;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

export class CameraRig {
  readonly camera: THREE.PerspectiveCamera;
  readonly target = new THREE.Vector3();
  distance = 300_000;
  yaw = 0.9;
  pitch = 0.62;

  minDistance = 0.0015;
  maxDistance = 900_000;

  // inertia
  private yawVel = 0;
  private pitchVel = 0;
  private panVel = new THREE.Vector3();
  private logGoal: number;
  private zoomAnchor: THREE.Vector3 | null = null;
  private moveInput = new THREE.Vector3();
  private rollInput = 0;

  flight: Flight | null = null;
  /** travelling along a polyline (route following) */
  path: { pts: THREE.Vector3[]; cum: number[]; t: number; duration: number; D: number } | null = null;
  follow: (() => THREE.Vector3 | null) | null = null;
  lastInputTime = 0;
  private time = 0;
  idleSpin = 0;

  private _right = new THREE.Vector3();
  private _up = new THREE.Vector3();
  private _fwd = new THREE.Vector3();
  private _tmp = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.logGoal = Math.log(this.distance);
  }

  get isFlying() {
    return this.flight !== null;
  }

  logGoalDistance() {
    return Math.exp(this.logGoal);
  }

  /** Called whenever the user touches any control: it always wins over automation. */
  userInput() {
    this.lastInputTime = this.time;
    this.path = null;
    if (this.flight) {
      // Keep wherever we are; hand control back immediately.
      this.flight = null;
      this.logGoal = Math.log(this.distance);
    }
    this.idleSpin = 0;
  }

  private lastDragT = 0;
  private dragDt() {
    const now = performance.now();
    const dt = THREE.MathUtils.clamp((now - this.lastDragT) / 1000, 1 / 240, 0.1);
    this.lastDragT = now;
    return dt;
  }

  orbitDrag(dxPx: number, dyPx: number, viewportH: number) {
    this.userInput();
    const k = 2.6 / viewportH;
    const dyaw = -dxPx * k;
    const dpitch = dyPx * k;
    this.yaw += dyaw;
    this.pitch = THREE.MathUtils.clamp(this.pitch + dpitch, -1.53, 1.53);
    // release inertia from the real pointer speed, capped so a flick never spins wildly
    const dt = this.dragDt();
    const cap = 3.2;
    this.yawVel = THREE.MathUtils.lerp(this.yawVel, THREE.MathUtils.clamp(dyaw / dt, -cap, cap), 0.35);
    this.pitchVel = THREE.MathUtils.lerp(this.pitchVel, THREE.MathUtils.clamp(dpitch / dt, -cap, cap), 0.35);
  }

  releaseOrbit(stillFor: number) {
    // If the pointer paused before release there should be no fling.
    if (stillFor > 0.08) {
      this.yawVel = 0;
      this.pitchVel = 0;
    }
  }

  stopInertia() {
    this.yawVel = 0;
    this.pitchVel = 0;
    this.panVel.set(0, 0, 0);
  }

  panDrag(dxPx: number, dyPx: number, viewportH: number) {
    this.userInput();
    this.follow = null;
    const worldPerPx = (2 * this.distance * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))) / viewportH;
    this.basis();
    const delta = this._tmp;
    if (this.distance > 15_000 && Math.abs(this.pitch) > 0.22) {
      // at galactic scales, pan across the disk like a map
      const fwdFlat = new THREE.Vector3(this._fwd.x, 0, this._fwd.z).normalize();
      const s = 1 / Math.max(Math.abs(Math.sin(this.pitch)), 0.35);
      delta
        .copy(this._right)
        .multiplyScalar(-dxPx * worldPerPx)
        .addScaledVector(fwdFlat, dyPx * worldPerPx * s * Math.sign(this.pitch));
    } else {
      delta
        .copy(this._right)
        .multiplyScalar(-dxPx * worldPerPx)
        .addScaledVector(this._up, dyPx * worldPerPx);
    }
    this.target.add(delta);
    const dt = this.dragDt();
    this.panVel.lerp(delta.clone().multiplyScalar(0.6 / dt), 0.35);
  }

  /** Wheel/pinch zoom; positive delta = zoom out. The anchor (world) stays put on screen. */
  zoom(deltaLog: number, anchor?: THREE.Vector3 | null) {
    this.userInput();
    this.logGoal = THREE.MathUtils.clamp(
      this.logGoal + deltaLog,
      Math.log(this.minDistance),
      Math.log(this.maxDistance),
    );
    this.zoomAnchor = anchor && !this.follow ? anchor.clone() : null;
  }

  setMove(x: number, y: number, z: number) {
    this.moveInput.set(x, y, z);
    if (x || y || z) this.userInput();
  }

  setRoll(yawRate: number) {
    this.rollInput = yawRate;
    if (yawRate) this.userInput();
  }

  flyTo(end: THREE.Vector3 | (() => THREE.Vector3), opts: FlightOptions) {
    this.path = null;
    const endFn = typeof end === 'function' ? end : () => end;
    const c0 = this.target.clone();
    const w0 = this.distance;
    const w1 = THREE.MathUtils.clamp(opts.distance, opts.minDistance ?? this.minDistance, this.maxDistance);
    const d = c0.distanceTo(endFn());
    const path = zoomPath(d, w0, w1);
    const duration =
      opts.duration ?? THREE.MathUtils.clamp(0.75 + Math.abs(path.S) * 0.36, 1.1, 4.6);
    const yaw1 = opts.yaw !== undefined ? shortestAngle(this.yaw, opts.yaw) : this.yaw;
    const pitch1 = opts.pitch ?? this.pitch;
    this.flight = {
      c0,
      w0,
      endFn,
      w1,
      yaw0: this.yaw,
      yaw1,
      pitch0: this.pitch,
      pitch1,
      t: 0,
      duration,
      onArrive: opts.onArrive,
    };
    this.follow = opts.follow ?? null;
    if (opts.minDistance !== undefined) this.minDistance = opts.minDistance;
    this.stopInertia();
    this.idleSpin = 0;
  }

  private basis() {
    this._fwd.set(
      -Math.cos(this.pitch) * Math.sin(this.yaw),
      -Math.sin(this.pitch),
      -Math.cos(this.pitch) * Math.cos(this.yaw),
    );
    this._right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    this._up.crossVectors(this._right, this._fwd).normalize();
  }

  followPath(pts: THREE.Vector3[], D: number, duration: number) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    this.path = { pts, cum, t: 0, duration, D };
    this.follow = null;
  }

  private pathAt(u: number, out: THREE.Vector3) {
    const p = this.path!;
    const L = p.cum[p.cum.length - 1];
    const s = THREE.MathUtils.clamp(u, 0, 1) * L;
    let i = 1;
    while (i < p.cum.length - 1 && p.cum[i] < s) i++;
    const k = (s - p.cum[i - 1]) / Math.max(p.cum[i] - p.cum[i - 1], 1e-9);
    return out.copy(p.pts[i - 1]).lerp(p.pts[i], k);
  }

  update(dt: number) {
    this.time += dt;
    if (this.path && !this.flight) {
      const p = this.path;
      p.t = Math.min(1, p.t + dt / p.duration);
      const u = easeSine(p.t);
      this.pathAt(u, this.target);
      // look along the thread, a little above it
      const ahead = this.pathAt(Math.min(1, u + 0.02), this._tmp.clone());
      const dir = ahead.sub(this.target);
      if (dir.lengthSq() > 1e-6) {
        const wantYaw = Math.atan2(-dir.x, -dir.z);
        const dy = shortestAngle(this.yaw, wantYaw) - this.yaw;
        this.yaw += dy * (1 - Math.exp(-dt * 1.5));
      }
      this.pitch += (0.32 - this.pitch) * (1 - Math.exp(-dt * 1.2));
      const logD = Math.log(this.distance);
      this.distance = Math.exp(logD + (Math.log(p.D) - logD) * (1 - Math.exp(-dt * 2)));
      this.logGoal = Math.log(this.distance);
      if (p.t >= 1) this.path = null;
      this.apply();
      return;
    }
    const f = this.flight;
    if (f) {
      f.t = Math.min(1, f.t + dt / f.duration);
      const end = f.endFn();
      const d = f.c0.distanceTo(end);
      const path = zoomPath(d, f.w0, f.w1);
      const s = easeSine(f.t);
      const p = path.at(s);
      this.target.copy(f.c0).lerp(end, THREE.MathUtils.clamp(p.u, 0, 1));
      this.distance = p.w;
      const a = ease(f.t);
      this.yaw = f.yaw0 + (f.yaw1 - f.yaw0) * a;
      this.pitch = f.pitch0 + (f.pitch1 - f.pitch0) * a;
      if (f.t >= 1) {
        this.target.copy(end);
        this.distance = f.w1;
        this.flight = null;
        this.logGoal = Math.log(this.distance);
        f.onArrive?.();
      }
      this.logGoal = Math.log(this.distance);
    } else {
      // follow a moving body
      if (this.follow) {
        const p = this.follow();
        if (p) this.target.copy(p);
      }
      // inertia
      const damp = Math.exp(-dt * 5.5);
      this.yaw += this.yawVel * dt;
      this.pitch = THREE.MathUtils.clamp(this.pitch + this.pitchVel * dt, -1.53, 1.53);
      this.yawVel *= damp;
      this.pitchVel *= damp;
      if (!this.follow) {
        this.target.addScaledVector(this.panVel, dt);
      }
      this.panVel.multiplyScalar(Math.exp(-dt * 6));

      // keyboard flight (relative to view, speed scales with distance)
      if (this.moveInput.lengthSq() > 0) {
        this.follow = null;
        this.basis();
        const speed = this.distance * 0.9;
        const fwdFlat = this._tmp.copy(this._fwd);
        this.target.addScaledVector(this._right, this.moveInput.x * speed * dt);
        this.target.addScaledVector(this._up, this.moveInput.y * speed * dt);
        this.target.addScaledVector(fwdFlat, this.moveInput.z * speed * dt);
      }
      if (this.rollInput) this.yaw += this.rollInput * dt * 1.2;

      // idle drift at galactic scale
      const idle = this.time - this.lastInputTime;
      if (idle > 14 && this.distance > 40_000) {
        this.idleSpin = Math.min(1, this.idleSpin + dt * 0.25);
      } else {
        this.idleSpin = Math.max(0, this.idleSpin - dt * 2);
      }
      this.yaw += this.idleSpin * 0.018 * dt;

      // smooth zoom
      const logD = Math.log(this.distance);
      const goal = THREE.MathUtils.clamp(this.logGoal, Math.log(this.minDistance), Math.log(this.maxDistance));
      const next = logD + (goal - logD) * (1 - Math.exp(-dt * 11));
      const ratio = Math.exp(next - logD);
      if (this.zoomAnchor && Math.abs(ratio - 1) > 1e-7) {
        // a homothety about the anchor keeps it fixed on screen:
        // target' = anchor + (target - anchor) * ratio
        this.target.sub(this.zoomAnchor).multiplyScalar(ratio).add(this.zoomAnchor);
      }
      this.distance = Math.exp(next);
      if (Math.abs(goal - next) < 1e-4) this.zoomAnchor = null;
    }

    this.apply();
  }

  apply() {
    const cp = Math.cos(this.pitch);
    const off = this._tmp.set(cp * Math.sin(this.yaw), Math.sin(this.pitch), cp * Math.cos(this.yaw));
    this.camera.position.copy(this.target).addScaledVector(off, this.distance);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this.target);
    // Depth range tracks scale: tight near plane, generous far plane.
    this.camera.near = Math.max(this.distance * 0.0025, 1e-7);
    this.camera.far = Math.max(this.distance * 60, 4_000_000);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld(true);
  }
}
