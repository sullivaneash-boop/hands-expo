import type { ModDef } from './schema';

/** Modifier vocabulary (GDD §9). Ticket text is ALL CAPS. `emphasize` prints as *** TEXT ***. */
export const mods = [
  // doneness
  { id: 'rare', text: 'RARE', kind: 'doneness' },
  { id: 'med_rare', text: 'MED RARE', kind: 'doneness' },
  { id: 'medium', text: 'MEDIUM', kind: 'doneness' },
  { id: 'med_well', text: 'MED WELL', kind: 'doneness' },
  { id: 'well_done', text: 'WELL DONE', kind: 'doneness' },
  // removals
  { id: 'no_onion', text: 'NO ONION', kind: 'remove' },
  { id: 'no_pickle', text: 'NO PICKLE', kind: 'remove' },
  { id: 'no_cheese', text: 'NO CHEESE', kind: 'remove' },
  { id: 'no_butter', text: 'NO BUTTER', kind: 'remove', emphasize: true },
  { id: 'no_tomato', text: 'NO TOMATO', kind: 'remove' },
  // adds
  { id: 'cheddar', text: 'CHEDDAR', kind: 'add' },
  // sides
  { id: 'fries', text: 'FRIES', kind: 'side' },
  { id: 'potato', text: 'ROASTED POTATO', kind: 'side' },
  { id: 'asparagus', text: 'ASPARAGUS', kind: 'side' },
  { id: 'broccoli', text: 'BROCCOLI', kind: 'side' },
  { id: 'side_salad', text: 'SIDE SALAD', kind: 'side' },
  // prep
  { id: 'sauce_on_side', text: 'SAUCE ON SIDE', kind: 'prep' },
  { id: 'lemon_aioli', text: 'LEMON AIOLI', kind: 'prep' },
] as const satisfies readonly ModDef[];
