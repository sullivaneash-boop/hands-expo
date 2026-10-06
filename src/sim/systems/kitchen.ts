import type { PlateDefectKind, StationId } from '../../data/schema';
import { needsAllergyPick } from '../lookup';
import { baseCookMs, buildPlate, rollDefect } from '../plates';
import type { CookJob, Ticket, TicketItem } from '../state';
import type { Work } from '../work';

const byDoneAt = (a: CookJob, b: CookJob) =>
  a.doneAtMs - b.doneAtMs || (a.itemId < b.itemId ? -1 : a.itemId > b.itemId ? 1 : 0);

function stationMultiplier(w: Work, station: StationId): number {
  const st = w.s.stations[station];
  return w.now < st.dragUntilMs ? st.dragMultiplier : 1;
}

/** Put an item on a station. `ticket`/`item` must be the mutable copies from w.ticket(). */
export function startCook(
  w: Work,
  ticket: Ticket,
  courseIdx: number,
  item: TicketItem,
  defect: PlateDefectKind | null,
  onTheFly: boolean,
  allergyProtocol: boolean,
): void {
  const { cook } = w.ctx.tuning;
  const def = w.ctx.content.menu.find((m) => m.id === item.menuId);
  if (!def) return;
  const jitter = (w.rng.kitchen.next() * 2 - 1) * cook.jitterPct;
  const ms =
    Math.round(
      baseCookMs(w.ctx, item) *
        (1 + jitter) *
        stationMultiplier(w, def.station) *
        (onTheFly ? cook.onTheFlyFactor : 1),
    ) + (allergyProtocol ? cook.allergyExtraMs : 0);
  item.state = 'cooking';
  item.makes++;
  item.onTheFly = onTheFly;
  const job: CookJob = {
    ticketId: ticket.id,
    itemId: item.id,
    courseIdx,
    station: def.station,
    firedAtMs: w.now,
    doneAtMs: w.now + ms,
    defect,
    onTheFly,
    allergyProtocol,
  };
  w.s.cooking = [...w.s.cooking.filter((j) => j.itemId !== item.id), job].sort(byDoneAt);
  w.emit({ type: 'itemFired', ticketId: ticket.id, itemId: item.id, station: def.station, onTheFly });
}

/** Remake an item on the fly (refire, dead plate, dropped plate). Protocol follows the current ACK. */
export function remake(w: Work, ticketId: string, courseIdx: number, itemId: string): void {
  const { defects } = w.ctx.tuning;
  const ticket = w.ticket(ticketId);
  const item = ticket.courses[courseIdx]?.items.find((i) => i.id === itemId);
  if (!item) return;
  const rate = defects.ratePerNight[w.s.nightId] * defects.onTheFlyRateFactor;
  const protocol = needsAllergyPick(ticket, item) && (ticket.allergy?.acked ?? false);
  startCook(w, ticket, courseIdx, item, rollDefect(w.ctx, rate, w.rng.defects), true, protocol);
}

/** Finished jobs become plates in the window. */
export function updateKitchen(w: Work): void {
  const first = w.s.cooking[0];
  if (!first || first.doneAtMs > w.now) return;
  const done = w.s.cooking.filter((j) => j.doneAtMs <= w.now);
  w.s.cooking = w.s.cooking.filter((j) => j.doneAtMs > w.now);
  const missRate = w.ctx.tuning.allergy.pickMissRatePerNight[w.s.nightId];
  for (const job of done) {
    if (!w.s.tickets[job.ticketId]) continue;
    const ticket = w.ticket(job.ticketId);
    const item = ticket.courses[job.courseIdx]?.items.find((i) => i.id === job.itemId);
    if (!item || item.state !== 'cooking') continue;
    // The kitchen can forget the pick even under protocol (Nights 4–5): expo must still look.
    const pick = job.allergyProtocol && !w.rng.kitchen.chance(missRate);
    const plateId = w.nextId('p');
    w.putPlate({
      id: plateId,
      ticketId: ticket.id,
      itemId: item.id,
      courseIdx: job.courseIdx,
      seat: item.seat,
      upAtMs: w.now,
      build: buildPlate(w.ctx, { menuId: item.menuId, mods: item.mods }, job.defect, w.rng.kitchen, pick),
      onTheFly: job.onTheFly,
    });
    item.state = 'up';
    item.plateId = plateId;
    w.s.windowOrder = [...w.s.windowOrder, plateId];
    w.emit({ type: 'plateUp', plateId, ticketId: ticket.id, station: job.station });
  }
}

/** "Grill's dragging": everything on that station (including what's already cooking) slows down. */
export function dragStation(w: Work, station: StationId): void {
  const { dragMultiplier, dragMs } = w.ctx.tuning.kitchen;
  w.s.stations = { ...w.s.stations, [station]: { dragMultiplier, dragUntilMs: w.now + dragMs } };
  w.s.cooking = w.s.cooking
    .map((j) =>
      j.station === station
        ? { ...j, doneAtMs: w.now + Math.round((j.doneAtMs - w.now) * dragMultiplier) }
        : j,
    )
    .sort(byDoneAt);
}

/**
 * "Dropped the strip on 22": the line loses a plate (or a cooking item) and remakes it on the fly.
 * Prefers plates in the window of `ticketId` if given. Returns what was lost, or null if nothing could be.
 */
export function kitchenDrop(w: Work, ticketId?: string): { ticketId: string; menuId: string } | null {
  const plates = w.s.windowOrder
    .map((id) => w.s.plates[id])
    .filter((p) => p !== undefined && (ticketId === undefined || p.ticketId === ticketId));
  const jobs = w.s.cooking.filter((j) => ticketId === undefined || j.ticketId === ticketId);

  if (plates.length > 0) {
    const plate = w.rng.kitchen.pick(plates);
    if (!plate) return null;
    w.deletePlate(plate.id);
    w.s.windowOrder = w.s.windowOrder.filter((id) => id !== plate.id);
    const ticket = w.ticket(plate.ticketId);
    const item = ticket.courses[plate.courseIdx]?.items.find((i) => i.id === plate.itemId);
    if (item) item.plateId = null;
    remake(w, plate.ticketId, plate.courseIdx, plate.itemId);
    return { ticketId: plate.ticketId, menuId: plate.build.menuId };
  }
  if (jobs.length > 0) {
    const job = w.rng.kitchen.pick(jobs);
    const ticket = w.s.tickets[job.ticketId];
    const item = ticket?.courses[job.courseIdx]?.items.find((i) => i.id === job.itemId);
    if (!item) return null;
    remake(w, job.ticketId, job.courseIdx, job.itemId);
    return { ticketId: job.ticketId, menuId: item.menuId };
  }
  return null;
}
