import type { DialogueLine } from './schema';

/** Voice lines. Placeholders: {table}, {item}, {seat}, {server}. */
export const dialogue = [
  { id: 'server_status_1', text: "Where's my {table}?" },
  { id: 'server_status_2', text: 'How long on {table}?' },
  { id: 'server_status_3', text: "Expo — {table}'s asking about their food." },
  { id: 'reply_ok', text: 'Heard, thanks.' },
  { id: 'reply_wrong', text: "That's not what the board says…" },
  { id: 'reply_timeout', text: "Forget it, I'll ask the line myself." },
  { id: 'reply_moot', text: 'Oh — it just went out. Never mind.' },
] as const satisfies readonly DialogueLine[];
