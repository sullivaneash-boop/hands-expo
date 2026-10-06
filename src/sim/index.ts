/**
 * Public sim API. Pure and deterministic: step(state, commands, ctx) → { state, events }.
 * Must not import React, Zustand, Howler, DOM, timers, Date or Math.random (lint-enforced).
 */
import type { NightId, Tuning } from '../config/tuning';
import type { Content } from '../data/schema';
import type { PlayerCommand } from './commands';
import type { SimEvent } from './events';
import { Rng, forkSeed, seedRng } from './rng';
import { RNG_STREAMS, type RngStream, type SimState } from './state';

export interface SimContext {
  tuning: Tuning;
  content: Content;
}

export interface StepResult {
  state: SimState;
  events: SimEvent[];
}

export function createSim(seed: number, nightId: NightId): SimState {
  const rng = {} as Record<RngStream, ReturnType<typeof seedRng>>;
  for (const stream of RNG_STREAMS) rng[stream] = seedRng(forkSeed(seed, stream));
  return { seed: seed >>> 0, nightId, tick: 0, nowMs: 0, phase: 'running', rng };
}

/** Mutable RNG handles for the duration of one step; written back into state at the end. */
type Rngs = Record<RngStream, Rng>;

export function step(prev: SimState, commands: readonly PlayerCommand[], ctx: SimContext): StepResult {
  const events: SimEvent[] = [];
  if (prev.phase === 'ended') return { state: prev, events };

  const rngs = {} as Rngs;
  for (const stream of RNG_STREAMS) rngs[stream] = new Rng(prev.rng[stream]);

  let state = prev;
  if (state.tick === 0) events.push({ type: 'shiftStarted', nightId: state.nightId, seed: state.seed });

  for (const command of commands) {
    // Phase 1: only the debug no-op exists. Systems that handle real commands arrive in Phase 2.
    if (command.type === 'debug' && command.action.kind === 'noop') continue;
    events.push({ type: 'commandRejected', command, reason: 'unknown command' });
  }

  const tick = state.tick + 1;
  const nowMs = tick * ctx.tuning.sim.tickMs;
  if (Math.floor(nowMs / 1000) > Math.floor(state.nowMs / 1000))
    events.push({ type: 'secondElapsed', second: Math.floor(nowMs / 1000) });

  state = { ...state, tick, nowMs, rng: writeBack(rngs) };
  return { state, events };
}

function writeBack(rngs: Rngs): SimState['rng'] {
  const out = {} as Record<RngStream, SimState['rng'][RngStream]>;
  for (const stream of RNG_STREAMS) out[stream] = rngs[stream].state;
  return out;
}

export type { SimState } from './state';
export type { PlayerCommand } from './commands';
export type { SimEvent, SimEventType, SimEventOf } from './events';
export { hashState } from './hash';
