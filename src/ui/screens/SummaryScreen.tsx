import { engine, randomSeed } from '../../engine/runtime';
import { useGameStore } from '../../store/useGameStore';
import { REASON_LABEL, secs } from '../format';
import type { ScoreReason } from '../../sim';

function Row({ label, value, bad }: { label: string; value: string | number; bad?: boolean }) {
  return (
    <div className="flex justify-between gap-6">
      <span className="text-tile">{label}</span>
      <span className={`tabular-nums ${bad ? 'text-rush' : 'text-phosphor'}`}>{value}</span>
    </div>
  );
}

export function SummaryScreen() {
  const summary = useGameStore((s) => s.snap?.summary);
  if (!summary) return null;
  const st = summary.stats;
  const won = summary.outcome === 'won';
  const reasons = Object.entries(st.healthByReason).filter(([, v]) => v !== 0) as [ScoreReason, number][];

  return (
    <main className="flex h-full items-center justify-center overflow-auto p-4">
      <section className="w-full max-w-2xl border border-steel bg-night p-6 text-sm">
        <p className="text-xs tracking-widest text-tile">NIGHT {summary.nightId} · END OF SHIFT</p>
        <div className="mt-2 flex items-end justify-between">
          <h1 className={`text-3xl font-bold ${won ? 'text-amber' : 'text-rush'}`}>
            {won ? 'SHIFT SURVIVED' : 'PULLED OFF EXPO'}
          </h1>
          <div className="text-right">
            <div className={`text-6xl font-bold ${won ? 'text-phosphor' : 'text-rush'}`}>{summary.grade}</div>
            <div className="text-xs text-tile">score {summary.score}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-1">
            <p className="mb-1 text-xs text-amber">TICKET TIME</p>
            <Row label="Average" value={secs(summary.avgTicketMs)} />
            <Row label="Worst" value={secs(summary.worstTicketMs)} />
            <Row label="Tickets cleared" value={`${st.ticketsCleared} / ${st.ticketsPrinted}`} />
            <p className="mt-3 mb-1 text-xs text-amber">ACCURACY</p>
            <Row label="Bad plates caught" value={st.errorsCaught} />
            <Row label="Bad plates sent" value={st.errorsEscaped} bad={st.errorsEscaped > 0} />
            <Row label="Good plates refired" value={st.refiresUnneeded} bad={st.refiresUnneeded > 0} />
          </div>
          <div className="space-y-1">
            <p className="mb-1 text-xs text-amber">PASS CONTROL</p>
            <Row label="Plates died" value={st.platesDied} bad={st.platesDied > 0} />
            <Row label="Incomplete tables sent" value={st.incompleteSends} bad={st.incompleteSends > 0} />
            <Row label="Tables landed together" value={st.syncedCourses} />
            <p className="mt-3 mb-1 text-xs text-amber">THE DOOR</p>
            <Row label="Answered right" value={st.interrupts.correct} />
            <Row label="Answered wrong" value={st.interrupts.wrong} bad={st.interrupts.wrong > 0} />
            <Row label="Ignored" value={st.interrupts.timeout} bad={st.interrupts.timeout > 0} />
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-1 text-xs text-amber">
            SERVICE HEALTH {summary.health} · sub-scores: health {summary.subScores.health} · time{' '}
            {summary.subScores.time} · accuracy {summary.subScores.accuracy} · pass {summary.subScores.pass}
          </p>
          <div className="flex flex-wrap gap-x-4 text-xs">
            {reasons.map(([r, v]) => (
              <span key={r} className={v < 0 ? 'text-rush' : 'text-phosphor'}>
                {v > 0 ? '+' : ''}
                {v} {REASON_LABEL[r]}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => engine.restart()}
            className="border border-amber px-4 py-2 text-amber hover:bg-amber hover:text-ink"
          >
            RETRY (same tickets)
          </button>
          <button
            onClick={() => engine.start(summary.nightId, randomSeed())}
            className="border border-tile px-4 py-2 text-tile hover:text-paper"
          >
            NEW SEED
          </button>
          <button onClick={() => engine.quitToTitle()} className="px-4 py-2 text-tile hover:text-paper">
            TITLE
          </button>
          <span className="ml-auto text-xs text-tile">seed {summary.seed}</span>
        </div>
      </section>
    </main>
  );
}
