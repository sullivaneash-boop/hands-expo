import { useEffect, useRef } from 'react';
import { content } from '../../data';
import type { Course, Ticket, TicketItem } from '../../sim';
import { useGameStore } from '../../store/useGameStore';
import { Icon, TempGauge } from '../icons/Icon';
import { serverName } from '../format';

const menuById = new Map(content.menu.map((m) => [m.id, m]));
const modById = new Map(content.mods.map((m) => [m.id, m]));

const RING: Record<TicketItem['state'], string> = {
  held: 'border-2 border-dashed border-ink/40',
  queued: 'border-2 border-dashed border-amber',
  cooking: 'border-2 border-steel bg-steel/10',
  up: 'border-2 border-amber bg-amber/30',
  sent: 'border-2 border-transparent opacity-30',
  void: 'border-2 border-transparent opacity-30',
};

/** One item on a mini ticket: dish silhouette, seat, temp, and how many extra mods it carries. */
function ItemChip({ item, allergy }: { item: TicketItem; allergy: boolean }) {
  const def = menuById.get(item.menuId);
  const temp = item.mods.find((m) => modById.get(m)?.kind === 'doneness') ?? null;
  const extras = item.mods.filter((m) => {
    const k = modById.get(m)?.kind;
    return k === 'remove' || k === 'add' || k === 'prep';
  }).length;
  return (
    <div
      className={`relative flex w-[46px] flex-col items-center rounded-md px-0.5 py-0.5 ${RING[item.state]}`}
    >
      <Icon name={def?.icon ?? 'unknown'} size={28} />
      <span className="text-[9px] leading-none font-bold">
        {item.seat === 'share' ? 'SHR' : `S${item.seat}`}
      </span>
      {temp && (
        <span className="mt-0.5">
          <TempGauge mod={temp} size="sm" />
        </span>
      )}
      {extras > 0 && (
        <span className="absolute -top-1.5 -right-1.5 rounded-full bg-ink px-1 text-[9px] font-bold text-paper">
          +{extras}
        </span>
      )}
      {allergy && (
        <span className="absolute -top-1.5 -left-1.5">
          <Icon name="shield" size={14} />
        </span>
      )}
      {item.eightySixed && (
        <span className="absolute inset-0 flex items-center justify-center rounded-md bg-rush/70 text-xs font-bold text-paper">
          86
        </span>
      )}
      {item.state === 'cooking' && <span className="mt-0.5 h-0.5 w-6 animate-pulse bg-steel" />}
    </div>
  );
}

function courseBadge(c: Course, nowMs: number): string | null {
  if (c.hold && c.readyAtMs === null) return '⏸ HOLD';
  if (c.hold && c.readyAtMs !== null && nowMs >= c.readyAtMs) return c.fireHeard ? '▶ FIRE REQ' : '▶ READY';
  return null;
}

const lateAt = (t: Ticket) =>
  Math.min(
    ...t.courses.filter((c) => c.sentAtMs === null && c.lateAtMs !== null).map((c) => c.lateAtMs as number),
  );
const readySince = (t: Ticket) =>
  Math.min(
    ...t.courses.filter((c) => c.sentAtMs === null && c.readyAtMs !== null).map((c) => c.readyAtMs as number),
  );

function AgeBar({ ticket }: { ticket: Ticket }) {
  const nowMs = useGameStore((s) => Math.floor((s.snap?.nowMs ?? 0) / 250) * 250);
  const due = lateAt(ticket);
  const since = readySince(ticket);
  if (!Number.isFinite(due) || !Number.isFinite(since)) return <div className="mt-1 h-1" />;
  const late = nowMs >= due;
  const pct = Math.min(100, ((nowMs - since) / (due - since)) * 100);
  return (
    <div className="mt-1 h-1.5 w-full bg-ink/10">
      <div
        className={`h-full ${late ? 'bg-rush' : pct > 60 ? 'bg-amber' : 'bg-tile'}`}
        style={{ width: `${late ? 100 : pct}%` }}
      />
    </div>
  );
}

