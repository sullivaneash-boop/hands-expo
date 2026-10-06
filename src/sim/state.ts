import type { NightId } from '../config/tuning';
import type { CourseKind, InterruptSource, PlateDefectKind, StationId } from '../data/schema';
import type { RngState } from './rng';

/** Independent RNG streams (D-004). Add a stream here when a new system needs randomness. */
export const RNG_STREAMS = ['schedule', 'kitchen', 'defects', 'interrupts'] as const;
export type RngStream = (typeof RNG_STREAMS)[number];

export type ItemState = 'held' | 'cooking' | 'up' | 'sent';

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
}

export interface Course {
  kind: CourseKind;
  hold: boolean;
  items: TicketItem[];
}

export interface Ticket {
  id: string;
  orderNo: number;
  table: number;
  server: string;
  guests: number;
  note: string | null;
  printedAtMs: number;
  lateAtMs: number;
  /** Whole seconds of lateness already charged to health. */
  lateSecondsCharged: number;
  courses: Course[];
  /** Bad plates that reached the guest from this ticket. */
  escapedErrors: number;
}

export interface PlateBuild {
  menuId: string;
  mods: readonly string[];
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
}

export type StatusAnswer = 'notFired' | 'cooking' | 'partial' | 'window';

export interface ActiveInterrupt {
  id: string;
  defId: string;
  source: InterruptSource;
  ticketId: string;
  table: number;
  server: string;
  lineId: string;
  arrivedAtMs: number;
  expiresAtMs: number;
}

export type ScoreReason =
  | 'late'
  | 'wrongModSent'
  | 'wrongDishSent'
  | 'refireCorrect'
  | 'refireUnneeded'
  | 'plateDied'
  | 'incompleteSend'
  | 'tableComplete'
  | 'syncBonus'
  | 'interruptWrong'
  | 'interruptTimeout'
  | 'overtimeLeftover'
  | 'debug';

export type InterruptOutcome = 'correct' | 'wrong' | 'timeout' | 'moot';

export interface ShiftStats {
  ticketsPrinted: number;
  ticketsCleared: number;
  ticketTimeSumMs: number;
  ticketTimeMaxMs: number;
  platesSent: number;
  errorsEscaped: number;
  errorsCaught: number;
  refiresUnneeded: number;
  platesDied: number;
  incompleteSends: number;
  syncedCourses: number;
  checks: number;
  interrupts: Record<InterruptOutcome, number>;
  healthByReason: Partial<Record<ScoreReason, number>>;
}

export interface ShiftSummary {
  outcome: 'won' | 'lost';
  nightId: NightId;
  seed: number;
  health: number;
  score: number;
  grade: string;
  subScores: { health: number; time: number; accuracy: number; pass: number };
  avgTicketMs: number;
  worstTicketMs: number;
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
  tickets: Readonly<Record<string, Ticket>>;
  railOrder: readonly string[];
  plates: Readonly<Record<string, Plate>>;
  windowOrder: readonly string[];
  cooking: readonly CookJob[];
  interrupts: Readonly<Record<string, ActiveInterrupt>>;
  interruptOrder: readonly string[];
  stats: ShiftStats;
  summary: ShiftSummary | null;
}
