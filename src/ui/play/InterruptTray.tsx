import { content } from '../../data';
import { engine } from '../../engine/runtime';
import { STATUS_ANSWERS } from '../../sim';
import { useGameStore } from '../../store/useGameStore';
import { Figure } from '../scene/Figure';
import { line, speakerName, STATUS_LABEL } from '../format';
import { track } from '../telemetry';

/**
 * Interrupts in a tray over the live board (D-064): the rail and pass stay visible while you answer.
 * The separate door view is parked for a future expert mode.
 */
export function InterruptTray() {
  const firstId = useGameStore((s) => s.snap?.interruptOrder[0]);
  const count = useGameStore((s) => s.snap?.interruptOrder.length ?? 0);
  const it = useGameStore((s) => (firstId ? s.snap?.interrupts[firstId] : undefined));
  const nowMs = useGameStore((s) => Math.floor((s.snap?.nowMs ?? 0) / 250) * 250);
  if (!it || !firstId) return null;
  const def = content.interrupts.find((d) => d.id === it.defId);
  const pct = Math.max(0, ((it.expiresAtMs - nowMs) / (it.expiresAtMs - it.arrivedAtMs)) * 100);
  const answer = (choice: string) => {
    engine.dispatch({ type: 'answer', interruptId: firstId, choice });
    track('action', { kind: 'answer', choice });
  };
  return (
    <section
      key={firstId}
      className="anim-bubble-in shrink-0 border-t-2 border-amber bg-[#24211d] px-3 pt-2 pb-2"
      aria-label="Someone needs you"
      data-coach="tray"
    >
      <div className="flex items-start gap-2">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-steel/40 pt-1">
          <Figure source={it.source} who={it.speaker} scale={0.55} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between text-[10px] tracking-widest text-tile">
            <span>
              {speakerName(it.speaker, it.source)} · T{it.table}
            </span>
            {count > 1 && <span className="text-amber">+{count - 1} waiting</span>}
          </div>
          <p className="text-sm leading-tight font-bold text-paper">
            “{line(it.lineId, { table: it.table })}”
          </p>
          <div className="mt-1 h-1 bg-night">
            <div className={`h-full ${pct < 33 ? 'bg-rush' : 'bg-amber'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      {def?.choices === 'ticketStatus' ? (
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {STATUS_ANSWERS.map((choice) => (
            <button
              key={choice}
              onClick={() => answer(choice)}
              className="min-h-11 rounded-sm border border-tile px-1 text-[11px] font-bold text-paper active:bg-amber active:text-ink"
            >
              {STATUS_LABEL[choice]}
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={() => answer('heard')}
          className="mt-2 min-h-12 w-full rounded-sm bg-amber text-base font-bold tracking-widest text-ink active:scale-[0.98]"
        >
          HEARD!
        </button>
      )}
    </section>
  );
}
