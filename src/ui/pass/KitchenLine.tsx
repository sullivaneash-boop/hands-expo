import { content } from '../../data';
import type { StationId } from '../../data/schema';
import type { CookJob } from '../../sim';
import { useGameStore } from '../../store/useGameStore';
import { line, shortName } from '../format';

const BARK_MS = 4_500;

/** One pan on the flat-top: dish, table, and a rough "how done" fill (the expo can see the line). */
function Pan({ job }: { job: CookJob }) {
  const nowMs = useGameStore((s) => s.snap?.nowMs ?? 0);
  const table = useGameStore((s) => s.snap?.tickets[job.ticketId]?.table);
  const menuId = useGameStore(
    (s) =>
      s.snap?.tickets[job.ticketId]?.courses[job.courseIdx]?.items.find((i) => i.id === job.itemId)?.menuId,
  );
  const pct = Math.min(100, ((nowMs - job.firedAtMs) / (job.doneAtMs - job.firedAtMs)) * 100);
  return (
    <div className="anim-bubble-in w-[4.6rem] shrink-0 rounded-sm border border-steel bg-night/80 p-1 text-[9px] leading-tight text-paper">
      <div className="truncate font-bold">{menuId ? shortName(menuId) : '…'}</div>
      <div className="flex justify-between text-tile">
        <span>T{table ?? '?'}</span>
        {job.onTheFly && <span className="text-rush">OTF</span>}
        {job.allergyProtocol && <span className="text-rush">⚑</span>}
      </div>
      <div className="mt-0.5 h-1 bg-steel">
        <div className="h-full bg-amber/80" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Station({ id, name }: { id: StationId; name: string }) {
  const jobs = useGameStore((s) => s.snap?.cooking);
  const dragging = useGameStore((s) => (s.snap ? s.snap.nowMs < s.snap.stations[id].dragUntilMs : false));
  const mine = (jobs ?? []).filter((j) => j.station === id);
  const heat = Math.min(4, mine.length);
  return (
    <div
      className={`relative flex min-w-0 flex-1 flex-col border-x border-steel/60 px-2 pt-1 ${dragging ? 'bg-rush/10' : ''}`}
    >
      <div className="flex items-center justify-between text-[10px] tracking-widest">
        <span className="text-tile">{name}</span>
        {dragging ? (
          <span className="animate-pulse font-bold text-rush">DRAGGING</span>
        ) : (
          <span className="text-steel">{mine.length ? `${mine.length} working` : 'clear'}</span>
        )}
      </div>
      <div className="flex min-h-[3.1rem] items-end gap-1 overflow-hidden py-1">
        {mine.map((j) => (
          <Pan key={j.itemId} job={j} />
        ))}
      </div>
      {/* burners */}
      <div className="flex h-3 items-end justify-around" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={`h-3 w-4 rounded-t-full ${i < heat ? (dragging ? 'anim-flicker-slow bg-rush/80' : 'anim-flicker bg-amber/80') : 'bg-steel/40'}`}
            style={{ animationDelay: `${i * 70}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Call-outs from the line (86, drag, dropped plate) and POS add-ons, as speech bubbles. */
function Chatter() {
  const barks = useGameStore((s) => s.snap?.barks);
  const nowMs = useGameStore((s) => Math.floor((s.snap?.nowMs ?? 0) / 250) * 250);
  const live = (barks ?? []).filter((b) => nowMs - b.atMs < BARK_MS).slice(-2);
  return (
    <div className="pointer-events-none absolute inset-x-0 -top-1 z-10 flex justify-center gap-3">
      {live.map((b) => (
        <div
          key={`${b.atMs}-${b.lineId}`}
          className={`anim-bubble-in relative max-w-xs rounded-md px-2 py-1 text-xs font-bold shadow-lg ${
            b.source === 'kitchen' ? 'bg-paper text-ink' : 'bg-tile text-ink'
          }`}
        >
          “{line(b.lineId, b.vars)}”
          <span className="absolute -bottom-1 left-6 h-2 w-2 rotate-45 bg-inherit" />
        </div>
      ))}
    </div>
  );
}

/** The line behind the window: GRILL · SAUTÉ · PANTRY. */
export function KitchenLine() {
  return (
    <section className="relative border-b-2 border-steel bg-gradient-to-b from-night to-steel/30 pt-4">
      <Chatter />
      <div className="flex">
        {content.stations.map((s) => (
          <Station key={s.id} id={s.id} name={s.name} />
        ))}
      </div>
    </section>
  );
}
