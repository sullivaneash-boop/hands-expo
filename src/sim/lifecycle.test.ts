import { describe, expect, it } from 'vitest';
import { burgerAndSalad, Harness, makeCtx, oneBurger, quietTuning, ticketAt } from './testkit';

const T = quietTuning;
const STD = T.cook.tierMs.standard;
const QUICK = T.cook.tierMs.quick;

describe('schedule (2.2)', () => {
  it('prints beats in order at their atMs', () => {
    const ctx = makeCtx([ticketAt(1_000, oneBurger), ticketAt(3_000, { ...burgerAndSalad, table: 40 })]);
    const h = new Harness(ctx).until(950);
    expect(h.of('ticketPrinted')).toHaveLength(0);
    h.until(1_000);
    expect(h.of('ticketPrinted').map((e) => e.table)).toEqual([12]);
    h.until(3_000);
    expect(h.of('ticketPrinted').map((e) => e.table)).toEqual([12, 40]);
    expect(h.state.railOrder).toHaveLength(2);
  });

  it('computes lateAt from grace base + per item', () => {
    const h = new Harness(makeCtx([ticketAt(1_000, burgerAndSalad)])).until(1_000);
    expect(h.ticket.courses[0]!.lateAtMs!).toBe(1_000 + T.tickets.graceBaseMs + 2 * T.tickets.gracePerItemMs);
  });
});

describe('fire + kitchen (2.3)', () => {
  it('a fired burger becomes a plate exactly tierMs later', () => {
    const h = new Harness(makeCtx([ticketAt(1_000, oneBurger)])).until(1_000);
    const id = h.ticket.id;
    h.do({ type: 'fire', ticketId: id, courseIdx: 0 });
    const firedAt = h.state.nowMs;
    expect(h.ticket.courses[0]!.items[0]!.state).toBe('cooking');
    h.until(firedAt + STD - 50);
    expect(h.state.windowOrder).toHaveLength(0);
    h.until(firedAt + STD);
    expect(h.state.windowOrder).toHaveLength(1);
    expect(h.of('plateUp')).toHaveLength(1);
    expect(h.plateFor(0)!.build).toEqual({
      menuId: 'burger',
      mods: ['medium', 'no_onion', 'fries'],
      allergyPick: false,
    });
  });

  it('fires a single item, and rejects firing it twice', () => {
    const h = new Harness(makeCtx([ticketAt(1_000, burgerAndSalad)])).until(1_000);
    const t = h.ticket;
    h.do({ type: 'fire', ticketId: t.id, courseIdx: 0, itemId: t.courses[0]!.items[0]!.id });
    expect(h.ticket.courses[0]!.items.map((i) => i.state)).toEqual(['cooking', 'held']);
    h.do({ type: 'fire', ticketId: t.id, courseIdx: 0, itemId: t.courses[0]!.items[0]!.id });
    expect(h.of('commandRejected')).toHaveLength(1);
  });

  it('a forced defect shows up in the plate build', () => {
    const ctx = makeCtx([
      ticketAt(0, { ...oneBurger, forceDefect: { itemIdx: 0, defect: 'missingComponent' } }),
    ]);
    const h = new Harness(ctx).tick();
    h.do({ type: 'fire', ticketId: h.ticket.id, courseIdx: 0 }).untilTrue((s) => s.windowOrder.length > 0);
    expect(h.plateFor(0)!.build.mods).toEqual(['medium', 'no_onion']);
  });
});

