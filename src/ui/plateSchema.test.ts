import { describe, expect, it } from 'vitest';
import { tuning } from '../config/tuning';
import { content } from '../data';
import type { PlateDefectKind } from '../data/schema';
import { plateError } from '../sim';
import { buildPlate } from '../sim/plates';
import { Rng, seedRng } from '../sim/rng';
import { compareRows, hasMismatch } from './plateSchema';

const ctx = { tuning, content };
const KINDS: (PlateDefectKind | null)[] = [
  null,
  'wrongMod',
  'missingComponent',
  'wrongDoneness',
  'wrongDish',
];

describe('visual check rows agree with the sim', () => {
  it('flags a mismatch exactly when plateError says the plate is wrong (all dishes × defects × seeds)', () => {
    const r = new Rng(seedRng(42));
    let checked = 0;
    for (const m of content.menu) {
      for (let k = 0; k < 30; k++) {
        // a plausible order: legal mods with at most one temp/side
        const mods: string[] = [];
        const kind = (id: string) => content.mods.find((x) => x.id === id)!.kind;
        const temps = m.legalMods.filter((x) => kind(x) === 'doneness');
        const sides = m.legalMods.filter((x) => kind(x) === 'side');
        if (temps.length) mods.push(r.pick(temps));
        if (sides.length && r.chance(0.8)) mods.push(r.pick(sides));
        for (const x of m.legalMods)
          if (['remove', 'add', 'prep'].includes(kind(x)) && r.chance(0.3)) mods.push(x);
        const spec = { menuId: m.id, mods };
        for (const defect of KINDS) {
          for (const needsPick of [false, true]) {
            const build = buildPlate(ctx, spec, defect, r, r.chance(0.5));
            const wrong = plateError(ctx, spec, build, needsPick) !== null;
            expect(hasMismatch(compareRows(spec, build, needsPick)), `${m.id} ${defect} ${needsPick}`).toBe(
              wrong,
            );
            checked++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(2000);
  });

  it('names the problem the way a cook would', () => {
    const order = { menuId: 'burger', mods: ['medium', 'fries', 'no_onion'] };
    const callouts = (made: { menuId: string; mods: string[] }) =>
      compareRows(order, made)
        .filter((r) => !r.match)
        .map((r) => r.callout);
    expect(callouts({ menuId: 'burger', mods: ['medium', 'potato', 'no_onion'] })).toEqual(['WRONG SIDE']);
    expect(callouts({ menuId: 'burger', mods: ['medium', 'no_onion'] })).toEqual(['MISSING SIDE']);
    expect(callouts({ menuId: 'burger', mods: ['rare', 'fries', 'no_onion'] })).toEqual(['WRONG TEMP']);
    expect(callouts({ menuId: 'burger', mods: ['medium', 'fries'] })).toEqual(['MISSED A MOD']);
    expect(compareRows(order, { ...order, allergyPick: false }, true).at(-1)!.callout).toBe(
      'NO ALLERGY PICK',
    );
  });
});
