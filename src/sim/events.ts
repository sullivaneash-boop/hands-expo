import type { NightId } from '../config/tuning';
import type { InterruptSource, StationId } from '../data/schema';
import type { PlayerCommand } from './commands';
import type { PlateErrorKind } from './plates';
import type { InterruptOutcome, ScoreReason, ShiftSummary } from './state';

/** Sim → bus events, emitted per tick (ARCHITECTURE §6). Past tense. */
export type SimEvent =
  | { type: 'shiftStarted'; nightId: NightId; seed: number }
  | { type: 'secondElapsed'; second: number }
  | { type: 'ticketPrinted'; ticketId: string; table: number; lineCount: number; addon: boolean }
  | {
      type: 'itemFired';
      ticketId: string;
      itemId: string;
      station: StationId;
      onTheFly: boolean;
      queued: boolean;
    }
  | { type: 'itemStarted'; ticketId: string; itemId: string; station: StationId }
  | { type: 'plateBackedUp'; ticketId: string; itemId: string }
  | { type: 'plateUp'; plateId: string; ticketId: string; station: StationId }
  | { type: 'plateDied'; plateId: string; ticketId: string }
  | { type: 'plateDropped'; plateId: string; ticketId: string }
  | { type: 'plateRefired'; plateId: string; ticketId: string; correct: boolean }
  | {
      type: 'courseSent';
      ticketId: string;
      courseIdx: number;
      plates: number;
      plateIds: string[];
      errors: PlateErrorKind[];
      complete: boolean;
      synced: boolean;
      early: boolean;
    }
  | {
      type: 'courseScored';
      ticketId: string;
      courseIdx: number;
      table: number;
      plates: number;
      platePoints: number;
      syncPoints: number;
      freshPoints: number;
      /** Landing spread in ms (null for single-plate courses). */
      spreadMs: number | null;
      perfect: boolean;
      clean: boolean;
      multiplier: number;
      total: number;
    }
  | { type: 'courseReady'; ticketId: string; courseIdx: number; heard: boolean }
  | { type: 'ticketCleared'; ticketId: string; table: number; ticketTimeMs: number; clean: boolean }
  | { type: 'ticketLate'; ticketId: string; table: number; courseIdx: number }
  | { type: 'interruptArrived'; interruptId: string; defId: string; source: InterruptSource; table: number }
  | { type: 'interruptResolved'; interruptId: string; defId: string; outcome: InterruptOutcome }
  | { type: 'bark'; defId: string; source: InterruptSource; lineId: string }
  | { type: 'itemEightySixed'; menuId: string; affected: number }
  | { type: 'fired86'; ticketId: string; itemId: string }
  | { type: 'allergyAcked'; ticketId: string }
  | { type: 'allergyIncident'; ticketId: string; table: number }
  | { type: 'itemResolved'; ticketId: string; itemId: string; subMenuId: string | null }
  | { type: 'heatChanged'; delta: number; reason: ScoreReason; heat: number }
  | { type: 'scored'; points: number; reason: ScoreReason; total: number }
  | { type: 'comboChanged'; combo: number; previous: number; reason: string }
  | { type: 'criticalStarted'; untilMs: number }
  | { type: 'criticalEnded' }
  | { type: 'cleanBoard'; bonus: number }
  | { type: 'printerStopped' }
  | { type: 'shiftEnded'; summary: ShiftSummary }
  | { type: 'commandRejected'; command: PlayerCommand; reason: string };

export type SimEventType = SimEvent['type'];
export type SimEventOf<T extends SimEventType> = Extract<SimEvent, { type: T }>;
