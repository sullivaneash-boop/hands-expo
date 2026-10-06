import type { ServerDef } from './schema';

export const servers = [{ id: 'maya', name: 'MAYA' }] as const satisfies readonly ServerDef[];
