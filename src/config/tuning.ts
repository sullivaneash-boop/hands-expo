/**
 * THE tuning file (principle 3). Every number that affects feel or difficulty lives here.
 * Pure data: no imports, no logic. The sim receives this via ctx so tests/balancer can override it.
 * Values marked "GDD" come from docs/GDD.md §6; Phase 3 balancing changes are logged in DECISIONS.md.
 */

/** A per-night procedural profile (D-026: shift files hold content, this holds the numbers). */
const quiet = { firstMs: [0, 0], everyMs: [0, 0], max: 0 };

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
    /** Cook tier → base ms (D-010). A "long" item is the NY strip at MEDIUM; half chicken matches it. */
    tierMs: { quick: 9_000, standard: 15_000, long: 22_000 },
    /**
     * Per-modifier cook-time change, keyed by mod id (owner playtest, D-053). Applies to any item:
     * doneness moves steak/burger temps; protein add-ons make a salad take longer.
     */
    modDeltaMs: {
      rare: -3_000,
      med_rare: -1_500,
      medium: 0,
      med_well: 3_000,
      well_done: 5_000,
      add_chicken: 7_000,
      add_salmon: 6_000,
      add_steak: 8_000,
    },
    /** ± fraction of random variation on each cook. */
    jitterPct: 0.1,
    /** Multiplier on cook time for on-the-fly remakes. */
    onTheFlyFactor: 0.6,
    /** Extra ms an allergy-protocol item takes. */
    allergyExtraMs: 4_000,
  },

  pass: {
    /** A plate in the window this long dies (GDD). */
    plateDieMs: 25_000,
    /** All plates of a course landing within this window earn the sync bonus. */
    syncWindowMs: 4_000,
  },

  tickets: {
    /** Grace before a course counts as late, from when it's ready: base + per item. */
    graceBaseMs: 40_000,
    gracePerItemMs: 6_000,
  },

  courses: {
    /** After a course is sent, the guests eat for this long before the server asks to fire the next. */
    eatMs: [14_000, 22_000],
  },

  kitchen: {
    /** A dragging station cooks this much slower (in-progress jobs stretch too). */
    dragMultiplier: 1.5,
    dragMs: 30_000,
  },

  bar: {
    /** "Hold their food": sending before this long after the bar's warning costs sentBeforeBar. */
    delayMs: 25_000,
  },

  manager: {
    /** "Push 14": its live courses go late at most this soon, and drain faster. */
    pushGraceMs: 12_000,
    pushDrainMultiplier: 2,
    /** "VIP on 8": bad plates sent to this table cost this many times more. */
    vipPenaltyMultiplier: 2,
  },

  allergy: {
    /** Chance the kitchen forgets the allergy pick even though the player ACKed (kitchen error). */
    pickMissRatePerNight: { 1: 0, 2: 0, 3: 0, 4: 0.05, 5: 0.1 },
    /** Nights on which an allergy incident ends the shift immediately (GDD §6). */
    incidentEndsShift: { 1: false, 2: false, 3: false, 4: false, 5: true },
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
    sentBeforeBar: -5,
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
      /** Average course time (ready → sent) that scores 100 on Ticket Time; 2× this scores 0. */
      targetCourseMs: 45_000,
      /** Pass Control loses this much per dead plate / incomplete send / early landing. */
      deadPlateCost: 15,
      incompleteSendCost: 10,
      earlyLandingCost: 10,
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
    /** Procedural door interrupts wait this long if this many people are already at the door. */
    maxAtDoor: 2,
    doorBusyRetryMs: 4_000,
  },

  /** Random ticket generator (debug spawn + procedural waves). */
  generate: {
    guestWeights: { 1: 3, 2: 4, 3: 2, 4: 1 },
    /** Chance each eligible optional mod (remove/add/prep) is added, up to maxExtraMods. */
    extraModChance: 0.3,
    maxExtraMods: 2,
    /** Chance the side is swapped from the item's default. */
    sideSwapChance: 0.25,
    /** In a two-course ticket: one app per this many guests (rounded up). */
    guestsPerApp: 2,
    tableRange: [1, 60],
  },

  /**
   * Per-night procedural profiles. `segments` set the gap between printed tickets until `untilMs`
   * (a [0,0] gap = quiet, nothing prints). Interrupt schedules: first arrival in `firstMs`, then every
   * `everyMs`, at most `max` times. Shift files decide which features are on (D-026).
   */
  nights: {
    1: {
      firstTicketMs: 0,
      segments: [],
      twoCourseChance: 0,
      allergyChance: 0,
      interrupts: {},
    },
    2: {
      firstTicketMs: 28_000,
      segments: [
        { untilMs: 90_000, gapMs: [16_000, 22_000] },
        { untilMs: 130_000, gapMs: [10_000, 14_000] },
        { untilMs: 150_000, gapMs: [0, 0] },
        { untilMs: 210_000, gapMs: [9_000, 13_000] },
      ],
      twoCourseChance: 0.6,
      allergyChance: 0,
      interrupts: {
        server_status: { firstMs: [60_000, 80_000], everyMs: [45_000, 65_000], max: 3 },
      },
    },
    3: {
      firstTicketMs: 10_000,
      segments: [
        { untilMs: 60_000, gapMs: [14_000, 18_000] },
        { untilMs: 130_000, gapMs: [8_000, 12_000] },
        { untilMs: 160_000, gapMs: [0, 0] },
        { untilMs: 240_000, gapMs: [7_000, 10_000] },
      ],
      twoCourseChance: 0.5,
      allergyChance: 0,
      interrupts: {
        server_status: { firstMs: [40_000, 60_000], everyMs: [40_000, 60_000], max: 4 },
        server_addon: { firstMs: [70_000, 110_000], everyMs: [50_000, 80_000], max: 2 },
        kitchen_refire: { firstMs: [120_000, 150_000], everyMs: [60_000, 90_000], max: 2 },
        kitchen_86: quiet,
      },
    },
    4: {
      firstTicketMs: 8_000,
      segments: [
        { untilMs: 60_000, gapMs: [12_000, 16_000] },
        { untilMs: 150_000, gapMs: [7_000, 10_000] },
        { untilMs: 175_000, gapMs: [0, 0] },
        { untilMs: 270_000, gapMs: [6_000, 9_000] },
      ],
      twoCourseChance: 0.5,
      allergyChance: 0.15,
      interrupts: {
        server_status: { firstMs: [30_000, 50_000], everyMs: [35_000, 50_000], max: 5 },
        server_addon: { firstMs: [60_000, 90_000], everyMs: [50_000, 70_000], max: 3 },
        kitchen_refire: { firstMs: [90_000, 130_000], everyMs: [60_000, 80_000], max: 2 },
        kitchen_drag: { firstMs: [100_000, 140_000], everyMs: [70_000, 90_000], max: 2 },
        kitchen_86: { firstMs: [120_000, 180_000], everyMs: [60_000, 60_000], max: 1 },
        bar_delay: { firstMs: [50_000, 80_000], everyMs: [60_000, 90_000], max: 2 },
      },
    },
    5: {
      firstTicketMs: 6_000,
      segments: [
        { untilMs: 50_000, gapMs: [10_000, 13_000] },
        { untilMs: 170_000, gapMs: [6_000, 9_000] },
        { untilMs: 195_000, gapMs: [0, 0] },
        { untilMs: 300_000, gapMs: [5_000, 8_000] },
      ],
      twoCourseChance: 0.55,
      allergyChance: 0.2,
      interrupts: {
        server_status: { firstMs: [25_000, 40_000], everyMs: [30_000, 45_000], max: 6 },
        server_addon: { firstMs: [50_000, 80_000], everyMs: [45_000, 65_000], max: 3 },
        kitchen_refire: { firstMs: [70_000, 100_000], everyMs: [50_000, 70_000], max: 3 },
        kitchen_drag: { firstMs: [80_000, 120_000], everyMs: [60_000, 80_000], max: 2 },
        kitchen_86: { firstMs: [100_000, 160_000], everyMs: [70_000, 90_000], max: 2 },
        bar_delay: { firstMs: [40_000, 70_000], everyMs: [50_000, 70_000], max: 3 },
        manager_push: { firstMs: [110_000, 150_000], everyMs: [60_000, 80_000], max: 2 },
        manager_vip: quiet,
      },
    },
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
    : T extends boolean
      ? boolean
      : T extends readonly (infer U)[]
        ? readonly Widen<U>[]
        : T extends object
          ? { readonly [K in keyof T]: Widen<T[K]> }
          : T;

export type NightId = keyof (typeof tuning)['shift']['durationMs'];

/** Night profiles are typed by the shared NightProfile shape so overrides can drop or add interrupts. */
export type Tuning = Omit<Widen<typeof tuning>, 'nights'> & {
  readonly nights: Readonly<Record<NightId, NightProfile>>;
};

export interface InterruptSchedule {
  readonly firstMs: readonly number[];
  readonly everyMs: readonly number[];
  readonly max: number;
}
export interface NightProfile {
  readonly firstTicketMs: number;
  readonly segments: readonly { readonly untilMs: number; readonly gapMs: readonly number[] }[];
  readonly twoCourseChance: number;
  readonly allergyChance: number;
  readonly interrupts: Readonly<Record<string, InterruptSchedule>>;
}
