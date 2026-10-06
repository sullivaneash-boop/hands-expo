import type { PlateDefectKind } from '../../data/schema';
import { menuDef } from '../lookup';
import { buildPlate } from '../plates';
import type { CookJob, Ticket, TicketItem } from '../state';
import type { Work } from '../work';

/** Put an item on a station. `item` must be the mutable copy from w.ticket(). */
export function startCook(
  w: Work,
  ticket: Ticket,
  courseIdx: number,
  item: TicketItem,
  defect: PlateDefectKind | null,
  onTheFly: boolean,
): void {
  const { cook } = w.ctx.tuning;
  const def = menuDef(w.ctx, item.menuId);
  const jitter = (w.rng.kitchen.next() * 2 - 1) * cook.jitterPct;
  const ms = Math.round(cook.tierMs[def.cookTier] * (1 + jitter) * (onTheFly ? cook.onTheFlyFactor : 1));
  item.state = 'cooking';
  item.makes++;
  const job: CookJob = {
    ticketId: ticket.id,
    itemId: item.id,
    courseIdx,
    station: def.station,
    firedAtMs: w.now,
    doneAtMs: w.now + ms,
    defect,
    onTheFly,
  };
  // Keep jobs sorted by (doneAtMs, itemId) so completion order is deterministic.
  w.s.cooking = [...w.s.cooking, job].sort((a, b) => a.doneAtMs - b.doneAtMs || cmp(a.itemId, b.itemId));
  w.emit({ type: 'itemFired', ticketId: ticket.id, itemId: item.id, station: def.station, onTheFly });
}

/** Finished jobs become plates in the window. */
export function updateKitchen(w: Work): void {
  if (w.s.cooking.length === 0 || (w.s.cooking[0] as CookJob).doneAtMs > w.now) return;
  const done = w.s.cooking.filter((j) => j.doneAtMs <= w.now);
  w.s.cooking = w.s.cooking.filter((j) => j.doneAtMs > w.now);
  for (const job of done) {
    if (!w.s.tickets[job.ticketId]) continue;
    const ticket = w.ticket(job.ticketId);
    const item = ticket.courses[job.courseIdx]?.items.find((i) => i.id === job.itemId);
    if (!item || item.state !== 'cooking') continue;
    const plateId = w.nextId('p');
    w.putPlate({
      id: plateId,
      ticketId: ticket.id,
      itemId: item.id,
      courseIdx: job.courseIdx,
      seat: item.seat,
      upAtMs: w.now,
      build: buildPlate(w.ctx, { menuId: item.menuId, mods: item.mods }, job.defect, w.rng.kitchen),
      onTheFly: job.onTheFly,
    });
    item.state = 'up';
    item.plateId = plateId;
    w.s.windowOrder = [...w.s.windowOrder, plateId];
    w.emit({ type: 'plateUp', plateId, ticketId: ticket.id, station: job.station });
  }
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
