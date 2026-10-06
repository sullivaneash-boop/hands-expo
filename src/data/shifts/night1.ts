import type { ShiftDef } from '../schema';

/** Phase 1: a one-beat example. The real Night 1 timeline lands in task 2.1. */
export const night1 = {
  id: 1,
  name: 'The Window',
  clockStartHour: 17,
  features: [],
  beats: [
    {
      atMs: 12_000,
      type: 'ticket',
      ticket: {
        table: 12,
        server: 'maya',
        guests: 1,
        courses: [
          { kind: 'main', items: [{ seat: 1, menuId: 'burger', mods: ['medium', 'no_onion', 'fries'] }] },
        ],
      },
    },
  ],
} as const satisfies ShiftDef;
