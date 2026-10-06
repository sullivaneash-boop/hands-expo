import type { SimEventType } from '../sim';

/**
 * Data: which sprite sound(s) play for which sim event (STYLE.md §6).
 * Phase 4 swaps the sprite file + ids; game code never changes.
 */
export const soundMap: Partial<Record<SimEventType, readonly string[]>> = {
  ticketPrinted: ['print'],
  plateUp: ['food_up'],
  interruptArrived: ['interrupt'],
  courseSent: ['send'],
  plateDied: ['error'],
  commandRejected: ['error'],
};
