import type { PlayerCommand } from '../commands';
import { needsAllergyPick } from '../lookup';
import { plateError, type PlateErrorKind } from '../plates';
import type { CookJob, Course, Plate } from '../state';
import type { Work } from '../work';
import { expireWaiting, remake } from './kitchen';
import { afterCourseProgress } from './tickets';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * HANDS! — send every plate of a course that's on the pass. Bad plates cost heat; a clean, complete,
 * on-time course scores plates + sync + freshness × the clean-service combo (D-068).
 */
export function send(w: Work, cmd: Extract<PlayerCommand, { type: 'send' }>): void {
  const { heat: H, score: S, pass, allergy } = w.ctx.tuning;
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
  const plateIds: string[] = [];
  const vip = w.vipMult(ticket);

  for (const item of course.items) {
    if (item.state !== 'up' || !item.plateId) continue;
    const plate = w.s.plates[item.plateId] as Plate;
    upTimes.push(plate.upAtMs);
    plateIds.push(plate.id);
    const err = plateError(w.ctx, item, plate.build, needsAllergyPick(ticket, item));
    if (err) {
      errors.push(err);
      ticket.escapedErrors++;
      w.stats.errorsEscaped++;
      if (err === 'noAllergyPick') {
        w.stats.allergyIncidents++;
        w.heat(H.allergyIncident, 'allergyIncident');
        w.emit({ type: 'allergyIncident', ticketId: ticket.id, table: ticket.table });
        if (allergy.incidentEndsShift[w.s.nightId]) w.s.forcedLoss = 'allergy';
      } else if (err === 'wrongDish') w.heat(H.wrongDishSent * vip, 'wrongDishSent');
      else w.heat(H.wrongModSent * vip, 'wrongModSent');
    }
    removePlate(w, plate.id);
    item.state = 'sent';
    item.plateId = null;
    w.stats.platesSent++;
  }

  const complete = course.items.every((i) => i.state === 'sent' || i.state === 'void');
  if (!complete) {
    w.stats.incompleteSends++;
    w.heat(H.incompleteSend, 'incompleteSend');
  }
  // The table wasn't ready for this course yet (fired a HOLD course early and sent it).
  const early = course.readyAtMs === null || w.now < course.readyAtMs;
  if (early) {
    w.stats.earlyLandings++;
    w.heat(H.landedEarly, 'landedEarly');
  }
  const beatBar = ticket.flags.notBeforeMs !== null && w.now < ticket.flags.notBeforeMs;
  if (beatBar) {
    w.stats.barViolations++;
    w.heat(H.sentBeforeBar, 'sentBeforeBar');
  }

  // ── Scoring (D-068) ────────────────────────────────────────────────────────
  const plates = upTimes.length;
  const multi = complete && wasSent === 0 && plates >= 2;
  if (multi) w.stats.multiPlateCourses++;
  const spreadMs = multi ? Math.max(...upTimes) - Math.min(...upTimes) : null;
  const clean = errors.length === 0 && complete && wasSent === 0 && !early && !beatBar;
  const perfect = clean && spreadMs !== null && spreadMs <= S.perfectSyncMs;
  const multiplier = w.s.combo;
  let platePoints: number, syncPoints: number, freshPoints: number, total: number;
  if (clean) {
    const syncQ = spreadMs === null ? 0 : clamp01(1 - spreadMs / S.syncWindowMs);
    const freshQ = upTimes.reduce((sum, t) => sum + clamp01(1 - (w.now - t) / pass.plateDieMs), 0) / plates;
    platePoints = S.platePoints * plates;
    syncPoints = Math.round(S.syncPoints * syncQ);
    freshPoints = Math.round(S.freshPoints * freshQ);
    total = Math.round((platePoints + syncPoints + freshPoints) * multiplier);
  } else {
    // Something went wrong: only correct plates count, no multiplier.
    platePoints = S.platePoints * (plates - errors.length);
    syncPoints = 0;
    freshPoints = 0;
    total = platePoints;
  }
  w.score(total, 'courseScore');
  if (perfect) {
    w.stats.perfectSyncs++;
    w.stats.syncedCourses++;
    w.score(S.perfectSyncBonus, 'perfectSync');
    w.heat(w.ctx.tuning.heat.perfectSync, 'perfectSync');
  }
  if (clean) {
    w.heat(H.cleanCourse, 'cleanCourse');
    w.setCombo(w.s.combo + S.combo.step, 'clean');
  } else if (errors.length > 0 || !complete) {
    w.setCombo(S.combo.start, errors.length > 0 ? 'bad plate' : 'incomplete');
  } else if (early || beatBar) {
    w.setCombo(w.s.combo - S.combo.early, early ? 'early' : 'bar');
  }
  w.emit({
    type: 'courseScored',
    ticketId: ticket.id,
    courseIdx: cmd.courseIdx,
    table: ticket.table,
    plates,
    platePoints,
    syncPoints,
    freshPoints,
    spreadMs,
    perfect,
    clean,
    multiplier: clean ? multiplier : 1,
    total,
  });
  w.emit({
    type: 'courseSent',
    ticketId: ticket.id,
    courseIdx: cmd.courseIdx,
    plates,
    plateIds,
    errors,
    complete,
    synced: perfect,
    early,
  });
  afterCourseProgress(w, ticket.id, cmd.courseIdx);
}

