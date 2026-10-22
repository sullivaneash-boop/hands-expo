import { useEffect, useRef, useState } from 'react';
import { content } from '../../data';
import { engine } from '../../engine/runtime';
import { courseStatus, type Course, type Ticket, type TicketItem } from '../../sim';
import { useGameStore } from '../../store/useGameStore';
import { COURSE_LABEL, itemName, modText, seatLabel, serverName, wallClock } from '../format';

const ITEM_TEXT: Record<TicketItem['state'], string> = {
  held: 'text-ink',
  queued: 'text-ink/60',
  cooking: 'text-ink/60',
  up: 'text-ink',
  sent: 'text-ink/30 line-through',
  void: 'text-ink/30 line-through',
};
const CHIP: Record<TicketItem['state'], [string, string]> = {
  held: ['HELD', 'border-ink/40 text-ink/60'],
  queued: ['QUEUED', 'border-steel border-dashed text-ink/70'],
  cooking: ['FIRED', 'border-steel bg-steel text-paper'],
  up: ['UP', 'border-amber bg-amber text-ink'],
  sent: ['SENT', 'border-transparent text-ink/30'],
  void: ['VOID', 'border-transparent text-ink/30'],
};

/** Earliest late time among open, ready courses (what the age bar tracks). */
const lateAt = (t: Ticket) =>
  Math.min(
    ...t.courses.filter((c) => c.sentAtMs === null && c.lateAtMs !== null).map((c) => c.lateAtMs as number),
  );
const readySince = (t: Ticket) =>
  Math.min(
    ...t.courses.filter((c) => c.sentAtMs === null && c.readyAtMs !== null).map((c) => c.readyAtMs as number),
  );

function AgeBar({ ticket }: { ticket: Ticket }) {
  const nowMs = useGameStore((s) => s.snap?.nowMs ?? 0);
  const due = lateAt(ticket);
  const since = readySince(ticket);
  if (!Number.isFinite(due) || !Number.isFinite(since)) {
    return <div className="mt-2 text-center text-[9px] text-ink/50">— waiting on table —</div>;
  }
  const late = nowMs >= due;
  const pct = Math.min(100, ((nowMs - since) / (due - since)) * 100);
  const color = late ? 'bg-rush' : pct > 50 ? 'bg-amber' : 'bg-tile';
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-1.5 flex-1 bg-ink/10">
        <div className={`h-full ${color}`} style={{ width: `${late ? 100 : pct}%` }} />
      </div>
      <span className={`text-[10px] tabular-nums ${late ? 'font-bold text-rush' : 'text-ink/60'}`}>
        {Math.floor((nowMs - ticket.printedAtMs) / 1000)}s
      </span>
    </div>
  );
}

function Stamp({ children, tone }: { children: React.ReactNode; tone: 'rush' | 'amber' | 'ink' }) {
  const colors = {
    rush: 'border-rush text-rush',
    amber: 'border-amber text-amber',
    ink: 'border-ink text-ink',
  };
  return (
    <span
      className={`anim-stamp inline-block border-2 px-1 text-[10px] font-bold tracking-wider ${colors[tone]}`}
    >
      {children}
    </span>
  );
}

/** HOLD course status line: waiting on the table → fire requested. */
function CourseState({ course }: { course: Course }) {
  if (!course.hold) return null;
  if (course.readyAtMs === null)
    return <div className="mb-1 text-[10px] text-ink/60">⏸ WAITING ON TABLE</div>;
  return (
    <div className="mb-1 text-[10px] font-bold text-ink">
      {course.fireHeard ? '▶ FIRE REQUESTED' : '▶ TABLE READY (server told the line)'}
    </div>
  );
}

/** An 86'd item: pick a substitute (the guest's choice) or void it. */
function Resolve86({ ticketId, item }: { ticketId: string; item: TicketItem }) {
  const eighty6 = useGameStore((s) => s.snap?.eighty6 ?? []);
  const course = content.menu.find((m) => m.id === item.menuId)?.course;
  const subs = content.menu.filter((m) => m.course === course && !eighty6.includes(m.id));
  return (
    <div className="mt-0.5 flex flex-wrap gap-1 pl-6" onClick={(e) => e.stopPropagation()}>
      <span className="text-[9px] text-rush">SUB:</span>
      {subs.map((m) => (
        <button
          key={m.id}
          onClick={() => engine.dispatch({ type: 'resolve86', ticketId, itemId: item.id, subMenuId: m.id })}
          className="border border-ink/40 px-1 text-[9px] hover:bg-amber/30"
        >
          {m.ticketName}
        </button>
      ))}
      <button
        onClick={() => engine.dispatch({ type: 'resolve86', ticketId, itemId: item.id, subMenuId: null })}
        className="border border-rush px-1 text-[9px] text-rush hover:bg-rush hover:text-paper"
      >
        VOID
      </button>
    </div>
  );
}

