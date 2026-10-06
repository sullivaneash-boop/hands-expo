/** Display helpers: turn sim/content ids into ticket text. No game rules here. */
import { tuning } from '../config/tuning';
import { content } from '../data';
import type { CourseKind } from '../data/schema';
import { clockLabel } from '../sim/clock';
import type { ScoreReason, StatusAnswer } from '../sim';

const menuById = new Map(content.menu.map((m) => [m.id, m]));
const modById = new Map(content.mods.map((m) => [m.id, m]));
const serverById = new Map(content.servers.map((s) => [s.id, s]));
const lineById = new Map(content.dialogue.map((d) => [d.id, d]));

export const itemName = (menuId: string) => menuById.get(menuId)?.ticketName ?? menuId.toUpperCase();
export const serverName = (id: string) => serverById.get(id)?.name ?? id.toUpperCase();

export function modText(modId: string): string {
  const m = modById.get(modId);
  if (!m) return modId.toUpperCase();
  return m.emphasize ? `*** ${m.text} ***` : m.text;
}

export const seatLabel = (seat: number | 'share') => (seat === 'share' ? 'SHR' : `S${seat}`);

export const COURSE_LABEL: Record<CourseKind, string> = { app: 'APPS', main: 'ENTREE', side: 'SIDES' };

export function line(lineId: string, vars: Record<string, string | number>): string {
  const text = lineById.get(lineId)?.text ?? lineId;
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

export function wallClock(simMs: number, nightId: number): string {
  const start = content.shifts.find((s) => s.id === nightId)?.clockStartHour ?? 17;
  return clockLabel(start, simMs, tuning.shift.clockMinutesPerSec);
}

export const secs = (ms: number) => `${(ms / 1000).toFixed(0)}s`;
export const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
};

export const STATUS_LABEL: Record<StatusAnswer, string> = {
  notFired: 'NOT FIRED YET',
  cooking: 'COOKING',
  partial: 'SOME OF IT’S UP',
  window: 'IT’S IN THE WINDOW',
};

export const REASON_LABEL: Record<ScoreReason, string> = {
  late: 'late ticket',
  wrongModSent: 'bad plate sent',
  wrongDishSent: 'wrong dish sent',
  refireCorrect: 'caught a bad plate',
  refireUnneeded: 'refired a good plate',
  plateDied: 'plate died in the window',
  incompleteSend: 'sent an incomplete table',
  tableComplete: 'table complete',
  syncBonus: 'landed together',
  interruptWrong: 'told the server wrong',
  interruptTimeout: 'ignored the server',
  overtimeLeftover: 'tickets left at close',
  landedEarly: 'food beat the table',
  sentBeforeBar: 'food beat the drinks',
  fired86: 'fired an 86’d item',
  allergyIncident: 'ALLERGY INCIDENT',
  debug: 'debug',
};
