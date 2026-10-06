import type { NightId } from '../config/tuning';
import { createSim, step, type PlayerCommand, type SimContext, type SimEvent, type SimState } from '../sim';

export interface ReplayLog {
  seed: number;
  nightId: NightId;
  /** [tick at which the command was applied, command] */
  commands: [number, PlayerCommand][];
}

/**
 * Owns one running sim. Queues player commands, applies them on the next tick,
 * and records them so a shift can be replayed exactly (ARCHITECTURE §5).
 */
export class Session {
  state: SimState;
  readonly log: ReplayLog;
  private queue: PlayerCommand[] = [];

  constructor(
    seed: number,
    nightId: NightId,
    private readonly ctx: SimContext,
  ) {
    this.state = createSim(seed, nightId);
    this.log = { seed: this.state.seed, nightId, commands: [] };
  }

  dispatch(command: PlayerCommand): void {
    this.queue.push(command);
  }

  /** Run n ticks; returns all events in order. */
  advance(n: number): SimEvent[] {
    const events: SimEvent[] = [];
    for (let i = 0; i < n; i++) {
      const commands = this.queue;
      this.queue = [];
      for (const c of commands) this.log.commands.push([this.state.tick, c]);
      const r = step(this.state, commands, this.ctx);
      this.state = r.state;
      for (const e of r.events) events.push(e);
    }
    return events;
  }
}

/** Re-run a recorded shift headlessly to `untilTick`. */
export function replay(log: ReplayLog, ctx: SimContext, untilTick: number): SimState {
  let state = createSim(log.seed, log.nightId);
  let ci = 0;
  while (state.tick < untilTick) {
    const cmds: PlayerCommand[] = [];
    for (let entry = log.commands[ci]; entry && entry[0] === state.tick; entry = log.commands[++ci])
      cmds.push(entry[1]);
    state = step(state, cmds, ctx).state;
  }
  return state;
}