describe('pass: send / refire / die (2.4)', () => {
  it('full lifecycle: print → fire → up → send → cleared (+tableComplete +sync)', () => {
    const h = new Harness(makeCtx([ticketAt(0, burgerAndSalad)])).tick();
    const id = h.ticket.id;
    // Stagger so both land together: fire the burger, then the salad when it'll land at the same time.
    h.do({ type: 'fire', ticketId: id, courseIdx: 0, itemId: `${id}.0` });
    h.tick((STD - QUICK) / T.sim.tickMs - 1);
    h.do({ type: 'fire', ticketId: id, courseIdx: 0, itemId: `${id}.1` });
    h.untilTrue((s) => s.windowOrder.length === 2);
    h.do({ type: 'send', ticketId: id, courseIdx: 0 });
    expect(h.state.railOrder).toHaveLength(0);
    expect(h.state.tickets[id]).toBeUndefined();
    expect(h.state.windowOrder).toHaveLength(0);
    const sent = h.of('courseSent')[0]!;
    expect(sent).toMatchObject({ complete: true, synced: true, errors: [] });
    expect(h.of('ticketCleared')[0]).toMatchObject({ clean: true });
    const scored = h.of('courseScored')[0]!;
    expect(scored).toMatchObject({ clean: true, perfect: true, plates: 2, multiplier: 1, spreadMs: 0 });
    expect(scored.total).toBe(2 * T.score.platePoints + T.score.syncPoints + scored.freshPoints);
    expect(h.scoreFor('perfectSync')).toBe(T.score.perfectSyncBonus);
    expect(h.scoreFor('tableComplete')).toBe(T.score.tableComplete);
    expect(h.state.combo).toBe(T.score.combo.start + T.score.combo.step);
    expect(h.heatDelta('cleanCourse')).toBe(T.heat.cleanCourse);
    expect(h.state.stats.ticketsCleared).toBe(1);
  });

  it('no sync bonus when plates land far apart', () => {
    const h = new Harness(makeCtx([ticketAt(0, burgerAndSalad)])).tick();
    h.do({ type: 'fire', ticketId: h.ticket.id, courseIdx: 0 }).untilTrue((s) => s.windowOrder.length === 2);
    h.do({ type: 'send', ticketId: h.ticket.id, courseIdx: 0 });
    expect(h.of('courseSent')[0]!.synced).toBe(false);
  });

  it('incomplete send: −8, remaining item stays live and can be sent later', () => {
    const h = new Harness(makeCtx([ticketAt(0, burgerAndSalad)])).tick();
    const id = h.ticket.id;
    h.do({ type: 'fire', ticketId: id, courseIdx: 0 }).untilTrue((s) => s.windowOrder.length === 1);
    h.do({ type: 'send', ticketId: id, courseIdx: 0 });
    expect(h.heatDelta('incompleteSend')).toBe(T.heat.incompleteSend);
    expect(h.state.tickets[id]!.courses[0]!.items.map((i) => i.state)).toEqual(['cooking', 'sent']);
    h.untilTrue((s) => s.windowOrder.length === 1).do({ type: 'send', ticketId: id, courseIdx: 0 });
    expect(h.state.tickets[id]).toBeUndefined();
    expect(h.of('ticketCleared')).toHaveLength(1);
  });

  it('refire a bad plate: a SAVE (score, heat relief), remade on the fly (faster)', () => {
    const ctx = makeCtx([ticketAt(0, { ...oneBurger, forceDefect: { itemIdx: 0, defect: 'wrongMod' } })]);
    const h = new Harness(ctx).tick();
    h.do({ type: 'fire', ticketId: h.ticket.id, courseIdx: 0 }).untilTrue((s) => s.windowOrder.length === 1);
    h.do({ type: 'refire', plateId: h.plateFor(0)!.id });
    expect(h.scoreFor('save')).toBe(T.score.saveBonus);
    expect(h.heatDelta('save')).toBe(T.heat.caughtDefect);
    expect(h.state.stats.errorsCaught).toBe(1);
    expect(h.of('plateRefired')[0]!.correct).toBe(true);
    const job = h.state.cooking[0]!;
    expect(job.onTheFly).toBe(true);
    expect(job.doneAtMs! - job.startedAtMs!).toBe(Math.round(STD * T.cook.onTheFlyFactor));
    expect(h.ticket.courses[0]!.items[0]!.makes).toBe(2);
  });

  it('refire a good plate costs refireUnneeded', () => {
    const h = new Harness(makeCtx([ticketAt(0, oneBurger)])).tick();
    h.do({ type: 'fire', ticketId: h.ticket.id, courseIdx: 0 }).untilTrue((s) => s.windowOrder.length === 1);
    h.do({ type: 'refire', plateId: h.plateFor(0)!.id });
    expect(h.heatDelta('refireUnneeded')).toBe(T.heat.refireUnneeded);
    expect(h.state.stats.refiresUnneeded).toBe(1);
  });

  it('a plate left in the window dies after plateDieMs and is auto-refired', () => {
    const h = new Harness(makeCtx([ticketAt(0, oneBurger)])).tick();
    h.do({ type: 'fire', ticketId: h.ticket.id, courseIdx: 0 }).untilTrue((s) => s.windowOrder.length === 1);
    const upAt = h.plateFor(0)!.upAtMs;
    h.until(upAt + T.pass.plateDieMs - 50);
    expect(h.of('plateDied')).toHaveLength(0);
    h.until(upAt + T.pass.plateDieMs);
    expect(h.of('plateDied')).toHaveLength(1);
    expect(h.heatDelta('plateDied')).toBe(T.heat.plateDied);
    expect(h.state.windowOrder).toHaveLength(0);
    expect(h.ticket.courses[0]!.items[0]!.state).toBe('cooking');
    expect(h.state.cooking[0]!.onTheFly).toBe(true);
  });

  it('send with nothing up is rejected', () => {
    const h = new Harness(makeCtx([ticketAt(0, oneBurger)])).tick();
    h.do({ type: 'send', ticketId: h.ticket.id, courseIdx: 0 });
    expect(h.of('commandRejected')[0]!.reason).toMatch(/nothing in the window/);
  });
});
