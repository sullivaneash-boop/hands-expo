/**
 * Public sim API. Pure and deterministic: step(state, commands, ctx) → { state, events }.
 * Must not import React, Zustand, Howler, DOM, timers, Date or Math.random (lint-enforced).
 */
import type { NightId } from '../config/tuning';
import type { PlayerCommand } from './commands';
import type { SimContext } from './context';
import type { SimEvent } from './events';
import { forkSeed, seedRng } from './rng';
import { RNG_STREAMS, type RngStream, type ShiftStats, type SimState } from './state';
import type { NightProfile } from '../config/tuning';
import { randomTicket } from './systems/generate';
import { updateKitchen } from './systems/kitchen';
import { answer, spawnInterrupt, updateInterrupts } from './systems/interrupts';
import { check, refire, send, updatePass } from './systems/pass';
import { updateSchedule } from './systems/schedule';
import { updateLateness } from './systems/scoring';
import { updateShiftEnd } from './systems/shift';
import { ackAllergy, fire, printTicket, resolve86 } from './systems/tickets';
import { Work } from './work';

export interface StepResult {
  state: SimState;
  events: SimEvent[];
}

/** First order number printed on tickets (cosmetic). */
const ORDER_NO_START = 1041;

export function emptyStats(): ShiftStats {
  return {
    ticketsPrinted: 0,
    ticketsCleared: 0,
    ticketTimeSumMs: 0,
    ticketTimeMaxMs: 0,
    coursesCompleted: 0,
    courseTimeSumMs: 0,
    courseTimeMaxMs: 0,
    platesSent: 0,
    errorsEscaped: 0,
    errorsCaught: 0,
    refiresUnneeded: 0,
    platesDied: 0,
    incompleteSends: 0,
    earlyLandings: 0,
    barViolations: 0,
    syncedCourses: 0,
    fired86: 0,
    allergyIncidents: 0,
    checks: 0,
    interrupts: { correct: 0, wrong: 0, timeout: 0, moot: 0 },
    healthByReason: {},
  };
}

export function createSim(seed: number, nightId: NightId, ctx: SimContext): SimState {
  const rng = {} as Record<RngStream, ReturnType<typeof seedRng>>;
  for (const stream of RNG_STREAMS) rng[stream] = seedRng(forkSeed(seed, stream));
  const profile = ctx.tuning.nights[nightId] as NightProfile;
  return {
    seed: seed >>> 0,
    nightId,
    tick: 0,
    nowMs: 0,
    phase: 'running',
    rng,
    ids: { next: 0, orderNo: ORDER_NO_START },
    health: ctx.tuning.score.startHealth,
    beatCursor: 0,
    nextTicketMs: profile.segments.length > 0 ? profile.firstTicketMs : null,
    procNext: {},
    procCount: {},
    tickets: {},
    railOrder: [],
    plates: {},
    windowOrder: [],
    cooking: [],
    stations: {
      grill: { dragMultiplier: 1, dragUntilMs: 0 },
      saute: { dragMultiplier: 1, dragUntilMs: 0 },
      pantry: { dragMultiplier: 1, dragUntilMs: 0 },
    },
    eighty6: [],
    interrupts: {},
    interruptOrder: [],
    pending: [],
    barks: [],
    forcedLoss: null,
    stats: emptyStats(),
    summary: null,
  };
}

/**
 * One fixed tick. Order: advance clock → apply commands → schedule → kitchen → pass →
 * interrupts → lateness → shift end. Changing this order changes balance; log it in DECISIONS.md.
 */
export function step(prev: SimState, commands: readonly PlayerCommand[], ctx: SimContext): StepResult {
  if (prev.phase === 'ended') return { state: prev, events: [] };
  const w = new Work(prev, ctx);

  if (prev.tick === 0) w.emit({ type: 'shiftStarted', nightId: prev.nightId, seed: prev.seed });
  w.s.tick = prev.tick + 1;
  w.s.nowMs = w.s.tick * ctx.tuning.sim.tickMs;
  if (Math.floor(w.s.nowMs / 1000) > Math.floor(prev.nowMs / 1000))
    w.emit({ type: 'secondElapsed', second: Math.floor(w.s.nowMs / 1000) });

  for (const command of commands) applyCommand(w, command);

  updateSchedule(w);
  updateKitchen(w);
  updatePass(w);
  updateInterrupts(w);
  updateLateness(w);
  updateShiftEnd(w);

  return { state: w.finish(), events: w.events };
}

function applyCommand(w: Work, command: PlayerCommand): void {
  switch (command.type) {
    case 'fire':
      return fire(w, command);
    case 'send':
      return send(w, command);
    case 'refire':
      return refire(w, command);
    case 'check':
      return check(w, command);
    case 'answer':
      return answer(w, command);
    case 'ackAllergy':
      return ackAllergy(w, command);
    case 'resolve86':
      return resolve86(w, command);
    case 'debug': {
      const a = command.action;
      if (a.kind === 'noop') return;
      if (a.kind === 'spawnTicket') {
        printTicket(w, randomTicket(w, w.rng.schedule));
        return;
      }
      if (a.kind === 'triggerInterrupt') {
        if (!spawnInterrupt(w, a.interrupt, { table: a.table, arg: a.arg }))
          w.emit({ type: 'commandRejected', command, reason: 'no valid target right now' });
        return;
      }
      if (a.kind === 'setHealth') {
        w.health(a.health - w.s.health, 'debug');
        return;
      }
      break;
    }
  }
  w.emit({ type: 'commandRejected', command, reason: 'unknown command' });
}

export type { SimContext } from './context';
export type * from './state';
export type { PlayerCommand, DebugAction } from './commands';
export type { SimEvent, SimEventType, SimEventOf } from './events';
export { hashState } from './hash';
export * from './selectors';
export { plateError, baseCookMs, type PlateErrorKind } from './plates';
export { needsAllergyPick, itemDone } from './lookup';
