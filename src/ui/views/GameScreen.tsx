import { useEffect, useRef, useState, type RefObject } from 'react';
import { bus } from '../../engine/bus';
import { useGameStore, type View } from '../../store/useGameStore';
import { FloorView } from '../floor/FloorView';
import { Hud } from '../hud/Hud';
import { PassView } from './PassView';

const ORDER: View[] = ['pass', 'floor'];

function look(dir: -1 | 1) {
  const s = useGameStore.getState();
  const next = ORDER[ORDER.indexOf(s.view) + dir];
  if (next) s.setView(next);
}

const SHAKE: Keyframe[] = [
  { transform: 'none' },
  { transform: 'translate(-5px, 2px)' },
  { transform: 'translate(5px, -2px)' },
  { transform: 'translate(-3px, 1px)' },
  { transform: 'translate(3px, 0)' },
  { transform: 'none' },
];

/**
 * Hit feedback: a short shake on discrete mistakes (not the per-second late drain), and a red flash on
 * an allergy incident. Uses element.animate so nothing remounts. Skipped under prefers-reduced-motion.
 */
function useHitFx(target: RefObject<HTMLDivElement | null>) {
  const [flash, setFlash] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const offs = [
      bus.on('healthChanged', (e) => {
        if (!reduce && e.reason !== 'late' && e.delta <= -8)
          target.current?.animate(SHAKE, { duration: 320 });
      }),
      bus.on('allergyIncident', () => setFlash((n) => n + 1)),
    ];
    return () => offs.forEach((off) => off());
  }, [target]);
  return flash;
}

export function GameScreen() {
  const view = useGameStore((s) => s.view);
  const root = useRef<HTMLDivElement>(null);
  const flash = useHitFx(root);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') look(-1);
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') look(1);
      if (e.key === 'Escape') useGameStore.getState().selectTicket(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div ref={root} className="flex h-full flex-col">
      <Hud />
      <nav className="flex justify-between border-b border-steel px-4 py-1 text-xs">
        <button
          onClick={() => look(-1)}
          className={view === 'pass' ? 'text-steel' : 'text-tile hover:text-amber'}
          disabled={view === 'pass'}
        >
          ◀ PASS (A)
        </button>
        <span className="tracking-widest text-tile">{view === 'pass' ? 'THE PASS' : 'THE DOOR'}</span>
        <button
          onClick={() => look(1)}
          className={view === 'floor' ? 'text-steel' : 'text-tile hover:text-amber'}
          disabled={view === 'floor'}
        >
          DOOR (D) ▶
        </button>
      </nav>
      <main className="relative min-h-0 flex-1 overflow-hidden">
        {/* keyed so each switch replays the 150ms "blip" (STYLE §5.6) */}
        <div key={view} className="view-blip h-full">
          {view === 'pass' ? <PassView /> : <FloorView />}
        </div>
        {flash > 0 && (
          <div
            key={flash}
            className="anim-flash pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_40px_rgba(200,66,59,0.75)]"
          />
        )}
      </main>
    </div>
  );
}
