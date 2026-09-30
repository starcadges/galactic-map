import { useEffect, useRef, useState } from 'react';
import { useStore, type LabelMode } from '../store';
import { engineRef, go } from './engineRef';
import { CHARTED_BY_ID, LANDMARK_BY_ID, REGION_BY_ID, bodyDef, parseBody } from '../world';
import { kindOf, systemIdOf } from '../engine/Engine';
import { fmtLy } from './InfoPanel';
import { setSound, chime } from './sound';
import { PRESENT_YEAR } from '../world/history';
import { ROUTE_STYLE } from '../world/routes';
import { FACTIONS } from '../world/polities';

// ---------------------------------------------------------------------------
// Wordmark and breadcrumbs: where you are, and the way back out.

export function Breadcrumbs() {
  const sel = useStore((s) => s.selectedId);
  const regionId = useStore((s) => s.view.regionId);
  const scale = useStore((s) => s.view.scaleName);
  const crumbs: { label: string; onClick: () => void; cur?: boolean }[] = [
    { label: 'Andromeda', onClick: () => engineRef.current?.home() },
  ];
  let rid = regionId;
  const k = sel ? kindOf(sel) : null;
  const sys = sel ? systemIdOf(sel) : null;
  if (sys && LANDMARK_BY_ID[sys]) rid = LANDMARK_BY_ID[sys].region;
  if (sel && k === 'region') rid = sel.slice(7);
  if (rid && REGION_BY_ID[rid]) {
    const r = REGION_BY_ID[rid];
    crumbs.push({ label: r.name, onClick: () => engineRef.current?.select(`region:${r.id}`) });
  }
  if (sys) {
    const name = LANDMARK_BY_ID[sys]?.name ?? CHARTED_BY_ID[sys]?.name ?? engineRef.current?.catalog.get(sys)?.designation ?? 'System';
    crumbs.push({ label: name, onClick: () => go(sys) });
  }
  if (sel && k === 'body') {
    const b = bodyDef(sel);
    const pb = parseBody(sel)!;
    if (b?.moon) crumbs.push({ label: b.planet.name, onClick: () => go(`b|${pb.sys}|${pb.p}`) });
    crumbs.push({ label: (b?.moon ?? b?.planet)?.name ?? 'World', onClick: () => go(sel) });
  }
  crumbs[crumbs.length - 1].cur = true;
  return (
    <div className="topleft">
      <div className="wordmark" onClick={() => engineRef.current?.home()} role="button" tabIndex={0} title="Return to the whole galaxy (H)">
        <span className="wm-title">Andromeda</span>
        <span className="wm-sub">Anaheth · the Wide Wheel · an atlas</span>
      </div>
      <nav className="crumbs" aria-label="Location">
        {crumbs.map((c, i) => (
          <span key={i} className="crumb">
            {i > 0 && <span className="sep">›</span>}
            <button className={c.cur ? 'cur' : ''} onClick={c.onClick}>
              {c.label}
            </button>
          </span>
        ))}
        <span className="scale-tag">{scale}</span>
      </nav>
    </div>
  );
}

// ---------------------------------------------------------------------------

const LABEL_MODES: LabelMode[] = ['all', 'major', 'none'];

