/**
 * Derived, read-only views of sim state shared by the sim, the UI and the bot.
 * Pure functions; no state changes.
 */
import type { SimContext } from './context';
import { plateError } from './plates';
import type { Course, Plate, SimState, StatusAnswer, Ticket } from './state';

export const STATUS_ANSWERS: readonly StatusAnswer[] = ['notFired', 'cooking', 'partial', 'window'];

/** The truthful answer to "where's my table?" for a ticket. */
export function ticketStatus(ticket: Ticket): StatusAnswer {
  const live = ticket.courses.flatMap((c) => c.items).filter((i) => i.state !== 'sent');
  if (live.length === 0 || live.every((i) => i.state === 'held')) return 'notFired';
  if (live.every((i) => i.state === 'up')) return 'window';
  if (live.some((i) => i.state === 'up')) return 'partial';
  return 'cooking';
}

export type CourseStatus = 'held' | 'cooking' | 'partial' | 'up' | 'sent';

export function courseStatus(course: Course): CourseStatus {
  const states = course.items.map((i) => i.state);
  if (states.every((s) => s === 'sent')) return 'sent';
  const live = states.filter((s) => s !== 'sent');
  if (live.every((s) => s === 'held')) return 'held';
  if (live.every((s) => s === 'up')) return 'up';
  if (live.some((s) => s === 'up')) return 'partial';
  return 'cooking';
}

/** Is this plate wrong? (Debug overlay / bot omniscience only — the UI must not reveal this to the player.) */
export function plateIsWrong(ctx: SimContext, state: SimState, plate: Plate): boolean {
  const item = state.tickets[plate.ticketId]?.courses[plate.courseIdx]?.items.find(
    (i) => i.id === plate.itemId,
  );
  return item ? plateError(ctx, item, plate.build) !== null : false;
}

export function liveTickets(state: SimState): Ticket[] {
  return state.railOrder.map((id) => state.tickets[id]).filter((t): t is Ticket => !!t);
}
