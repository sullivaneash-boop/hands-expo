import { useState } from 'react';
import type { NightId } from '../../config/tuning';
import { content } from '../../data';
import { engine, seedFromUrl } from '../../engine/runtime';
import { useProgress } from '../../engine/save';
import { debugEnabled } from '../debug/DebugOverlay';

/** Brand art lives in public/assets/brand (stable URLs, D-046). */
const KEYART = '/assets/brand/keyart-title.webp';
const LOCKUP = '/assets/brand/logo-lockup-stacked.svg';

/** Night picker: cleared nights unlock the next (D-027). Debug builds can pick any night. */
function NightPicker({ night, setNight }: { night: NightId; setNight: (n: NightId) => void }) {
  const unlocked = useProgress((p) => p.unlocked);
  const best = useProgress((p) => p.best);
  return (
    <div className="flex gap-1">
      {content.shifts.map((s) => {
        const open = debugEnabled || s.id <= unlocked;
        const b = best[s.id];
        return (
          <button
            key={s.id}
            disabled={!open}
            onClick={() => setNight(s.id)}
            className={`flex w-12 flex-col items-center border-2 py-1 text-xs font-bold ${
              s.id === night
                ? 'border-[var(--heat-amber)] bg-[var(--thermal-black)] text-[var(--heat-amber)]'
                : 'border-[var(--thermal-black)] bg-[var(--thermal-black)]/70 text-[var(--ticket-paper)]'
            } disabled:opacity-40`}
            title={open ? s.name : 'Clear the night before to unlock'}
          >
            <span>{open ? s.id : '🔒'}</span>
            <span className="text-[9px] font-normal">{b ? b.grade : '—'}</span>
          </button>
        );
      })}
    </div>
  );
}

export function TitleScreen() {
  const unlocked = useProgress((p) => p.unlocked);
  const [night, setNight] = useState<NightId>(unlocked);
  const shift = content.shifts.find((s) => s.id === night);
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

        <div className="mt-auto mb-[8vh] flex flex-col items-center gap-2 pt-8">
          <NightPicker night={night} setNight={setNight} />
          <p className="bg-[var(--thermal-black)]/70 px-2 text-center text-xs tracking-widest text-[var(--ticket-paper)]">
            NIGHT {night} · {shift?.name.toUpperCase()}
            <br />
            <span className="normal-case tracking-normal opacity-80">{shift?.tagline}</span>
          </p>
          <button
            onClick={() => engine.start(night)}
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
          <p>Tickets print onto the rail. Tap one, then FIRE to send it to the line.</p>
          <p className="mt-2">
            Plates land on the pass. Tap a plate to CHECK it against the ticket. Wrong? Tap what’s off, then
            REFIRE. Right? HANDS!
          </p>
          <p className="mt-2">
            HOLD courses wait until the server asks to fire. ALLERGY? Flag it to the line before you fire.
          </p>
          <p className="mt-2">Servers will pop up with questions. Answer them, quick.</p>
          <p className="mt-2 font-bold">Keep the Heat down. Clean plates build the combo. — M.</p>
        </aside>
      </div>
    </main>
  );
}
