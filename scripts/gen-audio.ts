/**
 * Synthesizes the game's interim audio (D-057): a soft SFX sprite + a seamless kitchen ambience loop.
 * Deterministic (seeded noise), no samples, no ffmpeg. Output is committed:
 *   src/assets/audio/synth/sfx.wav + sfx.json   (Howler sprite)
 *   src/assets/audio/synth/kitchen-loop.wav      (ambience bed)
 * Run: npm run gen:audio
 * Phase 4 replaces these with recorded/CC0 sounds (STYLE.md §6); the event→sound map stays.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── helpers ──────────────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type FilterType = 'lowpass' | 'highpass' | 'bandpass';
/** RBJ-cookbook biquad. */
function biquad(rate: number, type: FilterType, f0: number, q = 0.707) {
  const w = (2 * Math.PI * f0) / rate;
  const cos = Math.cos(w);
  const alpha = Math.sin(w) / (2 * q);
  let b0: number, b1: number, b2: number;
  if (type === 'lowpass') [b0, b1, b2] = [(1 - cos) / 2, 1 - cos, (1 - cos) / 2];
  else if (type === 'highpass') [b0, b1, b2] = [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2];
  else [b0, b1, b2] = [alpha, 0, -alpha];
  const a0 = 1 + alpha;
  const a1 = -2 * cos;
  const a2 = 1 - alpha;
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0;
  return (x: number) => {
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  };
}

class Track {
  readonly data: Float32Array;
  constructor(
    readonly rate: number,
    seconds: number,
  ) {
    this.data = new Float32Array(Math.round(seconds * rate));
  }
  idx(t: number) {
    return Math.round(t * this.rate);
  }
  /** Mix a generated signal starting at time t. fn(k, n) → sample for k-th of n samples. */
  add(t: number, dur: number, fn: (k: number, n: number) => number) {
    const start = this.idx(t);
    const n = this.idx(dur);
    for (let k = 0; k < n && start + k < this.data.length; k++)
      this.data[start + k] = (this.data[start + k] ?? 0) + fn(k, n);
  }
  filter(type: FilterType, f0: number, q?: number) {
    const f = biquad(this.rate, type, f0, q);
    for (let i = 0; i < this.data.length; i++) this.data[i] = f(this.data[i] ?? 0);
    return this;
  }
  normalize(peak: number) {
    let max = 0;
    for (const v of this.data) max = Math.max(max, Math.abs(v));
    if (max > 0) for (let i = 0; i < this.data.length; i++) this.data[i] = (this.data[i] ?? 0) * (peak / max);
    return this;
  }
  /** Short fades at both ends (kills clicks). */
  fades(ms = 4) {
    const n = Math.min(this.idx(ms / 1000), this.data.length / 2);
    for (let k = 0; k < n; k++) {
      this.data[k] = (this.data[k] ?? 0) * (k / n);
      this.data[this.data.length - 1 - k] = (this.data[this.data.length - 1 - k] ?? 0) * (k / n);
    }
    return this;
  }
}

const expEnv = (k: number, rate: number, attack: number, decay: number) => {
  const t = k / rate;
  return t < attack ? t / attack : Math.exp(-(t - attack) / decay);
};

/** Inharmonic struck partials: ceramic, bells, pans. */
function partials(
  tr: Track,
  t: number,
  dur: number,
  freqs: number[],
  amps: number[],
  decays: number[],
  gain: number,
) {
  tr.add(t, dur, (k) => {
    let s = 0;
    for (let i = 0; i < freqs.length; i++)
      s +=
        (amps[i] ?? 0) *
        Math.sin((2 * Math.PI * (freqs[i] ?? 0) * k) / tr.rate) *
        expEnv(k, tr.rate, 0.002, decays[i] ?? 0.1);
    return s * gain;
  });
}

