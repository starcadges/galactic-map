import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { search, type SearchEntry } from '../world';
import { engineRef } from './engineRef';

const KIND_LABEL: Record<SearchEntry['kind'], string> = {
  landmark: 'Place',
  charted: 'Charted',
  body: 'World',
  region: 'Region',
  event: 'Event',
  route: 'Route',
};

const SUGGEST = ['orrhune', 'calyx', 'ishmere', 'kettobe', 'elision', 'wanderers-mercy', 'breachlight', 'beacon-1288'];

export function Search() {
  const open = useStore((s) => s.searchOpen);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    if (q.trim()) return search(q, 9);
    return SUGGEST.map((id) => search(id, 30).find((r) => r.id === id)).filter(Boolean) as SearchEntry[];
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
      if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        useStore.setState({ searchOpen: true });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ('');
      setSel(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const choose = (r: SearchEntry) => {
    useStore.setState({ searchOpen: false });
    const e = engineRef.current;
    if (!e) return;
    if (r.kind === 'event') e.showEvent(r.id.slice(6));
    else e.select(r.id);
  };

  if (!open) return null;
  return (
    <div className="search-wrap" onMouseDown={(e) => e.target === e.currentTarget && useStore.setState({ searchOpen: false })}>
      <div className="search" role="dialog" aria-label="Search the atlas">
        <div className="search-row">
          <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
            <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            placeholder="Search places, worlds, routes, events…"
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSel((s) => Math.min(results.length - 1, s + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSel((s) => Math.max(0, s - 1));
              } else if (e.key === 'Enter' && results[sel]) {
                choose(results[sel]);
              } else if (e.key === 'Escape') {
                useStore.setState({ searchOpen: false });
              }
            }}
            aria-label="Search"
          />
          <kbd>esc</kbd>
        </div>
        <ul className="results" role="listbox">
          {!q.trim() && <li className="hint-row">Suggested destinations</li>}
          {results.map((r, i) => (
            <li key={r.id} role="option" aria-selected={i === sel}>
              <button className={i === sel ? 'on' : ''} onMouseEnter={() => setSel(i)} onClick={() => choose(r)}>
                <span className="rk">{KIND_LABEL[r.kind]}</span>
                <span className="rn">{r.name}</span>
                <span className="rs">{r.sub}</span>
              </button>
            </li>
          ))}
          {q.trim() && results.length === 0 && <li className="hint-row">Nothing in the register by that name.</li>}
        </ul>
      </div>
    </div>
  );
}
