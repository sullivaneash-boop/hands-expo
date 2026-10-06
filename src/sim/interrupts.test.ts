import { describe, expect, it } from 'vitest';
import { burgerAndSalad, Harness, makeCtx, oneBurger, quietTuning, ticketAt } from './testkit';
import type { ShiftBeat } from '../data/schema';

const T = quietTuning;
const ask = (atMs: number, table: number): ShiftBeat => ({
  atMs,
  type: 'interrupt',
  interrupt: 'server_status',
  target: { table },
});

describe('server_status interrupt (2.6)', () => {
  it('arrives targeting the requested table, with server patience', () => {
    const h = new Harness(makeCtx([ticketAt(0, oneBurger), ask(1_000, 12)])).until(1_000);
    const it0 = Object.values(h.state.interrupts)[0]!;
    expect(it0).toMatchObject({ table: 12, speaker: 'maya', source: 'server' });
    expect(it0.expiresAtMs - it0.arrivedAtMs).toBe(T.interrupts.patienceMs.server);
    expect(h.of('interruptArrived')).toHaveLength(1);
  });

  it('correct answer: no penalty', () => {
    const h = new Harness(makeCtx([ticketAt(0, oneBurger), ask(1_000, 12)])).until(1_000);
    h.do({ type: 'answer', interruptId: h.state.interruptOrder[0]!, choice: 'notFired' });
    expect(h.of('interruptResolved')[0]!.outcome).toBe('correct');
    expect(h.state.health).toBe(100);
    expect(h.state.interruptOrder).toHaveLength(0);
  });

  it('status is judged at answer time (cooking / partial / window)', () => {
    const h = new Harness(makeCtx([ticketAt(0, burgerAndSalad), ask(500, 21)])).tick();
    h.do({ type: 'fire', ticketId: h.ticket.id, courseIdx: 0 }).until(500);
    h.untilTrue((s) => s.windowOrder.length === 1); // salad up, burger cooking
    h.do({ type: 'answer', interruptId: h.state.interruptOrder[0]!, choice: 'partial' });
    expect(h.of('interruptResolved')[0]!.outcome).toBe('correct');
  });

  it('wrong answer and timeout each cost their penalty', () => {
    const h = new Harness(makeCtx([ticketAt(0, oneBurger), ask(1_000, 12), ask(2_000, 12)])).until(1_000);
    h.do({ type: 'answer', interruptId: h.state.interruptOrder[0]!, choice: 'window' });
    expect(h.healthDelta('interruptWrong')).toBe(T.score.interruptWrong);
    h.until(2_000 + T.interrupts.patienceMs.server);
    expect(h.of('interruptResolved').map((e) => e.outcome)).toEqual(['wrong', 'timeout']);
    expect(h.healthDelta('interruptTimeout')).toBe(T.score.interruptTimeout);
  });

  it('becomes moot (no penalty) if the ticket clears before it is answered', () => {
    const h = new Harness(makeCtx([ticketAt(0, oneBurger)])).tick();
    h.do({ type: 'fire', ticketId: h.ticket.id, courseIdx: 0 });
    h.until(h.state.cooking[0]!.doneAtMs - 5_000);
    h.do({ type: 'debug', action: { kind: 'triggerInterrupt', interrupt: 'server_status' } });
    h.untilTrue((s) => s.windowOrder.length === 1);
    h.do({ type: 'send', ticketId: h.ticket.id, courseIdx: 0 });
    expect(h.of('interruptResolved').map((e) => e.outcome)).toEqual(['moot']);
    expect(h.healthDelta('interruptTimeout')).toBe(0);
  });

  it('invalid choices are rejected', () => {
    const h = new Harness(makeCtx([ticketAt(0, oneBurger), ask(100, 12)])).until(100);
    h.do({ type: 'answer', interruptId: h.state.interruptOrder[0]!, choice: 'banana' });
    expect(h.of('commandRejected')).toHaveLength(1);
    expect(h.state.interruptOrder).toHaveLength(1);
  });
});
