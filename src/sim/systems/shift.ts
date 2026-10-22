import type { ShiftSummary } from '../state';
import type { Work } from '../work';
import { summarize } from './scoring';

/**
 * Win/lose: staying critical past the grace window → lost (D-067); allergy incident on a night where it
 * ends the shift → lost; printer stopped + rail clear → won; overtime cap → leftover heat, then won unless
 * that pushes you over the edge.
 */
export function updateShiftEnd(w: Work): void {
  if (w.s.phase === 'ended') return;
  const { shift, heat } = w.ctx.tuning;
  const durationMs = shift.durationMs[w.s.nightId];

  if (w.s.forcedLoss === 'allergy') return end(w, 'lost', 'allergy');
  if (w.s.critical !== null && w.now >= w.s.critical.untilMs) return end(w, 'lost', 'heat');
  if (w.s.phase !== 'overtime') return;
  if (w.s.railOrder.length === 0) return end(w, 'won', null);
  if (w.now >= durationMs + shift.overtimeCapMs) {
    w.heat(heat.overtimeLeftoverPerTicket * w.s.railOrder.length, 'overtimeLeftover');
    return w.s.heat >= heat.max ? end(w, 'lost', 'heat') : end(w, 'won', null);
  }
}

function end(w: Work, outcome: 'won' | 'lost', lostBy: ShiftSummary['lostBy']): void {
  w.s.phase = 'ended';
  const summary = summarize(w.s, outcome, lostBy, w.ctx);
  w.s.summary = summary;
  w.emit({ type: 'shiftEnded', summary });
}
