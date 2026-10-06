/**
 * THE tuning file (principle 3). Every number that affects feel or difficulty lives here.
 * Pure data: no imports, no logic. The sim receives this via ctx so tests/balancer can override it.
 * Values marked "GDD" come from docs/GDD.md §6; they are starting points for Phase 3 balancing.
 */
export const tuning = {
  sim: {
    /** Fixed timestep (D-005). Integer ms. */
    tickMs: 50,
    /** Real-time frame delta is clamped to this before speed is applied (tab-sleep guard). */
    maxFrameMs: 250,
    /** Hard cap on ticks per rendered frame; excess sim time is dropped. */
    maxTicksPerFrame: 60,
  },

  shift: {
    /** Printer-time length per night (D-006). */
    durationMs: { 1: 180_000, 2: 210_000, 3: 240_000, 4: 270_000, 5: 300_000 },
    /** After the printer stops, how long the player may keep clearing the rail. */
    overtimeCapMs: 90_000,
    /** Multiplier on authored beat times (D-026). */
    timeScale: 1,
    /** Wall-clock minutes shown per sim second (display only; 3:00 shift ≈ 4.5 h of service). */
    clockMinutesPerSec: 1.5,
  },

  cook: {
    /** Cook tier → base ms (D-010). */
    tierMs: { quick: 9_000, standard: 15_000, long: 22_000 },
    /** ± fraction of random variation on each cook. */
    jitterPct: 0.1,
    /** Multiplier on cook time for on-the-fly remakes. */
    onTheFlyFactor: 0.6,
    /** Extra ms an allergy-protocol item takes (Phase 3). */
    allergyExtraMs: 4_000,
  },

  pass: {
    /** A plate in the window this long dies (GDD). */
    plateDieMs: 25_000,
    /** All plates of a course landing within this window earn the sync bonus. */
    syncWindowMs: 4_000,
  },

  tickets: {
    /** Grace before a ticket counts as late: base + per item. */
    graceBaseMs: 40_000,
    gracePerItemMs: 6_000,
  },

  score: {
    startHealth: 100,
    maxHealth: 100,
    lateDrainPerSec: 1,
    wrongModSent: -15,
    wrongDishSent: -20,
    refireCorrect: 0,
    refireUnneeded: -3,
    plateDied: -10,
    incompleteSend: -8,
    landedEarly: -5,
    tableComplete: 5,
    syncBonus: 3,
    interruptWrong: -5,
    interruptTimeout: -5,
    fired86: -10,
    allergyIncident: -50,
    overtimeLeftoverPerTicket: -10,
    /** Final 0–100 score = weighted blend of sub-scores (GDD §6 summary). */
    final: {
      healthWeight: 0.4,
      timeWeight: 0.25,
      accuracyWeight: 0.25,
      passWeight: 0.1,
      /** Average ticket time that scores 100 on Ticket Time; 2× this scores 0. */
      targetTicketMs: 45_000,
      /** Pass Control loses this much per dead plate / incomplete send / early landing. */
      deadPlateCost: 15,
      incompleteSendCost: 10,
    },
    /** Final score (0–100) → grade, highest band first. */
    gradeBands: [
      { min: 90, grade: 'A' },
      { min: 80, grade: 'B' },
      { min: 65, grade: 'C' },
      { min: 50, grade: 'D' },
      { min: 0, grade: 'F' },
    ],
  },

  defects: {
    /** Chance an item's plate comes out wrong, per night. */
    ratePerNight: { 1: 0.08, 2: 0.1, 3: 0.12, 4: 0.14, 5: 0.16 },
    /** Relative weights of defect kinds. */
    kindWeights: { wrongMod: 5, missingComponent: 3, wrongDoneness: 3, wrongDish: 1 },
    /** On-the-fly remakes are more careful. */
    onTheFlyRateFactor: 0.5,
  },

  interrupts: {
    patienceMs: { server: 12_000, manager: 10_000, bar: 12_000 },
  },

  /** Random ticket generator (debug spawn now; Phase 3 procedural waves). */
  generate: {
    guestWeights: { 1: 3, 2: 4, 3: 2, 4: 1 },
    /** Chance each eligible optional mod (remove/add/prep) is added, up to maxExtraMods. */
    extraModChance: 0.3,
    maxExtraMods: 2,
    /** Chance the side is swapped from the item's default. */
    sideSwapChance: 0.25,
    tableRange: [1, 60],
  },

  debug: {
    speeds: [0.5, 1, 2, 5, 10],
  },
} as const;

/** Widen literal types so tests/balancer can pass overrides (`{ ...tuning, cook: { ...tuning.cook, jitterPct: 0 } }`). */
type Widen<T> = T extends number
  ? number
  : T extends string
    ? string
    : T extends readonly (infer U)[]
      ? readonly Widen<U>[]
      : T extends object
        ? { readonly [K in keyof T]: Widen<T[K]> }
        : T;

export type Tuning = Widen<typeof tuning>;
export type NightId = keyof (typeof tuning)['shift']['durationMs'];
