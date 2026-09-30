import { useStore } from '../store';
import { ERAS, EVENTS, PRESENT_YEAR, fmtYear } from '../world/history';
import { engineRef } from './engineRef';

// A strip of the Wheel's history. Choosing an era re-lights the routes that
// existed then; choosing an event frames the places it happened.

const HEARTH_W = 0.04;
const x = (y: number) => (y <= 0 ? HEARTH_W * (1 + Math.max(y, -40_000) / 40_000) : HEARTH_W + (1 - HEARTH_W) * (y / PRESENT_YEAR));

export function Chronicle() {
  const open = useStore((s) => s.chronicleOpen);
  const era = useStore((s) => s.era);
  const active = useStore((s) => s.activeEventId);
  if (!open) return null;
  const eraObj = ERAS.find((e) => e.id === era);
  return (
    <div className="chronicle" aria-label="Chronicle">
      <div className="ch-head">
        <span className="ch-title">Chronicle of the Wheel</span>
        <span className="ch-note">{eraObj ? `${eraObj.name}: ${eraObj.blurb}` : 'Choose an era to see the routes that existed then, or an event to see where it happened.'}</span>
        <button className={`ch-now ${!era ? 'on' : ''}`} onClick={() => engineRef.current?.setEra(null)}>
          Present
        </button>
        <button className="pclose" onClick={() => useStore.setState({ chronicleOpen: false })} aria-label="Close chronicle">
          ×
        </button>
      </div>
      <div className="ch-track">
        {ERAS.map((e) => {
          const l = x(e.start);
          const r = x(e.end);
          return (
            <button
              key={e.id}
              className={`era ${era === e.id ? 'on' : ''}`}
              style={{ left: `${l * 100}%`, width: `${(r - l) * 100}%` }}
              onClick={() => engineRef.current?.setEra(era === e.id ? null : e.id)}
              title={`${e.name} (${fmtYear(e.start)} – ${fmtYear(e.end)})`}
            >
              <span>{e.name}</span>
            </button>
          );
        })}
        {EVENTS.map((ev) => (
          <button
            key={ev.id}
            className={`evt ${active === ev.id ? 'on' : ''}`}
            style={{ left: `${x(ev.year) * 100}%` }}
            onClick={() => engineRef.current?.showEvent(ev.id)}
            title={`${ev.yearLabel ?? fmtYear(ev.year)} — ${ev.title}`}
          >
            <i />
            <span className="evt-label">{ev.title}</span>
          </button>
        ))}
      </div>
      <div className="ch-scale">
        <span style={{ left: 0 }}>Hearthtime</span>
        {[8_000, 16_000, 24_000].map((y) => (
          <span key={y} style={{ left: `${x(y) * 100}%` }}>
            {y.toLocaleString('en-US')}
          </span>
        ))}
        <span style={{ right: 0, left: 'auto' }}>{PRESENT_YEAR.toLocaleString('en-US')} SR</span>
      </div>
    </div>
  );
}
