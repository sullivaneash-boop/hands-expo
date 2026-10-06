import type { InterruptDef, StationId } from '../../data/schema';
import type { PlayerCommand } from '../commands';
import { itemDone } from '../lookup';
import { STATUS_ANSWERS, ticketStatus } from '../selectors';
import type { ActiveInterrupt, InterruptOutcome, Ticket } from '../state';
import type { Work } from '../work';
import { dragStation, kitchenDrop } from './kitchen';
import { eightySix, makeReady, printAddOn } from './tickets';

export interface SpawnOpts {
  ticketId?: string;
  table?: number;
  /** menu id (86 / add-on) or station id (drag). */
  arg?: string;
}

const MAX_BARKS = 6;

/** The first HOLD course still waiting for the table, if any. */
const waitingCourseIdx = (t: Ticket) =>
  t.courses.findIndex((c) => c.hold && c.readyAtMs === null && !c.items.every(itemDone));

/**
 * Bring an interrupt into play. Blocking ones wait at the door; barks take effect now.
 * Returns false (and changes nothing) if there's no sensible target right now.
 */
export function spawnInterrupt(w: Work, defId: string, opts: SpawnOpts = {}): boolean {
  const def = w.ctx.content.interrupts.find((i) => i.id === defId);
  if (!def) return false;
  const orders = w.liveTickets().filter((t) => t.kind === 'order');
  const r = w.rng.interrupts;

  const pickTicket = (pool: Ticket[]): Ticket | undefined => {
    if (opts.ticketId) return pool.find((t) => t.id === opts.ticketId);
    if (opts.table !== undefined) return pool.find((t) => t.table === opts.table);
    return pool.length ? r.pick(pool) : undefined;
  };

  const e = def.effect;
  switch (e.kind) {
    case 'askStatus':
    case 'notBefore':
    case 'vip': {
      const ticket = pickTicket(orders);
      return ticket ? atDoor(w, def, ticket) : false;
    }
    case 'push': {
      // Managers push the table that's been waiting longest.
      const ticket =
        opts.ticketId || opts.table !== undefined ? pickTicket(orders) : orders.find((t) => !t.flags.pushed);
      return ticket ? atDoor(w, def, ticket) : false;
    }
    case 'fireRequest': {
      const ticket = pickTicket(orders.filter((t) => waitingCourseIdx(t) >= 0));
      return ticket ? atDoor(w, def, ticket) : false;
    }
    case 'addOn': {
      const parent = pickTicket(orders);
      if (!parent) return false;
      const menuId = opts.arg ?? e.menuId;
      const chit = printAddOn(w, parent, menuId, () => r.int(1, parent.guests));
      const seat = chit.courses[0]?.items[0]?.seat ?? 1;
      bark(w, def, { table: parent.table, item: itemName(w, menuId), seat });
      return true;
    }
    case 'eightySix': {
      const menuId = opts.arg ?? mostHeldItem(w);
      if (!menuId || w.s.eighty6.includes(menuId)) return false;
      eightySix(w, menuId);
      bark(w, def, { item: itemName(w, menuId) });
      return true;
    }
    case 'stationDrag': {
      const busy = [...new Set(w.s.cooking.map((j) => j.station))].sort();
      const station = (opts.arg as StationId | undefined) ?? (busy.length ? r.pick(busy) : undefined);
      if (!station || w.now < w.s.stations[station].dragUntilMs) return false;
      dragStation(w, station);
      bark(w, def, { station: w.ctx.content.stations.find((s) => s.id === station)?.name ?? station });
      return true;
    }
    case 'kitchenRefire': {
      const target = opts.ticketId ?? (opts.table !== undefined ? pickTicket(orders)?.id : undefined);
      const lost = kitchenDrop(w, target);
      if (!lost) return false;
      bark(w, def, { item: itemName(w, lost.menuId), table: w.s.tickets[lost.ticketId]?.table ?? '?' });
      return true;
    }
  }
}

function itemName(w: Work, menuId: string): string {
  return w.ctx.content.menu.find((m) => m.id === menuId)?.ticketName ?? menuId.toUpperCase();
}

/** The menu item most often still waiting to be fired (what an 86 hurts most). */
function mostHeldItem(w: Work): string | null {
  const counts = new Map<string, number>();
  for (const t of w.liveTickets())
    for (const c of t.courses)
      for (const i of c.items)
        if (i.state === 'held' && !w.s.eighty6.includes(i.menuId))
          counts.set(i.menuId, (counts.get(i.menuId) ?? 0) + 1);
  let best: string | null = null;
  for (const [id, n] of [...counts.entries()].sort())
    if (best === null || n > (counts.get(best) ?? 0)) best = id;
  return best;
}

