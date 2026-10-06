import type { ShiftSummary } from '../state';
import type { Work } from '../work';
import { summarize } from './scoring';

/**
 * Win/lose (GDD §6): health 0 → lost; allergy incident on a night where it ends the shift → lost;
 * printer stopped + rail clear → won; overtime cap → leftover penalty, then won if health remains.
 */
export function updateShiftEnd(w: Work): void {
  if (w.s.phase === 'ended') return;
  const { shift, score } = w.ctx.tuning;
  const durationMs = shift.durationMs[w.s.nightId];

  if (w.s.forcedLoss === 'allergy') return end(w, 'lost', 'allergy');
  if (w.s.health <= 0) return end(w, 'lost', 'health');
  if (w.s.phase !== 'overtime') return;
  if (w.s.railOrder.length === 0) return end(w, 'won', null);
  if (w.now >= durationMs + shift.overtimeCapMs) {
    w.health(score.overtimeLeftoverPerTicket * w.s.railOrder.length, 'overtimeLeftover');
    return w.s.health > 0 ? end(w, 'won', null) : end(w, 'lost', 'health');
  }
}

function end(w: Work, outcome: 'won' | 'lost', lostBy: ShiftSummary['lostBy']): void {
  w.s.phase = 'ended';
  const summary = summarize(w.s, outcome, lostBy, w.ctx);
  w.s.summary = summary;
  w.emit({ type: 'shiftEnded', summary });
}
