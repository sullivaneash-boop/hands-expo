import type { PlayerCommand } from '../commands';
import { needsAllergyPick } from '../lookup';
import { plateError, type PlateErrorKind } from '../plates';
import type { Course, Plate } from '../state';
import type { Work } from '../work';
import { remake } from './kitchen';
import { afterCourseProgress } from './tickets';

/** Send every plate of a course that's in the window. */
export function send(w: Work, cmd: Extract<PlayerCommand, { type: 'send' }>): void {
  const { score, pass, manager, allergy } = w.ctx.tuning;
  const reject = (reason: string) => w.emit({ type: 'commandRejected', command: cmd, reason });
  const prevCourse = w.s.tickets[cmd.ticketId]?.courses[cmd.courseIdx];
  if (!prevCourse) return reject('no such course');
  if (!prevCourse.items.some((i) => i.state === 'up' && i.plateId))
    return reject('nothing in the window for this course');

  const ticket = w.ticket(cmd.ticketId);
  const course = ticket.courses[cmd.courseIdx] as Course;
  const wasSent = course.items.filter((i) => i.state === 'sent').length;
  const errors: PlateErrorKind[] = [];
  const upTimes: number[] = [];
  const errMult = ticket.flags.vip ? manager.vipPenaltyMultiplier : 1;

  for (const item of course.items) {
    if (item.state !== 'up' || !item.plateId) continue;
    const plate = w.s.plates[item.plateId] as Plate;
    upTimes.push(plate.upAtMs);
    const err = plateError(w.ctx, item, plate.build, needsAllergyPick(ticket, item));
    if (err) {
      errors.push(err);
      ticket.escapedErrors++;
      w.stats.errorsEscaped++;
      if (err === 'noAllergyPick') {
        w.stats.allergyIncidents++;
        w.health(score.allergyIncident, 'allergyIncident');
        w.emit({ type: 'allergyIncident', ticketId: ticket.id, table: ticket.table });
        if (allergy.incidentEndsShift[w.s.nightId]) w.s.forcedLoss = 'allergy';
      } else if (err === 'wrongDish') w.health(score.wrongDishSent * errMult, 'wrongDishSent');
      else w.health(score.wrongModSent * errMult, 'wrongModSent');
    }
    removePlate(w, plate.id);
    item.state = 'sent';
    item.plateId = null;
    w.stats.platesSent++;
  }

  const complete = course.items.every((i) => i.state === 'sent' || i.state === 'void');
  if (!complete) {
    w.stats.incompleteSends++;
    w.health(score.incompleteSend, 'incompleteSend');
  }
  // The table wasn't ready for this course yet (fired a HOLD course early and sent it).
  const early = course.readyAtMs === null || w.now < course.readyAtMs;
  if (early) {
    w.stats.earlyLandings++;
    w.health(score.landedEarly, 'landedEarly');
  }
  if (ticket.flags.notBeforeMs !== null && w.now < ticket.flags.notBeforeMs) {
    w.stats.barViolations++;
    w.health(score.sentBeforeBar, 'sentBeforeBar');
  }
  // Sync bonus (D-038): the whole course (2+ plates) went in one send, on time, landed together, clean.
  const synced =
    complete &&
    !early &&
    wasSent === 0 &&
    upTimes.length >= 2 &&
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
    early,
  });
  afterCourseProgress(w, ticket.id, cmd.courseIdx);
}

/** Reject a plate: bin it and remake on the fly. */
export function refire(w: Work, cmd: Extract<PlayerCommand, { type: 'refire' }>): void {
  const plate = w.s.plates[cmd.plateId];
  if (!plate) return w.emit({ type: 'commandRejected', command: cmd, reason: 'no such plate' });
  const ticket = w.ticket(plate.ticketId);
  const item = ticket.courses[plate.courseIdx]?.items.find((i) => i.id === plate.itemId);
  if (!item) return w.emit({ type: 'commandRejected', command: cmd, reason: 'plate has no item' });

  const correct = plateError(w.ctx, item, plate.build, needsAllergyPick(ticket, item)) !== null;
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

function removePlate(w: Work, plateId: string): void {
  w.deletePlate(plateId);
  w.s.windowOrder = w.s.windowOrder.filter((id) => id !== plateId);
}
