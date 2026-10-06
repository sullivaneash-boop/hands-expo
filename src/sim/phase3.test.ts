import { describe, expect, it } from 'vitest';
import type { FeatureFlag, ShiftBeat, TicketTemplate } from '../data/schema';
import { baseCookMs } from './plates';
import { Harness, makeCtx, oneBurger, quietTuning, ticketAt } from './testkit';

const T = quietTuning;
const ALL: FeatureFlag[] = ['courses', 'addons', '86', 'refire', 'drag', 'allergy', 'bar', 'manager'];
const ctxFor = (beats: readonly ShiftBeat[], nightId: 1 | 2 | 3 | 4 | 5 = 4) =>
  makeCtx(beats, T, ALL, nightId);
const ask = (
  atMs: number,
  interrupt: string,
  extra: Partial<Extract<ShiftBeat, { type: 'interrupt' }>> = {},
) => ({ atMs, type: 'interrupt', interrupt, ...extra }) as ShiftBeat;

const twoCourse: TicketTemplate = {
  table: 21,
  server: 'jen',
  guests: 2,
  courses: [
    { kind: 'app', items: [{ seat: 'share', menuId: 'burrata', mods: [] }] },
    {
      kind: 'main',
      hold: true,
      items: [
        { seat: 1, menuId: 'salmon', mods: ['asparagus'] },
        { seat: 2, menuId: 'burger', mods: ['medium', 'fries'] },
      ],
    },
  ],
};

const salmonAndBurger: TicketTemplate = {
  table: 44,
  server: 'jen',
  guests: 2,
  courses: [
    {
      kind: 'main',
      items: [
        { seat: 1, menuId: 'salmon', mods: ['potato'] },
        { seat: 2, menuId: 'burger', mods: ['medium', 'fries'] },
      ],
    },
  ],
};

const allergyTicket: TicketTemplate = {
  table: 32,
  server: 'luis',
  guests: 2,
  allergy: { seat: 2, allergen: 'shellfish' },
  courses: [
    {
      kind: 'main',
      items: [
        { seat: 1, menuId: 'chop', mods: [] },
        { seat: 2, menuId: 'chop', mods: [] },
      ],
    },
  ],
};

const firstDoor = (h: Harness) => h.state.interrupts[h.state.interruptOrder[0]!]!;
const fireAll = (h: Harness, courseIdx = 0) => h.do({ type: 'fire', ticketId: h.ticket.id, courseIdx });

describe('cook times from modifiers (owner playtest, D-053)', () => {
  const ctx = ctxFor([]);
  const ms = (menuId: string, mods: string[]) => baseCookMs(ctx, { menuId, mods });
  it('steak temps: rare < med rare < medium < med well < well done', () => {
    const temps = ['rare', 'med_rare', 'medium', 'med_well', 'well_done'].map((d) => ms('strip', [d]));
    expect([...temps].sort((a, b) => a - b)).toEqual(temps);
    expect(new Set(temps).size).toBe(5);
  });
  it('half chicken takes as long as a medium strip', () => {
    expect(ms('chicken', [])).toBe(ms('strip', ['medium']));
  });
  it('protein on a salad takes longer', () => {
    expect(ms('chop', ['add_chicken'])).toBeGreaterThan(ms('chop', []));
    expect(ms('chop', ['add_steak'])).toBeGreaterThan(ms('chop', []));
  });
  it('the kitchen actually uses it', () => {
    const h = new Harness(
      ctxFor([
        ticketAt(0, {
          ...oneBurger,
          courses: [{ kind: 'main', items: [{ seat: 1, menuId: 'strip', mods: ['well_done'] }] }],
        }),
      ]),
    ).tick();
    fireAll(h);
    const job = h.state.cooking[0]!;
    expect(job.doneAtMs - job.firedAtMs).toBe(ms('strip', ['well_done']));
  });
});

