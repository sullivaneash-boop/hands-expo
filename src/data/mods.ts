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
  { id: 'no_onion', text: 'NO ONION', kind: 'remove', icon: 'onion' },
  { id: 'no_pickle', text: 'NO PICKLE', kind: 'remove', icon: 'pickle' },
  { id: 'no_cheese', text: 'NO CHEESE', kind: 'remove', icon: 'cheese' },
  { id: 'no_butter', text: 'NO BUTTER', kind: 'remove', emphasize: true, icon: 'butter' },
  { id: 'no_tomato', text: 'NO TOMATO', kind: 'remove', icon: 'tomato' },
  // adds (protein add-ons lengthen cook time via tuning.cook.modDeltaMs)
  { id: 'cheddar', text: 'CHEDDAR', kind: 'add', allergens: ['dairy'], icon: 'cheese' },
  { id: 'add_chicken', text: 'ADD CHICKEN', kind: 'add', icon: 'chicken' },
  { id: 'add_salmon', text: 'ADD SALMON', kind: 'add', allergens: ['fish'], icon: 'salmon' },
  { id: 'add_steak', text: 'ADD STEAK', kind: 'add', icon: 'steak' },
  // sides
  { id: 'fries', text: 'FRIES', kind: 'side', icon: 'fries' },
  { id: 'potato', text: 'ROASTED POTATO', kind: 'side', icon: 'potato' },
  { id: 'asparagus', text: 'ASPARAGUS', kind: 'side', icon: 'asparagus' },
  { id: 'broccoli', text: 'BROCCOLI', kind: 'side', icon: 'broccoli' },
  { id: 'side_salad', text: 'SIDE SALAD', kind: 'side', icon: 'salad' },
  // prep
  { id: 'sauce_on_side', text: 'SAUCE ON SIDE', kind: 'prep', icon: 'ramekin' },
  { id: 'lemon_aioli', text: 'LEMON AIOLI', kind: 'prep', allergens: ['egg'], icon: 'lemon' },
] as const satisfies readonly ModDef[];
