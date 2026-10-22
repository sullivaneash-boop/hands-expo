import { content } from '../../data';
import type { StationId } from '../../data/schema';
import { stationCapacity, type CookJob } from '../../sim';
import { engine } from '../../engine/runtime';
import { useGameStore } from '../../store/useGameStore';
import { line, shortName } from '../format';

const BARK_MS = 4_500;

/** One pan: dish, table, and a rough "how done" fill. Queued items wait in line; finished food backs up. */
function Pan({ job }: { job: CookJob }) {
  const nowMs = useGameStore((s) => s.snap?.nowMs ?? 0);
  const table = useGameStore((s) => s.snap?.tickets[job.ticketId]?.table);
  const menuId = useGameStore(
    (s) =>
      s.snap?.tickets[job.ticketId]?.courses[job.courseIdx]?.items.find((i) => i.id === job.itemId)?.menuId,
  );
  const pct =
    job.status === 'queued' || job.startedAtMs === null || job.doneAtMs === null
      ? 0
      : Math.min(100, ((nowMs - job.startedAtMs) / (job.doneAtMs - job.startedAtMs)) * 100);
  const look =
    job.status === 'queued'
      ? 'border-dashed border-steel/70 bg-night/40 text-paper/60'
      : job.status === 'waiting'
        ? 'border-rush bg-rush/15 text-paper'
        : 'border-steel bg-night/80 text-paper';
  return (
    <div
      className={`anim-bubble-in w-[4.6rem] shrink-0 rounded-sm border p-1 text-[9px] leading-tight ${look}`}
    >
      <div className="truncate font-bold">{menuId ? shortName(menuId) : '…'}</div>
      <div className="flex justify-between text-tile">
        <span>T{table ?? '?'}</span>
        {job.onTheFly && <span className="text-rush">OTF</span>}
        {job.allergyProtocol && <span className="text-rush">⚑</span>}
      </div>
      {job.status === 'queued' ? (
        <div className="mt-0.5 text-[8px] tracking-widest text-tile">QUEUED</div>
      ) : job.status === 'waiting' ? (
        <div className="mt-0.5 text-[8px] font-bold tracking-widest text-rush">BACKED UP</div>
      ) : (
        <div className="mt-0.5 h-1 bg-steel">
          <div className="h-full bg-amber/80" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

function Station({ id, name }: { id: StationId; name: string }) {
  const jobs = useGameStore((s) => s.snap?.cooking);
  const dragging = useGameStore((s) => (s.snap ? s.snap.nowMs < s.snap.stations[id].dragUntilMs : false));
  const capacity = useGameStore((s) => (s.snap ? stationCapacity(engine.ctx, s.snap, id) : 0));
  const mine = (jobs ?? []).filter((j) => j.station === id);
  const cooking = mine.filter((j) => j.status === 'cooking');
  const queued = mine.filter((j) => j.status === 'queued');
  const waiting = mine.filter((j) => j.status === 'waiting');
  const order = [...cooking, ...queued, ...waiting];
  return (
    <div
      className={`relative flex min-w-0 flex-1 flex-col border-x border-steel/60 px-2 pt-1 ${dragging ? 'bg-rush/10' : ''}`}
    >
      <div className="flex items-center justify-between text-[10px] tracking-widest">
        <span className="text-tile">{name}</span>
        <span
          className={queued.length ? 'font-bold text-amber' : dragging ? 'font-bold text-rush' : 'text-steel'}
        >
          {dragging ? 'DRAGGING · ' : ''}
          {cooking.length}/{capacity}
          {queued.length ? ` · ${queued.length} queued` : ''}
        </span>
      </div>
      <div className="flex min-h-[3.1rem] items-end gap-1 overflow-hidden py-1">
        {order.map((j) => (
          <Pan key={j.itemId} job={j} />
        ))}
      </div>
      {/* burners: one per slot, lit when in use */}
      <div className="flex h-3 items-end justify-around" aria-hidden>
        {Array.from({ length: capacity }, (_, i) => (
          <div
            key={i}
            className={`h-3 w-5 rounded-t-full ${i < cooking.length ? (dragging ? 'anim-flicker-slow bg-rush/80' : 'anim-flicker bg-amber/80') : 'bg-steel/40'}`}
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
