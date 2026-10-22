import { describe, expect, it } from 'vitest';
import type { PlateDefectKind, TicketTemplate } from '../data/schema';
import { Harness, makeCtx, oneBurger, quietTuning, ticketAt, tightTuning } from './testkit';
import type { Tuning } from '../config/tuning';

const T = quietTuning;

const fourBurgers: TicketTemplate = {
  table: 40,
  server: 'luis',
  guests: 4,
  courses: [
    {
      kind: 'main',
      items: [1, 2, 3, 4].map((seat) => ({ seat, menuId: 'burger', mods: ['medium', 'fries'] })),
    },
  ],
};
const salads = (n: number, table = 9): TicketTemplate => ({
  table,
  server: 'maya',
  guests: n,
  courses: [
    { kind: 'main', items: Array.from({ length: n }, (_, i) => ({ seat: i + 1, menuId: 'chop', mods: [] })) },
  ],
});

const fireAndSend = (h: Harness) => {
  const id = h.ticket.id;
  h.do({ type: 'fire', ticketId: id, courseIdx: 0 }).untilTrue((s) =>
    (s.tickets[id]?.courses[0]?.items ?? []).every((i) => i.state === 'up'),
  );
  return h.do({ type: 'send', ticketId: id, courseIdx: 0 });
};

describe('station capacity (5.1)', () => {
  it('extra fires queue for a slot; the queue starts as slots free', () => {
    const h = new Harness(makeCtx([ticketAt(0, fourBurgers)], tightTuning)).tick();
    h.do({ type: 'fire', ticketId: h.ticket.id, courseIdx: 0 });
    const states = h.ticket.courses[0]!.items.map((i) => i.state);
    expect(states.filter((s) => s === 'cooking')).toHaveLength(tightTuning.kitchen.slots.grill);
    expect(states.filter((s) => s === 'queued')).toHaveLength(4 - tightTuning.kitchen.slots.grill);
    expect(h.state.stats.overfires).toBe(4 - tightTuning.kitchen.slots.grill);
    const firstDone = Math.min(
      ...h.state.cooking.filter((j) => j.status === 'cooking').map((j) => j.doneAtMs!),
    );
    h.until(firstDone);
    expect(h.of('itemStarted').length).toBeGreaterThanOrEqual(4);
    expect(h.ticket.courses[0]!.items.filter((i) => i.state === 'queued')).toHaveLength(0);
  });

  it('on-the-fly remakes jump the queue', () => {
    const bad = { ...fourBurgers, forceDefect: { itemIdx: 0, defect: 'wrongMod' as PlateDefectKind } };
    const extra = { ...oneBurger, table: 50 };
    const h = new Harness(makeCtx([ticketAt(0, bad), ticketAt(0, extra)], tightTuning)).tick();
    const [a, b] = h.state.railOrder;
    h.do({ type: 'fire', ticketId: a!, courseIdx: 0 });
    h.untilTrue((s) => s.windowOrder.length >= 1);
    h.do({ type: 'fire', ticketId: b!, courseIdx: 0 }); // joins the queue behind seat 4
    const badPlate = h.state.windowOrder.map((id) => h.state.plates[id]!).find((p) => p.itemId === `${a}.0`)!;
    h.do({ type: 'refire', plateId: badPlate.id });
    const queued = h.state.cooking.filter((j) => j.status === 'queued');
    const started = h.state.cooking.filter((j) => j.status === 'cooking').map((j) => j.itemId);
    // The remake either started immediately or is first in line.
    expect(started.includes(`${a}.0`) || queued[0]?.onTheFly).toBe(true);
  });

  it('a dragging station loses a slot', () => {
    const h = new Harness(makeCtx([ticketAt(0, fourBurgers)], tightTuning, ['drag'])).tick();
    h.do({ type: 'debug', action: { kind: 'triggerInterrupt', interrupt: 'kitchen_drag', arg: 'grill' } });
    h.do({ type: 'fire', ticketId: h.ticket.id, courseIdx: 0 });
    const cooking = h.ticket.courses[0]!.items.filter((i) => i.state === 'cooking').length;
    expect(cooking).toBe(tightTuning.kitchen.slots.grill - tightTuning.kitchen.dragSlotPenalty);
  });
});

