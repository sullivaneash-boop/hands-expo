/**
 * Seeded PRNG (sfc32) — D-004. State is a plain 4-tuple so it can live in SimState.
 * Use `Rng` (mutable wrapper) inside a single step(); persist `rng.state` back into SimState.
 */
export type RngState = readonly [number, number, number, number];

export function seedRng(seed: number): RngState {
  // splitmix32 to spread a single 32-bit seed over 128 bits of state
  let s = seed >>> 0;
  const next = (): number => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
    return (z ^ (z >>> 16)) >>> 0;
  };
  const st: [number, number, number, number] = [next(), next(), next(), next()];
  // warm up
  const r = new Rng(st);
  for (let i = 0; i < 12; i++) r.next();
  return r.state;
}

/** Derive an independent stream from a parent seed and a label (stable across runs). */
export function forkSeed(seed: number, label: string): number {
  let h = 0x811c9dc5 ^ (seed >>> 0);
  for (let i = 0; i < label.length; i++) {
    h ^= label.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(state: RngState) {
    [this.a, this.b, this.c, this.d] = state;
  }

  get state(): RngState {
    return [this.a, this.b, this.c, this.d];
  }

  /** Uniform float in [0, 1). */
  next(): number {
    this.a >>>= 0;
    this.b >>>= 0;
    this.c >>>= 0;
    this.d >>>= 0;
    let t = (this.a + this.b) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.d = (this.d + 1) | 0;
    t = (t + this.d) | 0;
    this.c = (this.c + t) | 0;
    return (t >>> 0) / 4294967296;
  }

  /** Integer in [lo, hi] inclusive. */
  int(lo: number, hi: number): number {
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick on empty array');
    return items[Math.floor(this.next() * items.length)] as T;
  }

  /** Weighted pick from a record of { key: weight }. Keys are sorted for determinism. */
  weighted<K extends string>(weights: Readonly<Record<K, number>>): K {
    const keys = (Object.keys(weights) as K[]).sort();
    const total = keys.reduce((sum, k) => sum + weights[k], 0);
    let roll = this.next() * total;
    for (const k of keys) {
      roll -= weights[k];
      if (roll < 0) return k;
    }
    return keys[keys.length - 1] as K;
  }
}
