import { describe, expect, it } from 'vitest';
import { tuning } from '../config/tuning';
import { content } from '../data';
import type { PlateDefectKind } from '../data/schema';
import { buildPlate, plateError } from './plates';
import { Rng, seedRng } from './rng';

const ctx = { tuning, content };
const KINDS: PlateDefectKind[] = ['wrongMod', 'missingComponent', 'wrongDoneness', 'wrongDish'];

const specs = [
  { menuId: 'burger', mods: ['medium', 'no_onion', 'fries'] },
  { menuId: 'burger', mods: ['rare'] },
  { menuId: 'strip', mods: ['med_rare', 'potato', 'sauce_on_side'] },
  { menuId: 'salmon', mods: ['no_butter', 'asparagus'] },
  { menuId: 'salmon', mods: [] },
  { menuId: 'chicken', mods: ['broccoli'] },
  { menuId: 'chop', mods: ['no_tomato', 'sauce_on_side'] },
  { menuId: 'chop', mods: [] },
  { menuId: 'side_fries', mods: [] },
];

describe('plate builds and defects', () => {
  it('no defect → identical build, no error', () => {
    for (const spec of specs) {
      const build = buildPlate(ctx, spec, null, new Rng(seedRng(1)));
      expect(build).toEqual(spec);
      expect(plateError(ctx, spec, build)).toBeNull();
    }
  });

  it('every defect kind produces a detectably wrong plate on every item (via fallbacks if needed)', () => {
    for (const spec of specs) {
      for (const kind of KINDS) {
        for (let seed = 0; seed < 20; seed++) {
          const build = buildPlate(ctx, spec, kind, new Rng(seedRng(seed)));
          // side_fries has no mods and is the only side: wrongDish can't apply, so the defect fizzles.
          if (spec.menuId === 'side_fries') expect(plateError(ctx, spec, build)).toBeNull();
          else expect(plateError(ctx, spec, build), `${spec.menuId} ${kind}`).not.toBeNull();
        }
      }
    }
  });

  it('classifies errors', () => {
    const spec = { menuId: 'burger', mods: ['medium', 'no_onion', 'fries'] };
    expect(plateError(ctx, spec, { menuId: 'strip', mods: [] })).toBe('wrongDish');
    expect(plateError(ctx, spec, { menuId: 'burger', mods: ['rare', 'no_onion', 'fries'] })).toBe(
      'wrongDoneness',
    );
    expect(plateError(ctx, spec, { menuId: 'burger', mods: ['medium', 'no_onion'] })).toBe(
      'missingComponent',
    );
    expect(plateError(ctx, spec, { menuId: 'burger', mods: ['medium', 'fries'] })).toBe('wrongMod');
    expect(plateError(ctx, spec, { menuId: 'burger', mods: ['medium', 'no_onion', 'side_salad'] })).toBe(
      'wrongMod',
    );
  });
});
