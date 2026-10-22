import { tuning } from '../../config/tuning';
import { AudioManager } from '../../audio';
import { useProgress } from '../../engine/save';
import { useGameStore } from '../../store/useGameStore';
import { pts, wallClock } from '../format';

/** Clock · night · combo · score, with the Service Heat bar across the bottom edge (D-073). */
export function TopBar() {
  const minute = useGameStore((s) =>
    Math.floor(((s.snap?.nowMs ?? 0) / 1000) * tuning.shift.clockMinutesPerSec),
  );
  const nightId = useGameStore((s) => s.snap?.nightId ?? 1);
  const phase = useGameStore((s) => s.snap?.phase);
  const score = useGameStore((s) => s.snap?.score ?? 0);
  const combo = useGameStore((s) => s.snap?.combo ?? 1);
  const heat = useGameStore((s) => Math.round(s.snap?.heat ?? 0));
  const critical = useGameStore((s) => !!s.snap?.critical);
  const muted = useProgress((p) => p.muted);
  const heatColor = critical
    ? 'bg-rush animate-pulse'
    : heat > 70
      ? 'bg-rush'
      : heat > 40
        ? 'bg-amber'
        : 'bg-tile';
  return (
    <header className="relative shrink-0 border-b border-steel bg-night px-3 pt-2 pb-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-lg leading-none text-phosphor tabular-nums">
            {wallClock((minute / tuning.shift.clockMinutesPerSec) * 1000, nightId)}
          </div>
          <div className="truncate text-[10px] tracking-widest text-tile">
            NIGHT {nightId}
            {phase === 'overtime' ? ' · LAST CALL' : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 text-sm font-bold tabular-nums ${
              combo > 1 ? 'border-amber text-amber' : 'border-steel text-tile'
            }`}
            title="Clean-service combo"
          >
            ×{combo.toFixed(2)}
          </span>
          <span className="min-w-16 text-right text-xl font-bold tabular-nums text-paper">{pts(score)}</span>
          <button
            onClick={() => {
              useProgress.getState().setMuted(!muted);
              AudioManager.setMuted(!muted);
            }}
            className="flex h-11 w-11 items-center justify-center text-lg text-tile"
            aria-label={muted ? 'Sound off' : 'Sound on'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-1.5 bg-night"
        title={`Service Heat ${heat}`}
        aria-label={`Service Heat ${heat}`}
      >
        <div
          className={`h-full ${heatColor} transition-[width] duration-200`}
          style={{ width: `${heat}%` }}
        />
      </div>
    </header>
  );
}
