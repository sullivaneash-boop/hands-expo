/** Tick ↔ ms helpers. All sim time is integer ms derived from the tick counter (D-005). */
export const ticksToMs = (tick: number, tickMs: number): number => tick * tickMs;
export const msToTicks = (ms: number, tickMs: number): number => Math.ceil(ms / tickMs);

/** "5:00 PM" + elapsed ms → "5:03 PM" style wall-clock label (display helper, deterministic). */
export function clockLabel(startHour24: number, elapsedMs: number): string {
  const totalMin = startHour24 * 60 + Math.floor(elapsedMs / 60_000);
  const h24 = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}
