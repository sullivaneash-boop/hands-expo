import type { Content } from './schema';
import { menu } from './menu';
import { mods } from './mods';
import { allergens, stations } from './stations';
import { servers } from './servers';
import { interrupts } from './interrupts';
import { dialogue } from './dialogue';
import { shifts } from './shifts';

/** The full content bundle passed to the sim via ctx. */
export const content: Content = { menu, mods, stations, allergens, servers, interrupts, dialogue, shifts };

export type * from './schema';
