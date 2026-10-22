/**
 * Local playtest telemetry (ROADMAP 6.7, D-074). Records what players do — not who they are — into
 * this browser's localStorage only; export from the debug panel. Nothing is sent anywhere.
 * Timestamps are sim ms (so they line up with the replay log) plus wall ms for check timing.
 */
import { bus } from '../engine/bus';
import { useGameStore } from '../store/useGameStore';

export type TelemetryKind =
  | 'shift_start'
  | 'shift_end'
  | 'action'
  | 'mis_tap'
  | 'check_open'
  | 'check_tap'
  | 'check_decision'
  | 'quit'
  | 'retry'
  | 'coach_step';

export interface TelemetryEvent {
  kind: TelemetryKind;
  simMs: number;
  wallMs: number;
  data?: Record<string, string | number | boolean | null>;
}

const KEY = 'hands-telemetry';
const MAX = 5_000;
let buffer: TelemetryEvent[] = load();

function load(): TelemetryEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as TelemetryEvent[]) : [];
  } catch {
    return [];
  }
}

let saveQueued = false;
function save(): void {
  if (saveQueued) return;
  saveQueued = true;
  queueMicrotask(() => {
    saveQueued = false;
    try {
      localStorage.setItem(KEY, JSON.stringify(buffer.slice(-MAX)));
    } catch {
      /* storage full or blocked: keep in memory */
    }
  });
}

/** Wall-clock ms for UI timing (kept out of render code). */
export const nowMs = () => performance.now();

export function track(kind: TelemetryKind, data?: TelemetryEvent['data']): void {
  const simMs = useGameStore.getState().snap?.nowMs ?? 0;
  buffer.push({ kind, simMs, wallMs: Math.round(nowMs()), ...(data ? { data } : {}) });
  if (buffer.length > MAX) buffer = buffer.slice(-MAX);
  save();
}

/** Per-shift summary of the research's playtest metrics (research 05 §validation). */
export function shiftMetrics(events: TelemetryEvent[] = buffer) {
  const start = events.map((e) => e.kind).lastIndexOf('shift_start');
  const shift = start >= 0 ? events.slice(start) : events;
  const actions = shift.filter((e) => e.kind === 'action').length;
  const misTaps = shift.filter((e) => e.kind === 'mis_tap').length;
  const decisions = shift.filter((e) => e.kind === 'check_decision');
  const checkMs = decisions.map((e) => Number(e.data?.ms ?? 0)).sort((a, b) => a - b);
  const lastSim = shift.at(-1)?.simMs ?? 0;
  const firstSim = shift[0]?.simMs ?? 0;
  const minutes = Math.max(1 / 60, (lastSim - firstSim) / 60_000);
  return {
    actions,
    decisionsPerMin: Math.round((actions / minutes) * 10) / 10,
    misTapRate: actions + misTaps > 0 ? Math.round((1000 * misTaps) / (actions + misTaps)) / 10 : 0,
    checks: decisions.length,
    medianCheckMs: checkMs.length ? (checkMs[Math.floor(checkMs.length / 2)] ?? 0) : 0,
    checkAccuracy: decisions.length
      ? Math.round((100 * decisions.filter((e) => e.data?.correct === true).length) / decisions.length)
      : 0,
  };
}

export function exportTelemetry(): string {
  return JSON.stringify(
    { exportedAt: new Date().toISOString(), lastShift: shiftMetrics(), events: buffer },
    null,
    2,
  );
}

export function clearTelemetry(): void {
  buffer = [];
  save();
}

let wired = false;
/** Shift start/end come from sim events; everything else is tracked at the UI call sites. */
export function initTelemetry(): void {
  if (wired) return;
  wired = true;
  bus.on('shiftStarted', (e) => track('shift_start', { night: e.nightId, seed: e.seed }));
  bus.on('shiftEnded', (e) =>
    track('shift_end', {
      outcome: e.summary.outcome,
      score: e.summary.score,
      stars: e.summary.stars,
      lostBy: e.summary.lostBy,
    }),
  );
}