describe('pass capacity (5.2)', () => {
  const twoSpots: Tuning = { ...T, pass: { ...T.pass, spots: 2 } };

  it('when the pass is full, finished food backs up and keeps aging; it lands when a spot frees', () => {
    const h = new Harness(makeCtx([ticketAt(0, salads(2, 9)), ticketAt(0, salads(1, 10))], twoSpots)).tick();
    const [a, b] = h.state.railOrder;
    h.do({ type: 'fire', ticketId: a!, courseIdx: 0 });
    h.do({ type: 'fire', ticketId: b!, courseIdx: 0 });
    h.untilTrue((s) => s.cooking.some((j) => j.status === 'waiting'));
    expect(h.state.windowOrder).toHaveLength(2);
    expect(h.of('plateBackedUp')).toHaveLength(1);
    const waiting = h.state.cooking.find((j) => j.status === 'waiting')!;
    h.tick(40);
    h.do({ type: 'send', ticketId: a!, courseIdx: 0 });
    const landed = h.state.windowOrder
      .map((id) => h.state.plates[id]!)
      .find((p) => p.itemId === waiting.itemId)!;
    expect(landed.upAtMs).toBe(waiting.doneAtMs); // already aged while backed up
  });

  it('food can die behind a full pass', () => {
    const oneSpot: Tuning = { ...T, pass: { ...T.pass, spots: 1 } };
    const h = new Harness(makeCtx([ticketAt(0, salads(2))], oneSpot)).tick();
    h.do({ type: 'fire', ticketId: h.ticket.id, courseIdx: 0 });
    h.untilTrue((s) => s.cooking.some((j) => j.status === 'waiting'));
    const doneAt = h.state.cooking.find((j) => j.status === 'waiting')!.doneAtMs!;
    h.until(doneAt + T.pass.plateDieMs);
    expect(h.of('plateDied').some((e) => e.plateId.startsWith('backed-up:'))).toBe(true);
    expect(h.heatDelta('plateDied')).toBeGreaterThanOrEqual(T.heat.plateDied);
  });
});

describe('Service Heat (5.3)', () => {
  it('bad plates add heat by kind', () => {
    for (const [defect, reason, heat] of [
      ['wrongMod', 'wrongModSent', T.heat.wrongModSent],
      ['missingComponent', 'wrongModSent', T.heat.wrongModSent],
      ['wrongDoneness', 'wrongModSent', T.heat.wrongModSent],
      ['wrongDish', 'wrongDishSent', T.heat.wrongDishSent],
    ] as const) {
      const h = fireAndSend(
        new Harness(makeCtx([ticketAt(0, { ...oneBurger, forceDefect: { itemIdx: 0, defect } })])).tick(),
      );
      expect(h.heatDelta(reason)).toBe(heat);
      expect(h.state.stats.errorsEscaped).toBe(1);
    }
  });

  it('heat bleeds off passively when nothing is late', () => {
    const h = new Harness(makeCtx([])).until(5_000);
    expect(h.state.heat).toBeCloseTo(T.heat.initial - 5 * T.heat.passiveRecoveryPerSec, 5);
  });

  it('late pressure is root-sum-square of severities, capped', () => {
    const tickets = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ticketAt(0, { ...oneBurger, table: n }));
    const h = new Harness(makeCtx(tickets)).tick();
    const lateAt = h.ticket.courses[0]!.lateAtMs!;
    h.until(lateAt + T.heat.lateRampMs);
    const before = h.heatDelta('late');
    h.until(lateAt + T.heat.lateRampMs + 2_000);
    // 8 fully-late courses: uncapped would be lateRate·√8 ≈ 4.5/s; the cap holds it to maxLateRate.
    expect((h.heatDelta('late') - before) / 2).toBeCloseTo(T.heat.maxLateRate, 1);
  });

  it('hitting max opens a critical window; recovering below the line saves the shift', () => {
    const h = new Harness(makeCtx([ticketAt(0, oneBurger)])).tick();
    h.do({ type: 'debug', action: { kind: 'setHeat', heat: T.heat.max } });
    expect(h.state.critical).not.toBeNull();
    expect(h.of('criticalStarted')).toHaveLength(1);
    h.do({ type: 'debug', action: { kind: 'setHeat', heat: T.heat.criticalRecoverBelow - 1 } });
    expect(h.state.critical).toBeNull();
    expect(h.of('criticalEnded')).toHaveLength(1);
    expect(h.state.phase).toBe('running');
  });

  it('staying critical past the grace window loses the shift (F, lost by heat)', () => {
    const h = new Harness(makeCtx([ticketAt(0, oneBurger)])).tick();
    h.do({ type: 'debug', action: { kind: 'setHeat', heat: T.heat.max } });
    const until = h.state.critical!.untilMs;
    h.until(until - 100);
    expect(h.state.phase).toBe('running');
    h.until(until);
    expect(h.state.summary).toMatchObject({ outcome: 'lost', lostBy: 'heat', grade: 'F', stars: 0 });
  });

  it('overtime cap: leftover tickets add heat, then the shift ends', () => {
    const duration = T.shift.durationMs[1];
    const patient: Tuning = { ...T, tickets: { ...T.tickets, graceBaseMs: 10_000_000 } };
    const h = new Harness(makeCtx([ticketAt(duration - 1_000, oneBurger)], patient)).until(
      duration + T.shift.overtimeCapMs + 100,
    );
    expect(h.state.phase).toBe('ended');
    expect(h.heatDelta('overtimeLeftover')).toBe(T.heat.overtimeLeftoverPerTicket);
    expect(h.state.summary!.ticketsLeft).toBe(1);
  });
});

