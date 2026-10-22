import { useEffect, useState } from 'react';
import { tuning } from '../../config/tuning';
import { content } from '../../data';
import { AudioManager } from '../../audio';
import { bus } from '../../engine/bus';
import { useProgress } from '../../engine/save';
import { useGameStore } from '../../store/useGameStore';
import { pts, REASON_LABEL, wallClock } from '../format';

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
      {phase === 'overtime' && <span className="text-xs text-amber">LAST CALL — CLEAR THE RAIL</span>}
    </div>
  );
}

/** Service Heat: composed (left) → meltdown (right). Not a health bar: you want it LOW (D-067). */
function HeatMeter() {
  const heat = useGameStore((s) => Math.round(s.snap?.heat ?? 0));
  const critical = useGameStore((s) => s.snap?.critical !== null && s.snap?.critical !== undefined);
  const color = critical
    ? 'bg-rush animate-pulse'
    : heat > 70
      ? 'bg-rush'
      : heat > 40
        ? 'bg-amber'
        : 'bg-tile';
  return (
    <div className="flex items-center gap-2" title="Service Heat — keep it low">
      <span className={`text-xs ${critical ? 'font-bold text-rush' : 'text-tile'}`}>HEAT</span>
      <div className="h-3 w-40 border border-steel bg-night">
        <div className={`h-full ${color} transition-[width] duration-200`} style={{ width: `${heat}%` }} />
      </div>
      <span className="w-8 text-right text-sm tabular-nums">{heat}</span>
    </div>
  );
}

/** Score + clean-service combo (D-068). */
function ScoreCombo() {
  const score = useGameStore((s) => s.snap?.score ?? 0);
  const combo = useGameStore((s) => s.snap?.combo ?? 1);
  return (
    <div className="flex items-baseline gap-3">
      <span className={`text-lg font-bold tabular-nums ${combo > 1 ? 'text-amber' : 'text-tile'}`}>
        ×{combo.toFixed(2)}
      </span>
      <span className="text-lg tabular-nums text-paper">{pts(score)}</span>
    </div>
  );
}

interface TickerEntry {
  key: number;
  at: number;
  text: string;
  tone: 'good' | 'bad' | 'big';
}

/** What just happened: course scores, saves, clean boards, and heat spikes. Expires by sim time. */
function ScoreTicker() {
  const [entries, setEntries] = useState<TickerEntry[]>([]);
  const nowMs = useGameStore((s) => s.snap?.nowMs ?? 0);
  useEffect(() => {
    let key = 0;
    const push = (text: string, tone: TickerEntry['tone']) => {
      const at = useGameStore.getState().snap?.nowMs ?? 0;
      setEntries((prev) => [...prev.slice(-3), { key: key++, at, text, tone }]);
    };
    const offs = [
      bus.on('courseScored', (e) =>
        push(
          `T${e.table} ${e.perfect ? 'PERFECT ' : e.clean ? '' : 'MESSY '}+${pts(e.total)}${e.multiplier > 1 ? ` (×${e.multiplier})` : ''}`,
          e.perfect ? 'big' : e.clean ? 'good' : 'bad',
        ),
      ),
      bus.on('scored', (e) => {
        if (e.reason === 'save') push(`SAVE! +${e.points}`, 'good');
      }),
      bus.on('cleanBoard', (e) => push(`CLEAN BOARD +${pts(e.bonus)}`, 'big')),
      bus.on('heatChanged', (e) => {
        if (e.delta >= 5) push(`+${Math.round(e.delta)} heat · ${REASON_LABEL[e.reason]}`, 'bad');
      }),
    ];
    return () => offs.forEach((off) => off());
  }, []);
  const visible = entries.filter((x) => nowMs - x.at < 3_500 && nowMs >= x.at);
  const tone = { good: 'text-phosphor', bad: 'text-rush', big: 'font-bold text-amber' };
  return (
    <div className="flex min-h-5 flex-wrap justify-center gap-3 text-xs">
      {visible.map((x) => (
        <span key={x.key} className={`anim-bubble-in ${tone[x.tone]}`}>
          {x.text}
        </span>
      ))}
    </div>
  );
}

/** "MANAGER AT THE PASS — get it back under control" (critical window, D-067). */
export function CriticalBanner() {
  const until = useGameStore((s) => s.snap?.critical?.untilMs ?? null);
  const nowMs = useGameStore((s) => s.snap?.nowMs ?? 0);
  if (until === null) return null;
  const left = Math.max(0, Math.ceil((until - nowMs) / 1000));
  return (
    <div className="anim-bubble-in pointer-events-none absolute inset-x-0 top-2 z-30 mx-auto w-fit border-2 border-rush bg-night/95 px-5 py-2 text-center shadow-xl">
      <div className="text-sm font-bold tracking-widest text-rush">MANAGER AT THE PASS</div>
      <div className="text-xs text-paper">
        Get it back under control — clean tables, catch mistakes ·{' '}
        <span className="font-bold tabular-nums">{left}</span>
      </div>
    </div>
  );
}

function NightName() {
  const nightId = useGameStore((s) => s.snap?.nightId ?? 1);
  const name = content.shifts.find((s) => s.id === nightId)?.name ?? '';
  return (
    <span className="text-xs tracking-widest text-tile">
      NIGHT {nightId} · {name.toUpperCase()}
    </span>
  );
}

function MuteButton() {
  const muted = useProgress((p) => p.muted);
  return (
    <button
      onClick={() => {
        useProgress.getState().setMuted(!muted);
        AudioManager.setMuted(!muted);
      }}
      className="border border-steel px-2 text-xs text-tile hover:text-paper"
      title="Sound on/off"
    >
      {muted ? 'SOUND OFF' : 'SOUND ON'}
    </button>
  );
}

export function Hud() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-steel px-4 py-2">
      <div className="flex items-baseline gap-4">
        <Clock />
        <NightName />
      </div>
      <ScoreTicker />
      <div className="flex items-center gap-4">
        <ScoreCombo />
        <HeatMeter />
        <MuteButton />
      </div>
    </header>
  );
}
