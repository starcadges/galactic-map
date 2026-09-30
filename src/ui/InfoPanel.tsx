import { useMemo } from 'react';
import { Vector3 } from 'three';
import { useStore } from '../store';
import { engineRef, go } from './engineRef';
import { RichText } from './RichText';
import {
  CHARTED,
  CHARTED_BY_ID,
  FACTIONS,
  LANDMARKS,
  LANDMARK_BY_ID,
  REGION_BY_ID,
  ROMAN,
  bodyDef,
  bodyId,
  parseBody,
  systemFor,
} from '../world';
import { EVENT_BY_ID, EVENTS, ERAS, fmtYear } from '../world/history';
import { ROUTES, ROUTE_STYLE } from '../world/routes';
import { TYPE_LABEL, fmtPop } from '../world/procedural';
import { CULTURE_LABEL } from '../world/names';
import { kindOf, systemIdOf } from '../engine/Engine';
import { typeLabel } from '../engine/system/SystemView';
import type { Vec3 } from '../world/types';
import { factionAt } from '../world/territory';

function fmtLy(d: number): string {
  if (d >= 10_000) return `${(d / 1000).toFixed(d >= 100_000 ? 0 : 1)} kly`;
  if (d >= 10) return `${Math.round(d).toLocaleString('en-US')} ly`;
  if (d >= 1) return `${d.toFixed(1)} ly`;
  return `${(d * 63_241).toFixed(0)} AU`;
}

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function nearby(pos: Vec3, exclude: string, n = 6) {
  const out: { id: string; name: string; d: number; sub: string }[] = [];
  for (const l of LANDMARKS) if (l.id !== exclude) out.push({ id: l.id, name: l.name, d: dist(pos, l.pos), sub: l.category.split(' · ')[0] });
  out.sort((a, b) => a.d - b.d);
  const lms = out.slice(0, n);
  const cs: { id: string; name: string; d: number; sub: string }[] = [];
  for (const c of CHARTED) {
    const d = dist(pos, c.pos);
    if (d < 2_500 && c.id !== exclude) cs.push({ id: c.id, name: c.name, d, sub: TYPE_LABEL[c.type] });
  }
  cs.sort((a, b) => a.d - b.d);
  return { landmarks: lms, charted: cs.slice(0, 5) };
}