describe('courses + HOLD (3.1)', () => {
  it('apps are ready at print; HOLD mains wait', () => {
    const h = new Harness(ctxFor([ticketAt(0, twoCourse)])).tick();
    expect(h.ticket.courses[0]!.readyAtMs).toBe(h.ticket.printedAtMs);
    expect(h.ticket.courses[1]!.readyAtMs).toBeNull();
  });

  it('sending apps → the table eats → the server asks to fire → HEARD makes mains ready', () => {
    const h = new Harness(ctxFor([ticketAt(0, twoCourse)])).tick();
    fireAll(h).untilTrue((s) => s.windowOrder.length === 1);
    h.do({ type: 'send', ticketId: h.ticket.id, courseIdx: 0 });
    const sentAt = h.state.nowMs;
    expect(h.state.pending).toHaveLength(1);
    h.until(sentAt + T.courses.eatMs[0]!);
    expect(firstDoor(h).defId).toBe('server_fire');
    h.do({ type: 'answer', interruptId: firstDoor(h).id, choice: 'heard' });
    expect(h.ticket.courses[1]!.readyAtMs).toBe(h.state.nowMs);
    expect(h.ticket.courses[1]!.fireHeard).toBe(true);
    expect(h.of('courseReady').at(-1)).toMatchObject({ courseIdx: 1, heard: true });
  });

  it('ignoring the fire request: course still becomes ready, but costs interruptTimeout', () => {
    const h = new Harness(ctxFor([ticketAt(0, twoCourse)])).tick();
    fireAll(h).untilTrue((s) => s.windowOrder.length === 1);
    h.do({ type: 'send', ticketId: h.ticket.id, courseIdx: 0 });
    h.untilTrue((s) => s.interruptOrder.length === 1);
    h.until(h.state.nowMs + T.interrupts.patienceMs.server);
    expect(h.ticket.courses[1]!.readyAtMs).not.toBeNull();
    expect(h.ticket.courses[1]!.fireHeard).toBe(false);
    expect(h.healthDelta('interruptTimeout')).toBe(T.score.interruptTimeout);
  });

  it('firing and sending HOLD mains before the table is ready lands early (−5)', () => {
    const h = new Harness(ctxFor([ticketAt(0, twoCourse)])).tick();
    fireAll(h, 1).untilTrue((s) => s.windowOrder.length === 2);
    h.do({ type: 'send', ticketId: h.ticket.id, courseIdx: 1 });
    expect(h.healthDelta('landedEarly')).toBe(T.score.landedEarly);
    expect(h.of('courseSent')[0]!.early).toBe(true);
    expect(h.of('courseSent')[0]!.synced).toBe(false);
  });

  it('anticipating is fine: fire mains early, send after the table is ready → no penalty', () => {
    const h = new Harness(ctxFor([ticketAt(0, twoCourse)])).tick();
    fireAll(h).untilTrue((s) => s.windowOrder.length === 1);
    h.do({ type: 'send', ticketId: h.ticket.id, courseIdx: 0 });
    fireAll(h, 1); // fire mains while the table is still eating apps
    h.untilTrue((s) => s.interruptOrder.length === 1);
    h.do({ type: 'answer', interruptId: firstDoor(h).id, choice: 'heard' });
    h.untilTrue((s) => s.windowOrder.length === 2);
    h.do({ type: 'send', ticketId: h.state.railOrder[0]!, courseIdx: 1 });
    expect(h.healthDelta('landedEarly')).toBe(0);
    expect(h.of('ticketCleared')).toHaveLength(1);
  });

  it('per-course lateness: HOLD mains do not go late before they are ready', () => {
    const h = new Harness(ctxFor([ticketAt(0, twoCourse)])).until(120_000);
    // Apps (never fired) are late; mains never became ready so they never drain.
    expect(h.ticket.courses[1]!.lateAtMs).toBeNull();
    expect(h.of('ticketLate').map((e) => e.courseIdx)).toEqual([0]);
  });
});

describe('add-on chits (3.2)', () => {
  it('server_addon prints a small ADD ON chit attached to the open table', () => {
    const h = new Harness(
      ctxFor([ticketAt(0, salmonAndBurger), ask(1_000, 'server_addon', { target: { table: 44 } })]),
    ).until(1_000);
    const chit = h.state.tickets[h.state.railOrder[1]!]!;
    expect(chit).toMatchObject({ kind: 'addon', parentId: h.ticket.id, table: 44 });
    expect(chit.courses[0]!.items[0]!.menuId).toBe('side_fries');
    expect(h.of('ticketPrinted').at(-1)!.addon).toBe(true);
    expect(h.state.barks.at(-1)!.defId).toBe('server_addon');
  });
});

