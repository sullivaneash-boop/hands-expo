import { engine } from '../../engine/runtime';
import { STATUS_ANSWERS } from '../../sim';
import { useGameStore } from '../../store/useGameStore';
import { line, serverName, STATUS_LABEL } from '../format';

function InterruptCard({ id }: { id: string }) {
  const it = useGameStore((s) => s.snap?.interrupts[id]);
  const nowMs = useGameStore((s) => s.snap?.nowMs ?? 0);
  if (!it) return null;
  const left = Math.max(0, it.expiresAtMs - nowMs);
  const pct = (left / (it.expiresAtMs - it.arrivedAtMs)) * 100;
  return (
    <div className="w-80 border-2 border-paper bg-night p-4">
      <div className="mb-1 text-xs text-tile">{serverName(it.speaker)} · SERVER</div>
      <p className="mb-3 text-lg text-paper">“{line(it.lineId, { table: it.table })}”</p>
      <div className="mb-3 h-1 bg-steel">
        <div className={`h-full ${pct < 33 ? 'bg-rush' : 'bg-amber'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {STATUS_ANSWERS.map((choice) => (
          <button
            key={choice}
            onClick={() => engine.dispatch({ type: 'answer', interruptId: id, choice })}
            className="border border-tile px-2 py-1 text-xs text-paper hover:border-amber hover:text-amber"
          >
            {STATUS_LABEL[choice]}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The swing door to the dining room. Interrupts wait here; while you're here you can't see the pass. */
export function FloorView() {
  const order = useGameStore((s) => s.snap?.interruptOrder);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-steel/20 p-6">
      <div className="text-xs tracking-widest text-tile">THE DOOR · DINING ROOM</div>
      {order && order.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-4">
          {order.map((id) => (
            <InterruptCard key={id} id={id} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-tile">The door swings. Nobody’s waiting.</p>
      )}
      <p className="text-[10px] text-tile">Answer from memory. You can’t see the rail from here.</p>
    </div>
  );
}
