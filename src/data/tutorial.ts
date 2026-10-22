/**
 * Learn-by-doing first minute (research 05 §First minute, ROADMAP 6.6). Data only: the UI coach shows
 * one line at a time, highlights `target` (a data-coach key) and advances when `until` happens.
 * `when` delays a step until a condition holds (e.g. a ticket printed).
 */
export type CoachUntil =
  | { kind: 'select'; table: number }
  | { kind: 'event'; event: 'itemFired' | 'plateUp' | 'courseSent' | 'plateRefired' }
  | { kind: 'sheet'; sheet: 'plate' }
  | { kind: 'approve' }
  | { kind: 'sendTable'; table: number }
  | { kind: 'timeMs'; ms: number };

export interface CoachStep {
  id: string;
  text: string;
  target?: string;
  /** Wait for this table to be on the rail before showing the step. */
  whenTable?: number;
  until: CoachUntil;
}

export const tutorial: readonly CoachStep[] = [
  {
    id: 'rail',
    text: 'A ticket just printed. Tap TABLE 12.',
    target: 'ticket-12',
    whenTable: 12,
    until: { kind: 'select', table: 12 },
  },
  {
    id: 'fire',
    text: 'FIRE sends it to the line. You decide when cooking starts.',
    target: 'dock-fire',
    until: { kind: 'event', event: 'itemFired' },
  },
  {
    id: 'line',
    text: 'The grill has it. When it’s done, the plate lands on the pass.',
    target: 'station-grill',
    until: { kind: 'event', event: 'plateUp' },
  },
  {
    id: 'check',
    text: 'Tap the plate to check it against the ticket.',
    target: 'plate-12',
    until: { kind: 'sheet', sheet: 'plate' },
  },
  {
    id: 'good',
    text: 'Ordered vs. made, row by row. Everything matches — tap GOOD.',
    target: 'check-good',
    until: { kind: 'approve' },
  },
  {
    id: 'hands',
    text: 'HANDS! — send it to the table.',
    target: 'dock-send',
    until: { kind: 'sendTable', table: 12 },
  },
  {
    id: 'loop',
    text: 'That’s the job. Fire, check, HANDS!. A wrong plate? Tap what doesn’t match, then REFIRE.',
    until: { kind: 'timeMs', ms: 9_000 },
  },
  {
    id: 'sync',
    text: 'Two seats, different cook times. Open DETAILS and fire the long one first so they land together.',
    target: 'ticket-21',
    whenTable: 21,
    until: { kind: 'sendTable', table: 21 },
  },
];
