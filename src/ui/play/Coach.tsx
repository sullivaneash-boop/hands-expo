import { useEffect, useState, type RefObject } from 'react';
import { tutorial, type CoachStep } from '../../data/tutorial';
import { bus } from '../../engine/bus';
import { useProgress } from '../../engine/save';
import { useGameStore } from '../../store/useGameStore';
import { track } from '../telemetry';

const tablesOnRail = (): number[] => {
  const snap = useGameStore.getState().snap;
  if (!snap) return [];
  return snap.railOrder.flatMap((id) => {
    const t = snap.tickets[id];
    return t ? [t.table] : [];
  });
};

/** Has this step's condition happened? (bus events are latched in `seen`) */
function satisfied(step: CoachStep, seen: Set<string>, startedAt: number): boolean {
  const s = useGameStore.getState();
  const u = step.until;
  switch (u.kind) {
    case 'select': {
      const t = s.selectedTicketId ? s.snap?.tickets[s.selectedTicketId] : undefined;
      return t?.table === u.table;
    }
    case 'event':
      return seen.has(u.event);
    case 'sheet':
      return s.sheet?.kind === u.sheet;
    case 'approve':
      return Object.keys(s.approved).length > 0 || seen.has('plateRefired');
    case 'sendTable':
      return seen.has(`sent:${u.table}`);
    case 'timeMs':
      return (s.snap?.nowMs ?? 0) - startedAt >= u.ms;
  }
}

const isVisible = (step: CoachStep | undefined) =>
  step !== undefined && (step.whenTable === undefined || tablesOnRail().includes(step.whenTable));

/**
 * The Night 1 coach (ROADMAP 6.6): one line at a time, a pulsing outline on the thing to tap, advancing
 * when the player does it. Teaches by doing; no rules screen. All updates happen in store/bus callbacks.
 */
export function Coach({ stage }: { stage: RefObject<HTMLDivElement | null> }) {
  const done = useProgress((p) => p.tutorialDone);
  const nightId = useGameStore((s) => s.snap?.nightId);
  // A sheet or the interrupt tray owns the bottom of the screen; the coach talks from the top then.
  const bottomBusy = useGameStore((s) => s.sheet !== null || (s.snap?.interruptOrder.length ?? 0) > 0);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [box, setBox] = useState<DOMRect | null>(null);
  const active = !done && nightId === 1 && idx < tutorial.length;
  const step = tutorial[idx];

  useEffect(() => {
    if (!active || !step) return;
    const seen = new Set<string>();
    const startedAt = useGameStore.getState().snap?.nowMs ?? 0;
    const update = () => {
      const show = isVisible(step);
      setVisible(show);
      if (show && satisfied(step, seen, startedAt)) {
        track('coach_step', { step: step.id });
        if (idx + 1 >= tutorial.length) useProgress.getState().finishTutorial();
        setIdx(idx + 1);
        return;
      }
      const root = stage.current;
      const el = show && step.target ? root?.querySelector(`[data-coach="${step.target}"]`) : null;
      if (!root || !el) return setBox(null);
      const r = el.getBoundingClientRect();
      const o = root.getBoundingClientRect();
      setBox(new DOMRect(r.left - o.left, r.top - o.top, r.width, r.height));
    };
    const offs = [
      useGameStore.subscribe(update),
      bus.on('itemFired', () => seen.add('itemFired')),
      bus.on('plateUp', () => seen.add('plateUp')),
      bus.on('plateRefired', () => seen.add('plateRefired')),
      bus.on('ticketCleared', (e) => seen.add(`sent:${e.table}`)),
      bus.on('courseSent', (e) => {
        const t = useGameStore.getState().snap?.tickets[e.ticketId];
        if (t) seen.add(`sent:${t.table}`);
      }),
    ];
    const first = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(first);
      offs.forEach((off) => off());
    };
  }, [active, step, idx, stage]);

  if (!active || !visible || !step) return null;
  return (
    <>
      {box && (
        <div
          className="pointer-events-none absolute z-50 animate-pulse rounded-lg border-4 border-phosphor shadow-[0_0_0_4px_rgba(143,209,158,0.25)]"
          style={{ left: box.x - 4, top: box.y - 4, width: box.width + 8, height: box.height + 8 }}
          aria-hidden
        />
      )}
      <div
        className={`pointer-events-none absolute inset-x-3 z-50 flex justify-center ${
          bottomBusy ? 'top-3' : 'bottom-[88px]'
        }`}
      >
        <div className="anim-bubble-in pointer-events-auto flex max-w-sm items-start gap-2 rounded-lg border-2 border-phosphor bg-night/95 px-3 py-2 shadow-xl">
          <p className="text-sm leading-snug text-paper" role="status">
            {step.text}
          </p>
          <button
            onClick={() => {
              track('coach_step', { step: 'skipped' });
              useProgress.getState().finishTutorial();
            }}
            className="min-h-11 shrink-0 px-2 text-[10px] tracking-widest text-tile"
          >
            SKIP
          </button>
        </div>
      </div>
    </>
  );
}
