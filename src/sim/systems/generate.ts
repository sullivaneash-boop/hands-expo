import type { NightProfile } from '../../config/tuning';
import type { MenuItemDef, ServerDef, ShiftDef, TicketTemplate } from '../../data/schema';
import { modDef } from '../lookup';
import type { Rng } from '../rng';
import type { Work } from '../work';

/** Tonight's shift definition and procedural profile. */
export function tonight(w: Work): { shift: ShiftDef | undefined; profile: NightProfile } {
  return {
    shift: w.ctx.content.shifts.find((s) => s.id === w.s.nightId),
    profile: w.ctx.tuning.nights[w.s.nightId] as NightProfile,
  };
}

/**
 * A random, valid ticket using tonight's features: two courses (apps + HOLD mains) when 'courses' is
 * on, an allergy seat when 'allergy' is on. Never orders an 86'd item. Probabilities from tuning.
 */
export function randomTicket(w: Work, rng: Rng): TicketTemplate {
  const g = w.ctx.tuning.generate;
  const { shift, profile } = tonight(w);
  const features = shift?.features ?? [];
  const available = (course: string) =>
    w.ctx.content.menu.filter((m) => m.course === course && !w.s.eighty6.includes(m.id)) as MenuItemDef[];

  const guests = Number(rng.weighted(g.guestWeights as unknown as Record<string, number>));
  const server = rng.pick(w.ctx.content.servers as readonly ServerDef[]);
  const liveTables = new Set(w.s.railOrder.map((id) => w.s.tickets[id]?.table));
  const [lo, hi] = g.tableRange as readonly [number, number];
  let table = rng.int(lo, hi);
  for (let tries = 0; liveTables.has(table) && tries < 50; tries++) table = rng.int(lo, hi);

  const mains = available('main');
  const mainItems = Array.from({ length: guests }, (_, i) => {
    const def = rng.pick(mains);
    return { seat: i + 1, menuId: def.id, mods: randomMods(w, rng, def) };
  });

  const courses: TicketTemplate['courses'][number][] = [];
  const apps = available('app');
  if (features.includes('courses') && apps.length > 0 && rng.chance(profile.twoCourseChance)) {
    const count = Math.ceil(guests / g.guestsPerApp);
    courses.push({
      kind: 'app',
      items: Array.from({ length: count }, () => {
        const def = rng.pick(apps);
        return { seat: 'share' as const, menuId: def.id, mods: randomMods(w, rng, def) };
      }),
    });
    courses.push({ kind: 'main', hold: true, items: mainItems });
  } else {
    courses.push({ kind: 'main', items: mainItems });
  }

  const template: TicketTemplate = { table, server: server.id, guests, courses };
  if (features.includes('allergy') && rng.chance(profile.allergyChance)) {
    const seat = rng.int(1, guests);
    const seatItems = mainItems.filter((i) => i.seat === seat);
    const dish = seatItems.flatMap((i) => [
      ...(w.ctx.content.menu.find((m) => m.id === i.menuId)?.allergens ?? []),
      ...i.mods.flatMap((m) => modDef(w.ctx, m).allergens ?? []),
    ]);
    const options = w.ctx.content.allergens.filter((a) => !dish.includes(a));
    if (options.length > 0) template.allergy = { seat, allergen: rng.pick(options) };
  }
  return template;
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
