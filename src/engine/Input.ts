import type * as THREE from 'three';
import type { CameraRig } from './CameraRig';

export interface InputCallbacks {
  zoomAnchor(ndc: { x: number; y: number }): THREE.Vector3 | null;
  onHover(x: number, y: number): void;
  onHoverEnd(): void;
  onClick(x: number, y: number, e: PointerEvent): void;
  onDoubleClick(x: number, y: number): void;
  onKey(e: KeyboardEvent): boolean; // return true if handled
  onDragState(dragging: boolean): void;
}

// Mouse, trackpad, touch and keyboard → camera rig.
export class Input {
  private el: HTMLElement;
  private rig: CameraRig;
  private cb: InputCallbacks;
  private pointers = new Map<number, { x: number; y: number }>();
  private mode: 'none' | 'orbit' | 'pan' | 'pinch' = 'none';
  private downAt = { x: 0, y: 0, t: 0 };
  private moved = 0;
  private lastMoveT = 0;
  private lastClick = { t: 0, x: 0, y: 0 };
  private pinchDist = 0;
  private pinchMid = { x: 0, y: 0 };
  private keys = new Set<string>();
  private disposers: (() => void)[] = [];

  constructor(el: HTMLElement, rig: CameraRig, cb: InputCallbacks) {
    this.el = el;
    this.rig = rig;
    this.cb = cb;
    const on = <K extends keyof HTMLElementEventMap>(
      t: HTMLElement | Window,
      type: K,
      fn: (e: HTMLElementEventMap[K]) => void,
      opts?: AddEventListenerOptions,
    ) => {
      t.addEventListener(type, fn as EventListener, opts);
      this.disposers.push(() => t.removeEventListener(type, fn as EventListener, opts));
    };
    on(el, 'pointerdown', this.down);
    on(el, 'pointermove', this.move);
    on(el, 'pointerup', this.up);
    on(el, 'pointercancel', this.up);
    on(el, 'pointerleave', () => this.cb.onHoverEnd());
    on(el, 'wheel', this.wheel, { passive: false });
    on(el, 'contextmenu', (e) => e.preventDefault());
    on(window, 'keydown', this.keydown as never);
    on(window, 'keyup', this.keyup as never);
    on(window, 'blur', () => {
      this.keys.clear();
      this.applyKeys();
    });
  }

  dispose() {
    this.disposers.forEach((d) => d());
  }

  private get h() {
    return this.el.clientHeight || 1;
  }

  private down = (e: PointerEvent) => {
    this.el.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.moved = 0;
    this.downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.mode = 'pinch';
      this.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      this.pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      return;
    }
    const panMode = e.button === 2 || e.button === 1 || e.shiftKey || e.ctrlKey || e.metaKey;
    this.mode = panMode ? 'pan' : 'orbit';
    this.rig.stopInertia();
  };

  private move = (e: PointerEvent) => {
    const p = this.pointers.get(e.pointerId);
    if (!p) {
      if (e.pointerType !== 'touch') this.cb.onHover(e.clientX, e.clientY);
      return;
    }
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    this.moved += Math.abs(dx) + Math.abs(dy);
    if (this.moved > 4) this.cb.onDragState(true);
    this.lastMoveT = performance.now();

    if (this.mode === 'pinch' && this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (this.pinchDist > 0 && dist > 0) {
        this.rig.zoom(Math.log(this.pinchDist / dist) * 1.4, this.cb.zoomAnchor(this.ndc(mid.x, mid.y)));
      }
      this.rig.panDrag(mid.x - this.pinchMid.x, mid.y - this.pinchMid.y, this.h);
      this.pinchDist = dist;
      this.pinchMid = mid;
      return;
    }
    if (this.moved < 3) return;
    if (this.mode === 'orbit') this.rig.orbitDrag(dx, dy, this.h);
    else if (this.mode === 'pan') this.rig.panDrag(dx, dy, this.h);
  };

  private up = (e: PointerEvent) => {
    const had = this.pointers.has(e.pointerId);
    this.pointers.delete(e.pointerId);
    if (this.el.hasPointerCapture(e.pointerId)) this.el.releasePointerCapture(e.pointerId);
    if (!had) return;
    if (this.pointers.size === 1 && this.mode === 'pinch') {
      // continue as orbit with the remaining finger, without a jump
      this.mode = 'orbit';
      this.moved = 99;
      return;
    }
    if (this.pointers.size > 0) return;
    const wasMode = this.mode;
    this.mode = 'none';
    this.cb.onDragState(false);
    if (wasMode === 'orbit') this.rig.releaseOrbit((performance.now() - this.lastMoveT) / 1000);
    const dt = performance.now() - this.downAt.t;
    if (this.moved < 6 && dt < 500 && e.type === 'pointerup' && e.button === 0) {
      const now = performance.now();
      const dbl =
        now - this.lastClick.t < 380 && Math.hypot(e.clientX - this.lastClick.x, e.clientY - this.lastClick.y) < 12;
      if (dbl) {
        this.cb.onDoubleClick(e.clientX, e.clientY);
        this.lastClick.t = 0;
      } else {
        this.cb.onClick(e.clientX, e.clientY, e);
        this.lastClick = { t: now, x: e.clientX, y: e.clientY };
      }
    }
  };

  private ndc(x: number, y: number) {
    const r = this.el.getBoundingClientRect();
    return { x: ((x - r.left) / r.width) * 2 - 1, y: -(((y - r.top) / r.height) * 2 - 1) };
  }

  private wheel = (e: WheelEvent) => {
    e.preventDefault();
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16;
    else if (e.deltaMode === 2) dy *= 120;
    // ctrl+wheel is a trackpad pinch on most platforms: finer deltas, needs more gain
    const gain = e.ctrlKey ? 0.012 : 0.0019;
    const delta = THREE_clamp(dy * gain, -0.9, 0.9);
    this.rig.zoom(delta, this.cb.zoomAnchor(this.ndc(e.clientX, e.clientY)));
    // two-finger horizontal swipe on a trackpad orbits gently
    if (!e.ctrlKey && Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5 && e.deltaMode === 0) {
      this.rig.orbitDrag(-e.deltaX * 0.6, 0, this.h);
    }
  };

  private keydown = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (this.cb.onKey(e)) {
      e.preventDefault();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'q', 'e', 'r', 'f', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', '+', '=', '-', '_'].includes(k)) {
      this.keys.add(k);
      this.applyKeys();
      e.preventDefault();
    }
  };

  private keyup = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
    this.applyKeys();
  };

  private applyKeys() {
    const k = this.keys;
    const x = (k.has('d') ? 1 : 0) - (k.has('a') ? 1 : 0);
    const y = (k.has('r') ? 1 : 0) - (k.has('f') ? 1 : 0);
    const z = (k.has('w') ? 1 : 0) - (k.has('s') ? 1 : 0);
    this.rig.setMove(x, y, z);
    const yaw = (k.has('arrowleft') || k.has('q') ? 1 : 0) - (k.has('arrowright') || k.has('e') ? 1 : 0);
    this.rig.setRoll(yaw);
    const zoom = (k.has('-') || k.has('_') || k.has('arrowdown') ? 1 : 0) - (k.has('+') || k.has('=') || k.has('arrowup') ? 1 : 0);
    this.zoomKey = zoom;
  }

  zoomKey = 0;
  tick(dt: number) {
    if (this.zoomKey) this.rig.zoom(this.zoomKey * dt * 1.6);
  }
}

function THREE_clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}
