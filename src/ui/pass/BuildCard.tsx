import { engine } from '../../engine/runtime';
import { useGameStore } from '../../store/useGameStore';
import { itemName, modText, seatLabel } from '../format';

/** CHECK: what the kitchen actually put on the plate. Compare it with the ticket on the rail. */
export function BuildCard() {
  const plateId = useGameStore((s) => s.selectedPlateId);
  const plate = useGameStore((s) => (plateId ? s.snap?.plates[plateId] : undefined));
  const table = useGameStore((s) => (plate ? s.snap?.tickets[plate.ticketId]?.table : undefined));

  if (!plate) {
    return (
      <div className="flex h-full items-center justify-center border border-dashed border-steel p-3 text-center text-xs text-tile">
        No plate selected.
        <br />
        Click a plate in the window to check it.
      </div>
    );
  }

  const close = () => useGameStore.getState().selectPlate(null);
  return (
    <div className="flex h-full flex-col border border-amber bg-night p-3 text-xs">
      <div className="mb-2 flex justify-between text-tile">
        <span>
          AS MADE · T{table} · {seatLabel(plate.seat)}
        </span>
        {plate.onTheFly && <span className="text-amber">ON THE FLY</span>}
      </div>
      <div className="flex-1 font-bold text-paper">
        {itemName(plate.build.menuId)}
        {plate.build.mods.map((m) => (
          <div key={m} className="pl-4 font-normal">
            {modText(m)}
          </div>
        ))}
        {plate.build.mods.length === 0 && <div className="pl-4 font-normal text-tile">(nothing extra)</div>}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => {
            engine.dispatch({ type: 'refire', plateId: plate.id });
            close();
          }}
          className="flex-1 border border-rush px-2 py-1 font-bold text-rush hover:bg-rush hover:text-paper"
        >
          REFIRE
        </button>
        <button
          onClick={() => {
            engine.dispatch({ type: 'send', ticketId: plate.ticketId, courseIdx: plate.courseIdx });
            close();
          }}
          className="flex-1 border border-amber bg-amber px-2 py-1 font-bold text-ink"
        >
          HANDS! T{table}
        </button>
      </div>
    </div>
  );
}
