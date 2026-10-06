import type { PlateDefectKind } from '../../data/schema';
import type { PlayerCommand } from '../commands';
import { plateError, rollDefect } from '../plates';
import type { Course, Plate } from '../state';
import type { Work } from '../work';
import { startCook } from './kitchen';

/** Send every plate of a course that's in the window. */
export function send(w: Work, cmd: Extract<PlayerCommand, { type: 'send' }>): void {
  const { score, pass } = w.ctx.tuning;
  const reject = (reason: string) => w.emit({ type: 'commandRejected', command: cmd, reason });
  const prevCourse = w.s.tickets[cmd.ticketId]?.courses[cmd.courseIdx];
  if (!prevCourse) return reject('no such course');
  const upItems = prevCourse.items.filter((i) => i.state === 'up' && i.plateId);
  if (upItems.length === 0) return reject('nothing in the window for this course');

  const ticket = w.ticket(cmd.ticketId);
  const course = ticket.courses[cmd.courseIdx] as Course;
  const wasSent = course.items.filter((i) => i.state === 'sent').length;
  const errors: PlateDefectKind[] = [];
  const upTimes: number[] = [];

  for (const item of course.items) {
    if (item.state !== 'up' || !item.plateId) continue;
    const plate = w.s.plates[item.plateId] as Plate;
    upTimes.push(plate.upAtMs);
    const err = plateError(w.ctx, item, plate.build);
    if (err) {
      errors.push(err);
      ticket.escapedErrors++;
      w.stats.errorsEscaped++;
      if (err === 'wrongDish') w.health(score.wrongDishSent, 'wrongDishSent');
      else w.health(score.wrongModSent, 'wrongModSent');
    }
    removePlate(w, plate.id);
    item.state = 'sent';
    item.plateId = null;
    w.stats.platesSent++;
  }

  const complete = course.items.every((i) => i.state === 'sent');
  if (!complete) {
    w.stats.incompleteSends++;
    w.health(score.incompleteSend, 'incompleteSend');
  }
  // Sync bonus: the whole course (2+ plates) went in one send, landed together, and was clean.
  const synced =
    complete &&
    wasSent === 0 &&
    course.items.length >= 2 &&
    errors.length === 0 &&
    Math.max(...upTimes) - Math.min(...upTimes) <= pass.syncWindowMs;
  if (synced) {
    w.stats.syncedCourses++;
    w.health(score.syncBonus, 'syncBonus');
  }
  w.emit({
    type: 'courseSent',
    ticketId: ticket.id,
    courseIdx: cmd.courseIdx,
    plates: upTimes.length,
    errors,
    complete,
    synced,
  });

  if (ticket.courses.every((c) => c.items.every((i) => i.state === 'sent'))) clearTicket(w, ticket.id);
}

function clearTicket(w: Work, ticketId: string): void {
  const ticket = w.s.tickets[ticketId];
  if (!ticket) return;
  const ticketTimeMs = w.now - ticket.printedAtMs;
  const clean = ticket.escapedErrors === 0;
  w.stats.ticketsCleared++;
  w.stats.ticketTimeSumMs += ticketTimeMs;
  w.stats.ticketTimeMaxMs = Math.max(w.stats.ticketTimeMaxMs, ticketTimeMs);
  if (clean) w.health(w.ctx.tuning.score.tableComplete, 'tableComplete');
  w.s.railOrder = w.s.railOrder.filter((id) => id !== ticketId);
  w.deleteTicket(ticketId);
  w.emit({ type: 'ticketCleared', ticketId, table: ticket.table, ticketTimeMs, clean });
}

/** Reject a plate: bin it and remake on the fly. */
export function refire(w: Work, cmd: Extract<PlayerCommand, { type: 'refire' }>): void {
  const plate = w.s.plates[cmd.plateId];
  if (!plate) return w.emit({ type: 'commandRejected', command: cmd, reason: 'no such plate' });
  const ticket = w.ticket(plate.ticketId);
  const item = ticket.courses[plate.courseIdx]?.items.find((i) => i.id === plate.itemId);
  if (!item) return w.emit({ type: 'commandRejected', command: cmd, reason: 'plate has no item' });

  const correct = plateError(w.ctx, item, plate.build) !== null;
  if (correct) {
    w.stats.errorsCaught++;
    w.health(w.ctx.tuning.score.refireCorrect, 'refireCorrect');
  } else {
    w.stats.refiresUnneeded++;
    w.health(w.ctx.tuning.score.refireUnneeded, 'refireUnneeded');
  }
  removePlate(w, plate.id);
  item.plateId = null;
  remake(w, plate.ticketId, plate.courseIdx, item.id);
  w.emit({ type: 'plateRefired', plateId: plate.id, ticketId: plate.ticketId, correct });
}

export function check(w: Work, cmd: Extract<PlayerCommand, { type: 'check' }>): void {
  if (!w.s.plates[cmd.plateId])
    return w.emit({ type: 'commandRejected', command: cmd, reason: 'no such plate' });
  w.stats.checks++;
}

/** Plates that sit too long die and are remade on the fly. */
export function updatePass(w: Work): void {
  const { pass, score } = w.ctx.tuning;
  for (const plateId of w.s.windowOrder) {
    const plate = w.s.plates[plateId];
    if (!plate || w.now - plate.upAtMs < pass.plateDieMs) continue;
    w.stats.platesDied++;
    w.health(score.plateDied, 'plateDied');
    removePlate(w, plateId);
    const ticket = w.ticket(plate.ticketId);
    const item = ticket.courses[plate.courseIdx]?.items.find((i) => i.id === plate.itemId);
    if (item) item.plateId = null;
    remake(w, plate.ticketId, plate.courseIdx, plate.itemId);
    w.emit({ type: 'plateDied', plateId, ticketId: plate.ticketId });
  }
}

function remake(w: Work, ticketId: string, courseIdx: number, itemId: string): void {
  const { defects } = w.ctx.tuning;
  const ticket = w.ticket(ticketId);
  const item = ticket.courses[courseIdx]?.items.find((i) => i.id === itemId);
  if (!item) return;
  const rate = defects.ratePerNight[w.s.nightId] * defects.onTheFlyRateFactor;
  startCook(w, ticket, courseIdx, item, rollDefect(w.ctx, rate, w.rng.defects), true);
}

function removePlate(w: Work, plateId: string): void {
  w.deletePlate(plateId);
  w.s.windowOrder = w.s.windowOrder.filter((id) => id !== plateId);
}
