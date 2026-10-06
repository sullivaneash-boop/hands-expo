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
