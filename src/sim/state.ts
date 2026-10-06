import type { NightId } from '../config/tuning';
import type { CourseKind, InterruptSource, PlateDefectKind, StationId } from '../data/schema';
import type { RngState } from './rng';

/** Independent RNG streams (D-004). Add a stream here when a new system needs randomness. */
export const RNG_STREAMS = ['schedule', 'kitchen', 'defects', 'interrupts'] as const;
export type RngStream = (typeof RNG_STREAMS)[number];

/** 'void' = removed from the order after an 86 (counts as done, no plate). */
export type ItemState = 'held' | 'cooking' | 'up' | 'sent' | 'void';

export interface TicketItem {
  /** `${ticketId}.${n}` */
  id: string;
  seat: number | 'share';
  menuId: string;
  mods: readonly string[];
  state: ItemState;
  plateId: string | null;
  /** Pre-rolled defect for the first make (scripted or random). Remakes roll fresh. */
  firstDefect: PlateDefectKind | null;
  /** How many times the kitchen has started this item. */
  makes: number;
  /** The menu item was 86'd while this was still held: must be resolved (sub or void) before firing. */
  eightySixed: boolean;
  /** The current make is an on-the-fly remake. */
  onTheFly: boolean;
}

export interface Course {
  kind: CourseKind;
  /** Printed "HOLD": don't fire until the table is ready. */
  hold: boolean;
  items: TicketItem[];
  /** When the table became ready for this course (print for non-hold; fire request for hold). null = not yet. */
  readyAtMs: number | null;
  /** When this course goes late (ready + grace). null until ready. */
  lateAtMs: number | null;
  /** Whole seconds of lateness already charged to health. */
  lateSecondsCharged: number;
  /** When the last plate of this course went out. */
  sentAtMs: number | null;
  /** The player acknowledged the server's fire request (shows FIRE REQUESTED on the ticket). */
  fireHeard: boolean;
}

export interface Ticket {
  id: string;
  orderNo: number;
  /** 'addon' = a small chit attached to an open table. */
  kind: 'order' | 'addon';
  parentId: string | null;
  table: number;
  server: string;
  guests: number;
  note: string | null;
  printedAtMs: number;
  courses: Course[];
  /** Bad plates that reached the guest from this ticket. */
  escapedErrors: number;
  allergy: { seat: number; allergen: string; acked: boolean } | null;
  /** Hidden effects of door interrupts (applied on arrival). */
  flags: { vip: boolean; pushed: boolean; notBeforeMs: number | null };
  /** What the player has acknowledged at the door (shown as stamps on the ticket). */
  known: { vip: boolean; pushed: boolean; bar: boolean };
}

export interface PlateBuild {
  menuId: string;
  mods: readonly string[];
  /** The kitchen flagged this plate as an allergy plate (the pick / flag in the food). */
  allergyPick: boolean;
}

export interface Plate {
  id: string;
  ticketId: string;
  itemId: string;
  courseIdx: number;
  seat: number | 'share';
  upAtMs: number;
  build: PlateBuild;
  onTheFly: boolean;
}

export interface CookJob {
  ticketId: string;
  itemId: string;
  courseIdx: number;
  station: StationId;
  firedAtMs: number;
  doneAtMs: number;
  defect: PlateDefectKind | null;
  onTheFly: boolean;
  /** Made under allergy protocol (player ACKed before firing). */
  allergyProtocol: boolean;
}

export type StatusAnswer = 'notFired' | 'cooking' | 'partial' | 'window';

export interface ActiveInterrupt {
  id: string;
  defId: string;
  source: InterruptSource;
  ticketId: string;
  table: number;
  /** Server id for server interrupts; 'bar' / 'manager' otherwise. */
  speaker: string;
  lineId: string;
  arrivedAtMs: number;
  expiresAtMs: number;
}

/** A scheduled future happening (e.g. the server asking to fire mains after apps). */
export interface PendingEvent {
  atMs: number;
  defId: string;
  ticketId: string;
}

/** Recent line/POS call-outs, for the "line chatter" readout. */
export interface Bark {
  atMs: number;
  defId: string;
  source: InterruptSource;
  lineId: string;
  vars: Record<string, string | number>;
}

export interface StationState {
  dragMultiplier: number;
  dragUntilMs: number;
}

export type ScoreReason =
  | 'late'
  | 'wrongModSent'
  | 'wrongDishSent'
  | 'refireCorrect'
  | 'refireUnneeded'
  | 'plateDied'
  | 'incompleteSend'
  | 'landedEarly'
  | 'sentBeforeBar'
  | 'tableComplete'
  | 'syncBonus'
  | 'interruptWrong'
  | 'interruptTimeout'
  | 'fired86'
  | 'allergyIncident'
  | 'overtimeLeftover'
  | 'debug';

export type InterruptOutcome = 'correct' | 'wrong' | 'timeout' | 'moot';

export interface ShiftStats {
  ticketsPrinted: number;
  ticketsCleared: number;
  ticketTimeSumMs: number;
  ticketTimeMaxMs: number;
  coursesCompleted: number;
  courseTimeSumMs: number;
  courseTimeMaxMs: number;
  platesSent: number;
  errorsEscaped: number;
  errorsCaught: number;
  refiresUnneeded: number;
  platesDied: number;
  incompleteSends: number;
  earlyLandings: number;
  barViolations: number;
  syncedCourses: number;
  fired86: number;
  allergyIncidents: number;
  checks: number;
  interrupts: Record<InterruptOutcome, number>;
  healthByReason: Partial<Record<ScoreReason, number>>;
}

export interface ShiftSummary {
  outcome: 'won' | 'lost';
  /** Why a lost shift ended. */
  lostBy: 'health' | 'allergy' | null;
  nightId: NightId;
  seed: number;
  health: number;
  score: number;
  grade: string;
  subScores: { health: number; time: number; accuracy: number; pass: number };
  avgTicketMs: number;
  worstTicketMs: number;
  avgCourseMs: number;
  endedAtMs: number;
  ticketsLeft: number;
  stats: ShiftStats;
}

/**
 * The entire game state. Plain, JSON-serializable, updated immutably per entity (ARCHITECTURE §7).
 * Iterate via the *Order arrays, never Object.keys, to stay deterministic.
 */
export interface SimState {
  seed: number;
  nightId: NightId;
  tick: number;
  nowMs: number;
  phase: 'running' | 'overtime' | 'ended';
  rng: Readonly<Record<RngStream, RngState>>;
  ids: { next: number; orderNo: number };
  health: number;
  /** Index of the next unfired shift beat. */
  beatCursor: number;
  /** Next procedural ticket time (null = none tonight / not yet scheduled). */
  nextTicketMs: number | null;
  /** Next procedural arrival per interrupt id, and how many have spawned. */
  procNext: Readonly<Record<string, number>>;
  procCount: Readonly<Record<string, number>>;
  tickets: Readonly<Record<string, Ticket>>;
  railOrder: readonly string[];
  plates: Readonly<Record<string, Plate>>;
  windowOrder: readonly string[];
  cooking: readonly CookJob[];
  stations: Readonly<Record<StationId, StationState>>;
  eighty6: readonly string[];
  interrupts: Readonly<Record<string, ActiveInterrupt>>;
  interruptOrder: readonly string[];
  pending: readonly PendingEvent[];
  barks: readonly Bark[];
  /** Set by an allergy incident on a night where that ends the shift. */
  forcedLoss: 'allergy' | null;
  stats: ShiftStats;
  summary: ShiftSummary | null;
}