function noiseBurst(
  tr: Track,
  t: number,
  dur: number,
  gain: number,
  rnd: () => number,
  shape: (k: number, n: number) => number,
) {
  tr.add(t, dur, (k, n) => (rnd() * 2 - 1) * gain * shape(k, n));
}

/** Filter just a segment: render into a scratch track then mix. */
function filtered(
  rate: number,
  dur: number,
  fill: (tr: Track) => void,
  chain: [FilterType, number, number?][],
): Float32Array {
  const tr = new Track(rate, dur);
  fill(tr);
  for (const [type, f, q] of chain) tr.filter(type, f, q);
  return tr.data;
}

function mixIn(dst: Track, t: number, src: Float32Array, gain = 1) {
  const start = dst.idx(t);
  for (let k = 0; k < src.length && start + k < dst.data.length; k++)
    dst.data[start + k] = (dst.data[start + k] ?? 0) + (src[k] ?? 0) * gain;
}

// ── SFX ──────────────────────────────────────────────────────────────────────
const RATE = 22_050;
const rnd = mulberry32(0x4a4e4453);

/** Each sound is rendered into its own track, then concatenated into the sprite. */
const SFX: Record<string, () => Track> = {
  // Dot-matrix kitchen printer: motor hum + rows of soft head strikes + paper feed between lines.
  print: () => {
    const dur = 1.25;
    const tr = new Track(RATE, dur);
    tr.add(0, dur, (k, n) => {
      const ph = ((110 * k) / RATE) % 1;
      return (ph * 2 - 1) * 0.06 * Math.min(1, k / 800, (n - k) / 1500);
    });
    let t = 0.04;
    for (let line = 0; line < 5; line++) {
      const strikes = 12 + Math.floor(rnd() * 6);
      for (let s = 0; s < strikes; s++) {
        const g = 0.25 + rnd() * 0.15;
        mixIn(
          tr,
          t,
          filtered(RATE, 0.006, (x) => noiseBurst(x, 0, 0.006, g, rnd, (k, n) => 1 - k / n), [
            ['bandpass', 2400 + rnd() * 600, 1.4],
          ]),
        );
        t += 0.0105;
      }
      // line feed: a short soft whir
      mixIn(
        tr,
        t + 0.01,
        filtered(
          RATE,
          0.06,
          (x) => noiseBurst(x, 0, 0.06, 0.18, rnd, (k, n) => Math.sin((Math.PI * k) / n)),
          [['bandpass', 700, 2]],
        ),
      );
      t += 0.085;
    }
    return tr.filter('lowpass', 5200).normalize(0.42).fades();
  },

  // Ticket tear: crackly band-limited noise.
  tear: () => {
    const tr = new Track(RATE, 0.32);
    let gate = 1;
    tr.add(0, 0.32, (k, n) => {
      if (k % 40 === 0) gate = 0.3 + rnd() * 0.7;
      return (rnd() * 2 - 1) * gate * Math.sin((Math.PI * k) / n) ** 0.6;
    });
    return tr.filter('bandpass', 2600, 0.8).normalize(0.35).fades();
  },

  // Plate landing on the stainless pass: ceramic partials + a low thud.
  plate: () => {
    const tr = new Track(RATE, 0.45);
    partials(tr, 0, 0.45, [1850, 2930, 4410, 6050], [0.5, 0.32, 0.18, 0.08], [0.18, 0.11, 0.07, 0.04], 1);
    tr.add(0, 0.12, (k) => Math.sin((2 * Math.PI * 140 * k) / RATE) * expEnv(k, RATE, 0.001, 0.035) * 0.7);
    return tr.normalize(0.4).fades(2);
  },

  // Service bell: the "order up" ding when HANDS! goes out.
  bell: () => {
    const tr = new Track(RATE, 1.3);
    partials(tr, 0, 1.3, [1568, 4327, 8467], [1, 0.35, 0.12], [0.55, 0.22, 0.09], 1);
    return tr.filter('lowpass', 7000).normalize(0.32).fades(2);
  },

  // Swing door: soft whoosh + a padded thump.
  door: () => {
    const tr = new Track(RATE, 0.6);
    mixIn(
      tr,
      0,
      filtered(RATE, 0.45, (x) => noiseBurst(x, 0, 0.45, 0.25, rnd, (k, n) => Math.sin((Math.PI * k) / n)), [
        ['bandpass', 450, 1.2],
      ]),
    );
    tr.add(0.33, 0.25, (k) => Math.sin((2 * Math.PI * 78 * k) / RATE) * expEnv(k, RATE, 0.003, 0.06) * 0.8);
    return tr.filter('lowpass', 2500).normalize(0.38).fades();
  },

  // Gentle "nope" for rejected actions and fired-86: a soft wooden thunk.
  thunk: () => {
    const tr = new Track(RATE, 0.22);
    tr.add(0, 0.22, (k) => {
      const f = 190 - 70 * (k / (0.22 * RATE));
      return Math.sin((2 * Math.PI * f * k) / RATE) * expEnv(k, RATE, 0.002, 0.05);
    });
    return tr.filter('lowpass', 1200).normalize(0.3).fades(2);
  },

  // Refire: plate scraped into the bin.
  scrape: () => {
    const tr = new Track(RATE, 0.5);
    tr.add(
      0,
      0.4,
      (k, n) =>
        (rnd() * 2 - 1) * (0.6 + 0.4 * Math.sin((2 * Math.PI * 28 * k) / RATE)) * Math.sin((Math.PI * k) / n),
    );
    tr.filter('bandpass', 1300, 2.5);
    partials(tr, 0.38, 0.12, [900, 1500], [0.3, 0.2], [0.03, 0.02], 0.4);
    return tr.normalize(0.3).fades();
  },

  // A plate died under the lamps: low, sagging tone.
  wilt: () => {
    const tr = new Track(RATE, 0.5);
    tr.add(0, 0.5, (k) => {
      const f = 320 - 160 * (k / (0.5 * RATE));
      return Math.sin((2 * Math.PI * f * k) / RATE) * expEnv(k, RATE, 0.01, 0.18);
    });
    return tr.filter('lowpass', 900).normalize(0.28).fades();
  },

  // Pan clang: the line yelling (86 / drag / drop).
  clang: () => {
    const tr = new Track(RATE, 0.7);
    partials(tr, 0, 0.7, [523, 1187, 1873, 2971], [0.6, 0.45, 0.3, 0.15], [0.3, 0.18, 0.1, 0.06], 1);
    return tr.filter('lowpass', 5000).normalize(0.3).fades(2);
  },

  // UI tick (fire, check, answer).
  tick: () => {
    const tr = new Track(RATE, 0.05);
    tr.add(0, 0.03, (k) => Math.sin((2 * Math.PI * 1800 * k) / RATE) * expEnv(k, RATE, 0.0005, 0.006));
    return tr.normalize(0.18).fades(1);
  },

  // Allergy incident: low two-note alarm, filtered so it isn't shrill.
  alarm: () => {
    const tr = new Track(RATE, 0.7);
    for (const [t0, f] of [
      [0, 440],
      [0.3, 349],
    ] as const)
      tr.add(
        t0,
        0.3,
        (k, n) => Math.sign(Math.sin((2 * Math.PI * f * k) / RATE)) * Math.min(1, k / 200, (n - k) / 400),
      );
    return tr.filter('lowpass', 1400).normalize(0.18).fades();
  },
};