function ItemLine({ ticket, courseIdx, item }: { ticket: Ticket; courseIdx: number; item: TicketItem }) {
  const allergySeat = ticket.allergy?.seat === item.seat;
  const [chip, chipStyle] = item.eightySixed ? ['86', 'border-rush bg-rush text-paper'] : CHIP[item.state];
  const fireable = item.state === 'held' && !item.eightySixed;
  return (
    <div
      onClick={(e) => {
        if (!fireable) return;
        e.stopPropagation();
        engine.dispatch({ type: 'fire', ticketId: ticket.id, courseIdx, itemId: item.id });
      }}
      className={`mb-1 ${fireable ? 'hover:bg-amber/20' : ''}`}
      title={fireable ? 'Click to fire just this item' : undefined}
    >
      <div className="flex items-start justify-between gap-1">
        <span className={`${ITEM_TEXT[item.state]} ${item.eightySixed ? 'text-rush line-through' : ''}`}>
          {seatLabel(item.seat)}
          {allergySeat ? '⚑' : ''}&nbsp; {itemName(item.menuId)}
          {item.onTheFly && item.state !== 'sent' ? (
            <span className="ml-1 text-[9px] text-rush">OTF</span>
          ) : null}
        </span>
        <span className={`shrink-0 border px-1 text-[9px] ${chipStyle}`}>{chip}</span>
      </div>
      {item.mods.map((m) => (
        <div key={m} className={`pl-6 ${ITEM_TEXT[item.state]}`}>
          {modText(m)}
        </div>
      ))}
      {item.eightySixed && item.state === 'held' && <Resolve86 ticketId={ticket.id} item={item} />}
    </div>
  );
}

export function TicketCard({ id }: { id: string }) {
  const ticket = useGameStore((s) => s.snap?.tickets[id]);
  const nightId = useGameStore((s) => s.snap?.nightId ?? 1);
  const selected = useGameStore((s) => s.selectedTicketId === id);
  const nowMs = useGameStore((s) => Math.floor((s.snap?.nowMs ?? 0) / 500));
  const ref = useRef<HTMLElement>(null);
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [selected]);

  if (!ticket) return null;
  const now = nowMs * 500;
  const isLate = now >= lateAt(ticket);
  const barHold = ticket.known.bar && ticket.flags.notBeforeMs !== null && now < ticket.flags.notBeforeMs;
  const addon = ticket.kind === 'addon';
  const parentTable = addon ? ticket.table : null;

  return (
    <article
      ref={ref}
      onClick={() => useGameStore.getState().selectTicket(selected ? null : id)}
      onAnimationEnd={() => setPrinted(true)}
      className={`${printed ? '' : 'anim-print-in'} shrink-0 cursor-pointer bg-paper p-2 text-[11px] leading-snug text-ink shadow-[0_6px_14px_rgba(0,0,0,0.45)] ${
        addon ? 'w-44 -rotate-1 bg-[#efe6c8]' : 'w-56'
      } ${selected ? 'outline-3 outline-amber' : isLate ? 'outline-2 outline-rush' : ''}`}
    >
      {addon ? (
        <div className="border-b border-dashed border-ink/40 pb-1 font-bold">
          *** ADD ON → TABLE {parentTable} ***
        </div>
      ) : (
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
      )}

      {(ticket.known.vip || ticket.known.pushed || barHold) && (
        <div className="flex flex-wrap gap-1 pt-1">
          {ticket.known.vip && <Stamp tone="amber">VIP</Stamp>}
          {ticket.known.pushed && <Stamp tone="rush">PUSH</Stamp>}
          {barHold && <Stamp tone="ink">WAIT ON BAR</Stamp>}
        </div>
      )}

      {ticket.allergy && (
        <div className="mt-1 border-2 border-rush p-1 text-center font-bold text-rush">
          *** ALLERGY: {ticket.allergy.allergen.toUpperCase()} — SEAT {ticket.allergy.seat} ***
          {ticket.allergy.acked ? (
            <div className="text-[10px]">✓ LINE HEARD — PROTOCOL ON</div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                engine.dispatch({ type: 'ackAllergy', ticketId: id });
              }}
              className="mt-1 w-full bg-rush px-1 py-0.5 text-[10px] text-paper hover:bg-ink"
            >
              FLAG ALLERGY TO LINE
            </button>
          )}
        </div>
      )}

      {ticket.courses.map((course, courseIdx) => {
        const status = courseStatus(course);
        const anyUp = course.items.some((i) => i.state === 'up');
        const anyFireable = course.items.some((i) => i.state === 'held' && !i.eightySixed);
        return (
          <section key={courseIdx} className="border-b border-dashed border-ink/40 py-1">
            {!addon && (
              <div className="mb-1 font-bold">
                {COURSE_LABEL[course.kind]}
                {course.hold ? ' - HOLD' : ''}
              </div>
            )}
            <CourseState course={course} />
            {course.items.map((item) => (
              <ItemLine key={item.id} ticket={ticket} courseIdx={courseIdx} item={item} />
            ))}
            {status !== 'sent' && (
              <div className="mt-1 flex gap-1">
                <button
                  disabled={!anyFireable}
                  onClick={(e) => {
                    e.stopPropagation();
                    engine.dispatch({ type: 'fire', ticketId: id, courseIdx });
                  }}
                  className={`flex-1 border px-1 py-0.5 font-bold disabled:border-ink/20 disabled:bg-transparent disabled:text-ink/30 ${
                    status === 'waiting' ? 'border-ink/50 text-ink/70' : 'border-ink bg-ink text-paper'
                  }`}
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
            )}
          </section>
        );
      })}

      {ticket.note && <div className="py-1">NOTE: {ticket.note}</div>}
      {!addon && <div className="pt-1 text-center text-ink/60">ORDER #{ticket.orderNo}</div>}
      <AgeBar ticket={ticket} />
    </article>
  );
}
