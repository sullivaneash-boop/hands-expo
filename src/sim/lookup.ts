import type { MenuItemDef, ModDef } from '../data/schema';
import type { SimContext } from './context';
import type { Course, Ticket, TicketItem } from './state';

export function menuDef(ctx: SimContext, id: string): MenuItemDef {
  const def = ctx.content.menu.find((m) => m.id === id);
  if (!def) throw new Error(`unknown menu item ${id}`);
  return def;
}

export function modDef(ctx: SimContext, id: string): ModDef {
  const def = ctx.content.mods.find((m) => m.id === id);
  if (!def) throw new Error(`unknown mod ${id}`);
  return def;
}

export interface ItemRef {
  course: Course;
  courseIdx: number;
  item: TicketItem;
}

export function findItem(ticket: Ticket, itemId: string): ItemRef | null {
  for (let courseIdx = 0; courseIdx < ticket.courses.length; courseIdx++) {
    const course = ticket.courses[courseIdx] as Course;
    const item = course.items.find((i) => i.id === itemId);
    if (item) return { course, courseIdx, item };
  }
  return null;
}

export function allItems(ticket: Ticket): TicketItem[] {
  return ticket.courses.flatMap((c) => c.items);
}

/** Done = nothing left to make or send for this item. */
export const itemDone = (i: TicketItem) => i.state === 'sent' || i.state === 'void';

/** Does this item's plate need the allergy pick? */
export const needsAllergyPick = (ticket: Ticket, item: TicketItem) =>
  ticket.allergy !== null && item.seat === ticket.allergy.seat;

/** Grace window for a course, from when it becomes ready. */
export function courseGraceMs(ctx: SimContext, course: Course): number {
  const live = course.items.filter((i) => i.state !== 'void').length;
  return ctx.tuning.tickets.graceBaseMs + ctx.tuning.tickets.gracePerItemMs * live;
}