const GAP = 0.12;
const tracks = Object.entries(SFX).map(([id, make]) => [id, make()] as const);
const total = tracks.reduce((n, [, tr]) => n + tr.data.length + Math.round(GAP * RATE), 0);
const sprite = new Float32Array(total);
const map: Record<string, [number, number]> = {};
let off = 0;
for (const [id, tr] of tracks) {
  sprite.set(tr.data, off);
  map[id] = [Math.round((off / RATE) * 1000), Math.round((tr.data.length / RATE) * 1000)];
  off += tr.data.length + Math.round(GAP * RATE);
}

// ── Ambience: hood fan + hum + sizzle + distant clatter, seamless loop ──────
const AMB_RATE = 16_000;
const LOOP_S = 14;
const XF_S = 1;
function ambience(): Float32Array {
  const r2 = mulberry32(0xa4b1e);
  const tr = new Track(AMB_RATE, LOOP_S + XF_S);
  // hood: brown noise, low-passed
  const hood = new Track(AMB_RATE, LOOP_S + XF_S);
  let brown = 0;
  hood.add(0, LOOP_S + XF_S, () => {
    brown = 0.985 * brown + (r2() * 2 - 1) * 0.12;
    return brown;
  });
  hood.filter('lowpass', 420).filter('highpass', 45);
  mixIn(tr, 0, hood.data, 1);
  // electrical hum
  tr.add(
    0,
    LOOP_S + XF_S,
    (k) =>
      0.015 * Math.sin((2 * Math.PI * 60 * k) / AMB_RATE) +
      0.008 * Math.sin((2 * Math.PI * 120 * k) / AMB_RATE),
  );
  // sizzle bed with a slow swell
  const sizzle = new Track(AMB_RATE, LOOP_S + XF_S);
  sizzle.add(
    0,
    LOOP_S + XF_S,
    (k) => (r2() * 2 - 1) * (0.5 + 0.5 * Math.sin((2 * Math.PI * 0.13 * k) / AMB_RATE)),
  );
  sizzle.filter('highpass', 3000).filter('lowpass', 7000);
  mixIn(tr, 0, sizzle.data, 0.05);
  // distant clinks and pan knocks
  for (let t = 0.4; t < LOOP_S; t += 0.7 + r2() * 1.8) {
    const clink = new Track(AMB_RATE, 0.4);
    const base = 1400 + r2() * 1600;
    partials(clink, 0, 0.4, [base, base * 1.58, base * 2.37], [0.5, 0.3, 0.15], [0.12, 0.07, 0.04], 1);
    clink.filter('lowpass', 2800);
    mixIn(tr, t, clink.data, 0.05 + r2() * 0.05);
  }
  // seamless: crossfade the tail into the head
  const n = Math.round(LOOP_S * AMB_RATE);
  const xf = Math.round(XF_S * AMB_RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const v = tr.data[i] ?? 0;
    out[i] = i < xf ? v * (i / xf) + (tr.data[n + i] ?? 0) * (1 - i / xf) : v;
  }
  let max = 0;
  for (const v of out) max = Math.max(max, Math.abs(v));
  for (let i = 0; i < n; i++) out[i] = (out[i] ?? 0) * (0.5 / max);
  return out;
}

// ── WAV writer ───────────────────────────────────────────────────────────────
function wav(samples: Float32Array, rate: number): Buffer {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++)
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i] ?? 0)) * 32767), 44 + i * 2);
  return buf;
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src/assets/audio/synth');
rmSync(join(root, 'src/assets/audio/placeholder'), { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const sfxBuf = wav(sprite, RATE);
const ambBuf = wav(ambience(), AMB_RATE);
writeFileSync(join(outDir, 'sfx.wav'), sfxBuf);
writeFileSync(join(outDir, 'sfx.json'), JSON.stringify(map, null, 2) + '\n');
writeFileSync(join(outDir, 'kitchen-loop.wav'), ambBuf);
console.log(`sfx.wav ${(sfxBuf.length / 1024).toFixed(0)} KB: ${Object.keys(map).join(', ')}`);
console.log(`kitchen-loop.wav ${(ambBuf.length / 1024).toFixed(0)} KB (${LOOP_S}s @ ${AMB_RATE} Hz)`);
