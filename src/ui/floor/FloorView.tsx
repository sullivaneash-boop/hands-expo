import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { content } from '../../data';
import { bus } from '../../engine/bus';
import { engine } from '../../engine/runtime';
import { STATUS_ANSWERS, type ActiveInterrupt } from '../../sim';
import { useGameStore } from '../../store/useGameStore';
import { Figure } from '../scene/Figure';
import { line, REPLY_LINE, speakerName, STATUS_LABEL } from '../format';

function Bubble({ children, tone = 'paper' }: { children: React.ReactNode; tone?: 'paper' | 'dim' }) {
  return (
    <div
      className={`anim-bubble-in relative mb-2 w-60 rounded-lg p-3 text-sm shadow-lg ${
        tone === 'paper' ? 'bg-paper text-ink' : 'bg-steel text-paper'
      }`}
    >
      {children}
      <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-inherit" />
    </div>
  );
}

function Waiting({ id }: { id: string }) {
  const it = useGameStore((s) => s.snap?.interrupts[id]);
  const nowMs = useGameStore((s) => s.snap?.nowMs ?? 0);
  const [arrived, setArrived] = useState(false);
  if (!it) return null;
  const def = content.interrupts.find((d) => d.id === it.defId);
  const left = Math.max(0, it.expiresAtMs - nowMs);
  const pct = (left / (it.expiresAtMs - it.arrivedAtMs)) * 100;
  return (
    <div className="flex flex-col items-center">
      <Bubble>
        <div className="mb-1 text-[10px] tracking-widest text-ink/60">
          {speakerName(it.speaker, it.source)} · TABLE {it.table}
        </div>
        <p className="mb-2 font-bold">“{line(it.lineId, { table: it.table })}”</p>
        <div className="mb-2 h-1 bg-ink/15">
          <div className={`h-full ${pct < 33 ? 'bg-rush' : 'bg-amber'}`} style={{ width: `${pct}%` }} />
        </div>
        {def?.choices === 'ticketStatus' ? (
          <div className="grid grid-cols-2 gap-1">
            {STATUS_ANSWERS.map((choice) => (
              <button
                key={choice}
                onClick={() => engine.dispatch({ type: 'answer', interruptId: id, choice })}
                className="border border-ink/40 px-1 py-1 text-[10px] font-bold hover:bg-amber"
              >
                {STATUS_LABEL[choice]}
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => engine.dispatch({ type: 'answer', interruptId: id, choice: 'heard' })}
            className="w-full bg-ink px-2 py-1 text-xs font-bold text-paper hover:bg-amber hover:text-ink"
          >
            HEARD!
          </button>
        )}
      </Bubble>
      <div className={arrived ? 'anim-bob' : 'anim-walk-in'} onAnimationEnd={() => setArrived(true)}>
        <Figure source={it.source} who={it.speaker} label={speakerName(it.speaker, it.source)} scale={1.3} />
      </div>
    </div>
  );
}

interface Leaving {
  key: string;
  it: ActiveInterrupt;
  outcome: string;
}

/** The swing door to the dining room. People walk up, wait, and leave; while you're here you can't see the pass. */
export function FloorView() {
  const order = useGameStore((s) => s.snap?.interruptOrder);
  const interrupts = useGameStore((s) => s.snap?.interrupts);
  const last = useRef(interrupts);
  useLayoutEffect(() => {
    last.current = interrupts;
  }, [interrupts]);
  const [leaving, setLeaving] = useState<Leaving[]>([]);

  useEffect(
    () =>
      bus.on('interruptResolved', (e) => {
        const it = last.current?.[e.interruptId];
        if (it) setLeaving((l) => [...l, { key: `${e.interruptId}-out`, it, outcome: e.outcome }]);
      }),
    [],
  );

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#3a4440] to-[#22201d]">
      {/* the door frame */}
      <div
        className="pointer-events-none absolute top-6 left-1/2 flex h-[70%] w-72 -translate-x-1/2 gap-1 border-8 border-steel bg-[#2b2622]"
        aria-hidden
      >
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-1 justify-center border border-[#1b1815] pt-8">
            <div className="h-14 w-14 rounded-full border-4 border-steel bg-[#9a8a6a]/30" />
          </div>
        ))}
      </div>
      <div className="relative mt-auto flex min-h-[70%] flex-wrap items-end justify-center gap-6 px-6 pb-6">
        {order?.map((id) => (
          <Waiting key={id} id={id} />
        ))}
        {leaving.map((l) => (
          <div
            key={l.key}
            className="anim-walk-out flex flex-col items-center"
            style={{ animationDelay: '500ms, 500ms' }}
            onAnimationEnd={(e) => {
              if (e.animationName === 'walk-out') setLeaving((all) => all.filter((x) => x.key !== l.key));
            }}
          >
            <Bubble tone="dim">“{REPLY_LINE[l.outcome] ?? '…'}”</Bubble>
            <Figure
              source={l.it.source}
              who={l.it.speaker}
              label={speakerName(l.it.speaker, l.it.source)}
              scale={1.3}
            />
          </div>
        ))}
        {(!order || order.length === 0) && leaving.length === 0 && (
          <p className="mb-10 text-sm text-tile">The door swings. Nobody’s waiting.</p>
        )}
      </div>
      <div className="h-3 bg-[#1a1714]" aria-hidden />
      <p className="py-1 text-center text-[10px] text-tile">
        THE DOOR · answer from memory, you can’t see the rail from here · A to turn back
      </p>
    </div>
  );
}
