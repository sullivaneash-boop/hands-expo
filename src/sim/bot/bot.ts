/**
 * Headless bot player (ROADMAP 3.9). Pure: botStep(state, memory, ctx, skill) → commands + memory.
 * Models a human's limits: one view at a time, reaction delays, time per action, imperfect checks.
 * It reads the same information the UI shows; `plateIsWrong` stands in for "reading the plate", gated by
 * checkProb/spotProb so it isn't omniscient.
 */
import type { PlayerCommand } from '../commands';
import type { SimContext } from '../context';
import { itemDone, needsAllergyPick } from '../lookup';
import { baseCookMs } from '../plates';
import { Rng, seedRng, type RngState } from '../rng';
import { plateIsWrong, STATUS_ANSWERS, ticketStatus } from '../selectors';
import type { Course, SimState, Ticket } from '../state';
import type { BotSkill } from './skills';

export interface BotMemory {
  view: 'pass' | 'floor';
  busyUntilMs: number;
  doorNoticeAtMs: number | null;
  /** plateId → what the bot concluded (absent = not checked). */
  verdicts: Record<string, 'ok' | 'bad'>;
  /** Per-course / per-ticket decisions made once (so a habit isn't re-rolled every tick). */
  decided: Record<string, boolean>;
  rng: RngState;
}

export function botInit(seed: number): BotMemory {
  return {
    view: 'pass',
    busyUntilMs: 0,
    doorNoticeAtMs: null,
    verdicts: {},
    decided: {},
    rng: seedRng(seed ^ 0xb07),
  };
}

const IDLE_MS = 250;

