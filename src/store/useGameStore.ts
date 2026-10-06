import { create } from 'zustand';
import type { SimState } from '../sim';

export type Screen = 'title' | 'playing' | 'summary';
export type View = 'pass' | 'floor';

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
  screen: Screen;
  view: View;
  selectedTicketId: string | null;
  selectedPlateId: string | null;
  debugOpen: boolean;
  /** Debug: outline wrong plates (omniscient). */
  revealDefects: boolean;
  muted: boolean;

  setSnapshot: (snap: SimState) => void;
  setFps: (fps: number) => void;
  setSpeed: (speed: number) => void;
  setPaused: (paused: boolean) => void;
  setScreen: (screen: Screen) => void;
  setView: (view: View) => void;
  selectTicket: (id: string | null) => void;
  selectPlate: (id: string | null, ticketId?: string | null) => void;
  setDebugOpen: (open: boolean) => void;
  setRevealDefects: (on: boolean) => void;
  setMuted: (muted: boolean) => void;
}

export const useGameStore = create<GameStore>()((set) => ({
  snap: null,
  fps: 0,
  speed: 1,
  paused: false,
  screen: 'title',
  view: 'pass',
  selectedTicketId: null,
  selectedPlateId: null,
  debugOpen: false,
  revealDefects: false,
  muted: false,

  setSnapshot: (snap) => set({ snap }),
  setFps: (fps) => set({ fps }),
  setSpeed: (speed) => set({ speed }),
  setPaused: (paused) => set({ paused }),
  setScreen: (screen) => set({ screen }),
  setView: (view) => set({ view }),
  selectTicket: (id) => set({ selectedTicketId: id, selectedPlateId: null }),
  selectPlate: (id, ticketId) =>
    set((s) => ({ selectedPlateId: id, selectedTicketId: ticketId ?? s.selectedTicketId })),
  setDebugOpen: (debugOpen) => set({ debugOpen }),
  setRevealDefects: (revealDefects) => set({ revealDefects }),
  setMuted: (muted) => set({ muted }),
}));
