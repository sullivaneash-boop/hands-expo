import { content } from '../../data';
import type { StationId } from '../../data/schema';
import { engine } from '../../engine/runtime';
import { stationCapacity, type CookJob } from '../../sim';
import { useGameStore } from '../../store/useGameStore';
import { Icon } from '../icons/Icon';
import { line } from '../format';

const menuById = new Map(content.menu.map((m) => [m.id, m]));

function MiniPan({ job }: { job: CookJob }) {
  const nowMs = useGameStore((s) => Math.floor((s.snap?.nowMs ?? 0) / 200) * 200);
  const item = useGameStore((s) =>
    s.snap?.tickets[job.ticketId]?.courses[job.courseIdx]?.items.find((i) => i.id === job.itemId),
  );
  const table = useGameStore((s) => s.snap?.tickets[job.ticketId]?.table);
  const pct =
    job.status === 'cooking' && job.startedAtMs !== null && job.doneAtMs !== null
      ? Math.min(100, ((nowMs - job.startedAtMs) / (job.doneAtMs - job.startedAtMs)) * 100)
      : 0;
  const look =
    job.status === 'queued'
      ? 'border-dashed border-amber/70 opacity-70'
      : job.status === 'waiting'
        ? 'border-rush'
        : 'border-steel';
  return (
    <div
      className={`flex w-9 flex-col items-center rounded border bg-night/80 ${look}`}
      title={`T${table ?? '?'}`}
    >
      <Icon name={menuById.get(item?.menuId ?? '')?.icon ?? 'unknown'} size={20} />
      <span className="text-[8px] leading-none text-tile">T{table ?? '?'}</span>
      <span className="mt-0.5 h-0.5 w-7 bg-steel">
        <span className="block h-full bg-amber" style={{ width: `${pct}%` }} />
      </span>
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
  const shown = [...cooking, ...queued].slice(0, 4);
  const more = cooking.length + queued.length - shown.length;
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col gap-1 px-1.5 py-1 ${dragging ? 'bg-rush/10' : ''}`}
      data-coach={`station-${id}`}
    >
      <div className="flex items-baseline justify-between text-[10px] tracking-wider">
        <span className="text-tile">{name}</span>
        <span
          className={`font-bold tabular-nums ${queued.length ? 'text-amber' : dragging ? 'text-rush' : 'text-steel'}`}
        >
          {cooking.length}/{capacity}
          {queued.length ? `+${queued.length}` : ''}
        </span>
      </div>
      <div className="flex gap-1" aria-hidden>
        {Array.from({ length: capacity }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < cooking.length ? (dragging ? 'anim-flicker-slow bg-rush' : 'anim-flicker bg-amber') : 'bg-steel/40'}`}
          />
        ))}
      </div>
      <div className="flex min-h-[40px] gap-1 overflow-hidden">
        {shown.map((j) => (
          <MiniPan key={j.itemId} job={j} />
        ))}
        {more > 0 && <span className="self-center text-[10px] text-tile">+{more}</span>}
      </div>
    </div>
  );
}

/** Line call-outs (86, drag, drop, add-ons) as a speech bubble over the line. */
function Chatter() {
  const barks = useGameStore((s) => s.snap?.barks);
  const nowMs = useGameStore((s) => Math.floor((s.snap?.nowMs ?? 0) / 250) * 250);
  const b = (barks ?? []).filter((x) => nowMs - x.atMs < 4_000).at(-1);
  if (!b) return null;
  return (
    <div className="pointer-events-none absolute inset-x-2 -top-3 z-10 flex justify-center">
      <div
        key={`${b.atMs}-${b.lineId}`}
        className="anim-bubble-in max-w-full rounded-md bg-paper px-2 py-1 text-xs font-bold text-ink shadow-lg"
      >
        “{line(b.lineId, b.vars)}”
      </div>
    </div>
  );
}

/** The line, compact: GRILL · SAUTÉ · PANTRY with slots, queues and pans (D-066, D-073). */
export function LineStrip() {
  return (
    <section
      className="relative shrink-0 border-b-2 border-steel bg-gradient-to-b from-night to-steel/25"
      aria-label="The line"
    >
      <Chatter />
      <div className="flex divide-x divide-steel/50">
        {content.stations.map((s) => (
          <Station key={s.id} id={s.id} name={s.name} />
        ))}
      </div>
    </section>
  );
}
