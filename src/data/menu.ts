import type { MenuItemDef } from './schema';

/** Phase 1: one example item. Full menu (GDD §9) lands in task 2.1. */
export const menu = [
  {
    id: 'burger',
    ticketName: 'HOUSE BURGER',
    course: 'main',
    station: 'grill',
    cookTier: 'standard',
    doneness: true,
    defaultSide: 'fries',
    legalMods: ['medium', 'fries', 'no_onion'],
    allergens: ['gluten', 'dairy'],
  },
] as const satisfies readonly MenuItemDef[];
