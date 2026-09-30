import * as THREE from 'three';

// Spatial labels as pooled DOM elements. Each frame the engine offers candidates;
// the manager projects them, resolves collisions by priority, and eases opacity
// so labels emerge and recede rather than pop.

export type LabelClass = 'region' | 'landmark' | 'charted' | 'body' | 'extra' | 'route' | 'star' | 'minor';

export interface LabelCandidate {
  key: string;
  text: string;
  sub?: string;
  cls: LabelClass;
  world: THREE.Vector3;
  priority: number;
  alpha: number;
  pickId?: string;
  /** pixel offset from the anchor */
  dx?: number;
  dy?: number;
  tone?: string;
  emph?: boolean;
}

interface LabelEl {
  el: HTMLDivElement;
  a: number;
  target: number;
  x: number;
  y: number;
  w: number;
  h: number;
  lastSeen: number;
  text: string;
  sub: string;
  cls: LabelClass;
  tone: string;
  emph: boolean;
}

const EST_CHAR: Record<LabelClass, number> = {
  region: 13.5,
  landmark: 7.8,
  charted: 6.2,
  body: 6.4,
  extra: 7,
  route: 6,
  star: 6,
  minor: 6,
};
const EST_H: Record<LabelClass, number> = { region: 22, landmark: 30, charted: 14, body: 16, extra: 26, route: 14, star: 14, minor: 14 };

export class Labels {
  private root: HTMLElement;
  private els = new Map<string, LabelEl>();
  private cands: LabelCandidate[] = [];
  private v = new THREE.Vector3();
  private frame = 0;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  begin() {
    this.cands.length = 0;
  }

  /** global multiplier: labels emerge after the arrival flight */
  global = 1;

  add(c: LabelCandidate) {
    c.alpha *= this.global;
    if (c.alpha > 0.02) this.cands.push(c);
  }

  private blocked: [number, number, number, number][] = [];

  /** Screen regions occupied by the HUD; labels keep out of them. */
  private refreshBlocked() {
    this.blocked.length = 0;
    for (const sel of ['.topleft .wordmark', '.crumbs', '.topright', '.panel', '.readouts', '.chronicle', '.hint.on']) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0) this.blocked.push([r.left - 6, r.top - 4, r.width + 12, r.height + 8]);
    }
  }

  end(camera: THREE.Camera, w: number, h: number, dt: number) {
    this.frame++;
    if (this.frame % 15 === 1) this.refreshBlocked();
    const placed: [number, number, number, number][] = [...this.blocked];
    this.cands.sort((a, b) => b.priority - a.priority);
    const seen = new Set<string>();
    for (const c of this.cands) {
      this.v.copy(c.world).project(camera);
      if (this.v.z > 1 || this.v.z < -1) continue;
      const x = (this.v.x * 0.5 + 0.5) * w + (c.dx ?? 0);
      const y = (-this.v.y * 0.5 + 0.5) * h + (c.dy ?? 0);
      if (x < -150 || x > w + 150 || y < -40 || y > h + 40) continue;
      const lw = Math.max(c.text.length, (c.sub?.length ?? 0) * 0.8) * EST_CHAR[c.cls] + 12;
      const lh = EST_H[c.cls];
      // anchor: labels sit to the right of their point, regions are centred
      const rx = c.cls === 'region' ? x - lw / 2 : x;
      const ry = c.cls === 'region' ? y - lh / 2 : y - lh / 2;
      let hit = false;
      for (const r of placed) {
        if (rx < r[0] + r[2] && rx + lw > r[0] && ry < r[1] + r[3] && ry + lh > r[1]) {
          hit = true;
          break;
        }
      }
      if (hit) continue;
      placed.push([rx, ry, lw, lh]);
      seen.add(c.key);
      let L = this.els.get(c.key);
      if (!L) {
        const el = document.createElement('div');
        el.className = `lbl lbl-${c.cls}`;
        if (c.pickId) el.dataset.pick = c.pickId;
        this.root.appendChild(el);
        L = { el, a: 0, target: 0, x, y, w: lw, h: lh, lastSeen: this.frame, text: '', sub: '', cls: c.cls, tone: '', emph: false };
        this.els.set(c.key, L);
      }
      if (L.text !== c.text || L.sub !== (c.sub ?? '')) {
        L.text = c.text;
        L.sub = c.sub ?? '';
        L.el.innerHTML = L.sub ? `<span class="t">${esc(c.text)}</span><span class="s">${esc(L.sub)}</span>` : `<span class="t">${esc(c.text)}</span>`;
      }
      if (L.tone !== (c.tone ?? '')) {
        L.tone = c.tone ?? '';
        L.el.style.setProperty('--tone', L.tone || 'inherit');
      }
      if (L.emph !== !!c.emph) {
        L.emph = !!c.emph;
        L.el.classList.toggle('emph', L.emph);
      }
      L.x = x;
      L.y = y;
      L.target = Math.min(1, c.alpha);
      L.lastSeen = this.frame;
    }
    const k = 1 - Math.exp(-dt * 9);
    for (const [key, L] of this.els) {
      if (!seen.has(key)) L.target = 0;
      L.a += (L.target - L.a) * k;
      if (L.a < 0.01 && L.target === 0) {
        if (this.frame - L.lastSeen > 90) {
          L.el.remove();
          this.els.delete(key);
        } else if (L.el.style.visibility !== 'hidden') {
          L.el.style.visibility = 'hidden';
        }
        continue;
      }
      L.el.style.visibility = 'visible';
      L.el.style.opacity = L.a.toFixed(3);
      L.el.style.transform = `translate3d(${L.x.toFixed(1)}px, ${L.y.toFixed(1)}px, 0)`;
    }
  }

  clear() {
    for (const L of this.els.values()) L.el.remove();
    this.els.clear();
  }
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}
