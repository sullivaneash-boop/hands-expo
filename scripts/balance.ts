/**
 * Headless balancing (principle 6, ROADMAP 3.10 / 5.5). Runs N shifts per (night, skill) with the bot.
 *
 *   npm run balance                                   # all nights × all skills, 200 runs each
 *   npm run balance -- --night 3 --skill average --runs 500
 *   npm run balance -- --ablate                       # expert vs. strategy-stripped variants (D-070)
 *   npm run balance -- --json                         # also write scripts/out/balance-*.json
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tuning, type NightId } from '../src/config/tuning';
import { content } from '../src/data';
import { BOT_SKILLS, expertVariant, runShift, type BotSkill, type ShiftRun } from '../src/sim/bot';

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i] ?? '';
  if (!a.startsWith('--')) continue;
  const next = process.argv[i + 1];
  if (next && !next.startsWith('--')) {
    args.set(a.slice(2), next);
    i++;
  } else args.set(a.slice(2), 'true');
}
const nights: NightId[] =
  args.get('night') && args.get('night') !== 'all' ? [Number(args.get('night')) as NightId] : [1, 2, 3, 4, 5];
const ablate = args.has('ablate');
const skills: BotSkill[] = ablate
  ? [
      BOT_SKILLS.expert,
      expertVariant('asap'),
      expertVariant('neverStagger'),
      expertVariant('ignoreLoad'),
      expertVariant('neverCheck'),
    ]
  : args.get('skill') && args.get('skill') !== 'all'
    ? [BOT_SKILLS[args.get('skill') as keyof typeof BOT_SKILLS]]
    : Object.values(BOT_SKILLS);
const runs = Number(args.get('runs') ?? (ablate ? 100 : 200));
const baseSeed = Number(args.get('seed') ?? 1);
const ctx = { tuning, content };

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pct = (xs: number[], p: number) => {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 0;
};
const f1 = (n: number) => n.toFixed(1);

interface Row {
  night: NightId;
  skill: string;
  runs: number;
  failPct: number;
  spiralPctOfLosses: number;
  allergyLossPct: number;
  scoreMean: number;
  scoreP50: number;
  stars: number[];
  peakHeatMean: number;
  courseSecP50: number;
  escapedPerShift: number;
  deadPerShift: number;
  syncConversion: number;
  comboUptime: number;
  decisionsPerMin: number;
  overfireRate: number;
  passPanicSec: number;
  cleanBoards: number;
  ticketsPerShift: number;
  topHeat: string;
}

const rows: Row[] = [];
const started = Date.now();
for (const night of nights) {
  for (const skill of skills) {
    const results: ShiftRun[] = [];
    for (let i = 0; i < runs; i++) results.push(runShift(ctx, night, baseSeed + i, skill));
    const sums = results.map((r) => r.summary);
    const lost = results.filter((r) => r.summary.outcome === 'lost');
    const heatByReason: Record<string, number> = {};
    for (const x of sums)
      for (const [k, v] of Object.entries(x.stats.heatByReason))
        if ((v ?? 0) > 0) heatByReason[k] = (heatByReason[k] ?? 0) + (v ?? 0);
    const per = (f: (r: ShiftRun) => number) => mean(results.map(f));
    rows.push({
      night,
      skill: skill.name,
      runs,
      failPct: (100 * lost.length) / runs,
      spiralPctOfLosses: lost.length
        ? (100 * lost.filter((r) => r.metrics.deathSpiral).length) / lost.length
        : 0,
      allergyLossPct: (100 * lost.filter((r) => r.summary.lostBy === 'allergy').length) / runs,
      scoreMean: per((r) => r.summary.score),
      scoreP50: pct(
        sums.map((x) => x.score),
        0.5,
      ),
      stars: [0, 1, 2, 3].map((n) => sums.filter((x) => x.stars === n).length),
      peakHeatMean: per((r) => r.metrics.peakHeat),
      courseSecP50: pct(
        sums.map((x) => x.avgCourseMs / 1000),
        0.5,
      ),
      escapedPerShift: per((r) => r.summary.stats.errorsEscaped),
      deadPerShift: per((r) => r.summary.stats.platesDied),
      syncConversion: per((r) => r.metrics.syncConversion),
      comboUptime: per((r) => r.metrics.comboUptime),
      decisionsPerMin: per((r) => r.metrics.decisionsPerMin),
      overfireRate: per((r) => r.metrics.overfireRate),
      passPanicSec: per((r) => r.metrics.passPanicSec),
      cleanBoards: per((r) => r.summary.stats.cleanBoards),
      ticketsPerShift: per((r) => r.summary.stats.ticketsPrinted),
      topHeat: Object.entries(heatByReason)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([k, v]) => `${k} ${f1(v / runs)}`)
        .join(', '),
    });
  }
}

console.log(
  `\nHANDS! ${ablate ? 'strategy ablation' : 'balance'} · ${runs} runs per cell · seeds ${baseSeed}..${baseSeed + runs - 1} · ${((Date.now() - started) / 1000).toFixed(1)}s\n`,
);
console.table(
  rows.map((r) => ({
    night: r.night,
    skill: r.skill,
    'fail%': f1(r.failPct),
    'spiral% of L': f1(r.spiralPctOfLosses),
    'score μ': Math.round(r.scoreMean),
    '★ 0/1/2/3': r.stars.join('/'),
    'peak heat': f1(r.peakHeatMean),
    'course s': f1(r.courseSecP50),
    'bad sent': f1(r.escapedPerShift),
    dead: f1(r.deadPerShift),
    'sync conv': f1(100 * r.syncConversion) + '%',
    'combo up': f1(100 * r.comboUptime) + '%',
    'dec/min': f1(r.decisionsPerMin),
    overfire: f1(100 * r.overfireRate) + '%',
    'pass panic s': f1(r.passPanicSec),
    'clean boards': f1(r.cleanBoards),
  })),
);
if (ablate) {
  console.log('\nScore vs. expert (same night):');
  for (const night of nights) {
    const base = rows.find((r) => r.night === night && r.skill === 'expert');
    if (!base) continue;
    const line = rows
      .filter((r) => r.night === night && r.skill !== 'expert')
      .map(
        (r) =>
          `${r.skill.replace('expert-', '')} ${r.scoreMean >= base.scoreMean ? '+' : ''}${f1((100 * (r.scoreMean - base.scoreMean)) / base.scoreMean)}% (fail ${f1(r.failPct)}%)`,
      )
      .join(' · ');
    console.log(`  N${night}: ${line}`);
  }
} else {
  console.log('\nBiggest heat sources per shift (avg):');
  for (const r of rows)
    console.log(
      `  N${r.night} ${r.skill.padEnd(8)} ${r.topHeat}${r.allergyLossPct ? ` · allergy losses ${f1(r.allergyLossPct)}%` : ''}`,
    );
}

if (args.has('json')) {
  const outDir = join(dirname(fileURLToPath(import.meta.url)), 'out');
  mkdirSync(outDir, { recursive: true });
  const file = join(outDir, `balance-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, JSON.stringify({ runs, baseSeed, ablate, rows }, null, 2));
  console.log(`\nwrote ${file}`);
}
