import { engine, seedFromUrl } from '../../engine/runtime';
import { content } from '../../data';

export function TitleScreen() {
  const night = content.shifts.find((s) => s.id === 1);
  const seed = seedFromUrl();
  return (
    <main className="flex h-full items-center justify-center p-4">
      <div className="flex max-w-3xl flex-col gap-8 md:flex-row md:items-center">
        <section>
          <h1 className="text-6xl font-bold tracking-widest text-amber">HANDS!</h1>
          <p className="mt-2 text-sm text-tile">a restaurant expo simulator · grey-box build</p>
          <button
            onClick={() => engine.start(1)}
            className="mt-8 border-2 border-amber px-6 py-3 text-lg font-bold text-amber hover:bg-amber hover:text-ink"
          >
            CLOCK IN — NIGHT 1: {night?.name.toUpperCase()}
          </button>
          {seed !== null && <p className="mt-2 text-xs text-tile">seed {seed}</p>}
        </section>
        {/* The manager's sticky note (instructions are diegetic, STYLE §5). */}
        <aside className="w-72 rotate-1 bg-paper p-4 text-xs leading-relaxed text-ink shadow-lg">
          <p className="mb-2 font-bold">EXPO — READ THIS</p>
          <p>
            Tickets print onto the rail. Hit FIRE to send them to the line (or click one item to fire just
            it).
          </p>
          <p className="mt-2">
            Plates land in the window. CHECK each one against its ticket. Wrong? REFIRE. Right? HANDS!
          </p>
          <p className="mt-2">Food dies under the lamps. Tickets go red when they’re late.</p>
          <p className="mt-2">Servers wait at the door (D). Tell them the truth.</p>
          <p className="mt-2 font-bold">Don’t let Service hit zero. — M.</p>
        </aside>
      </div>
    </main>
  );
}
