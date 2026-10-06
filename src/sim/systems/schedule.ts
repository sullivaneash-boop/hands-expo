import type { Work } from '../work';
import { between } from '../work';
import { randomTicket, tonight } from './generate';
import { doorCount, spawnInterrupt } from './interrupts';
import { printTicket } from './tickets';

/**
 * Everything that arrives on its own: scripted beats, procedural tickets and interrupts (D-026),
 * and pending events (fire requests after the table eats). Stops the printer at shift end.
 */
export function updateSchedule(w: Work): void {
  const { shift: shiftTuning, interrupts } = w.ctx.tuning;
  const { shift, profile } = tonight(w);
  const durationMs = shiftTuning.durationMs[w.s.nightId];
  const printing = w.s.phase === 'running';

  // 1. Scripted beats (always run, regardless of features).
  if (printing && shift) {
    while (w.s.beatCursor < shift.beats.length) {
      const beat = shift.beats[w.s.beatCursor];
      if (!beat) break;
      const at = Math.round(beat.atMs * shiftTuning.timeScale);
      if (at > w.now || at >= durationMs) break;
      w.s.beatCursor++;
      if (beat.type === 'ticket') printTicket(w, beat.ticket);
      else spawnInterrupt(w, beat.interrupt, { table: beat.target?.table, arg: beat.arg });
    }
  }

  // 2. Procedural tickets by segment.
  if (printing && w.s.nextTicketMs !== null && w.now >= w.s.nextTicketMs && w.now < durationMs) {
    printTicket(w, randomTicket(w, w.rng.schedule));
    const seg = profile.segments.find((s) => w.now < s.untilMs);
    if (!seg) w.s.nextTicketMs = null;
    else if ((seg.gapMs[1] ?? 0) === 0)
      w.s.nextTicketMs = seg.untilMs; // quiet patch
    else w.s.nextTicketMs = w.now + between(w.rng.schedule, seg.gapMs);
  }

  // 3. Procedural interrupts (only features that are on tonight; stop when the printer stops).
  if (printing) {
    for (const defId of Object.keys(profile.interrupts).sort()) {
      const sched = profile.interrupts[defId];
      const def = w.ctx.content.interrupts.find((d) => d.id === defId);
      if (!sched || !def || sched.max <= 0) continue;
      if (def.feature && !shift?.features.includes(def.feature)) continue;
      const count = w.s.procCount[defId] ?? 0;
      if (count >= sched.max) continue;
      const next = w.s.procNext[defId];
      if (next === undefined) {
        w.s.procNext = { ...w.s.procNext, [defId]: w.now + between(w.rng.schedule, sched.firstMs) };
        continue;
      }
      if (w.now < next) continue;
      const doorFull = def.blocking && doorCount(w) >= interrupts.maxAtDoor;
      const ok = !doorFull && spawnInterrupt(w, defId);
      w.s.procNext = {
        ...w.s.procNext,
        [defId]: w.now + (ok ? between(w.rng.schedule, sched.everyMs) : interrupts.doorBusyRetryMs),
      };
      if (ok) w.s.procCount = { ...w.s.procCount, [defId]: count + 1 };
    }
  }

  // 4. Pending events (e.g. "Fire 21!" after the table finishes apps). These continue in overtime.
  while (w.s.pending.length > 0 && (w.s.pending[0]?.atMs ?? Infinity) <= w.now) {
    const [ev, ...rest] = w.s.pending;
    w.s.pending = rest;
    if (ev && w.s.tickets[ev.ticketId]) spawnInterrupt(w, ev.defId, { ticketId: ev.ticketId });
  }

  if (w.s.phase === 'running' && w.now >= durationMs) {
    w.s.phase = 'overtime';
    w.emit({ type: 'printerStopped' });
  }
}
