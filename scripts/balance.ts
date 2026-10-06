/**
 * Headless balancing (principle 6, ROADMAP 3.10). Runs N shifts per (night, skill) with the bot.
 *
 *   npm run balance                                  # all nights × all skills, 200 runs each
 *   npm run balance -- --night 3 --skill average --runs 500
 *   npm run balance -- --seed 1000 --json            # also write scripts/out/balance-*.json
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tuning, type NightId } from '../src/config/tuning';
import { content } from '../src/data';
import { BOT_SKILLS, runShift, type BotSkill } from '../src/sim/bot';
import type { ShiftSummary } from '../src/sim';

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i] ?? '';
  if (a.startsWith('--')) {
    const next = process.argv[i + 1];
    if (next && !next.startsWith('--')) args.set(a.slice(2), (i++, next));
    else args.set(a.slice(2), 'true');
  }
}
const nights: NightId[] =
  args.get('night') && args.get('night') !== 'all' ? [Number(args.get('night')) as NightId] : [1, 2, 3, 4, 5];
const skills: BotSkill[] =
  args.get('skill') && args.get('skill') !== 'all'
    ? [BOT_SKILLS[args.get('skill') as keyof typeof BOT_SKILLS]]
    : Object.values(BOT_SKILLS);
const runs = Number(args.get('runs') ?? 200);
const baseSeed = Number(args.get('seed') ?? 1);
const ctx = { tuning, content };

const pct = (xs: number[], p: number) => {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 0;
};
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const f1 = (n: number) => n.toFixed(1);

interface Row {
  night: NightId;
  skill: string;
  runs: number;
  failPct: number;
  allergyLossPct: number;
  healthMean: number;
  healthP10: number;
  scoreMean: number;
  grades: Record<string, number>;
  courseSecP50: number;
  courseSecP90: number;
  escapedPerShift: number;
  caughtPerShift: number;
  deadPerShift: number;
  earlyPerShift: number;
  doorWrongPerShift: number;
  doorTimeoutPerShift: number;
  allergyIncidentsPerShift: number;
  ticketsPerShift: number;
  topLosses: string;
}

const rows: Row[] = [];
const started = Date.now();
for (const night of nights) {
  for (const skill of skills) {
    const sums: ShiftSummary[] = [];
    for (let i = 0; i < runs; i++) sums.push(runShift(ctx, night, baseSeed + i, skill).summary);
    const lost = sums.filter((x) => x.outcome === 'lost');
    const grades: Record<string, number> = {};
    for (const x of sums) grades[x.grade] = (grades[x.grade] ?? 0) + 1;
    const losses: Record<string, number> = {};
    for (const x of sums)
      for (const [k, v] of Object.entries(x.stats.healthByReason))
        if (v < 0) losses[k] = (losses[k] ?? 0) + v;
    const per = (f: (x: ShiftSummary) => number) => mean(sums.map(f));
    rows.push({
      night,
      skill: skill.name,
      runs,
      failPct: (100 * lost.length) / runs,
      allergyLossPct: (100 * lost.filter((x) => x.lostBy === 'allergy').length) / runs,
      healthMean: per((x) => x.health),
      healthP10: pct(
        sums.map((x) => x.health),
        0.1,
      ),
      scoreMean: per((x) => x.score),
      grades,
      courseSecP50: pct(
        sums.map((x) => x.avgCourseMs / 1000),
        0.5,
      ),
      courseSecP90: pct(
        sums.map((x) => x.avgCourseMs / 1000),
        0.9,
      ),
      escapedPerShift: per((x) => x.stats.errorsEscaped),
      caughtPerShift: per((x) => x.stats.errorsCaught),
      deadPerShift: per((x) => x.stats.platesDied),
      earlyPerShift: per((x) => x.stats.earlyLandings + x.stats.barViolations),
      doorWrongPerShift: per((x) => x.stats.interrupts.wrong),
      doorTimeoutPerShift: per((x) => x.stats.interrupts.timeout),
      allergyIncidentsPerShift: per((x) => x.stats.allergyIncidents),
      ticketsPerShift: per((x) => x.stats.ticketsPrinted),
      topLosses: Object.entries(losses)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 3)
        .map(([k, v]) => `${k} ${f1(v / runs)}`)
        .join(', '),
    });
  }
}

console.log(
  `\nHANDS! balance · ${runs} runs per cell · seeds ${baseSeed}..${baseSeed + runs - 1} · ${((Date.now() - started) / 1000).toFixed(1)}s\n`,
);
console.table(
  rows.map((r) => ({
    night: r.night,
    skill: r.skill,
    'fail%': f1(r.failPct),
    'health μ': f1(r.healthMean),
    'health p10': r.healthP10,
    'score μ': f1(r.scoreMean),
    grades: ['A', 'B', 'C', 'D', 'F'].map((g) => `${g}${r.grades[g] ?? 0}`).join(' '),
    'course s p50/p90': `${f1(r.courseSecP50)}/${f1(r.courseSecP90)}`,
    'bad sent': f1(r.escapedPerShift),
    dead: f1(r.deadPerShift),
    door: `${f1(r.doorWrongPerShift)}w ${f1(r.doorTimeoutPerShift)}t`,
    tickets: f1(r.ticketsPerShift),
  })),
);
console.log('\nBiggest health losses per shift (avg):');
for (const r of rows)
  console.log(
    `  N${r.night} ${r.skill.padEnd(8)} ${r.topLosses}${r.allergyLossPct ? ` · allergy losses ${f1(r.allergyLossPct)}%` : ''}`,
  );

if (args.has('json')) {
  const outDir = join(dirname(fileURLToPath(import.meta.url)), 'out');
  mkdirSync(outDir, { recursive: true });
  const file = join(outDir, `balance-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, JSON.stringify({ runs, baseSeed, rows }, null, 2));
  console.log(`\nwrote ${file}`);
}
