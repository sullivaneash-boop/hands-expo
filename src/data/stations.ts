import type { StationDef } from './schema';

export const stations = [
  { id: 'grill', name: 'GRILL' },
  { id: 'saute', name: 'SAUTÉ' },
  { id: 'pantry', name: 'PANTRY' },
] as const satisfies readonly StationDef[];

/** Allergens that can appear on allergy tickets (ALL CAPS when printed). */
export const allergens = ['shellfish', 'fish', 'dairy', 'gluten', 'egg'] as const;
