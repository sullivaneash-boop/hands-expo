import { describe, expect, it } from 'vitest';
import { tuning, type NightId } from '../config/tuning';
import { content } from '../data';
import type { ShiftBeat } from '../data/schema';
import { validateContent } from '../data/validate';
import { createSim } from '.';
import { randomTicket } from './systems/generate';
import { Work } from './work';

const ctx = { tuning, content };

describe('procedural ticket generator (3.7)', () => {
  it.each([1, 2, 3, 4, 5] as NightId[])(
    'night %i: 1000 generated tickets pass content validation',
    (nightId) => {
      const beats: ShiftBeat[] = [];
      let twoCourse = 0;
      let allergy = 0;
      for (let seed = 0; seed < 1000; seed++) {
        const w = new Work(createSim(seed, nightId, ctx), ctx);
        const t = randomTicket(w, w.rng.schedule);
        if (t.courses.length === 2) twoCourse++;
        if (t.allergy) allergy++;
        beats.push({ atMs: 0, type: 'ticket', ticket: t });
      }
      const shift = content.shifts.find((s) => s.id === nightId)!;
      expect(validateContent({ ...content, shifts: [{ ...shift, beats }] })).toEqual([]);
      const features = shift.features;
      if (features.includes('courses')) expect(twoCourse).toBeGreaterThan(300);
      else expect(twoCourse).toBe(0);
      if (features.includes('allergy')) expect(allergy).toBeGreaterThan(50);
      else expect(allergy).toBe(0);
    },
  );

  it('never orders an 86’d item', () => {
    for (let seed = 0; seed < 300; seed++) {
      const w = new Work(createSim(seed, 3, ctx), ctx);
      w.s.eighty6 = ['salmon', 'burger'];
      const t = randomTicket(w, w.rng.schedule);
      for (const c of t.courses)
        for (const i of c.items) expect(['salmon', 'burger']).not.toContain(i.menuId);
    }
  });
});
