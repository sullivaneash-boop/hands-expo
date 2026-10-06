import type { DialogueLine } from './schema';

export const dialogue = [
  { id: 'server_status_1', text: "Where's my {table}?" },
] as const satisfies readonly DialogueLine[];
