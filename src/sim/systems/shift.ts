import type { Work } from '../work';
import { summarize } from './scoring';

/** Win/lose (GDD §6): health 0 → lost; printer stopped + rail clear → won; overtime cap → won with penalties. */
export function updateShiftEnd(w: Work): void {
  if (w.s.phase === 'ended') return;
  const { shift, score } = w.ctx.tuning;
  const durationMs = shift.durationMs[w.s.nightId];

  if (w.s.health <= 0) return end(w, 'lost');
  if (w.s.phase !== 'overtime') return;
  if (w.s.railOrder.length === 0) return end(w, 'won');
  if (w.now >= durationMs + shift.overtimeCapMs) {
    w.health(score.overtimeLeftoverPerTicket * w.s.railOrder.length, 'overtimeLeftover');
    return end(w, w.s.health > 0 ? 'won' : 'lost');
  }
}

function end(w: Work, outcome: 'won' | 'lost'): void {
  w.s.phase = 'ended';
  const summary = summarize(w.s, outcome, w.ctx);
  w.s.summary = summary;
  w.emit({ type: 'shiftEnded', summary });
}
