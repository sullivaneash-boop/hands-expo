import { describe, expect, it } from 'vitest';
import type { PlateDefectKind } from '../data/schema';
import { Harness, makeCtx, oneBurger, quietTuning, ticketAt } from './testkit';

const T = quietTuning;

function sendWithDefect(defect: PlateDefectKind) {
  const ctx = makeCtx([ticketAt(0, { ...oneBurger, forceDefect: { itemIdx: 0, defect } })]);
  const h = new Harness(ctx).tick();
  const id = h.ticket.id;
  h.do({ type: 'fire', ticketId: id, courseIdx: 0 }).untilTrue((s) => s.windowOrder.length === 1);
  h.do({ type: 'send', ticketId: id, courseIdx: 0 });
  return h;
}

describe('scoring (2.5)', () => {
  it.each([
    ['wrongMod', 'wrongModSent', T.score.wrongModSent],
    ['missingComponent', 'wrongModSent', T.score.wrongModSent],
    ['wrongDoneness', 'wrongModSent', T.score.wrongModSent],
    ['wrongDish', 'wrongDishSent', T.score.wrongDishSent],
  ] as const)('sending a %s plate costs %s', (defect, reason, delta) => {
    const h = sendWithDefect(defect);
    expect(h.healthDelta(reason)).toBe(delta);
    expect(h.state.stats.errorsEscaped).toBe(1);
    expect(h.of('ticketCleared')[0]!.clean).toBe(false);
    expect(h.healthDelta('tableComplete')).toBe(0);
  });

  it('a clean single-plate ticket earns tableComplete but no sync bonus', () => {
    const h = new Harness(makeCtx([ticketAt(0, oneBurger)])).tick();
    h.do({ type: 'fire', ticketId: h.ticket.id, courseIdx: 0 }).untilTrue((s) => s.windowOrder.length === 1);
    h.do({ type: 'send', ticketId: h.ticket.id, courseIdx: 0 });
    expect(h.healthDelta('tableComplete')).toBe(T.score.tableComplete);
    expect(h.healthDelta('syncBonus')).toBe(0);
  });

  it('late tickets drain lateDrainPerSec per whole second after grace', () => {
    const h = new Harness(makeCtx([ticketAt(0, oneBurger)])).tick();
    const lateAt = h.ticket.lateAtMs;
    h.until(lateAt - 50);
    expect(h.state.health).toBe(100);
    h.until(lateAt);
    expect(h.of('ticketLate')).toHaveLength(1);
    h.until(lateAt + 3_000);
    expect(h.healthDelta('late')).toBe(-3 * T.score.lateDrainPerSec);
    expect(h.of('ticketLate')).toHaveLength(1);
  });

  it('health is clamped to maxHealth', () => {
    const h = new Harness(makeCtx([ticketAt(0, oneBurger)])).tick();
    h.do({ type: 'fire', ticketId: h.ticket.id, courseIdx: 0 }).untilTrue((s) => s.windowOrder.length === 1);
    h.do({ type: 'send', ticketId: h.ticket.id, courseIdx: 0 });
    expect(h.state.health).toBe(T.score.maxHealth);
  });

  it('health reaching 0 ends the shift as lost with grade F', () => {
    const h = new Harness(makeCtx([ticketAt(0, oneBurger)])).tick();
    h.do({ type: 'debug', action: { kind: 'setHealth', health: 0 } });
    expect(h.state.phase).toBe('ended');
    const ended = h.of('shiftEnded')[0]!;
    expect(ended.summary.outcome).toBe('lost');
    expect(ended.summary.grade).toBe('F');
    // Ended state is frozen.
    const frozen = h.state;
    h.tick(10);
    expect(h.state).toBe(frozen);
  });

  it('printer stops at the shift duration; clearing the rail then wins', () => {
    const duration = T.shift.durationMs[1];
    const h = new Harness(makeCtx([ticketAt(duration - 5_000, oneBurger)])).until(duration);
    expect(h.of('printerStopped')).toHaveLength(1);
    expect(h.state.phase).toBe('overtime');
    h.do({ type: 'fire', ticketId: h.ticket.id, courseIdx: 0 }).untilTrue((s) => s.windowOrder.length === 1);
    h.do({ type: 'send', ticketId: h.ticket.id, courseIdx: 0 });
    expect(h.state.phase).toBe('ended');
    expect(h.state.summary!.outcome).toBe('won');
    expect(['A', 'B', 'C', 'D']).toContain(h.state.summary!.grade);
  });

  it('beats at or after the shift duration never print', () => {
    const duration = T.shift.durationMs[1];
    const h = new Harness(makeCtx([ticketAt(duration, oneBurger)])).until(duration + 1_000);
    expect(h.of('ticketPrinted')).toHaveLength(0);
    expect(h.state.phase).toBe('ended');
  });

  it('overtime cap: leftover tickets cost a flat penalty each, then the shift ends', () => {
    const duration = T.shift.durationMs[1];
    const lenient = {
      ...T,
      score: { ...T.score, lateDrainPerSec: 0 },
    };
    const h = new Harness(makeCtx([ticketAt(duration - 1_000, oneBurger)], lenient)).until(
      duration + T.shift.overtimeCapMs + 100,
    );
    expect(h.state.phase).toBe('ended');
    expect(h.healthDelta('overtimeLeftover')).toBe(T.score.overtimeLeftoverPerTicket);
    expect(h.state.summary!.ticketsLeft).toBe(1);
  });

  it('open tickets count against the Ticket Time sub-score', () => {
    const h = new Harness(makeCtx([ticketAt(0, oneBurger)])).until(120_000);
    h.do({ type: 'debug', action: { kind: 'setHealth', health: 0 } });
    expect(h.state.summary!.subScores.time).toBe(0);
  });
});
