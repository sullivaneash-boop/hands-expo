import type { InterruptDef } from './schema';

export const interrupts = [
  {
    id: 'server_status',
    source: 'server',
    blocking: true,
    lines: ['server_status_1'],
    choices: 'ticketStatus',
    effect: { kind: 'askStatus' },
  },
] as const satisfies readonly InterruptDef[];
