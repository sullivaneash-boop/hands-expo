import type { SimContext } from './context';
import type { SimEvent } from './events';
import { Rng } from './rng';
import {
  RNG_STREAMS,
  type ActiveInterrupt,
  type Plate,
  type RngStream,
  type ScoreReason,
  type SimState,
  type Ticket,
} from './state';

/**
 * Copy-on-write working state for one step. Systems mutate `w.s` through the helpers below;
 * untouched entities keep their previous object identity so React selectors don't re-render.
 */
export class Work {
  readonly s: {
    -readonly [K in keyof SimState]: SimState[K];
  };
  readonly events: SimEvent[] = [];
  readonly rng: Record<RngStream, Rng>;
  private touched = new Set<string>();
  private copiedMaps = new Set<'tickets' | 'plates' | 'interrupts'>();
  private statsCopied = false;

  constructor(
    prev: SimState,
    readonly ctx: SimContext,
  ) {
    this.s = { ...prev };
    this.rng = {} as Record<RngStream, Rng>;
    for (const stream of RNG_STREAMS) this.rng[stream] = new Rng(prev.rng[stream]);
  }

  get now(): number {
    return this.s.nowMs;
  }

  emit(e: SimEvent): void {
    this.events.push(e);
  }

  nextId(prefix: string): string {
    this.s.ids = { ...this.s.ids, next: this.s.ids.next + 1 };
    return `${prefix}${this.s.ids.next}`;
  }

  nextOrderNo(): number {
    this.s.ids = { ...this.s.ids, orderNo: this.s.ids.orderNo + 1 };
    return this.s.ids.orderNo;
  }

  private ownMap<K extends 'tickets' | 'plates' | 'interrupts'>(key: K): Record<string, SimState[K][string]> {
    if (!this.copiedMaps.has(key)) {
      (this.s as Record<K, unknown>)[key] = { ...this.s[key] };
      this.copiedMaps.add(key);
    }
    return this.s[key] as Record<string, SimState[K][string]>;
  }

  /** Mutable ticket (cloned on first touch this step). */
  ticket(id: string): Ticket {
    const map = this.ownMap('tickets');
    const t = map[id];
    if (!t) throw new Error(`no ticket ${id}`);
    const key = `t:${id}`;
    if (!this.touched.has(key)) {
      map[id] = structuredClone(t);
      this.touched.add(key);
    }
    return map[id] as Ticket;
  }

  putTicket(t: Ticket): void {
    this.ownMap('tickets')[t.id] = t;
    this.touched.add(`t:${t.id}`);
  }

  deleteTicket(id: string): void {
    Reflect.deleteProperty(this.ownMap('tickets'), id);
  }

  putPlate(p: Plate): void {
    this.ownMap('plates')[p.id] = p;
  }

  deletePlate(id: string): void {
    Reflect.deleteProperty(this.ownMap('plates'), id);
  }

  putInterrupt(i: ActiveInterrupt): void {
    this.ownMap('interrupts')[i.id] = i;
  }

  deleteInterrupt(id: string): void {
    Reflect.deleteProperty(this.ownMap('interrupts'), id);
  }

  /** Mutable stats (cloned on first touch this step). */
  get stats(): SimState['stats'] {
    if (!this.statsCopied) {
      this.s.stats = structuredClone(this.s.stats);
      this.statsCopied = true;
    }
    return this.s.stats;
  }

  /** Apply a health change (clamped), record it by reason, emit healthChanged. */
  health(delta: number, reason: ScoreReason): void {
    if (delta === 0) return;
    const { maxHealth } = this.ctx.tuning.score;
    const before = this.s.health;
    this.s.health = Math.max(0, Math.min(maxHealth, before + delta));
    const applied = this.s.health - before;
    const byReason = this.stats.healthByReason;
    byReason[reason] = (byReason[reason] ?? 0) + delta;
    this.emit({ type: 'healthChanged', delta, applied, reason, health: this.s.health });
  }

  finish(): SimState {
    const rng = {} as Record<RngStream, SimState['rng'][RngStream]>;
    for (const stream of RNG_STREAMS) rng[stream] = this.rng[stream].state;
    return { ...this.s, rng };
  }
}
