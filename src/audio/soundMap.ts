import type { SimEventType } from '../sim';

/**
 * Data: which sprite sound(s) play for which sim event (STYLE.md §6).
 * Phase 2 fills this with `ticketPrinted → print`, `plateUp → food_up`.
 */
export const soundMap: Partial<Record<SimEventType, readonly string[]>> = {};
