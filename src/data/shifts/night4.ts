import type { ShiftDef } from '../schema';

/**
 * Night 4 — "Saturday". New obligation: protect attention. Allergy tickets need ACK before firing,
 * the grill drags, and the bar asks you to hold a table's food.
 */
export const night4 = {
  id: 4,
  name: 'Saturday',
  tagline: 'Allergies, a dragging grill, and the bar wants a word.',
  clockStartHour: 17,
  features: ['courses', 'addons', '86', 'refire', 'drag', 'allergy', 'bar'],
  beats: [
    {
      atMs: 10_000,
      type: 'ticket',
      ticket: {
        table: 32,
        server: 'luis',
        guests: 3,
        allergy: { seat: 2, allergen: 'shellfish' },
        courses: [
          {
            kind: 'main',
            items: [
              { seat: 1, menuId: 'burger', mods: ['medium', 'fries'] },
              { seat: 2, menuId: 'strip', mods: ['med_rare', 'broccoli'] },
              { seat: 3, menuId: 'salmon', mods: ['potato'] },
            ],
          },
        ],
      },
    },
    { atMs: 85_000, type: 'interrupt', interrupt: 'kitchen_drag', arg: 'grill' },
    { atMs: 110_000, type: 'interrupt', interrupt: 'bar_delay' },
  ],
} as const satisfies ShiftDef;
