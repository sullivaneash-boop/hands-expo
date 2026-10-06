import type { SimContext } from '../context';
import type { SimState, ShiftSummary } from '../state';
import type { Work } from '../work';

/** Late tickets drain health once per whole second past their grace time. */
export function updateLateness(w: Work): void {
  const { score } = w.ctx.tuning;
  let seconds = 0;
  for (const id of w.s.railOrder) {
    const t = w.s.tickets[id];
    if (!t || w.now < t.lateAtMs) continue;
    const late = Math.floor((w.now - t.lateAtMs) / 1000);
    if (t.lateSecondsCharged === 0 && w.now - t.lateAtMs < w.ctx.tuning.sim.tickMs)
      w.emit({ type: 'ticketLate', ticketId: t.id, table: t.table });
    if (late > t.lateSecondsCharged) {
      seconds += late - t.lateSecondsCharged;
      w.ticket(id).lateSecondsCharged = late;
    }
  }
  if (seconds > 0) w.health(-score.lateDrainPerSec * seconds, 'late');
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

/** Build the end-of-shift summary (GDD §6). Pure function of state + tuning. */
export function summarize(s: SimState, outcome: 'won' | 'lost', ctx: SimContext): ShiftSummary {
  const { score } = ctx.tuning;
  const f = score.final;
  const st = s.stats;
  const avgTicketMs = st.ticketsCleared > 0 ? Math.round(st.ticketTimeSumMs / st.ticketsCleared) : 0;

  const health = clamp((s.health / score.maxHealth) * 100);
  const time =
    st.ticketsCleared === 0 ? 0 : clamp(100 * (1 - (avgTicketMs - f.targetTicketMs) / f.targetTicketMs));
  const judged = st.errorsCaught + st.errorsEscaped;
  const accuracy = judged === 0 ? 100 : clamp((100 * st.errorsCaught) / judged);
  const pass = clamp(100 - f.deadPlateCost * st.platesDied - f.incompleteSendCost * st.incompleteSends);

  const total =
    health * f.healthWeight + time * f.timeWeight + accuracy * f.accuracyWeight + pass * f.passWeight;
  const finalScore = Math.round(outcome === 'lost' ? Math.min(total, 49) : total);
  const grade = outcome === 'lost' ? 'F' : (score.gradeBands.find((b) => finalScore >= b.min)?.grade ?? 'F');

  return {
    outcome,
    nightId: s.nightId,
    seed: s.seed,
    health: s.health,
    score: finalScore,
    grade,
    subScores: {
      health: Math.round(health),
      time: Math.round(time),
      accuracy: Math.round(accuracy),
      pass: Math.round(pass),
    },
    avgTicketMs,
    worstTicketMs: st.ticketTimeMaxMs,
    endedAtMs: s.nowMs,
    ticketsLeft: s.railOrder.length,
    stats: structuredClone(st),
  };
}
