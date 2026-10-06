import { engine, seedFromUrl } from '../../engine/runtime';
import { content } from '../../data';

/** Brand art lives in public/assets/brand (stable URLs, D-046). */
const KEYART = '/assets/brand/keyart-title.webp';
const LOCKUP = '/assets/brand/logo-lockup-stacked.svg';

export function TitleScreen() {
  const night = content.shifts.find((s) => s.id === 1);
  const seed = seedFromUrl();
  return (
    <main className="relative min-h-full overflow-x-hidden bg-[var(--thermal-black)]">
      {/* Full-bleed key art, pinned so it stays put if the page scrolls on a phone. */}
      <img
        src={KEYART}
        alt=""
        fetchPriority="high"
        className="fixed inset-0 h-full w-full object-cover object-center"
      />

      <div className="relative flex min-h-dvh flex-col items-center px-4">
        {/*
          Upper third: the stacked lockup. Its 512×512 viewBox has empty space above and below the
          ticket, so the frame is cropped with CSS (aspect-ratio + object-fit); the art isn't touched.
        */}
        <h1 className="mt-[5vh] w-[min(88vw,460px,50vh)]">
          <img
            src={LOCKUP}
            alt="HANDS! Expo Simulator"
            className="aspect-[512/280] w-full object-cover object-center drop-shadow-[0_6px_18px_rgba(0,0,0,0.6)]"
          />
        </h1>

        <div className="mt-auto mb-[10vh] flex flex-col items-center gap-2 pt-8">
          <p className="bg-[var(--thermal-black)]/70 px-2 text-xs tracking-widest text-[var(--ticket-paper)]">
            NIGHT 1 · {night?.name.toUpperCase()}
          </p>
          <button
            onClick={() => engine.start(1)}
            className="border-2 border-[var(--thermal-black)] bg-[var(--heat-amber)] px-8 py-3 text-xl font-bold tracking-widest text-[var(--thermal-black)] shadow-[0_6px_24px_rgba(0,0,0,0.6)] hover:bg-[var(--ticket-paper)] focus-visible:outline-4 focus-visible:outline-[var(--ticket-paper)]"
          >
            START SHIFT
          </button>
          {seed !== null && (
            <p className="bg-[var(--thermal-black)]/70 px-2 text-xs text-[var(--ticket-paper)]">
              seed {seed}
            </p>
          )}
        </div>

        {/* The manager's sticky note: the game's only instructions (diegetic, STYLE §5). Not a button. */}
        <aside className="mb-6 w-full max-w-72 rotate-1 bg-[var(--ticket-paper)] p-4 text-xs leading-relaxed text-ink shadow-lg md:absolute md:right-6 md:bottom-6 md:mb-0">
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
