/**
 * Fixed-timestep driver (ARCHITECTURE §4). The only place requestAnimationFrame is used.
 * `accumulate` is pure so the timing math is unit-tested; `startLoop` is the thin rAF shell.
 */
export interface LoopTiming {
  tickMs: number;
  maxFrameMs: number;
  maxTicksPerFrame: number;
}

export interface AccumulateResult {
  ticks: number;
  accMs: number;
  /** Sim time thrown away because of the per-frame tick cap. */
  droppedMs: number;
}

export function accumulate(
  accMs: number,
  realDeltaMs: number,
  speed: number,
  t: LoopTiming,
): AccumulateResult {
  const clamped = Math.min(Math.max(realDeltaMs, 0), t.maxFrameMs);
  let acc = accMs + clamped * speed;
  let ticks = Math.floor(acc / t.tickMs);
  acc -= ticks * t.tickMs;
  let droppedMs = 0;
  if (ticks > t.maxTicksPerFrame) {
    droppedMs = (ticks - t.maxTicksPerFrame) * t.tickMs;
    ticks = t.maxTicksPerFrame;
  }
  return { ticks, accMs: acc, droppedMs };
}

export interface LoopHooks {
  timing: LoopTiming;
  getSpeed: () => number;
  isPaused: () => boolean;
  /** Run exactly n sim ticks. */
  runTicks: (n: number) => void;
  /** Called once per animation frame after ticks ran (even if 0). */
  afterFrame: (frame: { realDeltaMs: number; ticks: number }) => void;
}

/** Starts the rAF loop. Returns a stop function. */
export function startLoop(hooks: LoopHooks): () => void {
  let acc = 0;
  let last: number | null = null;
  let handle = 0;
  let running = true;

  const frame = (now: number) => {
    if (!running) return;
    const realDeltaMs = last === null ? 0 : now - last;
    last = now;
    let ticks = 0;
    if (!hooks.isPaused()) {
      const r = accumulate(acc, realDeltaMs, hooks.getSpeed(), hooks.timing);
      acc = r.accMs;
      ticks = r.ticks;
      if (ticks > 0) hooks.runTicks(ticks);
    }
    hooks.afterFrame({ realDeltaMs, ticks });
    handle = requestAnimationFrame(frame);
  };
  handle = requestAnimationFrame(frame);

  return () => {
    running = false;
    cancelAnimationFrame(handle);
  };
}
