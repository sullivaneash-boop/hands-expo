import type { TicketTemplate } from '../../data/schema';
import type { PlayerCommand } from '../commands';
import { rollDefect } from '../plates';
import type { Course, Ticket } from '../state';
import type { Work } from '../work';
import { startCook } from './kitchen';

/** Instantiate a ticket from a template and hang it on the rail (emits ticketPrinted). */
export function printTicket(w: Work, template: TicketTemplate): Ticket {
  const { tuning } = w.ctx;
  const id = w.nextId('t');
  const rate = tuning.defects.ratePerNight[w.s.nightId];
  let flatIdx = 0;
  let itemCount = 0;
  let modLines = 0;

  const courses: Course[] = template.courses.map((c) => ({
    kind: c.kind,
    hold: c.hold ?? false,
    items: c.items.map((it) => {
      const idx = flatIdx++;
      itemCount++;
      modLines += it.mods?.length ?? 0;
      const forced =
        template.forceDefect && template.forceDefect.itemIdx === idx ? template.forceDefect.defect : null;
      return {
        id: `${id}.${idx}`,
        seat: it.seat,
        menuId: it.menuId,
        mods: [...(it.mods ?? [])],
        state: 'held' as const,
        plateId: null,
        // Forced defects skip the random roll so scripted teaching beats are exact.
        firstDefect: forced ?? rollDefect(w.ctx, rate, w.rng.defects),
        makes: 0,
      };
    }),
  }));

  const ticket: Ticket = {
    id,
    orderNo: w.nextOrderNo(),
    table: template.table,
    server: template.server,
    guests: template.guests,
    note: template.note ?? null,
    printedAtMs: w.now,
    lateAtMs: w.now + tuning.tickets.graceBaseMs + tuning.tickets.gracePerItemMs * itemCount,
    lateSecondsCharged: 0,
    courses,
    escapedErrors: 0,
  };
  w.putTicket(ticket);
  w.s.railOrder = [...w.s.railOrder, id];
  w.stats.ticketsPrinted++;
  const lineCount = 8 + courses.length + itemCount + modLines + (ticket.note ? 2 : 0);
  w.emit({ type: 'ticketPrinted', ticketId: id, table: ticket.table, lineCount });
  return ticket;
}

export function fire(w: Work, cmd: Extract<PlayerCommand, { type: 'fire' }>): void {
  const reject = (reason: string) => w.emit({ type: 'commandRejected', command: cmd, reason });
  if (!w.s.tickets[cmd.ticketId]) return reject('no such ticket');
  const course = w.s.tickets[cmd.ticketId]?.courses[cmd.courseIdx];
  if (!course) return reject('no such course');
  const targets = course.items.filter(
    (i) => i.state === 'held' && (cmd.itemId === undefined || i.id === cmd.itemId),
  );
  if (targets.length === 0) return reject(cmd.itemId ? 'item already fired' : 'nothing held to fire');

  const ticket = w.ticket(cmd.ticketId);
  const mutCourse = ticket.courses[cmd.courseIdx] as Course;
  for (const target of targets) {
    const item = mutCourse.items.find((i) => i.id === target.id);
    if (!item) continue;
    startCook(w, ticket, cmd.courseIdx, item, item.firstDefect, false);
  }
}
