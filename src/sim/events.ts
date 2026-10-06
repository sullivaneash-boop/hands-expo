import type { NightId } from '../config/tuning';
import type { PlayerCommand } from './commands';

/** Sim → bus events, emitted per tick (ARCHITECTURE §6). Past tense. */
export type SimEvent =
  | { type: 'shiftStarted'; nightId: NightId; seed: number }
  | { type: 'secondElapsed'; second: number }
  | { type: 'commandRejected'; command: PlayerCommand; reason: string };

export type SimEventType = SimEvent['type'];
export type SimEventOf<T extends SimEventType> = Extract<SimEvent, { type: T }>;
