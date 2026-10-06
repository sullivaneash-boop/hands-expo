import type { ServerDef } from './schema';

/** Fictional servers (report 02 fixtures). */
export const servers = [
  { id: 'maya', name: 'MAYA' },
  { id: 'luis', name: 'LUIS' },
  { id: 'jen', name: 'JEN' },
] as const satisfies readonly ServerDef[];
