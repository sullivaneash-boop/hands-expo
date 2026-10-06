import type { ModDef } from './schema';

export const mods = [
  { id: 'medium', text: 'MEDIUM', kind: 'doneness' },
  { id: 'fries', text: 'FRIES', kind: 'side' },
  { id: 'no_onion', text: 'NO ONION', kind: 'remove', emphasize: true },
] as const satisfies readonly ModDef[];