export function Controls() {
  const s = useStore();
  const [layersOpen, setLayersOpen] = useState(false);
  useEffect(() => {
    if (!layersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLayersOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest('.layers')) setLayersOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [layersOpen]);
  return (
    <div className="topright">
      <button className="ctl search-btn" onClick={() => useStore.setState({ searchOpen: true })} title="Search (/ or Ctrl+K)">
        <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden>
          <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        <span>Search the atlas</span>
        <kbd>/</kbd>
      </button>
      <button className={`ctl ${s.chronicleOpen ? 'on' : ''}`} onClick={() => useStore.setState({ chronicleOpen: !s.chronicleOpen })} title="History of the Wheel">
        Chronicle
      </button>
      <div className="layers">
        <button className={`ctl ${layersOpen ? 'on' : ''}`} onClick={() => setLayersOpen(!layersOpen)} aria-expanded={layersOpen}>
          Layers
        </button>
        {layersOpen && (
          <div className="layer-menu">
            <label>
              <input type="checkbox" checked={s.showRoutes} onChange={(e) => useStore.setState({ showRoutes: e.target.checked })} />
              Threads &amp; routes
            </label>
            <label>
              <input type="checkbox" checked={s.showTraffic} onChange={(e) => useStore.setState({ showTraffic: e.target.checked })} />
              Traffic
            </label>
            <label>
              <input type="checkbox" checked={s.showTerritories} onChange={(e) => useStore.setState({ showTerritories: e.target.checked })} />
              Territories
            </label>
            <div className="seg">
              <span>Labels</span>
              {LABEL_MODES.map((m) => (
                <button key={m} className={s.labels === m ? 'on' : ''} onClick={() => useStore.setState({ labels: m })}>
                  {m}
                </button>
              ))}
            </div>
            <div className="seg">
              <span>Quality</span>
              {(['high', 'balanced'] as const).map((q) => (
                <button key={q} className={s.quality === q ? 'on' : ''} onClick={() => engineRef.current?.setQuality(q)}>
                  {q}
                </button>
              ))}
            </div>
            <label>
              <input type="checkbox" checked={s.reducedMotion} onChange={(e) => useStore.setState({ reducedMotion: e.target.checked })} />
              Reduced motion
            </label>
            <Legend />
          </div>
        )}
      </div>
      <button
        className={`ctl icon ${s.sound ? 'on' : ''}`}
        onClick={() => {
          const on = !s.sound;
          setSound(on);
          useStore.setState({ sound: on });
          if (on) setTimeout(() => chime('open'), 400);
        }}
        title={s.sound ? 'Mute ambient sound' : 'Play ambient sound'}
        aria-pressed={s.sound}
      >
        {s.sound ? (
          <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
            <path d="M2 6h3l4-3v10L5 10H2z" fill="currentColor" />
            <path d="M11 5.5c1 1.2 1 3.8 0 5M13 4c1.8 2 1.8 6 0 8" stroke="currentColor" fill="none" strokeWidth="1.1" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
            <path d="M2 6h3l4-3v10L5 10H2z" fill="currentColor" />
            <path d="M11 6l4 4M15 6l-4 4" stroke="currentColor" strokeWidth="1.1" />
          </svg>
        )}
      </button>
      <button className="ctl icon" onClick={() => useStore.setState({ helpOpen: !s.helpOpen })} title="How to navigate">
        ?
      </button>
    </div>
  );
}

function Legend() {
  return (
    <div className="legend">
      <div className="lg-h">Routes</div>
      {Object.values(ROUTE_STYLE).map((r) => (
        <div key={r.label} className="lg-row" title={r.desc}>
          <span className="rline" style={{ background: r.color }} data-dash={r.dash > 0 ? 1 : 0} />
          {r.label}
        </div>
      ))}
      <div className="lg-h">Polities</div>
      {['plenary', 'hallowmere', 'leagues', 'tethri', 'ninefold', 'qesh', 'exclusion'].map((f) => (
        <div key={f} className="lg-row" title={FACTIONS[f].blurb}>
          <span className="dot" style={{ background: FACTIONS[f].color }} />
          {FACTIONS[f].name}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scale ladder: the hierarchy of scales, and a way to jump between them.

const RUNGS: [string, number][] = [
  ['Galaxy', 260_000],
  ['Region', 45_000],
  ['Sector', 6_000],
  ['Neighbourhood', 400],
  ['Local', 25],
  ['System', 2.4],
  ['Orbit', 0.05],
];
const LMAX = Math.log(900_000);
const LMIN = Math.log(0.002);

export function ScaleLadder() {
  const D = useStore((s) => s.view.distance);
  const f = (d: number) => 1 - (Math.log(d) - LMIN) / (LMAX - LMIN);
  return (
    <div className="ladder" aria-label="Scale">
      <div className="rail" />
      {RUNGS.map(([n, d]) => (
        <button
          key={n}
          className="rung"
          style={{ top: `${f(d) * 100}%` }}
          onClick={() => {
            const e = engineRef.current;
            if (!e) return;
            e.rig.zoom(Math.log(d / e.rig.logGoalDistance()));
          }}
          title={`Zoom to ${n.toLowerCase()} scale`}
        >
          <i />
          <span>{n}</span>
        </button>
      ))}
      <div className="cursor" style={{ top: `${Math.min(1, Math.max(0, f(D))) * 100}%` }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Readouts: span, position, and the Standard Reckoning.

export function Readouts() {
  const view = useStore((s) => s.view);
  const sel = useStore((s) => s.selectedId);
  const [clock, setClock] = useState('');
  const [local, setLocal] = useState('');
  useEffect(() => {
    const id = setInterval(() => {
      const e = engineRef.current;
      if (!e) return;
      const hours = 131 * 24 + 9.3 + e.simTime; // one standard hour per second
      const day = Math.floor(hours / 24) % 365;
      const h = Math.floor(hours % 24);
      const m = Math.floor((hours * 60) % 60);
      setClock(`${PRESENT_YEAR.toLocaleString('en-US')} SR · day ${day + 1} · ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      const sys = useStore.getState().selectedId ? systemIdOf(useStore.getState().selectedId!) : null;
      const lm = sys ? LANDMARK_BY_ID[sys] : null;
      if (lm?.localDay) {
        const lh = (((e.simTime + Math.abs(lm.pos[0]) % 97) % lm.localDay.hours) + lm.localDay.hours) % lm.localDay.hours;
        const lhh = Math.floor(lh);
        const lmm = Math.floor((lh * 60) % 60);
        setLocal(`${lm.name} · ${lm.localDay.name} ${String(lhh).padStart(2, '0')}:${String(lmm).padStart(2, '0')}`);
      } else setLocal('');
    }, 250);
    return () => clearInterval(id);
  }, [sel]);
  const [x, y, z] = view.target;
  const r = Math.hypot(x, z);
  const th = ((Math.atan2(z, x) * 180) / Math.PI + 360) % 360;
  const span = view.distance * 2 * Math.tan((25 * Math.PI) / 180);
  return (
    <div className="readouts">
      <div className="ro-row">
        <span className="ro-k">View</span>
        <span className="ro-v">{fmtLy(span)} across</span>
      </div>
      <div className="ro-row">
        <span className="ro-k">Focus</span>
        <span className="ro-v">
          r {(r / 1000).toFixed(r < 10_000 ? 2 : 1)} kly · θ {th.toFixed(1)}° · z {y >= 0 ? '+' : '−'}
          {Math.abs(y) < 1000 ? `${Math.abs(y).toFixed(0)} ly` : `${(Math.abs(y) / 1000).toFixed(1)} kly`}
        </span>
      </div>
      <div className="ro-row">
        <span className="ro-k">Reckoning</span>
        <span className="ro-v">{clock}</span>
      </div>
      {local && (
        <div className="ro-row">
          <span className="ro-k">Local</span>
          <span className="ro-v">{local}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function Hint() {
  const [show, setShow] = useState(true);
  const ready = useStore((s) => s.ready);
  useEffect(() => {
    if (!ready) return;
    const hide = () => setTimeout(() => setShow(false), 2500);
    const t = setTimeout(() => setShow(false), 22_000);
    window.addEventListener('pointerdown', hide, { once: true });
    window.addEventListener('wheel', hide, { once: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointerdown', hide);
      window.removeEventListener('wheel', hide);
    };
  }, [ready]);
  return (
    <div className={`hint ${show && ready ? 'on' : ''}`} aria-hidden={!show}>
      <span>
        <b>drag</b> orbit
      </span>
      <span>
        <b>scroll</b> zoom
      </span>
      <span>
        <b>right-drag</b> pan
      </span>
      <span>
        <b>click</b> a light to travel
      </span>
      <span>
        <b>esc</b> step back
      </span>
    </div>
  );
}

export function Tooltip() {
  const hover = useStore((s) => s.hover);
  const sel = useStore((s) => s.selectedId);
  if (!hover) return null;
  const isSel = hover.id === sel;
  const x = Math.min(hover.x + 16, window.innerWidth - 300);
  const y = Math.min(hover.y + 14, window.innerHeight - 90);
  return (
    <div className="tooltip" style={{ transform: `translate(${x}px, ${y}px)` }}>
      <div className="tt-kind">{hover.kind}</div>
      <div className="tt-name">{hover.name}</div>
      {hover.sub && <div className="tt-sub">{hover.sub}</div>}
      {hover.distanceLy !== undefined && hover.distanceLy > 0.5 && <div className="tt-dist">{fmtLy(hover.distanceLy)} from current focus</div>}
      {!isSel && <div className="tt-act">{hover.kind === 'route' ? 'click for route details' : 'click to travel'}</div>}
    </div>
  );
}

/** Animated reticle around the selected object, positioned every frame. */
export function Reticle() {
  const ref = useRef<HTMLDivElement>(null);
  const sel = useStore((s) => s.selectedId);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = ref.current;
      const e = engineRef.current;
      if (!el || !e || !sel) return;
      const k = kindOf(sel);
      if (k === 'region' || k === 'route' || k === 'event') {
        el.style.opacity = '0';
        return;
      }
      const s = e.screenOf(sel);
      if (!s || !s.visible) {
        el.style.opacity = '0';
        return;
      }
      const size = Math.max(26, Math.min(s.r * 2.6 + 18, 320));
      el.style.opacity = s.r * 2 > Math.min(window.innerWidth, window.innerHeight) * 0.6 ? '0' : '1';
      el.style.transform = `translate(${s.x - size / 2}px, ${s.y - size / 2}px)`;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sel]);
  if (!sel) return null;
  return (
    <div className="reticle" ref={ref} aria-hidden>
      <i className="c tl" />
      <i className="c tr" />
      <i className="c bl" />
      <i className="c br" />
    </div>
  );
}

export function Help() {
  const open = useStore((s) => s.helpOpen);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') useStore.setState({ helpOpen: false });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (!open) return null;
  return (
    <div className="help" role="dialog" aria-label="Navigation help">
      <button className="pclose" onClick={() => useStore.setState({ helpOpen: false })} aria-label="Close help">
        ×
      </button>
      <h3>Moving through the Wheel</h3>
      <dl>
        <dt>Orbit</dt>
        <dd>Drag with the left button or one finger</dd>
        <dt>Zoom</dt>
        <dd>Scroll, pinch, or +/−. Zoom follows the cursor unless something is focused.</dd>
        <dt>Pan</dt>
        <dd>Right-drag, Shift-drag, or two fingers. W A S D fly, R F rise and fall, Q E turn.</dd>
        <dt>Travel</dt>
        <dd>Click any marker, star, world, label or underlined name. Double-click empty space to dive toward it.</dd>
        <dt>Step back</dt>
        <dd>Esc climbs one level; H returns to the whole galaxy. The breadcrumb and the scale ladder do the same.</dd>
        <dt>Find</dt>
        <dd>/ or Ctrl+K searches places, worlds, routes and history.</dd>
      </dl>
      <p>
        Every star in view is real to the atlas: named places carry their histories, charted systems their registers, and the uncounted
        others at least a catalogue number. Scale is continuous — the system you are orbiting is also one point in the galaxy.
      </p>
    </div>
  );
}
