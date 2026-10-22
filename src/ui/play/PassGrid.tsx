import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { tuning } from '../../config/tuning';
import { content } from '../../data';
import { bus } from '../../engine/bus';
import { engine } from '../../engine/runtime';
import { plateIsWrong, type Plate } from '../../sim';
import { useGameStore } from '../../store/useGameStore';
import { Icon } from '../icons/Icon';
import { track } from '../telemetry';

const menuById = new Map(content.menu.map((m) => [m.id, m]));

type ExitKind = 'sent' | 'bin' | 'wilt' | 'drop';
const EXIT_CLASS: Record<ExitKind, string> = {
  sent: 'anim-plate-sent',
  bin: 'anim-plate-bin',
  wilt: 'anim-plate-wilt',
  drop: 'anim-plate-drop',
};

/** A plate: big dish silhouette, a freshness ring that drains, ticket/seat tag, allergy pick, ✓ once approved. */
function PlateFace({
  plate,
  table,
  ageMs,
  selected,
  related,
  approved,
  reveal,
}: {
  plate: Plate;
  table: number | undefined;
  ageMs: number;
  selected?: boolean;
  related?: boolean;
  approved?: boolean;
  reveal?: boolean;
}) {
  const life = Math.max(0, 1 - ageMs / tuning.pass.plateDieMs);
  const ringColor = life < 0.33 ? '#c8423b' : life < 0.6 ? '#e8a33d' : '#8fd19e';
  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative flex h-[84px] w-[84px] items-center justify-center rounded-full p-[5px] ${selected ? 'scale-105' : ''} ${
          reveal ? 'outline-4 outline-rush' : ''
        }`}
        style={{ background: `conic-gradient(${ringColor} ${life * 360}deg, #2a2a2a 0deg)` }}
      >
        <div
          className={`flex h-full w-full items-center justify-center rounded-full bg-paper shadow-[inset_0_-6px_12px_rgba(0,0,0,0.15)] ${
            selected ? 'ring-4 ring-amber' : related ? 'ring-2 ring-amber/60' : ''
          }`}
        >
          <Icon name={menuById.get(plate.build.menuId)?.icon ?? 'unknown'} size={50} />
        </div>
        {plate.build.allergyPick && (
          <span className="absolute -top-1 -right-1" title="Allergy pick">
            <Icon name="shield" size={22} />
          </span>
        )}
        {approved && (
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-phosphor text-sm font-bold text-ink">
            ✓
          </span>
        )}
      </div>
      <span className="mt-0.5 text-[11px] font-bold text-paper">
        T{table ?? '?'} · {plate.seat === 'share' ? 'SHR' : `S${plate.seat}`}
        {plate.onTheFly ? <span className="ml-1 text-rush">OTF</span> : null}
      </span>
    </div>
  );
}

function LivePlate({ id }: { id: string }) {
  const plate = useGameStore((s) => s.snap?.plates[id]);
  const table = useGameStore((s) => (plate ? s.snap?.tickets[plate.ticketId]?.table : undefined));
  const ageMs = useGameStore((s) =>
    plate ? Math.floor(((s.snap?.nowMs ?? 0) - plate.upAtMs) / 250) * 250 : 0,
  );
  const selected = useGameStore((s) => s.selectedPlateId === id);
  const related = useGameStore((s) => !!plate && s.selectedTicketId === plate.ticketId);
  const approved = useGameStore((s) => !!s.approved[id]);
  const reveal = useGameStore(
    (s) => s.revealDefects && !!s.snap && !!plate && plateIsWrong(engine.ctx, s.snap, plate),
  );
  if (!plate) return null;
  return (
    <button
      data-plate={id}
      data-coach={`plate-${table ?? ''}`}
      className="anim-plate-in flex min-h-[110px] items-start justify-center"
      aria-label={`Plate: table ${table ?? '?'} ${menuById.get(plate.build.menuId)?.ticketName ?? ''}`}
      onClick={() => {
        const store = useGameStore.getState();
        store.selectPlate(id, plate.ticketId);
        store.openSheet({ kind: 'plate', id });
        engine.dispatch({ type: 'check', plateId: id });
        track('check_open', { plateId: id });
      }}
    >
      <PlateFace
        plate={plate}
        table={table}
        ageMs={ageMs}
        selected={selected}
        related={related}
        approved={approved}
        reveal={reveal}
      />
    </button>
  );
}

