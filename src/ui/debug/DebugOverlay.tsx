import { useEffect, useState } from 'react';
import { tuning, type NightId } from '../../config/tuning';
import { content } from '../../data';
import { bus } from '../../engine/bus';
import { engine, randomSeed } from '../../engine/runtime';
import type { SimEvent } from '../../sim';
import { useGameStore } from '../../store/useGameStore';
import { mmss } from '../format';

/** Dev builds always; any build with ?debug=1 (D-025). */
export const debugEnabled =
  import.meta.env.DEV || new URLSearchParams(window.location.search).get('debug') === '1';

const Btn = ({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`border px-1.5 py-0.5 ${active ? 'border-amber bg-amber text-ink' : 'border-steel text-paper hover:border-tile'}`}
  >
    {children}
  </button>
);

function EventLog() {
  const [log, setLog] = useState<{ at: number; e: SimEvent }[]>([]);
  useEffect(
    () =>
      bus.onAny((e) => {
        if (e.type === 'secondElapsed' || (e.type === 'healthChanged' && e.reason === 'late')) return;
        const at = useGameStore.getState().snap?.nowMs ?? 0;
        setLog((prev) => [...prev.slice(-29), { at, e }]);
      }),
    [],
  );
  return (
    <div className="max-h-40 overflow-y-auto bg-black/40 p-1 text-[10px] leading-tight">
      {[...log].reverse().map(({ at, e }, i) => (
        <div key={i} className={e.type === 'commandRejected' ? 'text-rush' : 'text-tile'}>
          {mmss(at)} {e.type} {'ticketId' in e ? e.ticketId : ''}
          {'reason' in e ? ` ${String(e.reason)}` : ''}
          {'delta' in e ? ` ${e.delta}` : ''}
        </div>
      ))}
    </div>
  );
}

function StateView() {
  // Throttled: refresh at ~4 Hz, not every tick.
  const tick = useGameStore((s) => Math.floor((s.snap?.tick ?? 0) / 5));
  const [open, setOpen] = useState(false);
  const json = open ? JSON.stringify(useGameStore.getState().snap, null, 1) : '';
  void tick;
  return (
    <div>
      <Btn onClick={() => setOpen(!open)} active={open}>
        {open ? 'hide' : 'show'} state JSON
      </Btn>
      {open && <pre className="mt-1 max-h-64 overflow-auto bg-black/40 p-1 text-[9px]">{json}</pre>}
    </div>
  );
}

function Panel() {
  const speed = useGameStore((s) => s.speed);
  const paused = useGameStore((s) => s.paused);
  const seed = useGameStore((s) => s.snap?.seed);
  const tick = useGameStore((s) => s.snap?.tick ?? 0);
  const nowMs = useGameStore((s) => s.snap?.nowMs ?? 0);
  const phase = useGameStore((s) => s.snap?.phase);
  const nightId = useGameStore((s) => s.snap?.nightId ?? 1);
  const fps = useGameStore((s) => s.fps);
  const reveal = useGameStore((s) => s.revealDefects);
  const [seedInput, setSeedInput] = useState('');
  const [expanded, setExpanded] = useState(false);
  const store = useGameStore.getState();
  const dbg = (action: Parameters<typeof engine.dispatch>[0] & { type: 'debug' }) => engine.dispatch(action);

  return (
    <div className="fixed bottom-2 left-2 z-50 w-80 space-y-2 border border-amber bg-night/95 p-2 text-[11px] text-paper shadow-xl">
      <div className="flex justify-between text-amber">
        <button onClick={() => setExpanded(!expanded)} title="expand / collapse">
          {expanded ? '▾' : '▸'} DEBUG (`)
        </button>
        <span className="tabular-nums">
          {mmss(nowMs)} · t{tick} · {phase} · {fps}fps
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-tile">speed</span>
        {tuning.debug.speeds.map((sp) => (
          <Btn key={sp} onClick={() => store.setSpeed(sp)} active={speed === sp}>
            {sp}×
          </Btn>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        <Btn onClick={() => store.setPaused(!paused)} active={paused}>
          {paused ? 'resume' : 'pause'}
        </Btn>
        <Btn onClick={() => engine.stepOnce()}>step</Btn>
        <Btn onClick={() => engine.fastForward(10_000)}>+10s</Btn>
        <Btn onClick={() => engine.fastForward(30_000)}>+30s</Btn>
        <Btn onClick={() => dbg({ type: 'debug', action: { kind: 'spawnTicket' } })}>spawn ticket</Btn>
        <Btn
          onClick={() =>
            dbg({ type: 'debug', action: { kind: 'triggerInterrupt', interrupt: 'server_status' } })
          }
        >
          server asks
        </Btn>
      </div>
      {expanded && (
        <>
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-tile">health</span>
            {[100, 50, 10, 0].map((h) => (
              <Btn key={h} onClick={() => dbg({ type: 'debug', action: { kind: 'setHealth', health: h } })}>
                {h}
              </Btn>
            ))}
            <Btn onClick={() => store.setRevealDefects(!reveal)} active={reveal}>
              reveal bad plates
            </Btn>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-tile">night</span>
            {content.shifts.map((s) => (
              <Btn
                key={s.id}
                onClick={() => engine.start(s.id as NightId, randomSeed())}
                active={s.id === nightId}
              >
                {s.id}
              </Btn>
            ))}
            <Btn onClick={() => engine.restart()}>restart (same seed)</Btn>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-tile">seed</span>
            <span className="tabular-nums text-phosphor">{seed}</span>
            <input
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              placeholder="new seed"
              className="w-20 border border-steel bg-transparent px-1"
            />
            <Btn
              onClick={() => {
                const n = Number(seedInput);
                if (Number.isFinite(n)) engine.start(nightId, n >>> 0);
              }}
            >
              go
            </Btn>
          </div>
          <EventLog />
          <StateView />
        </>
      )}
    </div>
  );
}

export function DebugOverlay() {
  const open = useGameStore((s) => s.debugOpen);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('debug') === '1')
      useGameStore.getState().setDebugOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '`') useGameStore.getState().setDebugOpen(!useGameStore.getState().debugOpen);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return open ? <Panel /> : null;
}
