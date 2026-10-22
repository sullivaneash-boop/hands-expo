/**
 * What the action dock offers for a selected ticket (D-073). Pure: derived from the ticket + clock,
 * so the dock, the coach and tests agree. The first action is the primary (big) one.
 */
import { needsAllergyPick, type Course, type Ticket } from '../../sim';

export type DockAction =
  | { kind: 'flagAllergy'; label: string }
  | { kind: 'resolve86'; label: string }
  | { kind: 'fire'; courseIdx: number; label: string; early: boolean }
  | { kind: 'send'; courseIdx: number; label: string; partial: boolean }
  | { kind: 'details'; label: string };

const done = (state: string) => state === 'sent' || state === 'void';

/** The first course that still has something to make or send. */
export const openCourseIdx = (t: Ticket) => t.courses.findIndex((c) => !c.items.every((i) => done(i.state)));

export function dockActions(t: Ticket, nowMs: number): DockAction[] {
  const out: DockAction[] = [];
  const ci = openCourseIdx(t);
  const course: Course | undefined = t.courses[ci];
  if (!course) return [{ kind: 'details', label: 'DETAILS' }];
  const live = course.items.filter((i) => !done(i.state));
  const held = live.filter((i) => i.state === 'held');
  const up = live.filter((i) => i.state === 'up');

  if (t.allergy && !t.allergy.acked && held.some((i) => needsAllergyPick(t, i)))
    out.push({ kind: 'flagAllergy', label: 'FLAG ALLERGY' });
  if (held.some((i) => i.eightySixed)) out.push({ kind: 'resolve86', label: 'FIX 86' });
  if (up.length > 0 && up.length === live.length)
    out.push({ kind: 'send', courseIdx: ci, label: 'HANDS!', partial: false });
  const fireable = held.filter((i) => !i.eightySixed);
  if (fireable.length > 0) {
    const early = course.hold && (course.readyAtMs === null || nowMs < course.readyAtMs);
    out.push({
      kind: 'fire',
      courseIdx: ci,
      label: early ? 'FIRE EARLY' : held.length < live.length ? 'FIRE REST' : 'FIRE',
      early,
    });
  }
  if (up.length > 0 && up.length < live.length)
    out.push({ kind: 'send', courseIdx: ci, label: 'SEND PART', partial: true });
  out.push({ kind: 'details', label: 'DETAILS' });
  return out;
}
