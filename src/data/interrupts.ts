import type { InterruptDef } from './schema';

/**
 * Interrupt catalog (GDD §8). Blocking ones wait at the door (FLOOR view) for an answer;
 * non-blocking ones are barks from the line or the POS and take effect immediately.
 */
export const interrupts = [
  {
    id: 'server_status',
    source: 'server',
    blocking: true,
    lines: ['server_status_1', 'server_status_2', 'server_status_3'],
    choices: 'ticketStatus',
    effect: { kind: 'askStatus' },
  },
  {
    id: 'server_fire',
    source: 'server',
    blocking: true,
    lines: ['server_fire_1', 'server_fire_2', 'server_fire_3'],
    choices: 'heard',
    effect: { kind: 'fireRequest' },
    feature: 'courses',
  },
  {
    id: 'server_addon',
    source: 'server',
    blocking: false,
    lines: ['server_addon_1', 'server_addon_2'],
    choices: 'none',
    effect: { kind: 'addOn', menuId: 'side_fries' },
    feature: 'addons',
  },
  {
    id: 'kitchen_86',
    source: 'kitchen',
    blocking: false,
    lines: ['kitchen_86_1', 'kitchen_86_2'],
    choices: 'none',
    effect: { kind: 'eightySix' },
    feature: '86',
  },
  {
    id: 'kitchen_refire',
    source: 'kitchen',
    blocking: false,
    lines: ['kitchen_refire_1', 'kitchen_refire_2'],
    choices: 'none',
    effect: { kind: 'kitchenRefire' },
    feature: 'refire',
  },
  {
    id: 'kitchen_drag',
    source: 'kitchen',
    blocking: false,
    lines: ['kitchen_drag_1', 'kitchen_drag_2'],
    choices: 'none',
    effect: { kind: 'stationDrag' },
    feature: 'drag',
  },
  {
    id: 'bar_delay',
    source: 'bar',
    blocking: true,
    lines: ['bar_delay_1', 'bar_delay_2'],
    choices: 'heard',
    effect: { kind: 'notBefore' },
    feature: 'bar',
  },
  {
    id: 'manager_push',
    source: 'manager',
    blocking: true,
    lines: ['manager_push_1', 'manager_push_2'],
    choices: 'heard',
    effect: { kind: 'push' },
    feature: 'manager',
  },
  {
    id: 'manager_vip',
    source: 'manager',
    blocking: true,
    lines: ['manager_vip_1', 'manager_vip_2'],
    choices: 'heard',
    effect: { kind: 'vip' },
    feature: 'manager',
  },
] as const satisfies readonly InterruptDef[];