/** Reject a plate: bin it and remake on the fly. Catching a real mistake is a SAVE (keeps the combo). */
export function refire(w: Work, cmd: Extract<PlayerCommand, { type: 'refire' }>): void {
  const plate = w.s.plates[cmd.plateId];
  if (!plate) return w.emit({ type: 'commandRejected', command: cmd, reason: 'no such plate' });
  const ticket = w.ticket(plate.ticketId);
  const item = ticket.courses[plate.courseIdx]?.items.find((i) => i.id === plate.itemId);
  if (!item) return w.emit({ type: 'commandRejected', command: cmd, reason: 'plate has no item' });

  const correct = plateError(w.ctx, item, plate.build, needsAllergyPick(ticket, item)) !== null;
  if (correct) {
    w.stats.errorsCaught++;
    w.score(w.ctx.tuning.score.saveBonus, 'save');
    w.heat(w.ctx.tuning.heat.caughtDefect, 'save');
  } else {
    w.stats.refiresUnneeded++;
    w.heat(w.ctx.tuning.heat.refireUnneeded, 'refireUnneeded');
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

function plateDied(w: Work, ticketId: string, courseIdx: number, itemId: string, plateId: string): void {
  w.stats.platesDied++;
  w.heat(w.ctx.tuning.heat.plateDied, 'plateDied');
  w.setCombo(w.s.combo - w.ctx.tuning.score.combo.deadPlate, 'dead plate');
  remake(w, ticketId, courseIdx, itemId);
  w.emit({ type: 'plateDied', plateId, ticketId });
}

/** Plates that sit too long die and are remade on the fly — on the pass or backed up behind it. */
export function updatePass(w: Work): void {
  const { pass } = w.ctx.tuning;
  for (const plateId of w.s.windowOrder) {
    const plate = w.s.plates[plateId];
    if (!plate || w.now - plate.upAtMs < pass.plateDieMs) continue;
    removePlate(w, plateId);
    const ticket = w.ticket(plate.ticketId);
    const item = ticket.courses[plate.courseIdx]?.items.find((i) => i.id === plate.itemId);
    if (item) item.plateId = null;
    plateDied(w, plate.ticketId, plate.courseIdx, plate.itemId, plateId);
  }
  for (const job of expireWaiting(w) as CookJob[]) {
    if (!w.s.tickets[job.ticketId]) continue;
    plateDied(w, job.ticketId, job.courseIdx, job.itemId, `backed-up:${job.itemId}`);
  }
}

function removePlate(w: Work, plateId: string): void {
  w.deletePlate(plateId);
  w.s.windowOrder = w.s.windowOrder.filter((id) => id !== plateId);
}
