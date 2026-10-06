import type { PlateDefectKind } from '../data/schema';
import type { SimContext } from './context';
import { menuDef, modDef } from './lookup';
import type { Rng } from './rng';
import type { PlateBuild } from './state';

export interface ItemSpec {
  menuId: string;
  mods: readonly string[];
}

/** Everything that can be wrong with a plate. 'noAllergyPick' = allergy seat without the allergy flag. */
export type PlateErrorKind = PlateDefectKind | 'noAllergyPick';

const FALLBACK: Record<PlateDefectKind, PlateDefectKind | null> = {
  wrongDoneness: 'wrongMod',
  missingComponent: 'wrongMod',
  wrongMod: 'wrongDish',
  wrongDish: null,
};

/**
 * What the kitchen actually puts on the plate: the spec, altered by `defect` if any.
 * If a defect kind can't apply to this item it falls back (FALLBACK chain); a defect may fizzle (D-037).
 */
export function buildPlate(
  ctx: SimContext,
  spec: ItemSpec,
  defect: PlateDefectKind | null,
  rng: Rng,
  allergyPick = false,
): PlateBuild {
  let kind = defect;
  while (kind) {
    const build = tryDefect(ctx, spec, kind, rng);
    if (build) return { ...build, allergyPick };
    kind = FALLBACK[kind];
  }
  return { menuId: spec.menuId, mods: [...spec.mods], allergyPick };
}

function tryDefect(
  ctx: SimContext,
  spec: ItemSpec,
  kind: PlateDefectKind,
  rng: Rng,
): Omit<PlateBuild, 'allergyPick'> | null {
  const def = menuDef(ctx, spec.menuId);
  const kindOf = (id: string) => modDef(ctx, id).kind;
  const mods = [...spec.mods];

  switch (kind) {
    case 'wrongDoneness': {
      if (!def.doneness) return null;
      const current = mods.find((m) => kindOf(m) === 'doneness');
      const options = def.legalMods.filter((m) => kindOf(m) === 'doneness' && m !== current);
      if (options.length === 0) return null;
      const replacement = rng.pick(options);
      const idx = current ? mods.indexOf(current) : -1;
      if (idx >= 0) mods[idx] = replacement;
      else mods.unshift(replacement);
      return { menuId: spec.menuId, mods };
    }
    case 'missingComponent': {
      const side = mods.find((m) => kindOf(m) === 'side');
      if (!side) return null;
      return { menuId: spec.menuId, mods: mods.filter((m) => m !== side) };
    }
    case 'wrongMod': {
      const optional = (m: string) => ['remove', 'add', 'prep'].includes(kindOf(m));
      const present = mods.filter(optional);
      if (present.length > 0) {
        const drop = rng.pick(present);
        return { menuId: spec.menuId, mods: mods.filter((m) => m !== drop) };
      }
      const addable = def.legalMods.filter((m) => optional(m) && !mods.includes(m));
      if (addable.length === 0) return null;
      return { menuId: spec.menuId, mods: [...mods, rng.pick(addable)] };
    }
    case 'wrongDish': {
      const others = ctx.content.menu.filter((m) => m.course === def.course && m.id !== def.id);
      if (others.length === 0) return null;
      const other = rng.pick(others);
      return { menuId: other.id, mods: other.defaultSide ? [other.defaultSide] : [] };
    }
  }
}

/**
 * Compare what was ordered with what was made. null = correct plate.
 * `needsPick`: this plate is for the allergy seat; missing the allergy pick outranks every other error.
 */
export function plateError(
  ctx: SimContext,
  spec: ItemSpec,
  build: PlateBuild,
  needsPick = false,
): PlateErrorKind | null {
  if (needsPick && !build.allergyPick) return 'noAllergyPick';
  if (spec.menuId !== build.menuId) return 'wrongDish';
  const missing = spec.mods.filter((m) => !build.mods.includes(m));
  const extra = build.mods.filter((m) => !spec.mods.includes(m));
  if (missing.length === 0 && extra.length === 0) return null;
  const kinds = [...missing, ...extra].map((m) => modDef(ctx, m).kind);
  if (kinds.includes('doneness')) return 'wrongDoneness';
  if (extra.length === 0 && missing.every((m) => modDef(ctx, m).kind === 'side')) return 'missingComponent';
  return 'wrongMod';
}

/** Roll whether a make comes out wrong, and how. */
export function rollDefect(ctx: SimContext, rate: number, rng: Rng): PlateDefectKind | null {
  if (!rng.chance(rate)) return null;
  return rng.weighted(ctx.tuning.defects.kindWeights as Record<PlateDefectKind, number>);
}

/** Cook time for one make (ms, before drag/jitter): tier + per-mod deltas (D-053). */
export function baseCookMs(ctx: SimContext, spec: ItemSpec): number {
  const { cook } = ctx.tuning;
  const deltas = cook.modDeltaMs as Readonly<Record<string, number>>;
  const def = menuDef(ctx, spec.menuId);
  return cook.tierMs[def.cookTier] + spec.mods.reduce((sum, m) => sum + (deltas[m] ?? 0), 0);
}
