import { useEffect } from 'react';
import { useGameStore, type View } from '../../store/useGameStore';
import { FloorView } from '../floor/FloorView';
import { Hud } from '../hud/Hud';
import { serverName } from '../format';
import { PassView } from './PassView';

const ORDER: View[] = ['pass', 'floor'];

function look(dir: -1 | 1) {
  const s = useGameStore.getState();
  const next = ORDER[ORDER.indexOf(s.view) + dir];
  if (next) s.setView(next);
}

/** "Someone's at the door" cue shown on the PASS view's right edge. */
function DoorCue() {
  const firstId = useGameStore((s) => s.snap?.interruptOrder[0]);
  const count = useGameStore((s) => s.snap?.interruptOrder.length ?? 0);
  const server = useGameStore((s) => (firstId ? s.snap?.interrupts[firstId]?.server : undefined));
  if (!server) return null;
  return (
    <button
      onClick={() => look(1)}
      className="absolute top-1/2 right-0 -translate-y-1/2 animate-pulse border-2 border-r-0 border-amber bg-night px-3 py-4 text-xs text-amber"
    >
      {serverName(server)}
      {count > 1 ? ` +${count - 1}` : ''} AT THE DOOR ▶
    </button>
  );
}

export function GameScreen() {
  const view = useGameStore((s) => s.view);

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
    <div className="flex h-full flex-col">
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
        {view === 'pass' && <DoorCue />}
      </main>
    </div>
  );
}
