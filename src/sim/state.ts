import type { NightId } from '../config/tuning';
import type { RngState } from './rng';

/** Independent RNG streams (D-004). Add a stream here when a new system needs randomness. */
export const RNG_STREAMS = ['schedule', 'kitchen', 'defects', 'interrupts'] as const;
export type RngStream = (typeof RNG_STREAMS)[number];

/**
 * The entire game state. Plain, JSON-serializable, updated immutably (ARCHITECTURE §7).
 * Phase 1 holds only the clock; tickets/plates/stations/etc. arrive in Phase 2.
 */
export interface SimState {
  seed: number;
  nightId: NightId;
  tick: number;
  nowMs: number;
  phase: 'running' | 'overtime' | 'ended';
  rng: Readonly<Record<RngStream, RngState>>;
}
