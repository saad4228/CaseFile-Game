import { getSettings } from "./settings";

// Atmospheric sound, synthesised with WebAudio — no audio files to load. Every effect is
// short and quiet, fires only in response to something the player did, and is skipped
// entirely when sound is off.

export type Cue = "paper" | "type" | "shutter" | "stamp" | "thread" | "reveal" | "tick" | "pin" | "unpin";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let rain: { stop: () => void } | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}

function noise(c: AudioContext) {
  if (noiseBuffer) return noiseBuffer;
  const length = c.sampleRate * 2;
  noiseBuffer = c.createBuffer(1, length, c.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

function burst(
  c: AudioContext,
  o: { at?: number; dur: number; freq: number; q?: number; gain: number; type?: BiquadFilterType; attack?: number },
) {
  const t = c.currentTime + (o.at ?? 0);
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const filter = c.createBiquadFilter();
  filter.type = o.type ?? "bandpass";
  filter.frequency.value = o.freq;
  filter.Q.value = o.q ?? 1;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain, t + (o.attack ?? 0.004));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  src.connect(filter).connect(g).connect(master!);
  src.start(t, Math.random() * 1.5);
  src.stop(t + o.dur + 0.05);
}

function tone(
  c: AudioContext,
  o: { at?: number; freq: number; to?: number; dur: number; gain: number; type?: OscillatorType; attack?: number },
) {
  const t = c.currentTime + (o.at ?? 0);
  const osc = c.createOscillator();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain, t + (o.attack ?? 0.006));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  osc.connect(g).connect(master!);
  osc.start(t);
  osc.stop(t + o.dur + 0.05);
}

const cues: Record<Cue, (c: AudioContext) => void> = {
  // two soft rustles of a sheet being pulled from a folder
  paper: (c) => {
    burst(c, { dur: 0.14, freq: 2800, q: 0.7, gain: 0.22, attack: 0.02 });
    burst(c, { at: 0.07, dur: 0.2, freq: 3800, q: 0.6, gain: 0.14, attack: 0.03 });
  },
  // a typebar striking, with a little body
  type: (c) => {
    burst(c, { dur: 0.035, freq: 2600 + Math.random() * 800, q: 2.2, gain: 0.12 });
    tone(c, { freq: 140, dur: 0.04, gain: 0.04 });
  },
  // camera shutter: open, close
  shutter: (c) => {
    burst(c, { dur: 0.045, freq: 5200, type: "highpass", gain: 0.2 });
    burst(c, { at: 0.075, dur: 0.06, freq: 3400, q: 1.4, gain: 0.16 });
  },
  // rubber stamp on a desk
  stamp: (c) => {
    burst(c, { dur: 0.22, freq: 260, type: "lowpass", gain: 0.7, attack: 0.002 });
    tone(c, { freq: 78, to: 44, dur: 0.32, gain: 0.45, attack: 0.002 });
  },
  // red thread pulled taut
  thread: (c) => {
    tone(c, { freq: 620, to: 540, dur: 0.16, gain: 0.035, type: "triangle" });
    burst(c, { dur: 0.08, freq: 1800, q: 3, gain: 0.05 });
  },
  // a low, uneasy swell for something revealed
  reveal: (c) => {
    for (const f of [110, 164.8, 207.7]) tone(c, { freq: f, dur: 2.4, gain: 0.05, attack: 0.5 });
    burst(c, { dur: 1.8, freq: 600, type: "lowpass", gain: 0.06, attack: 0.6 });
  },
  // a thumbtack pushed into cork: a short woody knock with no ring to it
  pin: (c) => {
    burst(c, { dur: 0.05, freq: 1100, q: 1.6, gain: 0.3, attack: 0.001 });
    tone(c, { freq: 190, to: 110, dur: 0.07, gain: 0.16, attack: 0.001 });
  },
  // and pulled back out: the same knock, softer and upward
  unpin: (c) => {
    burst(c, { dur: 0.04, freq: 2100, q: 1.2, gain: 0.14, attack: 0.001 });
    tone(c, { freq: 150, to: 240, dur: 0.06, gain: 0.07, attack: 0.001 });
  },
  tick: (c) => tone(c, { freq: 1320, dur: 0.05, gain: 0.03 }),
};

let lastType = 0;

export function play(cue: Cue) {
  if (!getSettings().sound) return;
  // The typewriter fires per character; keep it from turning into a buzz.
  if (cue === "type") {
    const now = performance.now();
    if (now - lastType < 70) return;
    lastType = now;
  }
  const c = audio();
  if (!c || !master) return;
  try {
    cues[cue](c);
  } catch {
    /* audio is decoration; never let it break the game */
  }
}

/** Start or stop the rain loop. */
export function setAmbience(on: boolean) {
  if (!on) {
    rain?.stop();
    rain = null;
    return;
  }
  if (rain) return;
  const c = audio();
  if (!c || !master) return;
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, c.currentTime);
  out.gain.exponentialRampToValueAtTime(1, c.currentTime + 2);
  out.connect(master);

  const layer = (lo: number, hi: number, gain: number) => {
    const src = c.createBufferSource();
    src.buffer = noise(c);
    src.loop = true;
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = lo;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = hi;
    const g = c.createGain();
    g.gain.value = gain;
    src.connect(hp).connect(lp).connect(g).connect(out);
    src.start(c.currentTime, Math.random() * 2);
    return src;
  };
  const sources = [layer(500, 7000, 0.05), layer(40, 600, 0.09)];

  rain = {
    stop: () => {
      const t = c.currentTime;
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(out.gain.value, t);
      out.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      for (const s of sources) s.stop(t + 1.3);
    },
  };
}
