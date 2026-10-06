/**
 * Player → sim commands, applied at the start of the next tick, in order (ARCHITECTURE §6).
 * Invalid commands are ignored and emit `commandRejected`; they never throw.
 */
export type DebugAction =
  | { kind: 'noop' }
  /** Print a random valid ticket now. */
  | { kind: 'spawnTicket' }
  /** Trigger an interrupt now (random live ticket if no table given). */
  | { kind: 'triggerInterrupt'; interrupt: string; table?: number }
  | { kind: 'setHealth'; health: number };

export type PlayerCommand =
  /** Fire a whole course, or one item when itemId is given. */
  | { type: 'fire'; ticketId: string; courseIdx: number; itemId?: string }
  /** Send ("HANDS!") every plate of this course that is in the window. */
  | { type: 'send'; ticketId: string; courseIdx: number }
  /** Reject a plate: bin it and remake the item on the fly. */
  | { type: 'refire'; plateId: string }
  /** Player opened a plate's build card (metrics only; no rule effect). */
  | { type: 'check'; plateId: string }
  | { type: 'answer'; interruptId: string; choice: string }
  | { type: 'debug'; action: DebugAction };