describe('kitchen problems (3.3)', () => {
  it('a dropped plate is remade on the fly at no health cost', () => {
    const h = new Harness(ctxFor([ticketAt(0, oneBurger)])).tick();
    fireAll(h).untilTrue((s) => s.windowOrder.length === 1);
    h.do({ type: 'debug', action: { kind: 'triggerInterrupt', interrupt: 'kitchen_refire' } });
    expect(h.state.windowOrder).toHaveLength(0);
    expect(h.state.cooking[0]!.onTheFly).toBe(true);
    expect(h.state.health).toBe(100);
    expect(h.state.barks.at(-1)!.vars).toMatchObject({ item: 'HOUSE BURGER', table: 12 });
  });

  it('a dragging station slows jobs already cooking and new ones', () => {
    const h = new Harness(ctxFor([ticketAt(0, salmonAndBurger)])).tick();
    fireAll(h);
    const burger = () => h.state.cooking.find((j) => j.station === 'grill')!;
    const before = burger().doneAtMs - h.state.nowMs;
    h.do({ type: 'debug', action: { kind: 'triggerInterrupt', interrupt: 'kitchen_drag', arg: 'grill' } });
    const after = burger().doneAtMs - h.state.nowMs;
    expect(after).toBeGreaterThan(before * 1.4);
    expect(h.state.cooking.find((j) => j.station === 'saute')!.doneAtMs).toBeLessThan(burger().doneAtMs);
  });
});

describe('86 (3.4)', () => {
  const beats = [ticketAt(0, salmonAndBurger), ask(500, 'kitchen_86', { arg: 'salmon' })];

  it('flags held instances; firing the course still fires the rest and costs fired86 for the 86’d item', () => {
    const h = new Harness(ctxFor(beats)).until(500);
    expect(h.state.eighty6).toEqual(['salmon']);
    expect(h.ticket.courses[0]!.items[0]!.eightySixed).toBe(true);
    fireAll(h);
    expect(h.healthDelta('fired86')).toBe(T.score.fired86);
    expect(h.ticket.courses[0]!.items.map((i) => i.state)).toEqual(['held', 'cooking']);
  });

  it('resolve by substitute: the house way (MEDIUM + default side), then it can fire', () => {
    const h = new Harness(ctxFor(beats)).until(500);
    const item = h.ticket.courses[0]!.items[0]!;
    h.do({ type: 'resolve86', ticketId: h.ticket.id, itemId: item.id, subMenuId: 'strip' });
    expect(h.ticket.courses[0]!.items[0]).toMatchObject({
      menuId: 'strip',
      mods: ['medium', 'potato'],
      eightySixed: false,
    });
    fireAll(h);
    expect(h.ticket.courses[0]!.items.every((i) => i.state === 'cooking')).toBe(true);
  });

  it('resolve by void: the rest of the table completes without it', () => {
    const h = new Harness(ctxFor(beats)).until(500);
    h.do({
      type: 'resolve86',
      ticketId: h.ticket.id,
      itemId: h.ticket.courses[0]!.items[0]!.id,
      subMenuId: null,
    });
    fireAll(h).untilTrue((s) => s.windowOrder.length === 1);
    h.do({ type: 'send', ticketId: h.ticket.id, courseIdx: 0 });
    expect(h.of('ticketCleared')).toHaveLength(1);
  });

  it('cannot sub an 86’d or different-course item', () => {
    const h = new Harness(ctxFor(beats)).until(500);
    const id = h.ticket.courses[0]!.items[0]!.id;
    h.do({ type: 'resolve86', ticketId: h.ticket.id, itemId: id, subMenuId: 'salmon' });
    h.do({ type: 'resolve86', ticketId: h.ticket.id, itemId: id, subMenuId: 'burrata' });
    expect(h.of('commandRejected')).toHaveLength(2);
  });

  it('tickets rung in after the 86 print already flagged', () => {
    const h = new Harness(ctxFor([...beats, ticketAt(1_000, { ...salmonAndBurger, table: 50 })])).until(
      1_000,
    );
    expect(h.state.tickets[h.state.railOrder[1]!]!.courses[0]!.items[0]!.eightySixed).toBe(true);
  });
});

