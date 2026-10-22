import type { SimContext } from '../context';
import type { ShiftSummary, SimState } from '../state';
import type { Work } from '../work';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Service Heat per tick (D-067). Late courses add heat at a capped rate based on the root-sum-square of
 * their severities (so a bad moment hurts, but five late tickets don't stack into an unrecoverable
 * spiral); a little heat bleeds off every second. Hitting max opens the critical window.
 */
export function updateHeat(w: Work): void {
  const { heat: H, manager, sim, score } = w.ctx.tuning;
  const dt = sim.tickMs / 1000;
  let sumSq = 0;
  for (const t of w.liveTickets()) {
    t.courses.forEach((c, courseIdx) => {
      if (c.lateAtMs === null || c.sentAtMs !== null || w.now < c.lateAtMs) return;
      const raw = clamp01((w.now - c.lateAtMs) / H.lateRampMs);
      const severity = raw * (t.flags.pushed ? manager.pushSeverityMultiplier : 1);
      sumSq += severity * severity;
      if (!c.lateNotified || (raw >= 1 && !c.lateMaxed)) {
        const course = w.ticket(t.id).courses[courseIdx];
        if (!course) return;
        if (!course.lateNotified) {
          course.lateNotified = true;
          w.emit({ type: 'ticketLate', ticketId: t.id, table: t.table, courseIdx });
        }
        if (raw >= 1 && !course.lateMaxed) {
          course.lateMaxed = true;
          w.setCombo(w.s.combo - score.combo.seriouslyLate, 'late');
        }
      }
    });
  }
  const lateRate = Math.min(H.maxLateRate, H.lateRate * Math.sqrt(sumSq));
  // Second wind: while critical (the manager is at the pass), lateness stops piling on; only your
  // successes and the passive bleed decide whether you get it back under control.
  if (lateRate > 0 && w.s.critical === null) w.heat(lateRate * dt, 'late', false);
  w.heat(-H.passiveRecoveryPerSec * dt, 'recovery', false);

  if (w.s.critical === null && (w.hitMaxHeat || w.s.heat >= H.max)) {
    w.s.critical = { untilMs: w.now + H.criticalGraceMs };
    w.stats.criticals++;
    w.emit({ type: 'criticalStarted', untilMs: w.s.critical.untilMs });
  } else if (w.s.critical !== null && w.s.heat <= H.criticalRecoverBelow) {
    w.s.critical = null;
    w.emit({ type: 'criticalEnded' });
  }
}

/** Stars from score thresholds (D-069); a lost shift earns none. Grade follows stars. */
export function starsFor(ctx: SimContext, s: SimState, outcome: 'won' | 'lost'): number {
  if (outcome === 'lost') return 0;
  const thresholds = ctx.tuning.stars[s.nightId];
  return thresholds.filter((t) => s.score >= t).length;
}

const GRADE_BY_STARS = ['D', 'C', 'B', 'A'];

/** Build the end-of-shift summary. Pure function of state + tuning. */
export function summarize(
  s: SimState,
  outcome: 'won' | 'lost',
  lostBy: ShiftSummary['lostBy'],
  ctx: SimContext,
): ShiftSummary {
  const st = s.stats;
  const stars = starsFor(ctx, s, outcome);
  return {
    outcome,
    lostBy,
    nightId: s.nightId,
    seed: s.seed,
    heat: Math.round(s.heat),
    score: s.score,
    stars,
    grade: outcome === 'lost' ? 'F' : (GRADE_BY_STARS[stars] ?? 'D'),
    avgTicketMs: st.ticketsCleared > 0 ? Math.round(st.ticketTimeSumMs / st.ticketsCleared) : 0,
    worstTicketMs: st.ticketTimeMaxMs,
    avgCourseMs: st.coursesCompleted > 0 ? Math.round(st.courseTimeSumMs / st.coursesCompleted) : 0,
    endedAtMs: s.nowMs,
    ticketsLeft: s.railOrder.length,
    stats: structuredClone(st),
  };
}
