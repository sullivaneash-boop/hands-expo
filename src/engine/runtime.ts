/**
 * Wires session + loop + store + bus together. The UI talks to the game only through `engine`.
 */
import { tuning, type NightId } from '../config/tuning';
import { content } from '../data';
import type { PlayerCommand } from '../sim';
import { useGameStore } from '../store/useGameStore';
import { bus } from './bus';
import { startLoop } from './loop';
import { Session } from './session';

const ctx = { tuning, content };

let session: Session | null = null;
let stopLoop: (() => void) | null = null;
let fpsFrames = 0;
let fpsElapsed = 0;

function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

function seedFromUrl(): number | null {
  const raw = new URLSearchParams(window.location.search).get('seed');
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n >>> 0 : null;
}

export const engine = {
  start(nightId: NightId, seed: number = seedFromUrl() ?? randomSeed()): void {
    stopLoop?.();
    session = new Session(seed, nightId, ctx);
    useGameStore.getState().setSnapshot(session.state);
    stopLoop = startLoop({
      timing: tuning.sim,
      getSpeed: () => useGameStore.getState().speed,
      isPaused: () => useGameStore.getState().paused,
      runTicks: (n) => {
        if (!session) return;
        const events = session.advance(n);
        // Snapshot first, then events, so handlers that read the store see consistent state.
        useGameStore.getState().setSnapshot(session.state);
        for (const e of events) bus.emit(e);
      },
      afterFrame: ({ realDeltaMs }) => {
        fpsFrames++;
        fpsElapsed += realDeltaMs;
        if (fpsElapsed >= 500) {
          useGameStore.getState().setFps(Math.round((fpsFrames * 1000) / fpsElapsed));
          fpsFrames = 0;
          fpsElapsed = 0;
        }
      },
    });
  },

  stop(): void {
    stopLoop?.();
    stopLoop = null;
  },

  dispatch(command: PlayerCommand): void {
    session?.dispatch(command);
  },

  /** Debug: run exactly one tick regardless of pause. */
  stepOnce(): void {
    if (!session) return;
    const events = session.advance(1);
    useGameStore.getState().setSnapshot(session.state);
    for (const e of events) bus.emit(e);
  },

  get replayLog() {
    return session?.log ?? null;
  },
};
