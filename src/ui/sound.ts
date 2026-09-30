// A restrained, optional soundscape synthesised in the browser: a low, slowly
// breathing drone and soft interface tones. Never starts without a user action.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let started = false;

function build() {
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 420;
  lp.Q.value = 0.4;
  lp.connect(master);

  // drone: a fifth and an octave, slightly detuned, each gently amplitude-modulated
  const freqs = [55, 82.4, 110.2, 164.6];
  freqs.forEach((f, i) => {
    const o = ctx!.createOscillator();
    o.type = i % 2 ? 'sine' : 'triangle';
    o.frequency.value = f * (1 + (i - 1.5) * 0.0015);
    const g = ctx!.createGain();
    g.gain.value = 0.05 / (i + 1);
    const lfo = ctx!.createOscillator();
    lfo.frequency.value = 0.03 + i * 0.017;
    const lg = ctx!.createGain();
    lg.gain.value = 0.02 / (i + 1);
    lfo.connect(lg);
    lg.connect(g.gain);
    o.connect(g);
    g.connect(lp);
    o.start();
    lfo.start();
  });

  // faint filtered noise: the hiss of the Chorus
  const len = ctx.sampleRate * 3;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
  const n = ctx.createBufferSource();
  n.buffer = buf;
  n.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 900;
  bp.Q.value = 0.7;
  const ng = ctx.createGain();
  ng.gain.value = 0.012;
  n.connect(bp);
  bp.connect(ng);
  ng.connect(master);
  n.start();
}

export function setSound(on: boolean) {
  if (on && !started) {
    build();
    started = true;
  }
  if (!ctx || !master) return;
  if (on && ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setTargetAtTime(on ? 0.55 : 0, t, on ? 1.2 : 0.25);
}

export function chime(kind: 'select' | 'arrive' | 'open' = 'select') {
  if (!ctx || !master || master.gain.value < 0.05) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  const base = kind === 'select' ? 660 : kind === 'arrive' ? 440 : 520;
  o.frequency.setValueAtTime(base, t);
  o.frequency.exponentialRampToValueAtTime(base * (kind === 'arrive' ? 0.75 : 1.5), t + 0.35);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + 1);
}
