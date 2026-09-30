import { Fragment } from 'react';
import { go } from './engineRef';

// Renders lore text, turning [[id|label]] references into navigable links that
// move the camera through the same universe.

const RE = /\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;

export function RichText({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  RE.lastIndex = 0;
  while ((m = RE.exec(text))) {
    if (m.index > last) out.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>);
    const id = m[1];
    const label = m[2] ?? id;
    out.push(
      <button key={k++} className="xref" onClick={() => go(id)} title={id.startsWith('event:') ? 'Open this event' : 'Travel here'}>
        {label}
      </button>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  return <>{out}</>;
}

export function plain(text: string) {
  return text.replace(RE, (_, id, label) => label ?? id);
}
