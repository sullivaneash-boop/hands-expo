import { describe, expect, it } from 'vitest';
import { tuning } from '../config/tuning';
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
  if (roll < 0.04 && ticketId) {
    const t = s.tickets[ticketId]!;
    const items = t.courses[0]!.items;
    return r.chance(0.5)
      ? { type: 'fire', ticketId, courseIdx: 0 }
      : { type: 'fire', ticketId, courseIdx: 0, itemId: r.pick(items).id };
  }
  if (roll < 0.07 && ticketId) return { type: 'send', ticketId, courseIdx: 0 };
  if (roll < 0.075 && plateId) return { type: 'refire', plateId };
  if (roll < 0.08 && plateId) return { type: 'check', plateId };
  if (roll < 0.085 && s.interruptOrder.length)
    return { type: 'answer', interruptId: s.interruptOrder[0]!, choice: r.pick(STATUS_ANSWERS) };
  if (roll < 0.087) return { type: 'debug', action: { kind: 'spawnTicket' } };
  if (roll < 0.088)
    return { type: 'debug', action: { kind: 'triggerInterrupt', interrupt: 'server_status' } };
  return null;
}

describe('replay determinism (2.7)', () => {
  it.each(Array.from({ length: 20 }, (_, i) => i + 1))(
    'seed %i: recorded Night 1 replays to the same hash',
    (seed) => {
      const session = new Session(seed, 1, ctx);
      const monkey = new Rng(seedRng(seed * 7919));
      while (session.state.phase !== 'ended' && session.state.tick < 8_000) {
        const cmd = monkeyCommand(session.state, monkey);
        if (cmd) session.dispatch(cmd);
        session.advance(1);
      }
      expect(session.log.commands.length).toBeGreaterThan(0);
      expect(hashState(replay(session.log, ctx, session.state.tick))).toBe(hashState(session.state));
    },
  );
});