describe('bar + manager (3.5)', () => {
  it('bar_delay: sending before the drinks costs sentBeforeBar; HEARD stamps the ticket', () => {
    const h = new Harness(
      ctxFor([ticketAt(0, oneBurger), ask(100, 'bar_delay', { target: { table: 12 } })]),
    ).until(100);
    expect(h.ticket.flags.notBeforeMs).toBe(100 + T.bar.delayMs);
    h.do({ type: 'answer', interruptId: firstDoor(h).id, choice: 'heard' });
    expect(h.ticket.known.bar).toBe(true);
    fireAll(h).untilTrue((s) => s.windowOrder.length === 1);
    expect(h.state.nowMs).toBeLessThan(h.ticket.flags.notBeforeMs!);
    h.do({ type: 'send', ticketId: h.ticket.id, courseIdx: 0 });
    expect(h.healthDelta('sentBeforeBar')).toBe(T.score.sentBeforeBar);
  });

  it('manager_push: the table goes late sooner and drains double', () => {
    const h = new Harness(
      ctxFor([ticketAt(0, oneBurger), ask(1_000, 'manager_push', { target: { table: 12 } })]),
    ).until(1_000);
    expect(h.ticket.courses[0]!.lateAtMs).toBe(1_000 + T.manager.pushGraceMs);
    h.until(1_000 + T.manager.pushGraceMs + 2_000);
    expect(h.healthDelta('late')).toBe(-2 * T.manager.pushDrainMultiplier * T.score.lateDrainPerSec);
  });

  it('manager_vip: bad plates for that table cost double', () => {
    const vipBurger = { ...oneBurger, forceDefect: { itemIdx: 0, defect: 'wrongMod' as const } };
    const h = new Harness(
      ctxFor([ticketAt(0, vipBurger), ask(100, 'manager_vip', { target: { table: 12 } })]),
    ).until(100);
    fireAll(h).untilTrue((s) => s.windowOrder.length === 1);
    h.do({ type: 'send', ticketId: h.ticket.id, courseIdx: 0 });
    expect(h.healthDelta('wrongModSent')).toBe(T.score.wrongModSent * T.manager.vipPenaltyMultiplier);
  });
});

describe('allergy (3.6)', () => {
  it('fired without ACK: the allergy plate has no pick; sending it is an allergy incident', () => {
    const h = new Harness(ctxFor([ticketAt(0, allergyTicket)])).tick();
    fireAll(h).untilTrue((s) => s.windowOrder.length === 2);
    const plates = h.state.windowOrder.map((id) => h.state.plates[id]!);
    expect(plates.every((p) => !p.build.allergyPick)).toBe(true);
    h.do({ type: 'send', ticketId: h.ticket.id, courseIdx: 0 });
    expect(h.healthDelta('allergyIncident')).toBe(T.score.allergyIncident);
    expect(h.state.stats.allergyIncidents).toBe(1);
  });

  it('ACK before firing: the seat-2 plate arrives with a pick, takes the protocol time, no incident', () => {
    const h = new Harness(ctxFor([ticketAt(0, allergyTicket)])).tick();
    h.do({ type: 'ackAllergy', ticketId: h.ticket.id });
    fireAll(h);
    const [a, b] = [...h.state.cooking].sort((x, y) => (x.itemId < y.itemId ? -1 : 1));
    expect(b!.doneAtMs - a!.doneAtMs).toBe(T.cook.allergyExtraMs);
    h.untilTrue((s) => s.windowOrder.length === 2);
    const seat2 = h.state.windowOrder.map((id) => h.state.plates[id]!).find((p) => p.seat === 2)!;
    expect(seat2.build.allergyPick).toBe(true);
    h.do({ type: 'send', ticketId: h.ticket.id, courseIdx: 0 });
    expect(h.healthDelta('allergyIncident')).toBe(0);
  });

  it('catching an unpicked plate counts as a correct refire; ACK first and the remake comes picked', () => {
    const h = new Harness(ctxFor([ticketAt(0, allergyTicket)])).tick();
    fireAll(h).untilTrue((s) => s.windowOrder.length === 2);
    const seat2 = h.state.windowOrder.map((id) => h.state.plates[id]!).find((p) => p.seat === 2)!;
    h.do({ type: 'ackAllergy', ticketId: h.ticket.id });
    h.do({ type: 'refire', plateId: seat2.id });
    expect(h.state.stats.errorsCaught).toBe(1);
    expect(h.state.cooking[0]!.allergyProtocol).toBe(true);
  });

  it('Night 5: an allergy incident ends the shift (lost by allergy)', () => {
    const h = new Harness(ctxFor([ticketAt(0, allergyTicket)], 5), 1, 5).tick();
    fireAll(h).untilTrue((s) => s.windowOrder.length === 2);
    h.do({ type: 'send', ticketId: h.ticket.id, courseIdx: 0 });
    expect(h.state.phase).toBe('ended');
    expect(h.state.summary).toMatchObject({ outcome: 'lost', lostBy: 'allergy', grade: 'F' });
  });
});