/** Compact rail ticket (D-073). Tap to select; the dock shows what you can do with it. */
export function TicketMini({ id }: { id: string }) {
  const ticket = useGameStore((s) => s.snap?.tickets[id]);
  const selected = useGameStore((s) => s.selectedTicketId === id);
  const nowMs = useGameStore((s) => Math.floor((s.snap?.nowMs ?? 0) / 500) * 500);
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [selected]);
  if (!ticket) return null;
  const isLate = nowMs >= lateAt(ticket);
  const addon = ticket.kind === 'addon';
  const barHold = ticket.known.bar && ticket.flags.notBeforeMs !== null && nowMs < ticket.flags.notBeforeMs;
  return (
    <button
      ref={ref}
      data-coach={`ticket-${ticket.table}`}
      onClick={() => useGameStore.getState().selectTicket(selected ? null : id)}
      aria-label={`Table ${ticket.table}`}
      aria-pressed={selected}
      className={`anim-print-in flex min-h-[150px] w-[40vw] max-w-[190px] min-w-[150px] shrink-0 snap-start flex-col rounded-sm p-2 text-left text-ink shadow-[0_6px_14px_rgba(0,0,0,0.45)] ${
        addon ? 'bg-[#efe6c8]' : 'bg-paper'
      } ${selected ? 'outline-4 outline-offset-2 outline-amber' : isLate ? 'outline-3 outline-rush' : ''}`}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-xl leading-none font-bold">
          {addon ? '+' : ''}T{ticket.table}
        </span>
        <span className="text-[10px] text-ink/60">
          {ticket.guests}p · {serverName(ticket.server).slice(0, 4)}
        </span>
      </div>
      <div className="flex min-h-[18px] flex-wrap gap-1 py-0.5 text-[9px] font-bold">
        {ticket.allergy && (
          <span
            className={`rounded-sm px-1 ${ticket.allergy.acked ? 'bg-ink text-paper' : 'animate-pulse bg-rush text-paper'}`}
          >
            ⚑ {ticket.allergy.allergen.toUpperCase()} S{ticket.allergy.seat}
          </span>
        )}
        {ticket.known.vip && <span className="rounded-sm border border-amber px-1 text-amber">VIP</span>}
        {ticket.known.pushed && <span className="rounded-sm border border-rush px-1 text-rush">PUSH</span>}
        {barHold && <span className="rounded-sm border border-ink px-1">BAR</span>}
      </div>
      {ticket.courses.map((c, ci) => {
        const badge = courseBadge(c, nowMs);
        return (
          <div key={ci} className="mb-1">
            {(ticket.courses.length > 1 || badge) && (
              <div className="flex justify-between text-[9px] font-bold tracking-wider text-ink/70">
                <span>{c.kind === 'app' ? 'APPS' : c.kind === 'side' ? 'SIDE' : 'MAINS'}</span>
                {badge && <span className={badge.startsWith('▶') ? 'text-ink' : ''}>{badge}</span>}
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {c.items.map((it) => (
                <ItemChip key={it.id} item={it} allergy={ticket.allergy?.seat === it.seat} />
              ))}
            </div>
          </div>
        );
      })}
      <div className="mt-auto">
        <AgeBar ticket={ticket} />
      </div>
    </button>
  );
}

/** The rail: horizontally snapping, oldest left. */
export function RailStrip() {
  const order = useGameStore((s) => s.snap?.railOrder);
  return (
    <section className="shrink-0 border-b-4 border-steel bg-night/70" aria-label="Ticket rail">
      <div className="flex snap-x snap-mandatory items-start gap-3 overflow-x-auto px-3 pt-2 pb-3">
        {order && order.length > 0 ? (
          order.map((id) => <TicketMini key={id} id={id} />)
        ) : (
          <p className="flex min-h-[150px] w-full items-center justify-center text-sm text-tile">
            Rail’s clear. Listen for the printer.
          </p>
        )}
      </div>
    </section>
  );
}
