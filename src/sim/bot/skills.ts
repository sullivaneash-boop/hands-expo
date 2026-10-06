/**
 * Bot skill presets for headless balancing (principle 6). These describe *players*, not the game,
 * so they live with the bot rather than in tuning.ts; balance targets are expressed against them (D-056).
 */
export interface BotSkill {
  name: string;
  /** Time one pass action takes (read + click), ms range. */
  actionMs: readonly [number, number];
  /** Cost of turning between the pass and the door. */
  lookMs: number;
  /** Delay before noticing someone is waiting at the door. */
  doorReactMs: readonly [number, number];
  /** Chance to CHECK a plate before sending it. */
  checkProb: number;
  /** When checking a bad plate, chance to spot the mistake. */
  spotProb: number;
  /** Chance to notice a missing allergy pick (it's visible on the plate chip). */
  pickSpotProb: number;
  /** Chance to answer "where's my table?" correctly from memory. */
  statusAccuracy: number;
  /** Chance per course to stagger fires so plates land together. */
  syncProb: number;
  /** Chance to wait for the fire request on a HOLD course (vs. firing it early). */
  holdDiscipline: number;
  /** Chance to remember to ACK an allergy before firing. */
  ackAllergyProb: number;
  /** Chance to respect a known bar hold. */
  respectBarProb: number;
  /** Send an incomplete course when a plate reaches this fraction of its life (≥1 = never). */
  rescueAt: number;
}

export const BOT_SKILLS: Record<'novice' | 'average' | 'expert', BotSkill> = {
  novice: {
    name: 'novice',
    actionMs: [2_200, 3_600],
    lookMs: 400,
    doorReactMs: [5_000, 10_000],
    checkProb: 0.45,
    spotProb: 0.6,
    pickSpotProb: 0.5,
    statusAccuracy: 0.6,
    syncProb: 0,
    holdDiscipline: 0.6,
    ackAllergyProb: 0.6,
    respectBarProb: 0.5,
    rescueAt: 2,
  },
  average: {
    name: 'average',
    actionMs: [1_400, 2_400],
    lookMs: 300,
    doorReactMs: [2_500, 6_000],
    checkProb: 0.75,
    spotProb: 0.8,
    pickSpotProb: 0.8,
    statusAccuracy: 0.85,
    syncProb: 0.4,
    holdDiscipline: 0.9,
    ackAllergyProb: 0.9,
    respectBarProb: 0.85,
    rescueAt: 0.85,
  },
  expert: {
    name: 'expert',
    actionMs: [800, 1_400],
    lookMs: 200,
    doorReactMs: [1_000, 2_500],
    checkProb: 1,
    spotProb: 0.95,
    pickSpotProb: 1,
    statusAccuracy: 0.97,
    syncProb: 1,
    holdDiscipline: 1,
    ackAllergyProb: 1,
    respectBarProb: 1,
    rescueAt: 0.7,
  },
};