interface Ghost {
  key: string;
  plate: Plate;
  table: number | undefined;
  kind: ExitKind;
  left: number;
  top: number;
}

/** The pass: a fixed number of plate spots (D-066). Exits animate from where the plate sat. */
export function PassGrid() {
  const order = useGameStore((s) => s.snap?.windowOrder);
  const plates = useGameStore((s) => s.snap?.plates);
  const tickets = useGameStore((s) => s.snap?.tickets);
  const backed = useGameStore((s) => s.snap?.cooking.filter((j) => j.status === 'waiting').length ?? 0);
  const grid = useRef<HTMLDivElement>(null);
  const last = useRef({ plates, tickets });
  useLayoutEffect(() => {
    last.current = { plates, tickets };
  }, [plates, tickets]);
  const [ghosts, setGhosts] = useState<Ghost[]>([]);

  useEffect(() => {
    const capture = (ids: string[], kind: ExitKind) => {
      const box = grid.current?.getBoundingClientRect();
      if (!box) return;
      const found: Ghost[] = [];
      for (const id of ids) {
        const el = grid.current?.querySelector(`[data-plate="${id}"]`);
        const plate = last.current.plates?.[id];
        if (!el || !plate) continue;
        const r = el.getBoundingClientRect();
        found.push({
          key: `${id}-${kind}`,
          plate,
          table: last.current.tickets?.[plate.ticketId]?.table,
          kind,
          left: r.left - box.left,
          top: r.top - box.top,
        });
      }
      if (found.length) setGhosts((g) => [...g, ...found]);
    };
    const offs = [
      bus.on('courseSent', (e) => capture(e.plateIds, 'sent')),
      bus.on('plateRefired', (e) => capture([e.plateId], 'bin')),
      bus.on('plateDied', (e) => capture([e.plateId], 'wilt')),
      bus.on('plateDropped', (e) => capture([e.plateId], 'drop')),
    ];
    return () => offs.forEach((off) => off());
  }, []);

  const spots = tuning.pass.spots;
  const ids = order ?? [];
  return (
    <section
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-[#2a2722] to-steel/40"
      aria-label="The pass"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-around" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-20 w-32 bg-[radial-gradient(ellipse_at_top,rgba(232,163,61,0.35),transparent_70%)]"
          />
        ))}
      </div>
      <div className="flex items-center justify-between px-3 pt-1 text-[10px] tracking-widest text-tile">
        <span>
          THE PASS · {ids.length}/{spots}
        </span>
        {backed > 0 && <span className="animate-pulse font-bold text-rush">+{backed} BACKED UP</span>}
      </div>
      <div
        ref={grid}
        className="relative grid flex-1 grid-cols-3 content-start justify-items-center gap-x-2 gap-y-1 px-2 pt-1"
      >
        {Array.from({ length: spots }, (_, i) => {
          const id = ids[i];
          return id ? (
            <LivePlate key={id} id={id} />
          ) : (
            <div
              key={`empty-${i}`}
              className="mt-[5px] h-[84px] w-[84px] rounded-full border-2 border-dashed border-steel/40"
              aria-hidden
            />
          );
        })}
        {ghosts.map((g) => (
          <div
            key={g.key}
            className={`pointer-events-none absolute ${EXIT_CLASS[g.kind]}`}
            style={{ left: g.left, top: g.top }}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget) setGhosts((all) => all.filter((x) => x.key !== g.key));
            }}
          >
            <PlateFace plate={g.plate} table={g.table} ageMs={0} />
          </div>
        ))}
      </div>
    </section>
  );
}
