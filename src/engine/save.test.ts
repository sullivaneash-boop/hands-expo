import { beforeEach, describe, expect, it } from 'vitest';
import type { ShiftSummary } from '../sim';
import { useProgress } from './save';

const summary = (nightId: 1 | 2 | 3 | 4 | 5, outcome: 'won' | 'lost', score: number, grade = 'B') =>
  ({ nightId, outcome, score, grade }) as unknown as ShiftSummary;

describe('saved progress (3.12)', () => {
  beforeEach(() => useProgress.getState().reset());

  it('winning a night unlocks the next and records the best result', () => {
    useProgress.getState().record(summary(1, 'won', 82));
    expect(useProgress.getState().unlocked).toBe(2);
    expect(useProgress.getState().best[1]).toEqual({ grade: 'B', score: 82 });
  });

  it('losing never unlocks; best keeps the higher score', () => {
    useProgress.getState().record(summary(1, 'won', 90, 'A'));
    useProgress.getState().record(summary(1, 'lost', 40, 'F'));
    useProgress.getState().record(summary(2, 'lost', 30, 'F'));
    expect(useProgress.getState().unlocked).toBe(2);
    expect(useProgress.getState().best[1]).toEqual({ grade: 'A', score: 90 });
  });

  it('night 5 is the last unlock', () => {
    useProgress.getState().record(summary(5, 'won', 95, 'A'));
    expect(useProgress.getState().unlocked).toBe(5);
  });

  it('corrupted or foreign storage data falls back to safe defaults', () => {
    const merge = useProgress.persist.getOptions().merge!;
    const merged = merge(
      { unlocked: 99, best: { 1: { grade: 7 }, x: 1, 2: { grade: 'C', score: 70 } }, muted: 'yes' },
      useProgress.getState(),
    );
    expect(merged.unlocked).toBe(1);
    expect(merged.best).toEqual({ 2: { grade: 'C', score: 70 } });
    expect(merged.muted).toBe(false);
  });
});