function bark(w: Work, def: InterruptDef, vars: Record<string, string | number>): void {
  const lineId = w.rng.interrupts.pick(def.lines);
  w.s.barks = [
    ...w.s.barks.slice(-(MAX_BARKS - 1)),
    { atMs: w.now, defId: def.id, source: def.source, lineId, vars },
  ];
  w.emit({ type: 'bark', defId: def.id, source: def.source, lineId });
}

/** A person arrives at the door. Effects of bar/manager news apply immediately (D-055). */
function atDoor(w: Work, def: InterruptDef, target: Ticket): boolean {
  const { tuning } = w.ctx;
  const source = def.source === 'kitchen' ? 'server' : def.source;
  const interrupt: ActiveInterrupt = {
    id: w.nextId('i'),
    defId: def.id,
    source: def.source,
    ticketId: target.id,
    table: target.table,
    speaker: source === 'server' ? target.server : source,
    lineId: w.rng.interrupts.pick(def.lines),
    arrivedAtMs: w.now,
    expiresAtMs: w.now + tuning.interrupts.patienceMs[source],
  };
  w.putInterrupt(interrupt);
  w.s.interruptOrder = [...w.s.interruptOrder, interrupt.id];

  const e = def.effect.kind;
  if (e === 'notBefore' || e === 'push' || e === 'vip') {
    const t = w.ticket(target.id);
    if (e === 'notBefore') t.flags.notBeforeMs = w.now + tuning.bar.delayMs;
    if (e === 'vip') t.flags.vip = true;
    if (e === 'push') {
      t.flags.pushed = true;
      for (const c of t.courses)
        if (c.lateAtMs !== null && c.sentAtMs === null)
          c.lateAtMs = Math.min(c.lateAtMs, w.now + tuning.manager.pushGraceMs);
    }
  }
  w.emit({
    type: 'interruptArrived',
    interruptId: interrupt.id,
    defId: def.id,
    source: def.source,
    table: target.table,
  });
  return true;
}

export function answer(w: Work, cmd: Extract<PlayerCommand, { type: 'answer' }>): void {
  const it = w.s.interrupts[cmd.interruptId];
  if (!it) return w.emit({ type: 'commandRejected', command: cmd, reason: 'no such interrupt' });
  const def = w.ctx.content.interrupts.find((d) => d.id === it.defId);
  const ticket = w.s.tickets[it.ticketId];
  if (!def || !ticket) return resolve(w, it, 'moot');

  if (def.choices === 'ticketStatus') {
    if (!(STATUS_ANSWERS as readonly string[]).includes(cmd.choice))
      return w.emit({ type: 'commandRejected', command: cmd, reason: 'invalid choice' });
    // Judged against the board at the moment the player answers (D-039).
    return resolve(w, it, cmd.choice === ticketStatus(ticket) ? 'correct' : 'wrong');
  }
  if (cmd.choice !== 'heard')
    return w.emit({ type: 'commandRejected', command: cmd, reason: 'invalid choice' });
  // HEARD: the player now knows — it shows on the ticket.
  const t = w.ticket(ticket.id);
  switch (def.effect.kind) {
    case 'fireRequest': {
      const idx = waitingCourseIdx(t);
      if (idx >= 0) makeReady(w, t, idx, true);
      break;
    }
    case 'notBefore':
      t.known.bar = true;
      break;
    case 'push':
      t.known.pushed = true;
      break;
    case 'vip':
      t.known.vip = true;
      break;
    default:
      break;
  }
  resolve(w, it, 'correct');
}

/** Timeouts, and questions about tickets that already cleared (moot). */
export function updateInterrupts(w: Work): void {
  for (const id of w.s.interruptOrder) {
    const it = w.s.interrupts[id];
    if (!it) continue;
    if (!w.s.tickets[it.ticketId]) {
      resolve(w, it, 'moot');
      continue;
    }
    if (w.now < it.expiresAtMs) continue;
    // Ignored server with a fire request goes to the line directly: the course is ready anyway.
    if (it.defId === 'server_fire') {
      const t = w.ticket(it.ticketId);
      const idx = waitingCourseIdx(t);
      if (idx >= 0) makeReady(w, t, idx, false);
    }
    resolve(w, it, 'timeout');
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

/** How many people are waiting at the door. */
export const doorCount = (w: Work) => w.s.interruptOrder.length;
