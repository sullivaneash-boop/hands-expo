import type { PlateDefectKind, StationId } from '../../data/schema';
import { needsAllergyPick } from '../lookup';
import { baseCookMs, buildPlate, rollDefect } from '../plates';
import type { CookJob, Ticket, TicketItem } from '../state';
import type { Work } from '../work';

/**
 * The line (D-066): each station has a few cook slots. Fired items queue for a slot (on-the-fly remakes
 * jump the queue), cook, and land on the pass. If the pass is full, finished food waits behind the window
 * — still aging toward death — until a spot opens.
 */

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Effective slots right now (a dragging station loses some, never below 1). */
export function stationSlots(w: Work, station: StationId): number {
  const { kitchen } = w.ctx.tuning;
  const dragging = w.now < w.s.stations[station].dragUntilMs;
  return Math.max(1, kitchen.slots[station] - (dragging ? kitchen.dragSlotPenalty : 0));
}

function stationMultiplier(w: Work, station: StationId): number {
  const st = w.s.stations[station];
  return w.now < st.dragUntilMs ? st.dragMultiplier : 1;
}

const cookingAt = (w: Work, station: StationId) =>
  w.s.cooking.filter((j) => j.station === station && j.status === 'cooking').length;

/** Queue order: on-the-fly first, then fire time, then id (deterministic). */
const queueOrder = (a: CookJob, b: CookJob) =>
  Number(b.onTheFly) - Number(a.onTheFly) || a.firedAtMs - b.firedAtMs || cmp(a.itemId, b.itemId);

function itemOf(w: Work, job: CookJob): TicketItem | undefined {
  return w.ticket(job.ticketId).courses[job.courseIdx]?.items.find((i) => i.id === job.itemId);
}

/** Fire an item: it takes a free slot or joins the station queue. `ticket`/`item` must be mutable copies. */
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
  const baseMs =
    Math.round(baseCookMs(w.ctx, item) * (1 + jitter) * (onTheFly ? cook.onTheFlyFactor : 1)) +
    (allergyProtocol ? cook.allergyExtraMs : 0);
  item.makes++;
  item.onTheFly = onTheFly;
  item.state = 'queued';
  const full =
    w.s.cooking.filter((j) => j.station === def.station && j.status !== 'waiting').length >=
    stationSlots(w, def.station);
  if (!onTheFly) w.stats.itemsFired++;
  if (full && !onTheFly) w.stats.overfires++;
  const job: CookJob = {
    ticketId: ticket.id,
    itemId: item.id,
    courseIdx,
    station: def.station,
    status: 'queued',
    firedAtMs: w.now,
    baseMs,
    startedAtMs: null,
    doneAtMs: null,
    defect,
    onTheFly,
    allergyProtocol,
  };
  w.s.cooking = [...w.s.cooking.filter((j) => j.itemId !== item.id), job];
  w.emit({
    type: 'itemFired',
    ticketId: ticket.id,
    itemId: item.id,
    station: def.station,
    onTheFly,
    queued: full,
  });
  promote(w, def.station);
}

