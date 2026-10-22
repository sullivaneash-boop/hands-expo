import type { NightId } from '../config/tuning';
import type { CourseKind, InterruptSource, PlateDefectKind, StationId } from '../data/schema';
import type { RngState } from './rng';

/** Independent RNG streams (D-004). Add a stream here when a new system needs randomness. */
export const RNG_STREAMS = ['schedule', 'kitchen', 'defects', 'interrupts'] as const;
export type RngStream = (typeof RNG_STREAMS)[number];

/**
 * 'queued' = fired but waiting for a station slot (D-066). 'cooking' covers on the stove and finished
 * food backed up behind a full pass. 'void' = removed after an 86 (counts as done, no plate).
 */
export type ItemState = 'held' | 'queued' | 'cooking' | 'up' | 'sent' | 'void';

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
  /** ticketLate already emitted for this course. */
  lateNotified: boolean;
  /** Lateness reached full severity (combo penalty applied once). */
  lateMaxed: boolean;
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

/**
 * A fired item's trip through the kitchen (D-066): queued for a slot → cooking → (if the pass is full)
 * waiting behind the window, still aging → lands on the pass as a Plate.
 */
export interface CookJob {
  ticketId: string;
  itemId: string;
  courseIdx: number;
  station: StationId;
  status: 'queued' | 'cooking' | 'waiting';
  /** When the player fired it. */
  firedAtMs: number;
  /** Cook time rolled at fire (tier + mods, jitter, on-the-fly); drag applies when it starts. */
  baseMs: number;
  startedAtMs: number | null;
  /** When it finishes cooking (null while queued). */
  doneAtMs: number | null;
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
  | 'recovery'
  | 'cleanCourse'
  | 'perfectSync'
  | 'save'
  | 'cleanBoard'
  | 'interruptCorrect'
  | 'courseScore'
  | 'wrongModSent'
  | 'wrongDishSent'
  | 'refireUnneeded'
  | 'plateDied'
  | 'incompleteSend'
  | 'landedEarly'
  | 'sentBeforeBar'
  | 'tableComplete'
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
  perfectSyncs: number;
  multiPlateCourses: number;
  /** Items fired by the player (excludes on-the-fly remakes). */
  itemsFired: number;
  overfires: number;
  cleanBoards: number;
  criticals: number;
  heatPeak: number;
  comboMax: number;
  fired86: number;
  allergyIncidents: number;
  checks: number;
  interrupts: Record<InterruptOutcome, number>;
  heatByReason: Partial<Record<ScoreReason, number>>;
  scoreByReason: Partial<Record<ScoreReason, number>>;
}

export interface ShiftSummary {
  outcome: 'won' | 'lost';
  /** Why a lost shift ended. */
  lostBy: 'heat' | 'allergy' | null;
  nightId: NightId;
  seed: number;
  heat: number;
  score: number;
  stars: number;
  grade: string;
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
  /** Service Heat 0..100 (D-067). */
  heat: number;
  /** Set while heat is at max: the shift ends at untilMs unless heat drops below the recover line. */
  critical: { untilMs: number } | null;
  score: number;
  combo: number;
  /** Most tickets on the rail since the last clean board (a clean board needs a rush first). */
  railPeak: number;
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
