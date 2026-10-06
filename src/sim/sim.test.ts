import { describe, expect, it } from 'vitest';
import { tuning } from '../config/tuning';
import { content } from '../data';
import { createSim, hashState, step, type SimEvent, type SimState } from '.';
import { Session, replay } from '../engine/session';

const ctx = { tuning, content };

function run(state: SimState, ticks: number): { state: SimState; events: SimEvent[] } {
  const events: SimEvent[] = [];
  for (let i = 0; i < ticks; i++) {
    const r = step(state, [], ctx);
    state = r.state;
    events.push(...r.events);
  }
  return { state, events };
}

describe('sim loop', () => {
  it('advances one fixed tick per step with integer ms time', () => {
    const { state } = run(createSim(1, 1), 3);
    expect(state.tick).toBe(3);
    expect(state.nowMs).toBe(3 * tuning.sim.tickMs);
  });

  it('emits shiftStarted once, then secondElapsed each sim second', () => {
    const { events } = run(createSim(1, 1), (3 * 1000) / tuning.sim.tickMs);
    expect(events.filter((e) => e.type === 'shiftStarted')).toHaveLength(1);
    expect(
      events.filter((e) => e.type === 'secondElapsed').map((e) => e.type === 'secondElapsed' && e.second),
    ).toEqual([1, 2, 3]);
  });

  it('does not mutate the previous state (immutable updates)', () => {
    const s0 = createSim(1, 1);
    const frozen = JSON.stringify(s0);
    step(s0, [], ctx);
    expect(JSON.stringify(s0)).toBe(frozen);
  });

  it('is deterministic: same seed → same state hash', () => {
    expect(hashState(run(createSim(99, 1), 500).state)).toBe(hashState(run(createSim(99, 1), 500).state));
    expect(hashState(createSim(1, 1))).not.toBe(hashState(createSim(2, 1)));
  });

  it('rejects unknown commands without throwing', () => {
    const bogus = { type: 'debug', action: { kind: 'explode' } } as unknown as Parameters<
      typeof step
    >[1][number];
    const r = step(createSim(1, 1), [bogus], ctx);
    expect(r.events.some((e) => e.type === 'commandRejected')).toBe(true);
  });

  it('replay of a recorded session reproduces the exact state', () => {
    const s = new Session(1234, 1, ctx);
    s.advance(10);
    s.dispatch({ type: 'debug', action: { kind: 'noop' } });
    s.advance(50);
    expect(hashState(replay(s.log, ctx, s.state.tick))).toBe(hashState(s.state));
  });
});
