import type { NightId } from '../../config/tuning';
import type { SimContext } from '../context';
import { createSim, step } from '../index';
import type { ShiftSummary } from '../state';
import { botInit, botStep } from './bot';
import type { BotSkill } from './skills';

/** Per-shift design metrics from the pressure trace (research 05 validation plan, D-070). */
export interface ShiftMetrics {
  /** Lost after >30 s continuously above 75 heat with less than 10 heat of recovery inside that stretch. */
  deathSpiral: boolean;
  /** Player commands per active minute, excluding pure CHECK reads. */
  decisionsPerMin: number;
  /** Seconds with the pass at ≥ 5 of its spots filled. */
  passPanicSec: number;
  /** Fraction of the shift with combo above 1×. */
  comboUptime: number;
  /** Fires into a full station / all fires. */
  overfireRate: number;
  /** Perfect syncs / complete multi-plate courses. */
  syncConversion: number;
  peakHeat: number;
}

export interface ShiftRun {
  summary: ShiftSummary;
  commands: number;
  metrics: ShiftMetrics;
}

/** Play one whole shift headlessly with the bot. Deterministic for (seed, night, skill, ctx). */
export function runShift(
  ctx: SimContext,
  nightId: NightId,
  seed: number,
  skill: BotSkill,
  maxTicks = 20_000,
): ShiftRun {
  let s = createSim(seed, nightId, ctx);
  let mem = botInit(seed);
  let commands = 0;
  let decisions = 0;
  let ticks = 0;
  let panicTicks = 0;
  let comboTicks = 0;
  // death-spiral tracking: current stretch above 75 and its recovery
  let hotSince: number | null = null;
  let hotPeak = 0;
  let hotRecovery = 0;
  let lastStretch = { ms: 0, recovery: Infinity };
  for (let i = 0; i < maxTicks && s.phase !== 'ended'; i++) {
    const b = botStep(s, mem, ctx, skill);
    mem = b.mem;
    commands += b.commands.length;
    for (const c of b.commands) {
      if (c.type !== 'check') decisions++;
    }
    s = step(s, b.commands, ctx).state;
    ticks++;
    if (s.windowOrder.length >= 5) panicTicks++;
    if (s.combo > ctx.tuning.score.combo.start) comboTicks++;
    if (s.heat > 75) {
      if (hotSince === null) {
        hotSince = s.nowMs;
        hotPeak = s.heat;
        hotRecovery = 0;
      }
      hotPeak = Math.max(hotPeak, s.heat);
      hotRecovery = Math.max(hotRecovery, hotPeak - s.heat);
      lastStretch = { ms: s.nowMs - hotSince, recovery: hotRecovery };
    } else hotSince = null;
  }
  if (!s.summary)
    throw new Error(`shift did not end within ${maxTicks} ticks (night ${nightId}, seed ${seed})`);
  const st = s.stats;
  const minutes = (ticks * ctx.tuning.sim.tickMs) / 60_000;
  const lost = s.summary.outcome === 'lost';
  return {
    summary: s.summary,
    commands,
    metrics: {
      deathSpiral: lost && hotSince !== null && lastStretch.ms > 30_000 && lastStretch.recovery < 10,
      decisionsPerMin: minutes > 0 ? decisions / minutes : 0,
      passPanicSec: (panicTicks * ctx.tuning.sim.tickMs) / 1000,
      comboUptime: ticks > 0 ? comboTicks / ticks : 0,
      overfireRate: st.itemsFired > 0 ? st.overfires / st.itemsFired : 0,
      syncConversion: st.multiPlateCourses > 0 ? st.perfectSyncs / st.multiPlateCourses : 0,
      peakHeat: st.heatPeak,
    },
  };
}
