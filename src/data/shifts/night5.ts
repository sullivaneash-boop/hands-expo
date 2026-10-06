import type { ShiftDef } from '../schema';

/**
 * Night 5 — "Full House". Everything at once, plus the manager. An allergy incident ends the shift.
 */
export const night5 = {
  id: 5,
  name: 'Full House',
  tagline: 'Everything, all at once. The manager is watching.',
  clockStartHour: 17,
  features: ['courses', 'addons', '86', 'refire', 'drag', 'allergy', 'bar', 'manager'],
  beats: [
    {
      atMs: 12_000,
      type: 'ticket',
      ticket: {
        table: 8,
        server: 'maya',
        guests: 4,
        courses: [
          {
            kind: 'app',
            items: [
              { seat: 'share', menuId: 'calamari', mods: ['lemon_aioli'] },
              { seat: 'share', menuId: 'burrata', mods: [] },
            ],
          },
          {
            kind: 'main',
            hold: true,
            items: [
              { seat: 1, menuId: 'strip', mods: ['med_rare', 'potato'] },
              { seat: 2, menuId: 'salmon', mods: ['no_butter', 'asparagus'] },
              { seat: 3, menuId: 'chicken', mods: ['broccoli'] },
              { seat: 4, menuId: 'chop', mods: ['add_steak', 'sauce_on_side'] },
            ],
          },
        ],
      },
    },
    { atMs: 16_000, type: 'interrupt', interrupt: 'manager_vip', target: { table: 8 } },
    {
      atMs: 60_000,
      type: 'ticket',
      ticket: {
        table: 51,
        server: 'maya',
        guests: 5,
        note: 'BIRTHDAY - DESSERT AFTER MAINS',
        courses: [
          {
            kind: 'main',
            items: [
              { seat: 1, menuId: 'strip', mods: ['rare', 'fries'] },
              { seat: 2, menuId: 'salmon', mods: ['no_butter', 'broccoli'] },
              {
                seat: 3,
                menuId: 'burger',
                mods: ['medium', 'no_onion', 'no_pickle', 'cheddar', 'side_salad'],
              },
              { seat: 4, menuId: 'strip', mods: ['med_well', 'potato', 'sauce_on_side'] },
              { seat: 5, menuId: 'burger', mods: ['well_done', 'no_cheese', 'fries'] },
            ],
          },
        ],
      },
    },
    { atMs: 150_000, type: 'interrupt', interrupt: 'manager_push' },
  ],
} as const satisfies ShiftDef;
