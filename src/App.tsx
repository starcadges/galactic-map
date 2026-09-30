import { useEffect, useRef, useState } from 'react';
import { Engine } from './engine/Engine';
import { useStore } from './store';
import { engineRef } from './ui/engineRef';
import { InfoPanel } from './ui/InfoPanel';
import { Search } from './ui/Search';
import { Breadcrumbs, Controls, Help, Hint, Readouts, Reticle, ScaleLadder, Tooltip } from './ui/Hud';
import { Chronicle } from './ui/Chronicle';
import { chime } from './ui/sound';

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

export function App() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const ready = useStore((s) => s.ready);
  const err = useStore((s) => s.webglError);
  const panelOpen = useStore((s) => s.panelOpen);
  const selected = useStore((s) => s.selectedId);
  const chronicle = useStore((s) => s.chronicleOpen);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (!stage.current || !canvas.current || !labels.current) return;
    if (!webglAvailable()) {
      useStore.setState({ webglError: 'This atlas needs WebGL 2, which this browser or device has not made available.' });
      return;
    }
    let e: Engine | null = null;
    // let the loading veil paint before the galaxy is generated
    const t = setTimeout(() => {
      try {
        e = new Engine(stage.current!, canvas.current!, labels.current!);
        engineRef.current = e;
        (window as unknown as { __engine: Engine }).__engine = e;
        e.start();
        useStore.setState({ ready: true });
        requestAnimationFrame(() => setFadeIn(true));
      } catch (ex) {
        console.error(ex);
        useStore.setState({ webglError: `The cartographic engine failed to start: ${(ex as Error).message}` });
      }
    }, 60);
    const lost = (ev: Event) => {
      ev.preventDefault();
      useStore.setState({ webglError: 'The graphics context was lost. Reload the page to restore the atlas.' });
    };
    canvas.current.addEventListener('webglcontextlost', lost);
    return () => {
      clearTimeout(t);
      e?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (selected) chime('select');
  }, [selected]);

  return (
    <div className={`app ${chronicle ? 'with-chronicle' : ''}`}>
      <div className="stage" ref={stage}>
        <canvas ref={canvas} className={fadeIn ? 'in' : ''} />
        <div className="labels" ref={labels} />
      </div>
      {ready && (
        <>
          <Reticle />
          <Breadcrumbs />
          <Controls />
          <ScaleLadder />
          <Readouts />
          <Hint />
          <Tooltip />
          <Chronicle />
          <InfoPanel />
          {selected && !panelOpen && (
            <button className="panel-tab" onClick={() => useStore.setState({ panelOpen: true })}>
              Details
            </button>
          )}
          <Search />
          <Help />
        </>
      )}
      <div className={`veil ${ready ? 'gone' : ''}`}>
        <div className="veil-inner">
          <div className="veil-title">Andromeda</div>
          <div className="veil-sub">{err ?? 'charting the Wide Wheel'}</div>
          {!err && <div className="veil-bar" />}
        </div>
      </div>
      {err && ready && <div className="error-banner">{err}</div>}
    </div>
  );
}
