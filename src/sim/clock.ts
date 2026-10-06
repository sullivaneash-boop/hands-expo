/** Tick ↔ ms helpers. All sim time is integer ms derived from the tick counter (D-005). */
export const ticksToMs = (tick: number, tickMs: number): number => tick * tickMs;
export const msToTicks = (ms: number, tickMs: number): number => Math.ceil(ms / tickMs);

/**
 * Wall-clock label for sim time (display only). `minutesPerSec` = tuning.shift.clockMinutesPerSec.
 * e.g. start 17, 120_000 ms at 1.5 min/s → "8:00 PM".
 */
export function clockLabel(startHour24: number, simMs: number, minutesPerSec: number): string {
  const totalMin = startHour24 * 60 + Math.floor((simMs / 1000) * minutesPerSec);
  const h24 = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}
