/**
 * PlateSchema (research 05 §Visual CHECK, D-072): ordered vs. made, decomposed into aligned rows
 * (dish · temp · side · removals · additions · prep · allergy pick). The player compares row by row
 * and taps the one that doesn't match. Pure; mirrors the sim's plateError so the UI can't disagree.
 */
import { content } from '../data';
import type { ModKind } from '../data/schema';

export type SlotKey = 'dish' | 'temp' | 'side' | 'remove' | 'add' | 'prep' | 'allergy';

export interface Token {
  id: string;
  icon: string | null;
  text: string;
}

export interface Row {
  slot: SlotKey;
  label: string;
  ordered: Token[];
  made: Token[];
  match: boolean;
  /** Shown when the player correctly circles this row. */
  callout: string;
}

interface Spec {
  menuId: string;
  mods: readonly string[];
}

const menuById = new Map(content.menu.map((m) => [m.id, m]));
const modById = new Map(content.mods.map((m) => [m.id, m]));

const SLOT_LABEL: Record<SlotKey, string> = {
  dish: 'DISH',
  temp: 'TEMP',
  side: 'SIDE',
  remove: 'NO',
  add: 'ADD',
  prep: 'PREP',
  allergy: 'ALLERGY',
};

const KIND_SLOT: Record<ModKind, SlotKey> = {
  doneness: 'temp',
  side: 'side',
  remove: 'remove',
  add: 'add',
  prep: 'prep',
};

function tokensFor(spec: Spec, slot: SlotKey): Token[] {
  if (slot === 'dish') {
    const m = menuById.get(spec.menuId);
    return [{ id: spec.menuId, icon: m?.icon ?? null, text: m?.ticketName ?? spec.menuId.toUpperCase() }];
  }
  return spec.mods
    .flatMap((id) => {
      const m = modById.get(id);
      return m && KIND_SLOT[m.kind] === slot ? [{ id: m.id, icon: m.icon ?? null, text: m.text }] : [];
    })
    .sort((a, b) => (a.id < b.id ? -1 : 1));
}

const sameSet = (a: Token[], b: Token[]) =>
  a.length === b.length && a.every((t) => b.some((u) => u.id === t.id));

function callout(slot: SlotKey, ordered: Token[], made: Token[]): string {
  switch (slot) {
    case 'dish':
      return 'WRONG DISH';
    case 'temp':
      return 'WRONG TEMP';
    case 'side':
      return made.length === 0 ? 'MISSING SIDE' : 'WRONG SIDE';
    case 'remove':
      return 'MISSED A MOD';
    case 'add':
      return made.length < ordered.length ? 'MISSING ADD' : 'WRONG ADD';
    case 'prep':
      return 'WRONG PREP';
    case 'allergy':
      return 'NO ALLERGY PICK';
  }
}

/** Rows for the check card. Slots that are empty on both sides are omitted (except the dish). */
export function compareRows(ordered: Spec, made: Spec & { allergyPick?: boolean }, needsPick = false): Row[] {
  const rows: Row[] = [];
  for (const slot of ['dish', 'temp', 'side', 'remove', 'add', 'prep'] as const) {
    const o = tokensFor(ordered, slot);
    const m = tokensFor(made, slot);
    if (slot !== 'dish' && o.length === 0 && m.length === 0) continue;
    const match = sameSet(o, m);
    rows.push({
      slot,
      label: SLOT_LABEL[slot],
      ordered: o,
      made: m,
      match,
      callout: match ? '' : callout(slot, o, m),
    });
  }
  if (needsPick) {
    const pick: Token = { id: 'pick', icon: 'shield', text: 'ALLERGY PICK' };
    const has = made.allergyPick === true;
    rows.push({
      slot: 'allergy',
      label: SLOT_LABEL.allergy,
      ordered: [pick],
      made: has ? [pick] : [],
      match: has,
      callout: has ? '' : callout('allergy', [pick], []),
    });
  }
  return rows;
}

export const hasMismatch = (rows: Row[]) => rows.some((r) => !r.match);
