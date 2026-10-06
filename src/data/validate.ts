import type { Content, TicketTemplate } from './schema';

/** Cross-reference checks. Returns a list of human-readable errors; empty = valid. */
export function validateContent(c: Content): string[] {
  const errors: string[] = [];
  const dupes = (kind: string, ids: readonly string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) errors.push(`duplicate ${kind} id "${id}"`);
      seen.add(id);
    }
  };
  dupes(
    'menu',
    c.menu.map((m) => m.id),
  );
  dupes(
    'mod',
    c.mods.map((m) => m.id),
  );
  dupes(
    'server',
    c.servers.map((s) => s.id),
  );
  dupes(
    'interrupt',
    c.interrupts.map((i) => i.id),
  );
  dupes(
    'dialogue',
    c.dialogue.map((d) => d.id),
  );
  dupes(
    'shift',
    c.shifts.map((s) => String(s.id)),
  );

  const modById = new Map(c.mods.map((m) => [m.id, m]));
  const menuById = new Map(c.menu.map((m) => [m.id, m]));
  const serverIds = new Set(c.servers.map((s) => s.id));
  const stationIds = new Set<string>(c.stations.map((s) => s.id));
  const allergenSet = new Set(c.allergens);
  const lineIds = new Set(c.dialogue.map((d) => d.id));
  const interruptById = new Map(c.interrupts.map((i) => [i.id, i]));

  for (const m of c.menu) {
    if (m.ticketName !== m.ticketName.toUpperCase())
      errors.push(`menu "${m.id}" ticketName must be ALL CAPS`);
    if (!stationIds.has(m.station)) errors.push(`menu "${m.id}" unknown station "${m.station}"`);
    for (const mod of m.legalMods) if (!modById.has(mod)) errors.push(`menu "${m.id}" unknown mod "${mod}"`);
    if (m.defaultSide && !modById.has(m.defaultSide))
      errors.push(`menu "${m.id}" unknown defaultSide "${m.defaultSide}"`);
  }
  for (const mod of c.mods) {
    if (mod.text !== mod.text.toUpperCase()) errors.push(`mod "${mod.id}" text must be ALL CAPS`);
    for (const a of mod.allergens ?? [])
      if (!allergenSet.has(a)) errors.push(`mod "${mod.id}" unknown allergen "${a}"`);
  }

  for (const i of c.interrupts)
    for (const line of i.lines)
      if (!lineIds.has(line)) errors.push(`interrupt "${i.id}" unknown line "${line}"`);

  const checkTicket = (where: string, t: TicketTemplate) => {
    if (!serverIds.has(t.server)) errors.push(`${where}: unknown server "${t.server}"`);
    let n = 0;
    for (const course of t.courses) {
      for (const item of course.items) {
        n++;
        const def = menuById.get(item.menuId);
        if (!def) {
          errors.push(`${where}: unknown menu item "${item.menuId}"`);
          continue;
        }
        const itemMods = item.mods ?? [];
        for (const mod of itemMods)
          if (!def.legalMods.includes(mod))
            errors.push(`${where}: mod "${mod}" not legal on "${item.menuId}"`);
        const countKind = (k: string) => itemMods.filter((m) => modById.get(m)?.kind === k).length;
        if (def.doneness && countKind('doneness') !== 1)
          errors.push(`${where}: "${item.menuId}" needs exactly one doneness`);
        if (!def.doneness && countKind('doneness') > 0)
          errors.push(`${where}: "${item.menuId}" takes no doneness`);
        if (countKind('side') > 1) errors.push(`${where}: "${item.menuId}" has more than one side`);
        if (typeof item.seat === 'number' && (item.seat < 1 || item.seat > t.guests))
          errors.push(`${where}: seat ${item.seat} outside 1..${t.guests}`);
        if (t.allergy && item.seat === t.allergy.seat) {
          const dishAllergens = [
            ...def.allergens,
            ...itemMods.flatMap((m) => modById.get(m)?.allergens ?? []),
          ];
          if (dishAllergens.includes(t.allergy.allergen))
            errors.push(
              `${where}: seat ${item.seat} is allergic to ${t.allergy.allergen} but ordered "${item.menuId}"`,
            );
        }
      }
    }
    if (t.allergy) {
      if (!allergenSet.has(t.allergy.allergen))
        errors.push(`${where}: unknown allergen "${t.allergy.allergen}"`);
      if (t.allergy.seat < 1 || t.allergy.seat > t.guests) errors.push(`${where}: allergy seat out of range`);
    }
    if (t.forceDefect && t.forceDefect.itemIdx >= n)
      errors.push(`${where}: forceDefect.itemIdx out of range`);
  };

  for (const s of c.shifts) {
    let prev = -1;
    s.beats.forEach((b, idx) => {
      const where = `night ${s.id} beat ${idx}`;
      if (b.atMs < prev) errors.push(`${where}: beats must be sorted by atMs`);
      prev = b.atMs;
      if (b.type === 'ticket') return checkTicket(where, b.ticket);
      const def = interruptById.get(b.interrupt);
      if (!def) return errors.push(`${where}: unknown interrupt "${b.interrupt}"`);
      if (b.arg !== undefined) {
        const kind = def.effect.kind;
        const ok =
          kind === 'stationDrag'
            ? stationIds.has(b.arg)
            : kind === 'eightySix' || kind === 'addOn'
              ? menuById.has(b.arg)
              : false;
        if (!ok) errors.push(`${where}: arg "${b.arg}" not valid for ${b.interrupt}`);
      }
    });
  }
  return errors;
}
