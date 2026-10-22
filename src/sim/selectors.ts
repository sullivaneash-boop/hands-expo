/**
 * Derived, read-only views of sim state shared by the sim, the UI and the bot.
 * Pure functions; no state changes.
 */
import type { StationId } from '../data/schema';
import type { SimContext } from './context';
import { needsAllergyPick } from './lookup';
import { plateError } from './plates';
import type { Course, Plate, SimState, StatusAnswer, Ticket } from './state';

export const STATUS_ANSWERS: readonly StatusAnswer[] = ['notFired', 'cooking', 'partial', 'window'];

/** The truthful answer to "where's my table?" for a ticket. */
export function ticketStatus(ticket: Ticket): StatusAnswer {
  const live = ticket.courses.flatMap((c) => c.items).filter((i) => i.state !== 'sent' && i.state !== 'void');
  if (live.length === 0 || live.every((i) => i.state === 'held')) return 'notFired';
  if (live.every((i) => i.state === 'up')) return 'window';
  if (live.some((i) => i.state === 'up')) return 'partial';
  return 'cooking';
}

export type CourseStatus = 'waiting' | 'held' | 'cooking' | 'partial' | 'up' | 'sent';

/** 'waiting' = a HOLD course the table isn't ready for and nothing fired yet. */
export function courseStatus(course: Course): CourseStatus {
  const live = course.items.map((i) => i.state).filter((s) => s !== 'void');
  if (live.every((s) => s === 'sent')) return 'sent';
  const open = live.filter((s) => s !== 'sent');
  if (open.every((s) => s === 'held')) return course.hold && course.readyAtMs === null ? 'waiting' : 'held';
  if (open.every((s) => s === 'up')) return 'up';
  if (open.some((s) => s === 'up')) return 'partial';
  return 'cooking';
}

/** Is this plate wrong? (Debug overlay / bot only — the UI must not reveal this to the player.) */
export function plateIsWrong(ctx: SimContext, state: SimState, plate: Plate): boolean {
  const ticket = state.tickets[plate.ticketId];
  const item = ticket?.courses[plate.courseIdx]?.items.find((i) => i.id === plate.itemId);
  return ticket && item ? plateError(ctx, item, plate.build, needsAllergyPick(ticket, item)) !== null : false;
}

export function liveTickets(state: SimState): Ticket[] {
  return state.railOrder.map((id) => state.tickets[id]).filter((t): t is Ticket => !!t);
}

/** Does this plate belong on the allergy seat? (Visible to the player: it's printed on the ticket.) */
export function plateNeedsPick(state: SimState, plate: Plate): boolean {
  const ticket = state.tickets[plate.ticketId];
  return !!ticket?.allergy && plate.seat === ticket.allergy.seat;
}

/** Effective cook slots at a station right now (mirrors the kitchen's rule; a dragging station loses some). */
export function stationCapacity(ctx: SimContext, state: SimState, station: StationId): number {
  const { kitchen } = ctx.tuning;
  const dragging = state.nowMs < state.stations[station].dragUntilMs;
  return Math.max(1, kitchen.slots[station] - (dragging ? kitchen.dragSlotPenalty : 0));
}

/**
 * When would a newly fired item at `station` start cooking? Plays the slot timeline forward:
 * cooking jobs free their slots at doneAt, queued jobs take slots in order.
 * `extra` = cook times of items about to be fired at this station ahead of it (same batch).
 */
export function stationStartEstimate(
  ctx: SimContext,
  state: SimState,
  station: StationId,
  extra: readonly number[] = [],
): number {
  const now = state.nowMs;
  const cap = stationCapacity(ctx, state, station);
  const jobs = state.cooking.filter((j) => j.station === station && j.status !== 'waiting');
  const slots = jobs
    .filter((j) => j.status === 'cooking')
    .map((j) => j.doneAtMs ?? now)
    .sort((a, b) => a - b);
  while (slots.length < cap) slots.push(now);
  slots.sort((a, b) => a - b);
  const queued = jobs
    .filter((j) => j.status === 'queued')
    .sort((a, b) => Number(b.onTheFly) - Number(a.onTheFly) || a.firedAtMs - b.firedAtMs)
    .map((j) => j.baseMs);
  for (const ms of [...queued, ...extra]) {
    const t = Math.max(now, slots.shift() ?? now);
    slots.push(t + ms);
    slots.sort((a, b) => a - b);
  }
  return Math.max(now, slots[0] ?? now);
}
