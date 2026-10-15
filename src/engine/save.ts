import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { NightId } from '../config/tuning';
import type { ShiftSummary } from '../sim';

/**
 * Persisted progress (ROADMAP 3.12, D-027): unlocked nights, best result per night, mute.
 * No mid-shift saves. Storage failures (private mode, quota, corrupted JSON) fall back to defaults.
 */
export interface Best {
  grade: string;
  score: number;
}

export interface ProgressStore {
  unlocked: NightId;
  best: Partial<Record<NightId, Best>>;
  muted: boolean;
  record: (summary: ShiftSummary) => void;
  setMuted: (muted: boolean) => void;
  reset: () => void;
}

const LAST_NIGHT: NightId = 5;
const DEFAULTS = { unlocked: 1 as NightId, best: {}, muted: false };

/** localStorage that never throws (every access can fail in private windows). */
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

const isNight = (n: unknown): n is NightId => typeof n === 'number' && n >= 1 && n <= LAST_NIGHT;

export const useProgress = create<ProgressStore>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      record: (s) =>
        set((p) => {
          const prev = p.best[s.nightId];
          const best =
            !prev || s.score > prev.score
              ? { ...p.best, [s.nightId]: { grade: s.grade, score: s.score } }
              : p.best;
          const next = s.outcome === 'won' ? Math.min(LAST_NIGHT, s.nightId + 1) : 1;
          return { best, unlocked: Math.max(p.unlocked, next) as NightId };
        }),
      setMuted: (muted) => set({ muted }),
      reset: () => set({ unlocked: 1, best: {} }),
    }),
    {
      name: 'hands-progress',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (p) => ({ unlocked: p.unlocked, best: p.best, muted: p.muted }),
      // Anything unexpected in storage → sane defaults rather than a broken title screen.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ProgressStore>;
        const best: ProgressStore['best'] = {};
        if (p.best && typeof p.best === 'object')
          for (const [k, v] of Object.entries(p.best)) {
            const n = Number(k);
            if (isNight(n) && v && typeof v.grade === 'string' && typeof v.score === 'number') best[n] = v;
          }
        return {
          ...current,
          unlocked: isNight(p.unlocked) ? p.unlocked : DEFAULTS.unlocked,
          best,
          muted: typeof p.muted === 'boolean' ? p.muted : false,
        };
      },
    },
  ),
);