function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="facts">
      {rows.map(([k, v]) => (
        <div key={k} className="fact">
          <dt>{k}</dt>
          <dd>
            <RichText text={v} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function NearList({ pos, exclude }: { pos: Vec3; exclude: string }) {
  const near = useMemo(() => nearby(pos, exclude), [pos, exclude]);
  return (
    <section className="sec">
      <h4>Nearby</h4>
      <ul className="linklist">
        {near.charted.map((c) => (
          <li key={c.id}>
            <button onClick={() => go(c.id)}>
              <span className="nm">{c.name}</span>
              <span className="meta">{c.sub}</span>
              <span className="dist">{fmtLy(c.d)}</span>
            </button>
          </li>
        ))}
        {near.landmarks.map((c) => (
          <li key={c.id}>
            <button onClick={() => go(c.id)} className="major">
              <span className="nm">{c.name}</span>
              <span className="meta">{c.sub}</span>
              <span className="dist">{fmtLy(c.d)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Worlds({ sysId }: { sysId: string }) {
  const def = systemFor(sysId) ?? engineRef.current?.systemDef(sysId) ?? null;
  if (!def || !def.planets.length) return null;
  return (
    <section className="sec">
      <h4>Worlds</h4>
      <ul className="linklist worlds">
        {def.planets.map((p, i) => (
          <li key={i}>
            <button onClick={() => go(bodyId(sysId, i))}>
              <span className={`swatch t-${p.type}`} />
              <span className="nm">{p.name || `${ROMAN[i]}`}</span>
              <span className="meta">
                {typeLabel(p.type)}
                {p.moons?.length ? ` · ${p.moons.length} moon${p.moons.length > 1 ? 's' : ''}` : ''}
                {p.lights ? ' · inhabited' : ''}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Connections({ id }: { id: string }) {
  const rs = ROUTES.filter((r) => r.path.includes(id));
  if (!rs.length) return null;
  return (
    <section className="sec">
      <h4>Connections</h4>
      <ul className="linklist routes">
        {rs.map((r) => {
          const st = ROUTE_STYLE[r.cls];
          const others = r.path.filter((p): p is string => typeof p === 'string' && p !== id && !!LANDMARK_BY_ID[p]);
          return (
            <li key={r.id}>
              <button onClick={() => go(`route:${r.id}`)}>
                <span className="rline" style={{ background: st.color, opacity: st.dash ? 0.6 : 1 }} data-dash={st.dash > 0 ? 1 : 0} />
                <span className="nm">{r.name}</span>
                <span className="meta">
                  {st.label} · to {others.map((o) => LANDMARK_BY_ID[o].name).join(', ') || 'open space'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function FactionChip({ f }: { f: string }) {
  const fa = FACTIONS[f];
  if (!fa) return null;
  return (
    <span className="chip" style={{ ['--c' as string]: fa.color }} title={fa.blurb}>
      <i />
      {fa.short}
    </span>
  );
}

function Header({ kicker, title, sub, aliases, faction, onClose }: { kicker: string; title: string; sub?: string; aliases?: [string, string][]; faction?: string; onClose: () => void }) {
  return (
    <header className="phead">
      <div className="kicker">
        <span>{kicker}</span>
        {faction && <FactionChip f={faction} />}
      </div>
      <h2>{title}</h2>
      {sub && <div className="desig">{sub}</div>}
      {aliases && aliases.length > 0 && (
        <ul className="aliases">
          {aliases.map(([n, note]) => (
            <li key={n + note}>
              <b>{n}</b> <span>{note}</span>
            </li>
          ))}
        </ul>
      )}
      <button className="pclose" onClick={onClose} aria-label="Close panel">
        ×
      </button>
    </header>
  );
}

function LandmarkPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const l = LANDMARK_BY_ID[id];
  const region = REGION_BY_ID[l.region];
  const events = EVENTS.filter((e) => e.places.includes(id));
  const facts: [string, string][] = [['Region', region?.name ?? '—'], ...(l.population ? ([['Population', l.population]] as [string, string][]) : []), ...l.facts];
  return (
    <>
      <Header kicker={l.category} title={l.name} sub={l.designation} aliases={l.aliases} faction={l.faction} onClose={onClose} />
      <div className="pbody">
        <p className="lede">
          <RichText text={l.summary} />
        </p>
        {l.warning && (
          <div className="warn">
            <span>Advisory</span> {l.warning}
          </div>
        )}
        <Facts rows={facts} />
        {l.sections?.map((s) => (
          <section className="sec" key={s.title}>
            <h4>{s.title}</h4>
            <p>
              <RichText text={s.body} />
            </p>
          </section>
        ))}
        {l.chronology && (
          <section className="sec">
            <h4>Chronology</h4>
            <ol className="chrono">
              {l.chronology.map((c, i) => (
                <li key={i}>
                  <span className="yr">{c.y}</span>
                  <span>
                    <RichText text={c.t} />
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}
        {events.length > 0 && (
          <section className="sec">
            <h4>In the Chronicle</h4>
            <ul className="linklist">
              {events.map((e) => (
                <li key={e.id}>
                  <button onClick={() => engineRef.current?.showEvent(e.id)}>
                    <span className="nm">{e.title}</span>
                    <span className="dist">{e.yearLabel ?? fmtYear(e.year)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {l.trivia?.map((t, i) => (
          <p className="trivia" key={i}>
            {t}
          </p>
        ))}
        <Worlds sysId={id} />
        <Connections id={id} />
        <NearList pos={l.pos} exclude={id} />
        {l.tags && (
          <div className="tags">
            {l.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ChartedPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const c = CHARTED_BY_ID[id];
  const rid = engineRef.current?.regionAt(new Vector3(...c.pos), 1) ?? null;
  const region = rid ? REGION_BY_ID[rid] : null;
  const facts: [string, string][] = [
    ['Classification', TYPE_LABEL[c.type]],
    ['Region', region ? `[[region:${region.id}|${region.name}]]` : '—'],
    ['Star', `${c.starKind === 'RG' ? 'Red giant' : c.starKind === 'WD' ? 'White dwarf' : `${c.starKind}-class`} · ${Math.round(c.temp).toLocaleString('en-US')} K`],
    ['Population', c.population > 0 ? fmtPop(c.population) : 'Uninhabited'],
    ['Allegiance', FACTIONS[c.faction]?.name ?? 'Unclaimed'],
    ['Settled', c.settled !== null ? fmtYear(c.settled) : '—'],
    ['Naming', CULTURE_LABEL[c.culture]],
  ];
  return (
    <>
      <Header kicker="Charted system" title={c.name} sub={c.designation} faction={c.faction} onClose={onClose} />
      <div className="pbody">
        <p className="lede">{c.summary}</p>
        <p className="detail">{c.detail}</p>
        <Facts rows={facts} />
        <Worlds sysId={id} />
        <NearList pos={c.pos} exclude={id} />
      </div>
    </>
  );
}

const CATALOG_LEDES = [
  'One of the uncounted billions. It has a register entry, a class, and — so far as anyone knows — nothing else.',
  'A star the Weft has never needed. Its light reaches the charts; nobody has followed it back.',
  'Catalogued by an automated survey and never looked at again. The register lists it the way a library lists an unread book.',
  'No name, no claim, no thread. The nearest anchor is a long tug away, and no one has thought the trip worth it.',
  'Seen from every nearby system, visited from none. Pilots use it to check their bearings.',
  'The register holds four billion entries like this one. The Office of the Weft estimates it has looked at nine per cent.',
];

function CatalogPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const c = engineRef.current?.catalog.get(id);
  if (!c) return null;
  const f = factionAt(c.pos[0], c.pos[2]).faction;
  const worlds = engineRef.current?.systemDef(id)?.planets.length ?? 0;
  const facts: [string, string][] = [
    ['Class', `${c.kind === 'RG' ? 'Giant' : c.kind === 'WD' ? 'White dwarf' : `${c.kind}-class`} · ${Math.round(c.temp).toLocaleString('en-US')} K`],
    ['Register', c.surveyed ? `Surveyed ${fmtYear(c.surveyed)}` : 'Listed, never surveyed'],
    ['Worlds', worlds ? `${worlds} observed; none named` : 'None observed'],
    ['Claimed by', FACTIONS[f]?.name ?? 'Unclaimed'],
  ];
  return (
    <>
      <Header kicker="Catalogue star" title={c.designation} sub="Plenary star register · no settlement" faction={f} onClose={onClose} />
      <div className="pbody">
        <p className="lede">{CATALOG_LEDES[c.seed % CATALOG_LEDES.length]}</p>
        <p className="detail">{c.note}</p>
        <Facts rows={facts} />
        <Worlds sysId={id} />
        <NearList pos={c.pos} exclude={id} />
      </div>
    </>
  );
}

function BodyPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const b = bodyDef(id);
  const pb = parseBody(id)!;
  if (!b) return null;
  const sysName = LANDMARK_BY_ID[pb.sys]?.name ?? CHARTED_BY_ID[pb.sys]?.name ?? engineRef.current?.catalog.get(pb.sys)?.designation ?? 'this system';
  const body = b.moon ?? b.planet;
  const info = body.info;
  const facts: [string, string][] = [
    ['System', `[[${pb.sys}|${sysName}]]`],
    ['Type', typeLabel(body.type)],
    ...(b.moon ? ([['Orbits', `[[${bodyId(pb.sys, pb.p)}|${b.planet.name}]]`]] as [string, string][]) : []),
    ...(info?.population ? ([['Population', info.population]] as [string, string][]) : []),
    ...(!info?.population && (body.lights ?? 0) > 0 ? ([['Population', 'Inhabited']] as [string, string][]) : []),
    ...(info?.facts ?? []),
  ];
  return (
    <>
      <Header kicker={b.moon ? 'Moon' : 'World'} title={body.name || 'Unnamed body'} sub={`${sysName} ${b.moon ? '· satellite' : `· orbit ${pb.p + 1}`}`} onClose={onClose} />
      <div className="pbody">
        <p className="lede">{info?.summary ?? defaultBodyText(body.type, (body.lights ?? 0) > 0)}</p>
        <Facts rows={facts} />
        {!b.moon && b.planet.moons && b.planet.moons.length > 0 && (
          <section className="sec">
            <h4>Moons</h4>
            <ul className="linklist worlds">
              {b.planet.moons.map((m, j) => (
                <li key={j}>
                  <button onClick={() => go(bodyId(pb.sys, pb.p, j))}>
                    <span className={`swatch t-${m.type}`} />
                    <span className="nm">{m.name || `${b.planet.name} ${'abcdefg'[j]}`}</span>
                    <span className="meta">{typeLabel(m.type)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="sec">
          <button className="backto" onClick={() => go(pb.sys)}>
            ← Back to {sysName}
          </button>
        </section>
      </div>
    </>
  );
}

function defaultBodyText(t: string, inhabited: boolean) {
  const base: Record<string, string> = {
    gas: 'A gas giant: banded, stormy, and useful mainly for its moons and its hydrogen.',
    icegiant: 'An ice giant, cold and blue-grey, wrapped in methane haze.',
    barren: 'Airless rock, cratered by the long history of its system.',
    ice: 'A frozen world under a shell of ice.',
    lava: 'A world too close to its star, its crust never fully set.',
    desert: 'A dry world of dunes and wind-scoured plateaus.',
    terran: 'A temperate world with seas and weather.',
    ocean: 'Almost entirely ocean.',
    toxic: 'A world wrapped in poisonous cloud.',
    garden: 'A green, living world.',
  };
  return (base[t] ?? 'A world.') + (inhabited ? ' Its night side carries the lights of settlement.' : '');
}

function RegionPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const r = REGION_BY_ID[id.slice(7)];
  const lms = LANDMARKS.filter((l) => l.region === r.id);
  return (
    <>
      <Header kicker="Region" title={r.name} sub={r.aliases} onClose={onClose} />
      <div className="pbody">
        <p className="lede">{r.blurb}</p>
        {lms.length > 0 && (
          <section className="sec">
            <h4>Notable places</h4>
            <ul className="linklist">
              {lms.map((l) => (
                <li key={l.id}>
                  <button onClick={() => go(l.id)} className={l.rank === 1 ? 'major' : ''}>
                    <span className="nm">{l.name}</span>
                    <span className="meta">{l.category.split(' · ')[0]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

function RoutePanel({ id, onClose }: { id: string; onClose: () => void }) {
  const r = ROUTES.find((x) => x.id === id.slice(6));
  if (!r) return null;
  const st = ROUTE_STYLE[r.cls];
  const stops = r.path.filter((p): p is string => typeof p === 'string' && !!LANDMARK_BY_ID[p]);
  const facts: [string, string][] = [
    ['Class', st.label],
    ['Status', r.status],
    ...(r.built ? ([['Built', r.built]] as [string, string][]) : []),
    ['Traffic', r.traffic > 0.8 ? 'Very heavy' : r.traffic > 0.5 ? 'Heavy' : r.traffic > 0.2 ? 'Moderate' : r.traffic > 0.01 ? 'Light' : 'None'],
  ];
  return (
    <>
      <Header kicker="Route" title={r.name} sub={st.label} onClose={onClose} />
      <div className="pbody">
        <p className="lede">{st.desc}</p>
        {r.note && <p className="detail">{r.note}</p>}
        <Facts rows={facts} />
        <button className="action" onClick={() => engineRef.current?.followRoute(r.id)}>
          <span>Follow this {r.cls === 'songline' ? 'songline' : r.cls === 'vey' || r.cls === 'longway' || r.cls === 'sail' ? 'road' : 'thread'}</span>
          <i>→</i>
        </button>
        <section className="sec">
          <h4>Stops</h4>
          <ol className="stops">
            {stops.map((s) => (
              <li key={s}>
                <button onClick={() => go(s)}>{LANDMARK_BY_ID[s].name}</button>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}

function EventPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const e = EVENT_BY_ID[id.slice(6)];
  if (!e) return null;
  const era = ERAS.find((x) => x.id === e.era);
  const idx = EVENTS.indexOf(e);
  const prev = EVENTS[idx - 1];
  const next = EVENTS[idx + 1];
  return (
    <>
      <Header kicker={`Chronicle · ${era?.name ?? ''}`} title={e.title} sub={e.yearLabel ?? fmtYear(e.year)} onClose={onClose} />
      <div className="pbody">
        <p className="lede">
          <RichText text={e.text} />
        </p>
        <section className="sec">
          <h4>Places</h4>
          <ul className="linklist">
            {e.places
              .filter((p) => LANDMARK_BY_ID[p])
              .map((p) => (
                <li key={p}>
                  <button onClick={() => go(p)} className="major">
                    <span className="nm">{LANDMARK_BY_ID[p].name}</span>
                    <span className="meta">{LANDMARK_BY_ID[p].category.split(' · ')[0]}</span>
                  </button>
                </li>
              ))}
          </ul>
        </section>
        {era && <p className="detail">{era.blurb}</p>}
        <div className="evnav">
          {prev ? <button onClick={() => engineRef.current?.showEvent(prev.id)}>← {prev.title}</button> : <span />}
          {next ? <button onClick={() => engineRef.current?.showEvent(next.id)}>{next.title} →</button> : <span />}
        </div>
      </div>
    </>
  );
}

function StarPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const sys = systemIdOf(id)!;
  const i = Number(id.split('|')[2]);
  const def = systemFor(sys) ?? engineRef.current?.systemDef(sys);
  const s = def?.stars[i];
  const name = LANDMARK_BY_ID[sys]?.name ?? CHARTED_BY_ID[sys]?.name ?? '';
  if (!s) return null;
  return (
    <>
      <Header kicker="Star" title={`${name} ${def!.stars.length > 1 ? 'ABC'[i] : ''}`} sub={`${s.kind}-class · ${Math.round(s.temp).toLocaleString('en-US')} K`} onClose={onClose} />
      <div className="pbody">
        <Facts rows={[['System', `[[${sys}|${name}]]`]]} />
      </div>
    </>
  );
}

export function InfoPanel() {
  const id = useStore((s) => s.selectedId);
  const open = useStore((s) => s.panelOpen);
  const close = () => {
    useStore.setState({ panelOpen: false });
  };
  if (!id || !open) return null;
  const k = kindOf(id);
  let body: React.ReactNode = null;
  if (k === 'landmark' && LANDMARK_BY_ID[id]) body = <LandmarkPanel id={id} onClose={close} />;
  else if (k === 'charted' && CHARTED_BY_ID[id]) body = <ChartedPanel id={id} onClose={close} />;
  else if (k === 'catalog') body = <CatalogPanel id={id} onClose={close} />;
  else if (k === 'body') body = <BodyPanel id={id} onClose={close} />;
  else if (k === 'region') body = <RegionPanel id={id} onClose={close} />;
  else if (k === 'route') body = <RoutePanel id={id} onClose={close} />;
  else if (k === 'event') body = <EventPanel id={id} onClose={close} />;
  else if (k === 'star') body = <StarPanel id={id} onClose={close} />;
  if (!body) return null;
  return (
    <aside className="panel" key={id} aria-label="Location details">
      {body}
    </aside>
  );
}

export { fmtLy };
