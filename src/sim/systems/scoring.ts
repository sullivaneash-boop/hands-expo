import type { SimContext } from '../context';
import type { ShiftSummary, SimState } from '../state';
import type { Work } from '../work';

/** Late courses drain health once per whole second past their grace time (pushed tables drain faster). */
export function updateLateness(w: Work): void {
  const { score, manager, sim } = w.ctx.tuning;
  let drain = 0;
  for (const t of w.liveTickets()) {
    t.courses.forEach((c, courseIdx) => {
      if (c.lateAtMs === null || c.sentAtMs !== null || w.now < c.lateAtMs) return;
      if (c.lateSecondsCharged === 0 && w.now - c.lateAtMs < sim.tickMs)
        w.emit({ type: 'ticketLate', ticketId: t.id, table: t.table, courseIdx });
      const late = Math.floor((w.now - c.lateAtMs) / 1000);
      if (late <= c.lateSecondsCharged) return;
      const mult = t.flags.pushed ? manager.pushDrainMultiplier : 1;
      drain += (late - c.lateSecondsCharged) * score.lateDrainPerSec * mult;
      const course = w.ticket(t.id).courses[courseIdx];
      if (course) course.lateSecondsCharged = late;
    });
  }
  if (drain > 0) w.health(-drain, 'late');
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

/** Build the end-of-shift summary (GDD §6). Pure function of state + tuning. */
export function summarize(
  s: SimState,
  outcome: 'won' | 'lost',
  lostBy: ShiftSummary['lostBy'],
  ctx: SimContext,
): ShiftSummary {
  const { score } = ctx.tuning;
  const f = score.final;
  const st = s.stats;
  const avgTicketMs = st.ticketsCleared > 0 ? Math.round(st.ticketTimeSumMs / st.ticketsCleared) : 0;
  const avgCourseMs = st.coursesCompleted > 0 ? Math.round(st.courseTimeSumMs / st.coursesCompleted) : 0;

  // Ticket Time counts courses still open at the end at their age then (D-040), so abandoning loses.
  const openAges: number[] = [];
  for (const id of s.railOrder)
    for (const c of s.tickets[id]?.courses ?? [])
      if (c.readyAtMs !== null && c.sentAtMs === null) openAges.push(s.nowMs - c.readyAtMs);
  const timedCount = st.coursesCompleted + openAges.length;
  const timedAvgMs =
    timedCount > 0 ? (st.courseTimeSumMs + openAges.reduce((a, b) => a + b, 0)) / timedCount : 0;

  const health = clamp((s.health / score.maxHealth) * 100);
  const time = timedCount === 0 ? 0 : clamp(100 * (1 - (timedAvgMs - f.targetCourseMs) / f.targetCourseMs));
  const judged = st.errorsCaught + st.errorsEscaped;
  const accuracy = judged === 0 ? 100 : clamp((100 * st.errorsCaught) / judged);
  const pass = clamp(
    100 -
      f.deadPlateCost * st.platesDied -
      f.incompleteSendCost * st.incompleteSends -
      f.earlyLandingCost * (st.earlyLandings + st.barViolations),
  );

  const total =
    health * f.healthWeight + time * f.timeWeight + accuracy * f.accuracyWeight + pass * f.passWeight;
  const finalScore = Math.round(outcome === 'lost' ? Math.min(total, 49) : total);
  const grade = outcome === 'lost' ? 'F' : (score.gradeBands.find((b) => finalScore >= b.min)?.grade ?? 'F');

  return {
    outcome,
    lostBy,
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
    avgCourseMs,
    endedAtMs: s.nowMs,
    ticketsLeft: s.railOrder.length,
    stats: structuredClone(st),
  };
}