describe('score + combo (5.4)', () => {
  it('a clean single-plate course scores plates + freshness (no sync), then grows the combo', () => {
    const h = fireAndSend(new Harness(makeCtx([ticketAt(0, oneBurger)])).tick());
    const sc = h.of('courseScored')[0]!;
    expect(sc).toMatchObject({ clean: true, perfect: false, syncPoints: 0, spreadMs: null, multiplier: 1 });
    expect(sc.total).toBe(T.score.platePoints + sc.freshPoints);
    expect(sc.freshPoints).toBeGreaterThan(T.score.freshPoints * 0.9);
    expect(h.state.combo).toBe(1 + T.score.combo.step);
  });

  it('the combo multiplies later courses and caps at max', () => {
    const tickets = Array.from({ length: 10 }, (_, i) => ticketAt(0, { ...oneBurger, table: i + 1 }));
    const patient: Tuning = { ...T, tickets: { ...T.tickets, graceBaseMs: 10_000_000 } };
    const h = new Harness(makeCtx(tickets, patient)).tick();
    for (let k = 0; k < 10; k++) fireAndSend(h);
    const mults = h.of('courseScored').map((e) => e.multiplier);
    expect(mults.slice(0, 3)).toEqual([1, 1.25, 1.5]);
    expect(Math.max(...mults)).toBe(T.score.combo.max);
  });

  it('a bad plate resets the combo; a SAVE keeps it', () => {
    const bad = {
      ...oneBurger,
      table: 2,
      forceDefect: { itemIdx: 0, defect: 'wrongMod' as PlateDefectKind },
    };
    const h = new Harness(
      makeCtx([ticketAt(0, oneBurger), ticketAt(0, bad), ticketAt(0, { ...bad, table: 3 })]),
    ).tick();
    fireAndSend(h); // clean: combo 1.25
    const saveTicket = h.ticket.id;
    h.do({ type: 'fire', ticketId: saveTicket, courseIdx: 0 }).untilTrue((s) => s.windowOrder.length === 1);
    h.do({ type: 'refire', plateId: h.state.windowOrder[0]! });
    expect(h.state.combo).toBe(1.25);
    expect(h.scoreFor('save')).toBe(T.score.saveBonus);
    h.untilTrue((s) => s.windowOrder.length === 1).do({ type: 'send', ticketId: saveTicket, courseIdx: 0 });
    expect(h.state.combo).toBe(1.5);
    fireAndSend(h); // the third ticket's bad plate escapes
    expect(h.state.combo).toBe(T.score.combo.start);
  });

  it('a dead plate knocks the combo down', () => {
    const h = new Harness(makeCtx([ticketAt(0, oneBurger), ticketAt(0, { ...oneBurger, table: 5 })])).tick();
    fireAndSend(h);
    fireAndSend(h); // combo 1.5
    const h2 = h.state.railOrder;
    expect(h2).toHaveLength(0);
    const g = new Harness(makeCtx([ticketAt(0, oneBurger)])).tick();
    g.state = { ...g.state, combo: 2 };
    g.do({ type: 'fire', ticketId: g.ticket.id, courseIdx: 0 }).untilTrue((s) => s.windowOrder.length === 1);
    g.until(g.plateFor(0)!.upAtMs + T.pass.plateDieMs);
    expect(g.state.combo).toBe(2 - T.score.combo.deadPlate);
  });

  it('clearing the rail after a rush is a CLEAN BOARD', () => {
    const tickets = [1, 2, 3].map((n) => ticketAt(0, { ...oneBurger, table: n }));
    const h = new Harness(makeCtx(tickets)).tick();
    for (let k = 0; k < 3; k++) fireAndSend(h);
    const cb = h.of('cleanBoard');
    expect(cb).toHaveLength(1);
    expect(cb[0]!.bonus).toBe(Math.round(T.score.cleanBoardBonus * 1.75));
    expect(h.heatDelta('cleanBoard')).toBe(T.heat.cleanBoard);
  });

  it('stars and grade come from the night’s score thresholds', () => {
    const duration = T.shift.durationMs[1];
    const h = fireAndSend(
      new Harness(makeCtx([ticketAt(duration - 25_000, oneBurger)])).until(duration - 25_000),
    );
    h.until(duration + 100);
    const sum = h.state.summary!;
    expect(sum.outcome).toBe('won');
    const expected = T.stars[1].filter((t) => sum.score >= t).length;
    expect(sum.stars).toBe(expected);
    expect(sum.grade).toBe(['D', 'C', 'B', 'A'][expected]);
  });
});
