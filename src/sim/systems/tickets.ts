import type { TicketTemplate } from '../../data/schema';
import type { PlayerCommand } from '../commands';
import { courseGraceMs, itemDone, menuDef, modDef, needsAllergyPick } from '../lookup';
import { rollDefect } from '../plates';
import type { Course, Ticket, TicketItem } from '../state';
import { between, type Work } from '../work';
import { startCook } from './kitchen';

/** Instantiate a ticket from a template and hang it on the rail (emits ticketPrinted). */
export function printTicket(
  w: Work,
  template: TicketTemplate,
  addonOf: { parentId: string } | null = null,
): Ticket {
  const id = w.nextId('t');
  const rate = w.ctx.tuning.defects.ratePerNight[w.s.nightId];
  let flatIdx = 0;
  let itemCount = 0;
  let modLines = 0;

  const courses: Course[] = template.courses.map((c) => ({
    kind: c.kind,
    hold: c.hold ?? false,
    readyAtMs: null,
    lateAtMs: null,
    lateSecondsCharged: 0,
    sentAtMs: null,
    fireHeard: false,
    items: c.items.map((it): TicketItem => {
      const idx = flatIdx++;
      itemCount++;
      modLines += it.mods?.length ?? 0;
      const forced = template.forceDefect?.itemIdx === idx ? template.forceDefect.defect : null;
      return {
        id: `${id}.${idx}`,
        seat: it.seat,
        menuId: it.menuId,
        mods: [...(it.mods ?? [])],
        state: 'held',
        plateId: null,
        // Forced defects skip the random roll so scripted teaching beats are exact.
        firstDefect: forced ?? rollDefect(w.ctx, rate, w.rng.defects),
        makes: 0,
        // Rung in after an 86 (the server hadn't heard yet): must be resolved before firing.
        eightySixed: w.s.eighty6.includes(it.menuId),
        onTheFly: false,
      };
    }),
  }));

  const ticket: Ticket = {
    id,
    orderNo: w.nextOrderNo(),
    kind: addonOf ? 'addon' : 'order',
    parentId: addonOf?.parentId ?? null,
    table: template.table,
    server: template.server,
    guests: template.guests,
    note: template.note ?? null,
    printedAtMs: w.now,
    courses,
    escapedErrors: 0,
    allergy: template.allergy ? { ...template.allergy, acked: false } : null,
    flags: { vip: false, pushed: false, notBeforeMs: null },
    known: { vip: false, pushed: false, bar: false },
  };
  // Courses not marked HOLD are ready the moment they print.
  ticket.courses.forEach((c, i) => {
    if (!c.hold) makeReady(w, ticket, i, false);
  });
  w.putTicket(ticket);
  w.s.railOrder = [...w.s.railOrder, id];
  w.stats.ticketsPrinted++;
  const lineCount =
    8 + courses.length + itemCount + modLines + (ticket.note ? 2 : 0) + (ticket.allergy ? 2 : 0);
  w.emit({ type: 'ticketPrinted', ticketId: id, table: ticket.table, lineCount, addon: addonOf !== null });
  return ticket;
}

/** The table is ready for this course: start its late clock. `ticket` must be mutable. */
export function makeReady(w: Work, ticket: Ticket, courseIdx: number, heard: boolean): void {
  const course = ticket.courses[courseIdx];
  if (!course || course.readyAtMs !== null) return;
  course.readyAtMs = w.now;
  course.lateAtMs = w.now + courseGraceMs(w.ctx, course);
  if (ticket.flags.pushed)
    course.lateAtMs = Math.min(course.lateAtMs, w.now + w.ctx.tuning.manager.pushGraceMs);
  course.fireHeard = heard;
  w.emit({ type: 'courseReady', ticketId: ticket.id, courseIdx, heard });
}

/** Print a small ADD ON chit for an open table (server_addon). */
export function printAddOn(w: Work, parent: Ticket, menuId: string, rngPickSeat: () => number): Ticket {
  let seat = rngPickSeat();
  if (parent.allergy && seat === parent.allergy.seat) seat = seat === 1 && parent.guests > 1 ? 2 : 1;
  return printTicket(
    w,
    {
      table: parent.table,
      server: parent.server,
      guests: parent.guests,
      courses: [{ kind: 'side', items: [{ seat, menuId }] }],
    },
    { parentId: parent.id },
  );
}

export function fire(w: Work, cmd: Extract<PlayerCommand, { type: 'fire' }>): void {
  const reject = (reason: string) => w.emit({ type: 'commandRejected', command: cmd, reason });
  const prev = w.s.tickets[cmd.ticketId];
  if (!prev) return reject('no such ticket');
  const course = prev.courses[cmd.courseIdx];
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
    if (item.eightySixed) {
      // "It's 86'd!" — the line can't make it. Resolve it first (GDD §6).
      w.stats.fired86++;
      w.health(w.ctx.tuning.score.fired86, 'fired86');
      w.emit({ type: 'fired86', ticketId: ticket.id, itemId: item.id });
      continue;
    }
    const protocol = needsAllergyPick(ticket, item) && (ticket.allergy?.acked ?? false);
    startCook(w, ticket, cmd.courseIdx, item, item.firstDefect, false, protocol);
  }
}

export function ackAllergy(w: Work, cmd: Extract<PlayerCommand, { type: 'ackAllergy' }>): void {
  const prev = w.s.tickets[cmd.ticketId];
  if (!prev?.allergy)
    return w.emit({ type: 'commandRejected', command: cmd, reason: 'no allergy on ticket' });
  if (prev.allergy.acked) return w.emit({ type: 'commandRejected', command: cmd, reason: 'already flagged' });
  const ticket = w.ticket(cmd.ticketId);
  if (ticket.allergy) ticket.allergy.acked = true;
  w.emit({ type: 'allergyAcked', ticketId: ticket.id });
}