export function botStep(
  s: SimState,
  prev: BotMemory,
  ctx: SimContext,
  skill: BotSkill,
): { commands: PlayerCommand[]; mem: BotMemory } {
  if (s.phase === 'ended' || s.nowMs < prev.busyUntilMs) return { commands: [], mem: prev };
  const mem: BotMemory = { ...prev, verdicts: { ...prev.verdicts }, decided: { ...prev.decided } };
  const r = new Rng(prev.rng);
  const out: PlayerCommand[] = [];
  const act = (cmd: PlayerCommand | null, ms = r.int(skill.actionMs[0], skill.actionMs[1])) => {
    if (cmd) out.push(cmd);
    mem.busyUntilMs = s.nowMs + ms;
  };
  const once = (key: string, p: number) => {
    if (!(key in mem.decided)) mem.decided[key] = r.chance(p);
    return mem.decided[key] as boolean;
  };
  const done = () => ({ commands: out, mem: { ...mem, rng: r.state } });

  // ── At the door ───────────────────────────────────────────────────────────
  if (mem.view === 'floor') {
    const it = s.interruptOrder.map((id) => s.interrupts[id]).find((x) => x !== undefined);
    if (!it) {
      mem.view = 'pass';
      act(null, skill.lookMs);
      return done();
    }
    let choice = 'heard';
    if (it.defId === 'server_status') {
      const t = s.tickets[it.ticketId];
      const truth = t ? ticketStatus(t) : 'notFired';
      choice = r.chance(skill.statusAccuracy) ? truth : r.pick(STATUS_ANSWERS.filter((a) => a !== truth));
    }
    act({ type: 'answer', interruptId: it.id, choice });
    return done();
  }

  // ── Noticing the door from the pass ───────────────────────────────────────
  if (s.interruptOrder.length > 0) {
    if (mem.doorNoticeAtMs === null)
      mem.doorNoticeAtMs = s.nowMs + r.int(skill.doorReactMs[0], skill.doorReactMs[1]);
    if (s.nowMs >= mem.doorNoticeAtMs) {
      mem.view = 'floor';
      mem.doorNoticeAtMs = null;
      act(null, skill.lookMs);
      return done();
    }
  } else mem.doorNoticeAtMs = null;

  const tickets = s.railOrder.map((id) => s.tickets[id]).filter((t): t is Ticket => t !== undefined);
  const now = s.nowMs;

  // ── 1. Window: check, refire, send complete courses ───────────────────────
  for (const t of tickets) {
    for (let ci = 0; ci < t.courses.length; ci++) {
      const c = t.courses[ci] as Course;
      const open = c.items.filter((i) => !itemDone(i));
      if (open.length === 0 || !open.every((i) => i.state === 'up')) continue;
      for (const item of open) {
        const plate = item.plateId ? s.plates[item.plateId] : undefined;
        if (!plate || plate.id in mem.verdicts) continue;
        const pickMissing = needsAllergyPick(t, item) && !plate.build.allergyPick;
        if (pickMissing && r.chance(skill.pickSpotProb)) {
          mem.verdicts[plate.id] = 'bad';
          act(null);
          return done();
        }
        if (r.chance(skill.checkProb)) {
          const bad = plateIsWrong(ctx, s, plate) && r.chance(skill.spotProb);
          mem.verdicts[plate.id] = bad ? 'bad' : 'ok';
          act({ type: 'check', plateId: plate.id });
          return done();
        }
        mem.verdicts[plate.id] = 'ok';
      }
      const bad = open.find((i) => i.plateId && mem.verdicts[i.plateId] === 'bad');
      if (bad?.plateId) {
        if (needsAllergyPick(t, bad) && !t.allergy?.acked) {
          act({ type: 'ackAllergy', ticketId: t.id });
          return done();
        }
        act({ type: 'refire', plateId: bad.plateId });
        return done();
      }
      const waitBar = t.known.bar && t.flags.notBeforeMs !== null && now < t.flags.notBeforeMs;
      if (waitBar && once(`bar:${t.id}`, skill.respectBarProb)) continue;
      act({ type: 'send', ticketId: t.id, courseIdx: ci });
      return done();
    }
  }

  // ── 2. Rescue plates about to die on incomplete courses ───────────────────
  for (const id of s.windowOrder) {
    const p = s.plates[id];
    if (!p || (now - p.upAtMs) / ctx.tuning.pass.plateDieMs < skill.rescueAt) continue;
    act({ type: 'send', ticketId: p.ticketId, courseIdx: p.courseIdx });
    return done();
  }

  // ── 3. Resolve 86s ────────────────────────────────────────────────────────
  for (const t of tickets)
    for (const c of t.courses)
      for (const i of c.items) {
        if (!i.eightySixed || i.state !== 'held') continue;
        const course = ctx.content.menu.find((m) => m.id === i.menuId)?.course;
        const sub = ctx.content.menu.find((m) => m.course === course && !s.eighty6.includes(m.id));
        act({ type: 'resolve86', ticketId: t.id, itemId: i.id, subMenuId: sub?.id ?? null });
        return done();
      }

  // ── 4. Fire ───────────────────────────────────────────────────────────────
  for (const t of tickets) {
    for (let ci = 0; ci < t.courses.length; ci++) {
      const c = t.courses[ci] as Course;
      const held = c.items.filter((i) => i.state === 'held' && !i.eightySixed);
      if (held.length === 0) continue;
      const ready = c.readyAtMs !== null && now >= c.readyAtMs;
      if (!ready && once(`hold:${t.id}:${ci}`, skill.holdDiscipline)) continue;
      if (
        t.allergy &&
        !t.allergy.acked &&
        held.some((i) => needsAllergyPick(t, i)) &&
        once(`ack:${t.id}`, skill.ackAllergyProb)
      ) {
        act({ type: 'ackAllergy', ticketId: t.id });
        return done();
      }
      if (!once(`sync:${t.id}:${ci}`, skill.syncProb)) {
        act({ type: 'fire', ticketId: t.id, courseIdx: ci });
        return done();
      }
      // Stagger: estimate when the slowest item lands; fire each item so it lands then too.
      const extra = (i: (typeof held)[number]) =>
        needsAllergyPick(t, i) && t.allergy?.acked ? ctx.tuning.cook.allergyExtraMs : 0;
      const est = (i: (typeof held)[number]) => baseCookMs(ctx, i) + extra(i);
      const cookingLand = s.cooking
        .filter((j) => j.ticketId === t.id && j.courseIdx === ci)
        .map((j) => j.doneAtMs);
      const land = Math.max(...held.map((i) => now + est(i)), ...cookingLand);
      const next = held.find((i) => now + est(i) >= land - 1_500);
      if (next) {
        act({ type: 'fire', ticketId: t.id, courseIdx: ci, itemId: next.id });
        return done();
      }
    }
  }

  act(null, IDLE_MS);
  return done();
}
