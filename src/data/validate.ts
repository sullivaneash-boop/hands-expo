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

  const modIds = new Set(c.mods.map((m) => m.id));
  const menuById = new Map(c.menu.map((m) => [m.id, m]));
  const serverIds = new Set(c.servers.map((s) => s.id));
  const lineIds = new Set(c.dialogue.map((d) => d.id));
  const interruptIds = new Set(c.interrupts.map((i) => i.id));

  for (const m of c.menu) {
    if (m.ticketName !== m.ticketName.toUpperCase())
      errors.push(`menu "${m.id}" ticketName must be ALL CAPS`);
    for (const mod of m.legalMods) if (!modIds.has(mod)) errors.push(`menu "${m.id}" unknown mod "${mod}"`);
    if (m.defaultSide && !modIds.has(m.defaultSide))
      errors.push(`menu "${m.id}" unknown defaultSide "${m.defaultSide}"`);
  }
  for (const mod of c.mods)
    if (mod.text !== mod.text.toUpperCase()) errors.push(`mod "${mod.id}" text must be ALL CAPS`);

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
        for (const mod of item.mods ?? [])
          if (!def.legalMods.includes(mod))
            errors.push(`${where}: mod "${mod}" not legal on "${item.menuId}"`);
        if (typeof item.seat === 'number' && (item.seat < 1 || item.seat > t.guests))
          errors.push(`${where}: seat ${item.seat} outside 1..${t.guests}`);
      }
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
      if (b.type === 'ticket') checkTicket(where, b.ticket);
      if (b.type === 'interrupt' && !interruptIds.has(b.interrupt))
        errors.push(`${where}: unknown interrupt "${b.interrupt}"`);
    });
  }
  return errors;
}
