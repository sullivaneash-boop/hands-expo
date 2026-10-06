import type { ShiftDef } from '../schema';

/**
 * Night 2 — "Two Courses". New obligation: pacing. Apps fire now; mains are HOLD until the server
 * asks to fire (after the table finishes apps). Scripted opener teaches the flow; waves are procedural.
 */
export const night2 = {
  id: 2,
  name: 'Two Courses',
  tagline: 'Apps first. Mains wait for the table.',
  clockStartHour: 17,
  features: ['courses'],
  beats: [
    {
      atMs: 6_000,
      type: 'ticket',
      ticket: {
        table: 21,
        server: 'jen',
        guests: 2,
        courses: [
          { kind: 'app', items: [{ seat: 'share', menuId: 'burrata', mods: ['no_tomato'] }] },
          {
            kind: 'main',
            hold: true,
            items: [
              { seat: 1, menuId: 'salmon', mods: ['asparagus'] },
              { seat: 2, menuId: 'strip', mods: ['medium', 'fries'] },
            ],
          },
        ],
      },
    },
    {
      atMs: 18_000,
      type: 'ticket',
      ticket: {
        table: 9,
        server: 'maya',
        guests: 1,
        courses: [{ kind: 'main', items: [{ seat: 1, menuId: 'chop', mods: ['add_chicken', 'no_onion'] }] }],
      },
    },
    {
      atMs: 75_000,
      type: 'ticket',
      ticket: {
        table: 40,
        server: 'jen',
        guests: 3,
        courses: [
          { kind: 'app', items: [{ seat: 'share', menuId: 'calamari', mods: ['lemon_aioli'] }] },
          {
            kind: 'main',
            hold: true,
            items: [
              { seat: 1, menuId: 'salmon', mods: ['fries'] },
              { seat: 2, menuId: 'burger', mods: ['medium', 'no_pickle', 'cheddar', 'fries'] },
              { seat: 3, menuId: 'strip', mods: ['med_well', 'potato'] },
            ],
          },
        ],
      },
    },
  ],
} as const satisfies ShiftDef;
