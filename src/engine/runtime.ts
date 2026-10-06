/**
 * Wires session + loop + store + bus together. The UI talks to the game only through `engine`.
 */
import { tuning, type NightId } from '../config/tuning';
import { content } from '../data';
import type { PlayerCommand, SimEvent } from '../sim';
import { useGameStore } from '../store/useGameStore';
import { bus } from './bus';
import { startLoop } from './loop';
import { Session } from './session';

const ctx = { tuning, content };

let session: Session | null = null;
let stopLoop: (() => void) | null = null;
let fpsFrames = 0;
let fpsElapsed = 0;

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

export function seedFromUrl(): number | null {
  const raw = new URLSearchParams(window.location.search).get('seed');
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n >>> 0 : null;
}

function publish(events: SimEvent[]): void {
  if (!session) return;
  // Snapshot first, then events, so handlers that read the store see consistent state.
  useGameStore.getState().setSnapshot(session.state);
  for (const e of events) bus.emit(e);
  if (session.state.phase === 'ended') {
    stopLoop?.();
    stopLoop = null;
    useGameStore.getState().setScreen('summary');
  }
}

export const engine = {
  ctx,

  start(nightId: NightId, seed: number = seedFromUrl() ?? randomSeed()): void {
    stopLoop?.();
    session = new Session(seed, nightId, ctx);
    const store = useGameStore.getState();
    store.setSnapshot(session.state);
    store.selectTicket(null);
    store.setView('pass');
    store.setPaused(false);
    store.setScreen('playing');
    stopLoop = startLoop({
      timing: tuning.sim,
      getSpeed: () => useGameStore.getState().speed,
      isPaused: () => useGameStore.getState().paused,
      runTicks: (n) => session && publish(session.advance(n)),
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

  /** Same night, same seed. */
  restart(): void {
    if (session) engine.start(session.state.nightId, session.log.seed);
  },

  quitToTitle(): void {
    stopLoop?.();
    stopLoop = null;
    useGameStore.getState().setScreen('title');
  },

  dispatch(command: PlayerCommand): void {
    session?.dispatch(command);
  },

  /** Debug: run exactly one tick regardless of pause. */
  stepOnce(): void {
    if (session && session.state.phase !== 'ended') publish(session.advance(1));
  },

  /** Debug: jump ahead `ms` of sim time immediately (same result as playing it out with no input). */
  fastForward(ms: number): void {
    if (!session || session.state.phase === 'ended') return;
    publish(session.advance(Math.ceil(ms / tuning.sim.tickMs)));
  },

  get replayLog() {
    return session?.log ?? null;
  },
};
