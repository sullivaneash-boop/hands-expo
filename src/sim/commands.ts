/**
 * Player → sim commands, applied at the start of the next tick (ARCHITECTURE §6).
 * Phase 1 has only a debug no-op; fire/send/refire/check/answer arrive in Phase 2.
 */
export type DebugAction = { kind: 'noop' };

export type PlayerCommand = { type: 'debug'; action: DebugAction };
