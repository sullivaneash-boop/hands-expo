import { describe, expect, it } from 'vitest';
import { tuning, type NightId } from '../config/tuning';
import { content } from '../data';
import { Session, replay } from '../engine/session';
import { hashState, STATUS_ANSWERS, type PlayerCommand, type SimState } from '.';
import { Rng, seedRng } from './rng';

const ctx = { tuning, content };

/** A chaotic "monkey" player that issues plausible commands from a seeded RNG. */
function monkeyCommand(s: SimState, r: Rng): PlayerCommand | null {
  const roll = r.next();
  const ticketId = s.railOrder.length ? r.pick(s.railOrder) : null;
  const plateId = s.windowOrder.length ? r.pick(s.windowOrder) : null;
  const t = ticketId ? s.tickets[ticketId] : undefined;
  if (roll < 0.04 && t) {
    const courseIdx = r.int(0, t.courses.length - 1);
    const items = t.courses[courseIdx]!.items;
    return r.chance(0.5)
      ? { type: 'fire', ticketId: t.id, courseIdx }
      : { type: 'fire', ticketId: t.id, courseIdx, itemId: r.pick(items).id };
  }
  if (roll < 0.07 && t) return { type: 'send', ticketId: t.id, courseIdx: r.int(0, t.courses.length - 1) };
  if (roll < 0.075 && plateId) return { type: 'refire', plateId };
  if (roll < 0.08 && plateId) return { type: 'check', plateId };
  if (roll < 0.09 && s.interruptOrder.length) {
    const it = s.interrupts[s.interruptOrder[0]!]!;
    return {
      type: 'answer',
      interruptId: it.id,
      choice: it.defId === 'server_status' ? r.pick(STATUS_ANSWERS) : 'heard',
    };
  }
  if (roll < 0.093 && t?.allergy) return { type: 'ackAllergy', ticketId: t.id };
  if (roll < 0.096 && t) {
    const item = t.courses.flatMap((c) => c.items).find((i) => i.eightySixed);
    if (item)
      return {
        type: 'resolve86',
        ticketId: t.id,
        itemId: item.id,
        subMenuId: r.chance(0.5) ? null : 'chicken',
      };
  }
  if (roll < 0.097) return { type: 'debug', action: { kind: 'spawnTicket' } };
  if (roll < 0.0975)
    return { type: 'debug', action: { kind: 'triggerInterrupt', interrupt: 'kitchen_refire' } };
  return null;
}

describe('replay determinism (2.7, extended to all nights in 3.7)', () => {
  const cases = ([1, 2, 3, 4, 5] as NightId[]).flatMap((n) => [1, 2, 3, 4].map((seed) => [n, seed] as const));
  it.each(cases)('night %i seed %i: recorded shift replays to the same hash', (nightId, seed) => {
    const session = new Session(seed, nightId, ctx);
    const monkey = new Rng(seedRng(seed * 7919 + nightId));
    while (session.state.phase !== 'ended' && session.state.tick < 9_000) {
      const cmd = monkeyCommand(session.state, monkey);
      if (cmd) session.dispatch(cmd);
      session.advance(1);
    }
    expect(session.log.commands.length).toBeGreaterThan(0);
    expect(hashState(replay(session.log, ctx, session.state.tick))).toBe(hashState(session.state));
  });
});
