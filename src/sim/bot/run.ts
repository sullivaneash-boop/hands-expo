import type { NightId } from '../../config/tuning';
import type { SimContext } from '../context';
import { createSim, step } from '../index';
import type { ShiftSummary } from '../state';
import { botInit, botStep } from './bot';
import type { BotSkill } from './skills';

export interface ShiftRun {
  summary: ShiftSummary;
  commands: number;
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
  for (let i = 0; i < maxTicks && s.phase !== 'ended'; i++) {
    const b = botStep(s, mem, ctx, skill);
    mem = b.mem;
    commands += b.commands.length;
    s = step(s, b.commands, ctx).state;
  }
  if (!s.summary)
    throw new Error(`shift did not end within ${maxTicks} ticks (night ${nightId}, seed ${seed})`);
  return { summary: s.summary, commands };
}
