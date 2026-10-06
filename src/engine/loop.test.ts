import { describe, expect, it } from 'vitest';
import { accumulate } from './loop';

const t = { tickMs: 50, maxFrameMs: 250, maxTicksPerFrame: 60 };

describe('fixed-step accumulator', () => {
  it('runs whole ticks and carries the remainder', () => {
    const a = accumulate(0, 120, 1, t);
    expect(a).toEqual({ ticks: 2, accMs: 20, droppedMs: 0 });
    const b = accumulate(a.accMs, 30, 1, t);
    expect(b.ticks).toBe(1);
    expect(b.accMs).toBe(0);
  });

  it('60 fps for one simulated second at 1x yields exactly 20 ticks', () => {
    let acc = 0;
    let ticks = 0;
    for (let i = 0; i < 60; i++) {
      const r = accumulate(acc, 1000 / 60, 1, t);
      acc = r.accMs;
      ticks += r.ticks;
    }
    expect(ticks).toBe(20);
  });

  it('speed scales sim time (0.5x and 10x)', () => {
    expect(accumulate(0, 200, 0.5, t).ticks).toBe(2);
    expect(accumulate(0, 100, 10, t).ticks).toBe(20);
  });

  it('clamps a long frame (tab sleep) to maxFrameMs', () => {
    expect(accumulate(0, 10_000, 1, t).ticks).toBe(250 / 50);
  });

  it('caps ticks per frame and reports dropped time', () => {
    const r = accumulate(0, 250, 20, t); // 5000ms of sim → 100 ticks, cap 60
    expect(r.ticks).toBe(60);
    expect(r.droppedMs).toBe(40 * 50);
  });

  it('ignores negative deltas', () => {
    expect(accumulate(10, -5, 1, t)).toEqual({ ticks: 0, accMs: 10, droppedMs: 0 });
  });
});
