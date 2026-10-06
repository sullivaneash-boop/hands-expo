import type { DialogueLine } from './schema';

/** Voice lines. Placeholders: {table}, {item}, {seat}, {station}. */
export const dialogue = [
  // server status
  { id: 'server_status_1', text: "Where's my {table}?" },
  { id: 'server_status_2', text: 'How long on {table}?' },
  { id: 'server_status_3', text: "Expo — {table}'s asking about their food." },
  // server fire request
  { id: 'server_fire_1', text: 'Can I fire {table}?' },
  { id: 'server_fire_2', text: '{table} is ready for mains!' },
  { id: 'server_fire_3', text: 'Fire {table}, please — they cleared apps.' },
  // add-on (POS chit + call-out)
  { id: 'server_addon_1', text: 'Added {item} on {table}, seat {seat}!' },
  { id: 'server_addon_2', text: 'Seat {seat} on {table} wants {item} — ringing it in.' },
  // kitchen barks
  { id: 'kitchen_86_1', text: '86 {item}!' },
  { id: 'kitchen_86_2', text: "That's the last {item} — 86 {item}!" },
  { id: 'kitchen_refire_1', text: 'Dropped the {item} on {table} — refiring!' },
  { id: 'kitchen_refire_2', text: '{item} for {table} hit the floor, on the fly!' },
  { id: 'kitchen_drag_1', text: "{station}'s dragging — give me a minute!" },
  { id: 'kitchen_drag_2', text: "{station}'s in the weeds!" },
  // bar
  { id: 'bar_delay_1', text: "Bar's slammed — {table}'s drinks are late. Hold their food a sec?" },
  { id: 'bar_delay_2', text: "Don't send {table} yet, their cocktails aren't up." },
  // manager
  { id: 'manager_push_1', text: "Push {table}, they're complaining." },
  { id: 'manager_push_2', text: '{table} has been waiting forever. Get it out.' },
  { id: 'manager_vip_1', text: 'VIP on {table}. Make it perfect.' },
  { id: 'manager_vip_2', text: "{table} is the owner's friend. Nothing goes wrong." },
] as const satisfies readonly DialogueLine[];
