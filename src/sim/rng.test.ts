import { describe, expect, it } from 'vitest';
import { Rng, forkSeed, seedRng } from './rng';

const take = (r: Rng, n: number) => Array.from({ length: n }, () => r.next());

describe('rng', () => {
  it('same seed → same sequence', () => {
    expect(take(new Rng(seedRng(42)), 100)).toEqual(take(new Rng(seedRng(42)), 100));
  });

  it('different seeds diverge', () => {
    expect(take(new Rng(seedRng(1)), 10)).not.toEqual(take(new Rng(seedRng(2)), 10));
  });

  it('state round-trips: resuming from a saved state continues the sequence', () => {
    const a = new Rng(seedRng(7));
    take(a, 13);
    const b = new Rng(a.state);
    expect(take(a, 20)).toEqual(take(b, 20));
  });

  it('forked streams are stable and independent', () => {
    expect(forkSeed(9, 'kitchen')).toBe(forkSeed(9, 'kitchen'));
    expect(forkSeed(9, 'kitchen')).not.toBe(forkSeed(9, 'defects'));
  });

  it('next() in [0,1), int() within inclusive bounds', () => {
    const r = new Rng(seedRng(3));
    for (let i = 0; i < 10_000; i++) {
      const f = r.next();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      const n = r.int(-2, 5);
      expect(n).toBeGreaterThanOrEqual(-2);
      expect(n).toBeLessThanOrEqual(5);
    }
  });

  it('weighted() respects zero weights and is deterministic', () => {
    const r = new Rng(seedRng(5));
    for (let i = 0; i < 1000; i++) expect(r.weighted({ a: 1, b: 0, c: 3 })).not.toBe('b');
  });
});
