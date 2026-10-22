import { useGameStore } from '../../store/useGameStore';

/** "MANAGER AT THE PASS — get it back under control" (critical window, D-067). */
export function CriticalBanner() {
  const until = useGameStore((s) => s.snap?.critical?.untilMs ?? null);
  const nowMs = useGameStore((s) => Math.floor((s.snap?.nowMs ?? 0) / 250) * 250);
  if (until === null) return null;
  const left = Math.max(0, Math.ceil((until - nowMs) / 1000));
  return (
    <div
      className="anim-bubble-in pointer-events-none absolute inset-0 z-30 flex flex-col justify-center border-2 border-rush bg-night/95 px-4 text-center shadow-xl"
      role="alert"
    >
      <div className="text-sm font-bold tracking-widest text-rush">MANAGER AT THE PASS · {left}</div>
      <div className="text-xs text-paper">Get it back: send clean tables, catch bad plates.</div>
    </div>
  );
}
