import { useEffect, useState } from 'react';
import { tuning } from '../../config/tuning';
import { bus } from '../../engine/bus';
import { useGameStore } from '../../store/useGameStore';
import { REASON_LABEL, wallClock } from '../format';
import type { ScoreReason } from '../../sim';

function Clock() {
  // Re-render once per wall-clock minute, not per tick.
  const minute = useGameStore((s) =>
    s.snap ? Math.floor(((s.snap.nowMs / 1000) * tuning.shift.clockMinutesPerSec) | 0) : 0,
  );
  const nightId = useGameStore((s) => s.snap?.nightId ?? 1);
  const phase = useGameStore((s) => s.snap?.phase);
  const ms = (minute / tuning.shift.clockMinutesPerSec) * 1000;
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xl text-phosphor tabular-nums">{wallClock(ms, nightId)}</span>
      {phase === 'overtime' && <span className="text-xs text-amber">PRINTER STOPPED — CLEAR THE RAIL</span>}
    </div>
  );
}

function HealthStrip() {
  const health = useGameStore((s) => s.snap?.health ?? 100);
  const color = health > 50 ? 'bg-amber' : health > 25 ? 'bg-amber/70' : 'bg-rush';
  return (
    <div className="flex items-center gap-2" title="Service Health">
      <span className="text-xs text-tile">SERVICE</span>
      <div className="h-3 w-48 border border-steel bg-night">
        <div className={`h-full ${color} transition-[width] duration-200`} style={{ width: `${health}%` }} />
      </div>
      <span className="w-8 text-right text-sm tabular-nums">{health}</span>
    </div>
  );
}

interface TickerEntry {
  key: number;
  at: number;
  delta: number;
  reason: ScoreReason;
}

/** Recent health changes, expiring by sim time (no timers). Late drain is summed, not spammed. */
function ScoreTicker() {
  const [entries, setEntries] = useState<TickerEntry[]>([]);
  const nowMs = useGameStore((s) => s.snap?.nowMs ?? 0);
  useEffect(() => {
    let key = 0;
    return bus.on('healthChanged', (e) => {
      const at = useGameStore.getState().snap?.nowMs ?? 0;
      setEntries((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.reason === e.reason && e.reason === 'late' && at - last.at < 2000)
          return [...prev.slice(0, -1), { ...last, at, delta: last.delta + e.delta }];
        return [...prev.slice(-4), { key: key++, at, delta: e.delta, reason: e.reason }];
      });
    });
  }, []);
  const visible = entries.filter((x) => nowMs - x.at < 3500);
  return (
    <div className="flex min-h-5 flex-wrap justify-end gap-3 text-xs">
      {visible.map((x) => (
        <span key={x.key} className={x.delta < 0 ? 'text-rush' : 'text-phosphor'}>
          {x.delta > 0 ? '+' : ''}
          {x.delta} {REASON_LABEL[x.reason]}
        </span>
      ))}
    </div>
  );
}

export function Hud() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-steel px-4 py-2">
      <Clock />
      <ScoreTicker />
      <HealthStrip />
    </header>
  );
}
