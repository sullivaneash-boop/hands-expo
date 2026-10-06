/** Test helpers (used only by *.test.ts). Deterministic tuning: no jitter, no random defects. */
import { tuning, type NightId, type Tuning } from '../config/tuning';
import { content } from '../data';
import type { Content, FeatureFlag, ShiftBeat, TicketTemplate } from '../data/schema';
import { createSim, step, type PlayerCommand, type SimContext, type SimEvent, type SimState } from '.';

const noProcedural = { firstTicketMs: 0, segments: [], twoCourseChance: 0, allergyChance: 0, interrupts: {} };

/** No jitter, no random defects, no kitchen pick misses, no procedural tickets/interrupts. */
export const quietTuning: Tuning = {
  ...tuning,
  cook: { ...tuning.cook, jitterPct: 0 },
  defects: { ...tuning.defects, ratePerNight: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
  allergy: { ...tuning.allergy, pickMissRatePerNight: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
  courses: { eatMs: [15_000, 15_000] },
  nights: { 1: noProcedural, 2: noProcedural, 3: noProcedural, 4: noProcedural, 5: noProcedural },
};

export function makeCtx(
  beats: readonly ShiftBeat[],
  t: Tuning = quietTuning,
  features: readonly FeatureFlag[] = [],
  nightId: NightId = 1,
): SimContext {
  const c: Content = {
    ...content,
    shifts: [{ id: nightId, name: 'Test', tagline: 'test', clockStartHour: 17, features, beats }],
  };
  return { tuning: t, content: c };
}

export const ticketAt = (atMs: number, ticket: TicketTemplate): ShiftBeat => ({
  atMs,
  type: 'ticket',
  ticket,
});

export const oneBurger: TicketTemplate = {
  table: 12,
  server: 'maya',
  guests: 1,
  courses: [{ kind: 'main', items: [{ seat: 1, menuId: 'burger', mods: ['medium', 'no_onion', 'fries'] }] }],
};

export const burgerAndSalad: TicketTemplate = {
  table: 21,
  server: 'jen',
  guests: 2,
  courses: [
    {
      kind: 'main',
      items: [
        { seat: 1, menuId: 'burger', mods: ['medium', 'fries'] },
        { seat: 2, menuId: 'chop', mods: ['no_tomato'] },
      ],
    },
  ],
};

/** A tiny driver: run ticks, queue commands, collect events. */
export class Harness {
  state: SimState;
  events: SimEvent[] = [];
  private queue: PlayerCommand[] = [];

  constructor(
    readonly ctx: SimContext,
    seed = 1,
    nightId: NightId = ctx.content.shifts[0]?.id ?? 1,
  ) {
    this.state = createSim(seed, nightId, ctx);
  }

  do(cmd: PlayerCommand): this {
    this.queue.push(cmd);
    return this.tick();
  }

  tick(n = 1): this {
    for (let i = 0; i < n; i++) {
      const r = step(this.state, this.queue, this.ctx);
      this.queue = [];
      this.state = r.state;
      this.events.push(...r.events);
    }
    return this;
  }

  /** Advance until sim time ≥ ms. */
  until(ms: number): this {
    while (this.state.nowMs < ms && this.state.phase !== 'ended') this.tick();
    return this;
  }

  /** Advance until predicate holds (max 100k ticks). */
  untilTrue(pred: (s: SimState) => boolean): this {
    for (let i = 0; i < 100_000 && !pred(this.state); i++) this.tick();
    if (!pred(this.state)) throw new Error('condition never became true');
    return this;
  }

  of<T extends SimEvent['type']>(type: T): Extract<SimEvent, { type: T }>[] {
    return this.events.filter((e): e is Extract<SimEvent, { type: T }> => e.type === type);
  }

  get ticket() {
    const id = this.state.railOrder[0];
    if (!id) throw new Error('no live ticket');
    return this.state.tickets[id]!;
  }

  plateFor(itemIdx: number) {
    const item = this.ticket.courses[0]!.items[itemIdx]!;
    return item.plateId ? this.state.plates[item.plateId]! : null;
  }

  healthDelta(reason: string): number {
    return this.state.stats.healthByReason[reason as keyof SimState['stats']['healthByReason']] ?? 0;
  }
}
