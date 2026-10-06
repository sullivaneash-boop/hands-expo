/**
 * Generates the grey-box placeholder SFX sprite (STYLE.md §6): one 16-bit mono WAV + a Howler sprite map.
 * Deterministic, no ffmpeg. Output is committed: src/assets/audio/placeholder/{sprite.wav,sprite.json}.
 * Run: npx tsx scripts/gen-placeholder-audio.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 22_050;
const GAP_MS = 150;

type Wave = 'sine' | 'square';
interface Tone {
  hz: number;
  ms: number;
  wave?: Wave;
  /** Exponential decay (1 = none). */
  decay?: number;
  gain?: number;
}
/** A sound is a sequence of tones and rests (hz 0 = rest). */
const SOUNDS: Record<string, Tone[]> = {
  // printer chatter: three quick blips
  print: [
    { hz: 880, ms: 45, wave: 'square', gain: 0.25 },
    { hz: 0, ms: 35 },
    { hz: 880, ms: 45, wave: 'square', gain: 0.25 },
    { hz: 0, ms: 35 },
    { hz: 880, ms: 45, wave: 'square', gain: 0.25 },
  ],
  // food up: single bright ding
  food_up: [{ hz: 1320, ms: 260, decay: 6, gain: 0.5 }],
  // someone at the door: low double blip
  interrupt: [
    { hz: 440, ms: 90, gain: 0.45 },
    { hz: 0, ms: 60 },
    { hz: 440, ms: 90, gain: 0.45 },
  ],
  // rejected action / dead plate: buzz
  error: [{ hz: 220, ms: 170, wave: 'square', gain: 0.2 }],
  // hands! course sent: rising two-tone
  send: [
    { hz: 660, ms: 70, gain: 0.35 },
    { hz: 990, ms: 110, decay: 4, gain: 0.35 },
  ],
};

function render(tones: Tone[]): Float32Array {
  const total = tones.reduce((n, t) => n + Math.round((t.ms / 1000) * RATE), 0);
  const out = new Float32Array(total);
  let i = 0;
  for (const t of tones) {
    const n = Math.round((t.ms / 1000) * RATE);
    const fade = Math.min(n / 2, Math.round(0.004 * RATE)); // 4ms fades kill clicks
    for (let k = 0; k < n; k++, i++) {
      if (t.hz === 0) continue;
      const phase = (2 * Math.PI * t.hz * k) / RATE;
      const raw = t.wave === 'square' ? Math.sign(Math.sin(phase)) : Math.sin(phase);
      const env = Math.exp(-(t.decay ?? 0) * (k / n)) * Math.min(1, k / fade, (n - k) / fade);
      out[i] = raw * env * (t.gain ?? 0.4);
    }
  }
  return out;
}

const gap = new Float32Array(Math.round((GAP_MS / 1000) * RATE));
const parts: Float32Array[] = [];
const sprite: Record<string, [number, number]> = {};
let offsetSamples = 0;
for (const [id, tones] of Object.entries(SOUNDS)) {
  const pcm = render(tones);
  sprite[id] = [Math.round((offsetSamples / RATE) * 1000), Math.round((pcm.length / RATE) * 1000)];
  parts.push(pcm, gap);
  offsetSamples += pcm.length + gap.length;
}

const samples = parts.reduce((n, p) => n + p.length, 0);
const buf = Buffer.alloc(44 + samples * 2);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + samples * 2, 4);
buf.write('WAVE', 8);
buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); // PCM
buf.writeUInt16LE(1, 22); // mono
buf.writeUInt32LE(RATE, 24);
buf.writeUInt32LE(RATE * 2, 28);
buf.writeUInt16LE(2, 32);
buf.writeUInt16LE(16, 34);
buf.write('data', 36);
buf.writeUInt32LE(samples * 2, 40);
let o = 44;
for (const p of parts) {
  for (const v of p) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), o);
    o += 2;
  }
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), '../src/assets/audio/placeholder');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'sprite.wav'), buf);
writeFileSync(join(outDir, 'sprite.json'), JSON.stringify(sprite, null, 2) + '\n');
console.log(`wrote sprite.wav (${(buf.length / 1024).toFixed(1)} KB) with`, Object.keys(sprite).join(', '));