/** Take a menu item off: flag every still-held instance on the rail (D-054). */
export function eightySix(w: Work, menuId: string): number {
  if (w.s.eighty6.includes(menuId)) return 0;
  w.s.eighty6 = [...w.s.eighty6, menuId];
  let affected = 0;
  for (const prev of w.liveTickets()) {
    if (!prev.courses.some((c) => c.items.some((i) => i.menuId === menuId && i.state === 'held'))) continue;
    const t = w.ticket(prev.id);
    for (const c of t.courses)
      for (const i of c.items)
        if (i.menuId === menuId && i.state === 'held') {
          i.eightySixed = true;
          affected++;
        }
  }
  w.emit({ type: 'itemEightySixed', menuId, affected });
  return affected;
}

export function resolve86(w: Work, cmd: Extract<PlayerCommand, { type: 'resolve86' }>): void {
  const reject = (reason: string) => w.emit({ type: 'commandRejected', command: cmd, reason });
  const prev = w.s.tickets[cmd.ticketId];
  if (!prev) return reject('no such ticket');
  const courseIdx = prev.courses.findIndex((c) => c.items.some((i) => i.id === cmd.itemId));
  const prevItem = prev.courses[courseIdx]?.items.find((i) => i.id === cmd.itemId);
  if (!prevItem?.eightySixed || prevItem.state !== 'held') return reject('item is not 86’d');
  if (cmd.subMenuId !== null) {
    const sub = w.ctx.content.menu.find((m) => m.id === cmd.subMenuId);
    const orig = menuDef(w.ctx, prevItem.menuId);
    if (!sub || sub.course !== orig.course || w.s.eighty6.includes(sub.id))
      return reject('invalid substitute');
  }
  const ticket = w.ticket(cmd.ticketId);
  const item = ticket.courses[courseIdx]?.items.find((i) => i.id === cmd.itemId) as TicketItem;
  item.eightySixed = false;
  if (cmd.subMenuId === null) {
    item.state = 'void';
  } else {
    item.menuId = cmd.subMenuId;
    item.mods = defaultMods(w, cmd.subMenuId);
  }
  w.emit({ type: 'itemResolved', ticketId: ticket.id, itemId: item.id, subMenuId: cmd.subMenuId });
  afterCourseProgress(w, ticket.id, courseIdx);
}

/** A substitute comes the house way: MEDIUM if it takes a temp, plus its default side. */
function defaultMods(w: Work, menuId: string): string[] {
  const def = menuDef(w.ctx, menuId);
  const mods: string[] = [];
  if (def.doneness) {
    const medium =
      def.legalMods.find((m) => m === 'medium') ??
      def.legalMods.find((m) => modDef(w.ctx, m).kind === 'doneness');
    if (medium) mods.push(medium);
  }
  if (def.defaultSide) mods.push(def.defaultSide);
  return mods;
}

/**
 * After plates leave or items are voided: close out a finished course (stats, schedule the next
 * course's fire request) and clear the ticket when everything is done.
 */
export function afterCourseProgress(w: Work, ticketId: string, courseIdx: number): void {
  const prev = w.s.tickets[ticketId];
  const prevCourse = prev?.courses[courseIdx];
  if (!prev || !prevCourse || prevCourse.sentAtMs !== null || !prevCourse.items.every(itemDone)) return;

  const ticket = w.ticket(ticketId);
  const course = ticket.courses[courseIdx] as Course;
  course.sentAtMs = w.now;
  if (course.items.some((i) => i.state === 'sent')) {
    const courseTime = w.now - (course.readyAtMs ?? ticket.printedAtMs);
    w.stats.coursesCompleted++;
    w.stats.courseTimeSumMs += courseTime;
    w.stats.courseTimeMaxMs = Math.max(w.stats.courseTimeMaxMs, courseTime);
  }

  // The table eats; then the server comes to ask for the next held course.
  const next = ticket.courses[courseIdx + 1];
  if (next && next.hold && next.readyAtMs === null && !next.items.every(itemDone)) {
    const atMs = w.now + between(w.rng.interrupts, w.ctx.tuning.courses.eatMs);
    w.s.pending = [...w.s.pending, { atMs, defId: 'server_fire', ticketId }].sort(
      (a, b) => a.atMs - b.atMs || (a.ticketId < b.ticketId ? -1 : 1),
    );
  }

  if (ticket.courses.every((c) => c.items.every(itemDone))) clearTicket(w, ticketId);
}

function clearTicket(w: Work, ticketId: string): void {
  const ticket = w.s.tickets[ticketId];
  if (!ticket) return;
  const ticketTimeMs = w.now - ticket.printedAtMs;
  const clean = ticket.escapedErrors === 0;
  w.stats.ticketsCleared++;
  w.stats.ticketTimeSumMs += ticketTimeMs;
  w.stats.ticketTimeMaxMs = Math.max(w.stats.ticketTimeMaxMs, ticketTimeMs);
  const sentAnything = ticket.courses.some((c) => c.items.some((i) => i.state === 'sent'));
  if (clean && sentAnything && ticket.kind === 'order')
    w.health(w.ctx.tuning.score.tableComplete, 'tableComplete');
  w.s.railOrder = w.s.railOrder.filter((id) => id !== ticketId);
  w.s.pending = w.s.pending.filter((p) => p.ticketId !== ticketId);
  w.deleteTicket(ticketId);
  w.emit({ type: 'ticketCleared', ticketId, table: ticket.table, ticketTimeMs, clean });
}
