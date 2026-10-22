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
    overtimeCapMs: 150_000,
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
    /** A plate in the window (or backed up behind it) this long dies (GDD). */
    plateDieMs: 30_000,
    /** Plate spots on the pass; when full, finished food waits behind the window and keeps aging (D-066). */
    spots: 6,
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
    /** Cook slots per station; extra fires queue FIFO, on-the-fly remakes jump the queue (D-066). */
    slots: { grill: 3, saute: 2, pantry: 2 },
    /** A dragging station loses this many slots (min 1) and cooks this much slower, for dragMs. */
    dragSlotPenalty: 1,
    dragMultiplier: 1.25,
    dragMs: 30_000,
  },

  bar: {
    /** "Hold their food": sending before this long after the bar's warning costs sentBeforeBar. */
    delayMs: 25_000,
  },

  manager: {
    /** "Push 14": its live courses go late at most this soon, and weigh more in late heat. */
    pushGraceMs: 20_000,
    pushSeverityMultiplier: 1.5,
    /** "VIP on 8": bad plates sent to this table cost this many times more heat. */
    vipPenaltyMultiplier: 2,
  },

  allergy: {
    /** Chance the kitchen forgets the allergy pick even though the player ACKed (kitchen error). */
    pickMissRatePerNight: { 1: 0, 2: 0, 3: 0, 4: 0.05, 5: 0.1 },
    /** Nights on which an allergy incident ends the shift immediately (GDD §6). */
    incidentEndsShift: { 1: false, 2: false, 3: false, 4: false, 5: true },
  },

  /**
   * Service Heat (D-067): 0 = composed, 100 = meltdown. Late courses add heat at a capped rate
   * (root-sum-square of their severities); everything else is an event. Negative = relief.
   * Hitting 100 starts a critical window; drop below criticalRecoverBelow in time or the shift ends.
   */
  heat: {
    initial: 10,
    max: 100,
    lateRampMs: 12_000,
    lateRate: 1.25,
    maxLateRate: 3,
    passiveRecoveryPerSec: 0.5,
    wrongModSent: 18,
    wrongDishSent: 25,
    refireUnneeded: 4,
    plateDied: 12,
    incompleteSend: 8,
    landedEarly: 6,
    sentBeforeBar: 6,
    interruptWrong: 6,
    interruptTimeout: 6,
    fired86: 12,
    allergyIncident: 70,
    overtimeLeftoverPerTicket: 10,
    cleanCourse: -5,
    perfectSync: -4,
    caughtDefect: -2,
    cleanBoard: -10,
    interruptCorrect: -1,
    criticalRecoverBelow: 90,
    criticalGraceMs: 10_000,
  },

  /** Score (D-068): rewards synchronized, fresh, clean service, multiplied by the clean-service combo. */
  score: {
    platePoints: 100,
    syncPoints: 250,
    freshPoints: 150,
    /** Landing spread at which sync quality reaches 0; at or under perfectSyncMs it's a PERFECT table. */
    syncWindowMs: 6_000,
    perfectSyncMs: 2_000,
    perfectSyncBonus: 150,
    saveBonus: 75,
    tableComplete: 100,
    cleanBoardBonus: 500,
    /** A clean board only counts after a rush: the rail held at least this many tickets since the last one. */
    cleanBoardMinRail: 3,
    interruptCorrect: 50,
    combo: { start: 1, step: 0.25, max: 3, deadPlate: 0.5, seriouslyLate: 0.25, early: 0.25 },
  },

  /** Score needed for 1 / 2 / 3 stars per night (calibrated with the bot, D-069). Lost shifts get 0. */
  stars: {
    1: [5_000, 6_500, 8_000],
    2: [12_000, 17_500, 21_000],
    3: [13_000, 19_500, 23_500],
    4: [7_000, 16_000, 19_500],
    5: [5_500, 14_000, 17_500],
  },

  defects: {
    /** Chance an item's plate comes out wrong, per night. */
    ratePerNight: { 1: 0.08, 2: 0.1, 3: 0.12, 4: 0.14, 5: 0.14 },
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
        { untilMs: 90_000, gapMs: [18_000, 24_000] },
        { untilMs: 130_000, gapMs: [11_000, 14_000] },
        { untilMs: 150_000, gapMs: [0, 0] },
        { untilMs: 210_000, gapMs: [10_000, 13_000] },
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
        { untilMs: 60_000, gapMs: [17_000, 21_000] },
        { untilMs: 130_000, gapMs: [10_000, 13_000] },
        { untilMs: 160_000, gapMs: [0, 0] },
        { untilMs: 240_000, gapMs: [9_500, 12_500] },
      ],
      twoCourseChance: 0.45,
      allergyChance: 0,
      interrupts: {
        server_status: { firstMs: [40_000, 60_000], everyMs: [50_000, 70_000], max: 3 },
        server_addon: { firstMs: [70_000, 110_000], everyMs: [60_000, 90_000], max: 2 },
        kitchen_refire: { firstMs: [120_000, 150_000], everyMs: [70_000, 90_000], max: 1 },
        kitchen_86: quiet,
      },
    },
    4: {
      firstTicketMs: 8_000,
      segments: [
        { untilMs: 60_000, gapMs: [16_000, 20_000] },
        { untilMs: 150_000, gapMs: [12_500, 15_500] },
        { untilMs: 175_000, gapMs: [0, 0] },
        { untilMs: 270_000, gapMs: [11_500, 14_500] },
      ],
      twoCourseChance: 0.4,
      allergyChance: 0.15,
      interrupts: {
        server_status: { firstMs: [30_000, 50_000], everyMs: [50_000, 70_000], max: 3 },
        server_addon: { firstMs: [60_000, 90_000], everyMs: [70_000, 90_000], max: 2 },
        kitchen_refire: { firstMs: [90_000, 130_000], everyMs: [70_000, 90_000], max: 1 },
        kitchen_drag: { firstMs: [100_000, 140_000], everyMs: [80_000, 100_000], max: 1 },
        kitchen_86: { firstMs: [120_000, 180_000], everyMs: [60_000, 60_000], max: 1 },
        bar_delay: { firstMs: [50_000, 80_000], everyMs: [70_000, 90_000], max: 1 },
      },
    },
    5: {
      firstTicketMs: 6_000,
      segments: [
        { untilMs: 70_000, gapMs: [18_000, 22_000] },
        { untilMs: 170_000, gapMs: [15_000, 18_000] },
        { untilMs: 195_000, gapMs: [0, 0] },
        { untilMs: 300_000, gapMs: [13_000, 16_000] },
      ],
      twoCourseChance: 0.3,
      allergyChance: 0.15,
      interrupts: {
        server_status: { firstMs: [30_000, 45_000], everyMs: [70_000, 90_000], max: 2 },
        server_addon: { firstMs: [60_000, 90_000], everyMs: [70_000, 90_000], max: 1 },
        kitchen_refire: { firstMs: [90_000, 120_000], everyMs: [70_000, 90_000], max: 1 },
        kitchen_drag: { firstMs: [80_000, 120_000], everyMs: [80_000, 100_000], max: 1 },
        kitchen_86: { firstMs: [100_000, 160_000], everyMs: [70_000, 90_000], max: 1 },
        bar_delay: { firstMs: [60_000, 90_000], everyMs: [60_000, 80_000], max: 1 },
        manager_push: { firstMs: [110_000, 150_000], everyMs: [70_000, 90_000], max: 1 },
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
