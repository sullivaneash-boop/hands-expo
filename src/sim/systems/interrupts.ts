import type { PlayerCommand } from '../commands';
import { STATUS_ANSWERS, ticketStatus } from '../selectors';
import type { ActiveInterrupt, InterruptOutcome } from '../state';
import type { Work } from '../work';

/** Bring an interrupt to the door. Target: the live ticket at `table`, else a random live ticket. */
export function spawnInterrupt(w: Work, defId: string, table?: number): ActiveInterrupt | null {
  const def = w.ctx.content.interrupts.find((i) => i.id === defId);
  if (!def) return null;
  const live = w.s.railOrder.map((id) => w.s.tickets[id]).filter((t) => t !== undefined);
  if (live.length === 0) return null;
  const ticket =
    (table !== undefined ? live.find((t) => t.table === table) : undefined) ?? w.rng.interrupts.pick(live);
  const source = def.source;
  const patience =
    source === 'kitchen' ? 0 : w.ctx.tuning.interrupts.patienceMs[source as 'server' | 'manager' | 'bar'];
  const interrupt: ActiveInterrupt = {
    id: w.nextId('i'),
    defId,
    source,
    ticketId: ticket.id,
    table: ticket.table,
    server: ticket.server,
    lineId: w.rng.interrupts.pick(def.lines),
    arrivedAtMs: w.now,
    expiresAtMs: w.now + patience,
  };
  w.putInterrupt(interrupt);
  w.s.interruptOrder = [...w.s.interruptOrder, interrupt.id];
  w.emit({ type: 'interruptArrived', interruptId: interrupt.id, defId, source, table: interrupt.table });
  return interrupt;
}

export function answer(w: Work, cmd: Extract<PlayerCommand, { type: 'answer' }>): void {
  const it = w.s.interrupts[cmd.interruptId];
  if (!it) return w.emit({ type: 'commandRejected', command: cmd, reason: 'no such interrupt' });
  const def = w.ctx.content.interrupts.find((d) => d.id === it.defId);
  const ticket = w.s.tickets[it.ticketId];
  if (!ticket) return resolve(w, it, 'moot');

  if (def?.choices === 'ticketStatus') {
    if (!(STATUS_ANSWERS as readonly string[]).includes(cmd.choice))
      return w.emit({ type: 'commandRejected', command: cmd, reason: 'invalid choice' });
    // Judged against the board at the moment the player answers.
    resolve(w, it, cmd.choice === ticketStatus(ticket) ? 'correct' : 'wrong');
  } else {
    resolve(w, it, 'correct');
  }
}

/** Timeouts, and questions about tickets that already cleared (moot). */
export function updateInterrupts(w: Work): void {
  for (const id of w.s.interruptOrder) {
    const it = w.s.interrupts[id];
    if (!it) continue;
    if (!w.s.tickets[it.ticketId]) resolve(w, it, 'moot');
    else if (w.now >= it.expiresAtMs) resolve(w, it, 'timeout');
  }
}

function resolve(w: Work, it: ActiveInterrupt, outcome: InterruptOutcome): void {
  const { score } = w.ctx.tuning;
  w.stats.interrupts[outcome]++;
  if (outcome === 'wrong') w.health(score.interruptWrong, 'interruptWrong');
  if (outcome === 'timeout') w.health(score.interruptTimeout, 'interruptTimeout');
  w.deleteInterrupt(it.id);
  w.s.interruptOrder = w.s.interruptOrder.filter((x) => x !== it.id);
  w.emit({ type: 'interruptResolved', interruptId: it.id, defId: it.defId, outcome });
}
