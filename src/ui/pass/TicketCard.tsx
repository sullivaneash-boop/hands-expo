import { useEffect, useRef } from 'react';
import { engine } from '../../engine/runtime';
import { courseStatus, type Ticket, type TicketItem } from '../../sim';
import { useGameStore } from '../../store/useGameStore';
import { COURSE_LABEL, itemName, modText, seatLabel, serverName, wallClock } from '../format';

const ITEM_STATE_STYLE: Record<TicketItem['state'], string> = {
  held: 'text-ink',
  cooking: 'text-ink/60',
  up: 'text-ink',
  sent: 'text-ink/30 line-through',
  void: 'text-ink/30 line-through',
};
const CHIP: Record<TicketItem['state'], string> = {
  held: 'HELD',
  cooking: 'FIRED',
  up: 'UP',
  sent: 'SENT',
  void: 'VOID',
};
const CHIP_STYLE: Record<TicketItem['state'], string> = {
  held: 'border-ink/40 text-ink/60',
  cooking: 'border-steel bg-steel text-paper',
  up: 'border-amber bg-amber text-ink',
  sent: 'border-transparent text-ink/30',
  void: 'border-transparent text-ink/30',
};

/** Earliest late time among open, ready courses (Phase 3 grey-box stopgap; full course UI pending). */
const lateAt = (t: Ticket) =>
  Math.min(
    ...t.courses.filter((c) => c.sentAtMs === null && c.lateAtMs !== null).map((c) => c.lateAtMs as number),
    Infinity,
  );

/** Ticket age vs grace: amber after half, rush red once late. */
function AgeBar({ ticket }: { ticket: Ticket }) {
  const nowMs = useGameStore((s) => s.snap?.nowMs ?? 0);
  const grace = lateAt(ticket) - ticket.printedAtMs;
  const age = nowMs - ticket.printedAtMs;
  const late = nowMs >= lateAt(ticket);
  const pct = Math.min(100, (age / grace) * 100);
  const color = late ? 'bg-rush' : pct > 50 ? 'bg-amber' : 'bg-tile';
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-1.5 flex-1 bg-ink/10">
        <div className={`h-full ${color}`} style={{ width: `${late ? 100 : pct}%` }} />
      </div>
      <span className={`text-[10px] tabular-nums ${late ? 'font-bold text-rush' : 'text-ink/60'}`}>
        {Math.floor(age / 1000)}s
      </span>
    </div>
  );
}

export function TicketCard({ id }: { id: string }) {
  const ticket = useGameStore((s) => s.snap?.tickets[id]);
  const nightId = useGameStore((s) => s.snap?.nightId ?? 1);
  const selected = useGameStore((s) => s.selectedTicketId === id);
  const isLate = useGameStore((s) => (s.snap && ticket ? s.snap.nowMs >= lateAt(ticket) : false));
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [selected]);

  if (!ticket) return null;
  const select = () => useGameStore.getState().selectTicket(selected ? null : id);

  return (
    <article
      ref={ref}
      onClick={select}
      className={`w-56 shrink-0 cursor-pointer bg-paper p-2 text-[11px] leading-snug text-ink shadow-md ${
        selected ? 'outline-3 outline-amber' : isLate ? 'outline-2 outline-rush' : ''
      }`}
    >
      <div className="border-b border-dashed border-ink/40 pb-1">
        <div className="flex justify-between font-bold">
          <span>TABLE {ticket.table}</span>
          <span>{wallClock(ticket.printedAtMs, nightId)}</span>
        </div>
        <div className="flex justify-between">
          <span>SERVER: {serverName(ticket.server)}</span>
          <span>
            {ticket.guests} GUEST{ticket.guests > 1 ? 'S' : ''}
          </span>
        </div>
      </div>

      {ticket.courses.map((course, courseIdx) => {
        const status = courseStatus(course);
        const anyUp = course.items.some((i) => i.state === 'up');
        const anyHeld = course.items.some((i) => i.state === 'held');
        return (
          <section key={courseIdx} className="border-b border-dashed border-ink/40 py-1">
            <div className="mb-1 font-bold">
              {COURSE_LABEL[course.kind]}
              {course.hold ? ' - HOLD' : ''}
            </div>
            {course.items.map((item) => (
              <div
                key={item.id}
                onClick={(e) => {
                  if (item.state !== 'held') return;
                  e.stopPropagation();
                  engine.dispatch({ type: 'fire', ticketId: id, courseIdx, itemId: item.id });
                }}
                className={`mb-1 ${item.state === 'held' ? 'hover:bg-amber/20' : ''}`}
                title={item.state === 'held' ? 'Click to fire just this item' : undefined}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className={ITEM_STATE_STYLE[item.state]}>
                    {seatLabel(item.seat)}&nbsp; {itemName(item.menuId)}
                  </span>
                  <span className={`shrink-0 border px-1 text-[9px] ${CHIP_STYLE[item.state]}`}>
                    {CHIP[item.state]}
                  </span>
                </div>
                {item.mods.map((m) => (
                  <div key={m} className={`pl-6 ${ITEM_STATE_STYLE[item.state]}`}>
                    {modText(m)}
                  </div>
                ))}
              </div>
            ))}
            <div className="mt-1 flex gap-1">
              <button
                disabled={!anyHeld}
                onClick={(e) => {
                  e.stopPropagation();
                  engine.dispatch({ type: 'fire', ticketId: id, courseIdx });
                }}
                className="flex-1 border border-ink bg-ink px-1 py-0.5 font-bold text-paper disabled:border-ink/20 disabled:bg-transparent disabled:text-ink/30"
              >
                FIRE
              </button>
              <button
                disabled={!anyUp}
                onClick={(e) => {
                  e.stopPropagation();
                  engine.dispatch({ type: 'send', ticketId: id, courseIdx });
                }}
                className={`flex-1 border px-1 py-0.5 font-bold disabled:border-ink/20 disabled:bg-transparent disabled:text-ink/30 ${
                  status === 'up' ? 'border-amber bg-amber text-ink' : 'border-ink text-ink'
                }`}
              >
                HANDS!
              </button>
            </div>
          </section>
        );
      })}

      {ticket.note && <div className="py-1">NOTE: {ticket.note}</div>}
      <div className="pt-1 text-center text-ink/60">ORDER #{ticket.orderNo}</div>
      <AgeBar ticket={ticket} />
    </article>
  );
}
