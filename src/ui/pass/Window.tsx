import { engine } from '../../engine/runtime';
import { plateIsWrong, type Plate } from '../../sim';
import { useGameStore } from '../../store/useGameStore';
import { itemName, seatLabel } from '../format';
import { tuning } from '../../config/tuning';

/** Heat-lamp timer: how close this plate is to dying. */
function HeatBar({ plate }: { plate: Plate }) {
  const nowMs = useGameStore((s) => s.snap?.nowMs ?? 0);
  const pct = Math.min(100, ((nowMs - plate.upAtMs) / tuning.pass.plateDieMs) * 100);
  return (
    <div className="mt-1 h-1 bg-night/40">
      <div className={`h-full ${pct > 66 ? 'bg-rush' : 'bg-amber'}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function PlateChip({ id }: { id: string }) {
  const plate = useGameStore((s) => s.snap?.plates[id]);
  const table = useGameStore((s) => (plate ? s.snap?.tickets[plate.ticketId]?.table : undefined));
  const selected = useGameStore((s) => s.selectedPlateId === id);
  const ticketSelected = useGameStore((s) => !!plate && s.selectedTicketId === plate.ticketId);
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
      onClick={open}
      aria-label={`Plate: table ${table ?? '?'} ${seatLabel(plate.seat)} ${itemName(plate.build.menuId)}`}
      className={`w-36 border-2 bg-paper/90 p-2 text-left text-[11px] text-ink ${
        selected ? 'border-amber' : ticketSelected ? 'border-amber/50' : 'border-transparent'
      } ${reveal ? 'ring-2 ring-rush' : ''}`}
    >
      <div className="flex justify-between font-bold">
        <span>T{table}</span>
        <span>{seatLabel(plate.seat)}</span>
      </div>
      <div className="truncate">{itemName(plate.build.menuId)}</div>
      <HeatBar plate={plate} />
    </button>
  );
}

/** The pass: plates under the heat lamps, in arrival order. */
export function Window() {
  const order = useGameStore((s) => s.snap?.windowOrder);
  return (
    <section className="flex flex-1 flex-col border-2 border-steel bg-steel/30">
      <div className="h-2 bg-amber/60 shadow-[0_0_24px_6px] shadow-amber/30" aria-hidden />
      <div className="flex flex-1 flex-wrap content-start gap-2 p-3">
        {order && order.length > 0 ? (
          order.map((id) => <PlateChip key={id} id={id} />)
        ) : (
          <p className="text-sm text-tile">The window is clear.</p>
        )}
      </div>
      <div className="border-t border-steel px-3 py-1 text-[10px] text-tile">
        THE PASS — click a plate to check it against its ticket
      </div>
    </section>
  );
}