/** Start queued jobs while the station has free slots. */
function promote(w: Work, station: StationId): void {
  const free = stationSlots(w, station) - cookingAt(w, station);
  if (free <= 0) return;
  const next = w.s.cooking
    .filter((j) => j.station === station && j.status === 'queued')
    .sort(queueOrder)
    .slice(0, free);
  if (next.length === 0) return;
  const mult = stationMultiplier(w, station);
  const started = new Map(
    next.map((j) => [
      j.itemId,
      { ...j, status: 'cooking' as const, startedAtMs: w.now, doneAtMs: w.now + Math.round(j.baseMs * mult) },
    ]),
  );
  w.s.cooking = w.s.cooking.map((j) => started.get(j.itemId) ?? j);
  for (const j of next) {
    if (!w.s.tickets[j.ticketId]) continue;
    const item = itemOf(w, j);
    if (item && item.state === 'queued') item.state = 'cooking';
    w.emit({ type: 'itemStarted', ticketId: j.ticketId, itemId: j.itemId, station });
  }
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

/** Put a finished job's plate on the pass. */
function land(w: Work, job: CookJob, finishedAtMs: number): void {
  const ticket = w.ticket(job.ticketId);
  const item = ticket.courses[job.courseIdx]?.items.find((i) => i.id === job.itemId);
  w.s.cooking = w.s.cooking.filter((j) => j.itemId !== job.itemId);
  if (!item || (item.state !== 'cooking' && item.state !== 'queued')) return;
  // The kitchen can forget the pick even under protocol (Nights 4–5): expo must still look.
  const missRate = w.ctx.tuning.allergy.pickMissRatePerNight[w.s.nightId];
  const pick = job.allergyProtocol && !w.rng.kitchen.chance(missRate);
  const plateId = w.nextId('p');
  w.putPlate({
    id: plateId,
    ticketId: ticket.id,
    itemId: item.id,
    courseIdx: job.courseIdx,
    seat: item.seat,
    // Food backed up behind the window has already been aging since it finished.
    upAtMs: finishedAtMs,
    build: buildPlate(w.ctx, { menuId: item.menuId, mods: item.mods }, job.defect, w.rng.kitchen, pick),
    onTheFly: job.onTheFly,
  });
  item.state = 'up';
  item.plateId = plateId;
  w.s.windowOrder = [...w.s.windowOrder, plateId];
  w.emit({ type: 'plateUp', plateId, ticketId: ticket.id, station: job.station });
}

const passFree = (w: Work) => w.ctx.tuning.pass.spots - w.s.windowOrder.length;

/** Finish cooking, land what fits (oldest first), back up the rest, and fill free slots. */
export function updateKitchen(w: Work): void {
  // 1. Jobs whose cook time is up become "finished": waiting until the pass has room.
  const done = w.s.cooking.filter((j) => j.status === 'cooking' && (j.doneAtMs ?? Infinity) <= w.now);
  const doneIds = new Set(done.map((j) => j.itemId));
  if (done.length > 0) {
    w.s.cooking = w.s.cooking.map((j) => (doneIds.has(j.itemId) ? { ...j, status: 'waiting' as const } : j));
  }
  // 2. Land finished food while there are spots, oldest first.
  const waiting = w.s.cooking
    .filter((j) => j.status === 'waiting')
    .sort((a, b) => (a.doneAtMs ?? 0) - (b.doneAtMs ?? 0) || cmp(a.itemId, b.itemId));
  for (const job of waiting) {
    if (!w.s.tickets[job.ticketId]) {
      w.s.cooking = w.s.cooking.filter((j) => j.itemId !== job.itemId);
      continue;
    }
    if (passFree(w) <= 0) {
      if (doneIds.has(job.itemId))
        w.emit({ type: 'plateBackedUp', ticketId: job.ticketId, itemId: job.itemId });
      continue;
    }
    land(w, job, job.doneAtMs ?? w.now);
  }
  // 3. Freed slots pick up the queue.
  for (const s of w.ctx.content.stations) promote(w, s.id);
}

/** Finished food that died behind the window (pass was full too long). Returns the jobs that died. */
export function expireWaiting(w: Work): CookJob[] {
  const dieMs = w.ctx.tuning.pass.plateDieMs;
  const dead = w.s.cooking.filter((j) => j.status === 'waiting' && w.now - (j.doneAtMs ?? w.now) >= dieMs);
  if (dead.length > 0) {
    const ids = new Set(dead.map((j) => j.itemId));
    w.s.cooking = w.s.cooking.filter((j) => !ids.has(j.itemId));
  }
  return dead;
}

/** "Grill's dragging": the station loses a slot and slows down, including what's already cooking. */
export function dragStation(w: Work, station: StationId): void {
  const { dragMultiplier, dragMs } = w.ctx.tuning.kitchen;
  w.s.stations = { ...w.s.stations, [station]: { dragMultiplier, dragUntilMs: w.now + dragMs } };
  w.s.cooking = w.s.cooking.map((j) =>
    j.station === station && j.status === 'cooking' && j.doneAtMs !== null
      ? { ...j, doneAtMs: w.now + Math.round((j.doneAtMs - w.now) * dragMultiplier) }
      : j,
  );
}

/**
 * "Dropped the strip on 22": the line loses a plate (or a cooking item) and remakes it on the fly.
 * Prefers plates in the window of `ticketId` if given. Returns what was lost, or null if nothing could be.
 */
export function kitchenDrop(w: Work, ticketId?: string): { ticketId: string; menuId: string } | null {
  const plates = w.s.windowOrder
    .map((id) => w.s.plates[id])
    .filter((p) => p !== undefined && (ticketId === undefined || p.ticketId === ticketId));
  const jobs = w.s.cooking.filter(
    (j) => j.status === 'cooking' && (ticketId === undefined || j.ticketId === ticketId),
  );

  if (plates.length > 0) {
    const plate = w.rng.kitchen.pick(plates);
    if (!plate) return null;
    w.deletePlate(plate.id);
    w.s.windowOrder = w.s.windowOrder.filter((id) => id !== plate.id);
    const ticket = w.ticket(plate.ticketId);
    const item = ticket.courses[plate.courseIdx]?.items.find((i) => i.id === plate.itemId);
    if (item) item.plateId = null;
    remake(w, plate.ticketId, plate.courseIdx, plate.itemId);
    w.emit({ type: 'plateDropped', plateId: plate.id, ticketId: plate.ticketId });
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
