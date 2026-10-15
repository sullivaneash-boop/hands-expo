import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { tuning } from '../../config/tuning';
import { bus } from '../../engine/bus';
import { engine } from '../../engine/runtime';
import { plateIsWrong, type Plate } from '../../sim';
import { useGameStore } from '../../store/useGameStore';
import { itemName, seatLabel } from '../format';
import { BuildCard } from './BuildCard';

type ExitKind = 'sent' | 'bin' | 'wilt' | 'drop';
const EXIT_CLASS: Record<ExitKind, string> = {
  sent: 'anim-plate-sent',
  bin: 'anim-plate-bin',
  wilt: 'anim-plate-wilt',
  drop: 'anim-plate-drop',
};

interface Ghost {
  key: string;
  plate: Plate;
  table: number | undefined;
  kind: ExitKind;
  left: number;
  top: number;
}

/** A plate on the pass: rim, dish, ticket tag, allergy pick (visible), heat timer. */
function PlateView({
  plate,
  table,
  selected,
  related,
  reveal,
  ageMs,
}: {
  plate: Plate;
  table: number | undefined;
  selected?: boolean;
  related?: boolean;
  reveal?: boolean;
  ageMs: number;
}) {
  const pct = Math.min(100, (ageMs / tuning.pass.plateDieMs) * 100);
  return (
    <div className="flex w-32 flex-col items-center">
      <div
        className={`relative flex h-20 w-32 items-center justify-center rounded-[50%] border-[5px] bg-paper text-center text-[11px] font-bold leading-tight text-ink shadow-[0_8px_12px_rgba(0,0,0,0.5),inset_0_-4px_10px_rgba(0,0,0,0.12)] ${
          selected ? 'border-amber' : related ? 'border-amber/50' : 'border-[#dcd6c8]'
        } ${reveal ? 'ring-4 ring-rush' : ''}`}
      >
        <span className="px-4">{itemName(plate.build.menuId)}</span>
        {plate.build.allergyPick && (
          <span className="absolute -top-3 right-5 text-lg text-rush drop-shadow" title="Allergy pick">
            ⚑
          </span>
        )}
      </div>
      <div className="mt-1 flex w-24 items-center justify-between text-[10px] text-paper">
        <span className="font-bold">T{table ?? '?'}</span>
        <span>{seatLabel(plate.seat)}</span>
        {plate.onTheFly && <span className="text-rush">OTF</span>}
      </div>
      <div className="mt-0.5 h-1 w-24 bg-night/60">
        <div className={`h-full ${pct > 66 ? 'bg-rush' : 'bg-amber'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LivePlate({ id }: { id: string }) {
  const plate = useGameStore((s) => s.snap?.plates[id]);
  const table = useGameStore((s) => (plate ? s.snap?.tickets[plate.ticketId]?.table : undefined));
  const ageMs = useGameStore((s) => (plate ? (s.snap?.nowMs ?? 0) - plate.upAtMs : 0));
  const selected = useGameStore((s) => s.selectedPlateId === id);
  const related = useGameStore((s) => !!plate && s.selectedTicketId === plate.ticketId);
  const reveal = useGameStore(
    (s) => s.revealDefects && !!s.snap && !!plate && plateIsWrong(engine.ctx, s.snap, plate),
  );
  if (!plate) return null;
  const open = () => {
    const store = useGameStore.getState();
    if (selected) return store.selectPlate(null);
    store.selectPlate(id, plate.ticketId);
    engine.dispatch({ type: 'check', plateId: id });
  };
  return (
    <button
      data-plate={id}
      onClick={open}
      className="anim-plate-in"
      aria-label={`Plate: table ${table ?? '?'} ${seatLabel(plate.seat)} ${itemName(plate.build.menuId)}`}
    >
      <PlateView
        plate={plate}
        table={table}
        selected={selected}
        related={related}
        reveal={reveal}
        ageMs={ageMs}
      />
    </button>
  );
}

/** The CHECK card floats over the right of the pass while a plate is in hand. */
function PlateInHand() {
  const has = useGameStore((s) => s.selectedPlateId !== null && !!s.snap?.plates[s.selectedPlateId]);
  if (!has) return null;
  return (
    <div className="absolute top-4 right-4 z-20 w-60 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
      <BuildCard />
    </div>
  );
}

/** The pass: heat lamps over a steel shelf. Plates land from the line and leave toward the dining room. */
export function Window() {
  const order = useGameStore((s) => s.snap?.windowOrder);
  const plates = useGameStore((s) => s.snap?.plates);
  const tickets = useGameStore((s) => s.snap?.tickets);
  const shelf = useRef<HTMLDivElement>(null);
  // What was on the pass at the last render: exits are animated from these.
  const last = useRef({ plates, tickets });
  useLayoutEffect(() => {
    last.current = { plates, tickets };
  }, [plates, tickets]);
  const [ghosts, setGhosts] = useState<Ghost[]>([]);

  useEffect(() => {
    const capture = (ids: string[], kind: ExitKind) => {
      const box = shelf.current?.getBoundingClientRect();
      if (!box) return;
      const found: Ghost[] = [];
      for (const id of ids) {
        const el = shelf.current?.querySelector(`[data-plate="${id}"]`);
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

  return (
    <section className="relative flex flex-1 flex-col overflow-hidden border-2 border-steel bg-gradient-to-b from-[#2a2722] to-steel/40">
      {/* heat lamps */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-around" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="h-3 w-20 rounded-b-full bg-steel" />
            <div className="h-24 w-44 bg-[radial-gradient(ellipse_at_top,rgba(232,163,61,0.35),transparent_70%)]" />
          </div>
        ))}
      </div>
      <div ref={shelf} className="relative flex flex-1 flex-wrap content-start gap-3 px-4 pt-6 pb-3">
        {order && order.length > 0
          ? order.map((id) => <LivePlate key={id} id={id} />)
          : ghosts.length === 0 && <p className="text-sm text-tile">The window is clear.</p>}
        {ghosts.map((g) => (
          <div
            key={g.key}
            className={`pointer-events-none absolute ${EXIT_CLASS[g.kind]}`}
            style={{ left: g.left, top: g.top }}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget) setGhosts((all) => all.filter((x) => x.key !== g.key));
            }}
          >
            <PlateView plate={g.plate} table={g.table} ageMs={0} />
          </div>
        ))}
      </div>
      <PlateInHand />
      <div className="h-2 bg-gradient-to-b from-[#9aa1a6] to-steel" aria-hidden />
      <div className="px-3 py-1 text-[10px] text-tile">
        THE PASS — click a plate to check it against its ticket
      </div>
    </section>
  );
}
