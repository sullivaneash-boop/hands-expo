import type { NightId } from '../../config/tuning';
import { engine, randomSeed } from '../../engine/runtime';
import { useGameStore } from '../../store/useGameStore';
import { pts, REASON_LABEL, secs } from '../format';
import type { ScoreReason } from '../../sim';

function Row({ label, value, tone }: { label: string; value: string | number; tone?: 'bad' | 'good' }) {
  return (
    <div className="flex justify-between gap-6">
      <span className="text-tile">{label}</span>
      <span
        className={`tabular-nums ${tone === 'bad' ? 'text-rush' : tone === 'good' ? 'text-amber' : 'text-phosphor'}`}
      >
        {value}
      </span>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <div className="text-3xl tracking-widest" aria-label={`${n} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < n ? 'text-amber' : 'text-steel'}>
          ★
        </span>
      ))}
    </div>
  );
}

export function SummaryScreen() {
  const summary = useGameStore((s) => s.snap?.summary);
  if (!summary) return null;
  const st = summary.stats;
  const won = summary.outcome === 'won';
  const headline = won
    ? 'SHIFT SURVIVED'
    : summary.lostBy === 'allergy'
      ? 'ALLERGY INCIDENT'
      : 'YOU’RE OFF EXPO';
  const heat = Object.entries(st.heatByReason).filter(([, v]) => (v ?? 0) > 0.5) as [ScoreReason, number][];

  return (
    <main className="flex h-full items-center justify-center overflow-auto p-4">
      <section className="w-full max-w-2xl border border-steel bg-night p-6 text-sm">
        <p className="text-xs tracking-widest text-tile">NIGHT {summary.nightId} · END OF SHIFT</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${won ? 'text-amber' : 'text-rush'}`}>{headline}</h1>
            {!won && summary.lostBy === 'heat' && (
              <p className="text-xs text-tile">The manager pulled you off the pass. Run it back.</p>
            )}
          </div>
          <div className="text-right">
            <Stars n={summary.stars} />
            <div className="text-4xl font-bold tabular-nums text-paper">{pts(summary.score)}</div>
            <div className="text-xs text-tile">grade {summary.grade}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-1">
            <p className="mb-1 text-xs text-amber">SERVICE</p>
            <Row label="Perfect tables (in sync)" value={st.perfectSyncs} tone="good" />
            <Row label="Best combo" value={`×${st.comboMax.toFixed(2)}`} tone="good" />
            <Row label="Clean boards" value={st.cleanBoards} tone="good" />
            <Row label="Saves (bad plates caught)" value={st.errorsCaught} tone="good" />
            <Row label="Avg course (ready → out)" value={secs(summary.avgCourseMs)} />
            <Row label="Tickets cleared" value={`${st.ticketsCleared} / ${st.ticketsPrinted}`} />
          </div>
          <div className="space-y-1">
            <p className="mb-1 text-xs text-amber">WHAT WENT WRONG</p>
            <Row
              label="Bad plates sent"
              value={st.errorsEscaped}
              tone={st.errorsEscaped ? 'bad' : undefined}
            />
            <Row label="Plates died" value={st.platesDied} tone={st.platesDied ? 'bad' : undefined} />
            <Row
              label="Fired into a full station"
              value={st.overfires}
              tone={st.overfires ? 'bad' : undefined}
            />
            <Row
              label="Incomplete tables sent"
              value={st.incompleteSends}
              tone={st.incompleteSends ? 'bad' : undefined}
            />
            <Row
              label="Sent early / beat the bar"
              value={`${st.earlyLandings} / ${st.barViolations}`}
              tone={st.earlyLandings + st.barViolations ? 'bad' : undefined}
            />
            <Row
              label="Peak heat · meltdowns"
              value={`${Math.round(st.heatPeak)} · ${st.criticals}`}
              tone={st.criticals ? 'bad' : undefined}
            />
            {st.allergyIncidents > 0 && (
              <Row label="Allergy incidents" value={st.allergyIncidents} tone="bad" />
            )}
          </div>
        </div>

        {heat.length > 0 && (
          <div className="mt-6">
            <p className="mb-1 text-xs text-amber">WHERE THE HEAT CAME FROM</p>
            <div className="flex flex-wrap gap-x-4 text-xs">
              {heat
                .sort((a, b) => b[1] - a[1])
                .map(([r, v]) => (
                  <span key={r} className="text-rush">
                    +{Math.round(v)} {REASON_LABEL[r]}
                  </span>
                ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {won && summary.nightId < 5 && (
            <button
              onClick={() => engine.start((summary.nightId + 1) as NightId, randomSeed())}
              className="border border-amber bg-amber px-4 py-2 font-bold text-ink"
            >
              NEXT NIGHT ▶
            </button>
          )}
          <button
            onClick={() => engine.restart()}
            className="border border-amber px-4 py-2 text-amber hover:bg-amber hover:text-ink"
          >
            RUN IT BACK (same tickets)
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
