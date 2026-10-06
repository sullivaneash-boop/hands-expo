import type { Work } from '../work';
import { spawnInterrupt } from './interrupts';
import { printTicket } from './tickets';

/** Fire due shift beats; stop the printer at the end of the shift's printing window. */
export function updateSchedule(w: Work): void {
  const { shift } = w.ctx.tuning;
  const def = w.ctx.content.shifts.find((s) => s.id === w.s.nightId);
  const durationMs = shift.durationMs[w.s.nightId];

  if (w.s.phase === 'running' && def) {
    while (w.s.beatCursor < def.beats.length) {
      const beat = def.beats[w.s.beatCursor];
      if (!beat) break;
      const at = Math.round(beat.atMs * shift.timeScale);
      if (at > w.now || at >= durationMs) break;
      w.s.beatCursor++;
      if (beat.type === 'ticket') printTicket(w, beat.ticket);
      else if (beat.type === 'interrupt') spawnInterrupt(w, beat.interrupt, beat.target?.table);
      // 'kitchen' beats arrive in Phase 3.
    }
  }

  if (w.s.phase === 'running' && w.now >= durationMs) {
    w.s.phase = 'overtime';
    w.emit({ type: 'printerStopped' });
  }
}
