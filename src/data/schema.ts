/**
 * Content schemas (ARCHITECTURE §8, D-003). Content files `satisfies` these types.
 * Data only — no logic here. Cross-references are checked by validate.ts.
 */
import type { NightId } from '../config/tuning';

export type StationId = 'grill' | 'saute' | 'pantry';
export type CookTier = 'quick' | 'standard' | 'long';
export type CourseKind = 'app' | 'main' | 'side';
export type ModKind = 'doneness' | 'remove' | 'add' | 'side' | 'prep';
export type PlateDefectKind = 'wrongMod' | 'missingComponent' | 'wrongDoneness' | 'wrongDish';
export type InterruptSource = 'server' | 'manager' | 'bar' | 'kitchen';
export type FeatureFlag = 'courses' | 'addons' | '86' | 'refire' | 'drag' | 'allergy' | 'bar' | 'manager';

export interface MenuItemDef {
  id: string;
  /** ALL CAPS, as printed on the ticket. */
  ticketName: string;
  course: CourseKind;
  station: StationId;
  cookTier: CookTier;
  doneness: boolean;
  defaultSide?: string;
  legalMods: readonly string[];
  allergens: readonly string[];
}

export interface ModDef {
  id: string;
  /** ALL CAPS ticket text. */
  text: string;
  kind: ModKind;
  /** Printed as *** TEXT *** */
  emphasize?: boolean;
  /** Allergens this mod adds to the dish (e.g. ADD SALMON → fish). */
  allergens?: readonly string[];
}

export interface StationDef {
  id: StationId;
  name: string;
}

export interface ServerDef {
  id: string;
  name: string;
}

export interface TicketItemTemplate {
  seat: number | 'share';
  menuId: string;
  mods?: readonly string[];
}

export interface TicketTemplate {
  table: number;
  server: string;
  guests: number;
  note?: string;
  allergy?: { seat: number; allergen: string };
  courses: readonly { kind: CourseKind; hold?: boolean; items: readonly TicketItemTemplate[] }[];
  /** Scripted teaching moment: force a defect on the Nth item (flattened across courses). */
  forceDefect?: { itemIdx: number; defect: PlateDefectKind };
}

export type ShiftBeat =
  | { atMs: number; type: 'ticket'; ticket: TicketTemplate }
  /** `arg`: menu id for kitchen_86, station id for kitchen_drag, menu id for server_addon. */
  | { atMs: number; type: 'interrupt'; interrupt: string; target?: { table: number }; arg?: string };

export interface ShiftDef {
  id: NightId;
  name: string;
  /** One line shown on the title/night select. */
  tagline: string;
  /** 24h hour the wall clock starts at (display only). */
  clockStartHour: number;
  /** Systems the procedural generator may use tonight. Scripted beats always run. */
  features: readonly FeatureFlag[];
  beats: readonly ShiftBeat[];
}

/** Interpreted by sim/systems/interrupts.ts. New variants need sim code (AGENTS.md §4). */
export type InterruptEffect =
  | { kind: 'askStatus' }
  | { kind: 'fireRequest' }
  | { kind: 'addOn'; menuId: string }
  | { kind: 'eightySix' }
  | { kind: 'stationDrag' }
  | { kind: 'kitchenRefire' }
  | { kind: 'notBefore' }
  | { kind: 'push' }
  | { kind: 'vip' };

export interface InterruptDef {
  id: string;
  source: InterruptSource;
  /** Waits at the door for an answer (true) vs. a non-blocking bark from the line/POS (false). */
  blocking: boolean;
  /** Dialogue line ids; one is picked per occurrence. */
  lines: readonly string[];
  choices: 'ticketStatus' | 'heard' | 'none';
  effect: InterruptEffect;
  /** Feature flag that must be on for procedural spawns. */
  feature?: FeatureFlag;
}

export interface DialogueLine {
  id: string;
  /** May contain {table}, {item}, {seat}, {station}. */
  text: string;
  voice?: string;
}

export interface Content {
  menu: readonly MenuItemDef[];
  mods: readonly ModDef[];
  stations: readonly StationDef[];
  allergens: readonly string[];
  servers: readonly ServerDef[];
  interrupts: readonly InterruptDef[];
  dialogue: readonly DialogueLine[];
  shifts: readonly ShiftDef[];
}
