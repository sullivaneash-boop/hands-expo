import type { MenuItemDef, ServerDef, TicketTemplate } from '../../data/schema';
import { modDef } from '../lookup';
import type { Rng } from '../rng';
import type { Work } from '../work';

/**
 * A random, valid single-course ticket (debug spawn now; Phase 3 procedural waves build on this).
 * All probabilities come from tuning.generate.
 */
export function randomTicket(w: Work, rng: Rng): TicketTemplate {
  const g = w.ctx.tuning.generate;
  const guests = Number(rng.weighted(g.guestWeights as unknown as Record<string, number>));
  const mains = w.ctx.content.menu.filter((m) => m.course === 'main');
  const server = rng.pick(w.ctx.content.servers as readonly ServerDef[]);
  const liveTables = new Set(w.s.railOrder.map((id) => w.s.tickets[id]?.table));
  const [lo, hi] = g.tableRange as readonly [number, number];
  let table = rng.int(lo, hi);
  for (let tries = 0; liveTables.has(table) && tries < 50; tries++) table = rng.int(lo, hi);

  const items = Array.from({ length: guests }, (_, i) => {
    const def = rng.pick(mains as readonly MenuItemDef[]);
    return { seat: i + 1, menuId: def.id, mods: randomMods(w, rng, def) };
  });
  return { table, server: server.id, guests, courses: [{ kind: 'main', items }] };
}

function randomMods(w: Work, rng: Rng, def: MenuItemDef): string[] {
  const g = w.ctx.tuning.generate;
  const kind = (id: string) => modDef(w.ctx, id).kind;
  const mods: string[] = [];
  if (def.doneness) mods.push(rng.pick(def.legalMods.filter((m) => kind(m) === 'doneness')));
  let extras = 0;
  for (const m of def.legalMods) {
    if (extras >= g.maxExtraMods) break;
    if (['remove', 'add', 'prep'].includes(kind(m)) && rng.chance(g.extraModChance)) {
      mods.push(m);
      extras++;
    }
  }
  const sides = def.legalMods.filter((m) => kind(m) === 'side');
  if (sides.length > 0) {
    const swap = rng.chance(g.sideSwapChance) || !def.defaultSide;
    mods.push(swap ? rng.pick(sides) : (def.defaultSide as string));
  }
  return mods;
}
