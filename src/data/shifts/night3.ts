import type { ShiftDef } from '../schema';

/**
 * Night 3 — "The Weeds". New obligation: exceptions. A scripted 86 collides with live salmon
 * tickets, an add-on chit lands on an open table, and the line drops a plate.
 */
export const night3 = {
  id: 3,
  name: 'The Weeds',
  tagline: 'Things change mid-ticket. Keep up.',
  clockStartHour: 17,
  features: ['courses', 'addons', '86', 'refire'],
  beats: [
    {
      atMs: 8_000,
      type: 'ticket',
      ticket: {
        table: 18,
        server: 'maya',
        guests: 2,
        courses: [
          {
            kind: 'main',
            items: [
              { seat: 1, menuId: 'burger', mods: ['medium', 'fries'] },
              { seat: 2, menuId: 'chicken', mods: ['potato'] },
            ],
          },
        ],
      },
    },
    {
      atMs: 40_000,
      type: 'ticket',
      ticket: {
        table: 44,
        server: 'jen',
        guests: 2,
        courses: [
          {
            kind: 'main',
            items: [
              { seat: 1, menuId: 'salmon', mods: ['potato'] },
              { seat: 2, menuId: 'burger', mods: ['med_rare', 'fries'] },
            ],
          },
        ],
      },
    },
    {
      atMs: 62_000,
      type: 'ticket',
      ticket: {
        table: 27,
        server: 'luis',
        guests: 1,
        courses: [{ kind: 'main', items: [{ seat: 1, menuId: 'salmon', mods: ['no_butter', 'asparagus'] }] }],
      },
    },
    { atMs: 70_000, type: 'interrupt', interrupt: 'kitchen_86', arg: 'salmon' },
    { atMs: 95_000, type: 'interrupt', interrupt: 'server_addon', target: { table: 18 }, arg: 'side_fries' },
    { atMs: 140_000, type: 'interrupt', interrupt: 'kitchen_refire' },
  ],
} as const satisfies ShiftDef;
