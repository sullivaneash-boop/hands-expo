import { create } from 'zustand';
import type { SimState } from '../sim';

/**
 * Read-only mirror of the latest sim snapshot + UI-only state (D-001).
 * Components MUST select narrow slices: useGameStore((s) => s.snap?.tick).
 * Only the engine calls setSnapshot.
 */
export interface GameStore {
  snap: SimState | null;
  fps: number;
  speed: number;
  paused: boolean;
  setSnapshot: (snap: SimState) => void;
  setFps: (fps: number) => void;
  setSpeed: (speed: number) => void;
  setPaused: (paused: boolean) => void;
}

export const useGameStore = create<GameStore>()((set) => ({
  snap: null,
  fps: 0,
  speed: 1,
  paused: false,
  setSnapshot: (snap) => set({ snap }),
  setFps: (fps) => set({ fps }),
  setSpeed: (speed) => set({ speed }),
  setPaused: (paused) => set({ paused }),
}));
