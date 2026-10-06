import type { ShiftDef } from '../schema';

/**
 * Night 1 — "The Window". Report 02's sample timeline compressed ×0.6 to 3:00 (D-006).
 * Teaching beats: first fire (T12), first modifier (T8), multi-plate table with a forced bad side (T21),
 * rail building (T26), mini-rush + server status (T30/T33), quiet beat (~2:20), final wave with a
 * deliberate wrong-mod plate (T40), printer stops at 3:00.
 */
export const night1 = {
  id: 1,
  name: 'The Window',
  clockStartHour: 17,
  features: [],
  beats: [
    {
      atMs: 7_200,
      type: 'ticket',
      ticket: {
        table: 12,
        server: 'maya',
        guests: 1,
        courses: [{ kind: 'main', items: [{ seat: 1, menuId: 'burger', mods: ['medium', 'fries'] }] }],
      },
    },
    {
      atMs: 31_200,
      type: 'ticket',
      ticket: {
        table: 8,
        server: 'luis',
        guests: 1,
        courses: [{ kind: 'main', items: [{ seat: 1, menuId: 'salmon', mods: ['no_butter', 'asparagus'] }] }],
      },
    },
    {
      atMs: 42_000,
      type: 'ticket',
      ticket: {
        table: 15,
        server: 'maya',
        guests: 1,
        courses: [
          {
            kind: 'main',
            items: [{ seat: 1, menuId: 'strip', mods: ['med_rare', 'fries', 'sauce_on_side'] }],
          },
        ],
      },
    },
    {
      atMs: 61_200,
      type: 'ticket',
      ticket: {
        table: 21,
        server: 'jen',
        guests: 2,
        courses: [
          {
            kind: 'main',
            items: [
              { seat: 1, menuId: 'salmon', mods: ['asparagus'] },
              { seat: 2, menuId: 'strip', mods: ['medium', 'fries'] },
            ],
          },
        ],
        // The strip comes up without its fries: first forced rejection.
        forceDefect: { itemIdx: 1, defect: 'missingComponent' },
      },
    },
    {
      atMs: 70_800,
      type: 'ticket',
      ticket: {
        table: 26,
        server: 'luis',
        guests: 2,
        courses: [
          {
            kind: 'main',
            items: [
              { seat: 1, menuId: 'chicken', mods: ['potato'] },
              { seat: 2, menuId: 'chop', mods: ['no_onion'] },
            ],
          },
        ],
      },
    },
    {
      atMs: 108_000,
      type: 'ticket',
      ticket: {
        table: 30,
        server: 'maya',
        guests: 2,
        courses: [
          {
            kind: 'main',
            items: [
              { seat: 1, menuId: 'burger', mods: ['medium', 'no_pickle', 'fries'] },
              { seat: 2, menuId: 'salmon', mods: ['broccoli'] },
            ],
          },
        ],
      },
    },
    {
      atMs: 111_000,
      type: 'ticket',
      ticket: {
        table: 33,
        server: 'jen',
        guests: 1,
        courses: [
          { kind: 'main', items: [{ seat: 1, menuId: 'chop', mods: ['no_tomato', 'sauce_on_side'] }] },
        ],
      },
    },
    { atMs: 118_800, type: 'interrupt', interrupt: 'server_status', target: { table: 30 } },
    // ~2:20 quiet beat — nothing prints until the final wave.
    {
      atMs: 145_200,
      type: 'ticket',
      ticket: {
        table: 40,
        server: 'luis',
        guests: 3,
        courses: [
          {
            kind: 'main',
            items: [
              { seat: 1, menuId: 'strip', mods: ['med_well', 'potato'] },
              { seat: 2, menuId: 'burger', mods: ['medium', 'cheddar', 'no_onion', 'fries'] },
              { seat: 3, menuId: 'salmon', mods: ['no_butter', 'asparagus'] },
            ],
          },
        ],
        // The deliberate wrong-mod plate: tests whether the player learned to read.
        forceDefect: { itemIdx: 1, defect: 'wrongMod' },
      },
    },
    {
      atMs: 147_000,
      type: 'ticket',
      ticket: {
        table: 44,
        server: 'jen',
        guests: 2,
        courses: [
          {
            kind: 'main',
            items: [
              { seat: 1, menuId: 'chicken', mods: ['broccoli'] },
              { seat: 2, menuId: 'burger', mods: ['rare', 'fries'] },
            ],
          },
        ],
      },
    },
    {
      atMs: 149_400,
      type: 'ticket',
      ticket: {
        table: 51,
        server: 'maya',
        guests: 2,
        courses: [
          {
            kind: 'main',
            items: [
              { seat: 1, menuId: 'chop', mods: [] },
              { seat: 2, menuId: 'salmon', mods: ['potato'] },
            ],
          },
        ],
      },
    },
  ],
} as const satisfies ShiftDef;
