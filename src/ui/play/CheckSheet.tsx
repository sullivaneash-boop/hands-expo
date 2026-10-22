import { useEffect, useRef, useState } from 'react';
import { tuning } from '../../config/tuning';
import { engine } from '../../engine/runtime';
import { needsAllergyPick } from '../../sim';
import { useGameStore } from '../../store/useGameStore';
import { Icon, TempGauge } from '../icons/Icon';
import { compareRows, hasMismatch, type Row, type Token } from '../plateSchema';
import { nowMs, track } from '../telemetry';
import { Sheet } from './Sheet';

function Tokens({ tokens, slot }: { tokens: Token[]; slot: Row['slot'] }) {
  if (tokens.length === 0) return <span className="text-xs text-steel">—</span>;
  if (slot === 'temp') return <TempGauge mod={tokens[0]?.id ?? null} />;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {tokens.map((t) => (
        <span key={t.id} className="flex items-center gap-1">
          {t.icon && (
            <Icon
              name={t.icon}
              size={slot === 'dish' ? 34 : 26}
              variant={slot === 'remove' ? 'remove' : slot === 'add' ? 'add' : undefined}
            />
          )}
          <span className="text-[10px] leading-tight">
            {slot === 'remove' ? t.text.replace(/^NO /, '') : t.text}
          </span>
        </span>
      ))}
    </span>
  );
}

/**
 * The visual CHECK (D-072): ordered vs. made in aligned rows. Tap the row that doesn't match (grease-pencil
 * circle + call-out), then REFIRE — or GOOD if it's right. Allergy stays procedural: the only allergy row is
 * "is the pick there", never "does it look safe" (D-009).
 */
export function CheckSheet({ id }: { id: string }) {
  const plate = useGameStore((s) => s.snap?.plates[id]);
  const ticket = useGameStore((s) => (plate ? s.snap?.tickets[plate.ticketId] : undefined));
  const ageMs = useGameStore((s) => (plate ? (s.snap?.nowMs ?? 0) - plate.upAtMs : 0));
  const [circled, setCircled] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<string | null>(null);
  const opened = useRef(0);
  useEffect(() => {
    opened.current = nowMs();
  }, []);

  const close = () => useGameStore.getState().openSheet(null);
  if (!plate || !ticket) return null;
  const item = ticket.courses[plate.courseIdx]?.items.find((i) => i.id === plate.itemId);
  if (!item) return null;
  const rows = compareRows(item, plate.build, needsAllergyPick(ticket, item));
  const wrong = hasMismatch(rows);
  const life = Math.max(0, 1 - ageMs / tuning.pass.plateDieMs);

  const decide = (decision: 'good' | 'refire') => {
    const correct = decision === 'refire' ? wrong : !wrong;
    track('check_decision', {
      decision,
      correct,
      ms: Math.round(nowMs() - opened.current),
      circled: circled.size,
    });
    const store = useGameStore.getState();
    if (decision === 'refire') engine.dispatch({ type: 'refire', plateId: id });
    else store.approve(id);
    store.openSheet(null);
    store.selectTicket(ticket.id); // dock now shows HANDS! when the course is up
  };
  const tapRow = (r: Row) => {
    track('check_tap', { slot: r.slot, match: r.match });
    if (r.match) {
      setFlash(r.slot);
      setTimeout(() => setFlash((f) => (f === r.slot ? null : f)), 600);
    } else setCircled((c) => new Set(c).add(r.slot));
  };

  return (
    <Sheet
      title={
        <>
          CHECK · T{ticket.table} · {plate.seat === 'share' ? 'SHARE' : `SEAT ${plate.seat}`}
        </>
      }
      onClose={close}
    >
      <div className="mb-2 h-1.5 w-full bg-steel/40" aria-label="Freshness">
        <div
          className={`h-full ${life < 0.33 ? 'bg-rush' : life < 0.6 ? 'bg-amber' : 'bg-phosphor'}`}
          style={{ width: `${life * 100}%` }}
        />
      </div>
      <div className="grid grid-cols-[52px_1fr_1fr] items-center gap-x-2 border-b border-steel pb-1 text-[10px] tracking-widest text-tile">
        <span />
        <span>ORDERED</span>
        <span>MADE</span>
      </div>
      <div className="divide-y divide-steel/40" data-coach="check-rows">
        {rows.map((r) => {
          const isCircled = circled.has(r.slot);
          return (
            <button
              key={r.slot}
              onClick={() => tapRow(r)}
              className={`relative grid min-h-[52px] w-full grid-cols-[52px_1fr_1fr] items-center gap-x-2 py-1 text-left text-paper ${
                flash === r.slot ? 'bg-phosphor/15' : ''
              }`}
            >
              <span className="text-[10px] font-bold tracking-widest text-tile">{r.label}</span>
              <Tokens tokens={r.ordered} slot={r.slot} />
              <span className="relative">
                <Tokens tokens={r.made} slot={r.slot} />
                {isCircled && (
                  <svg
                    className="pointer-events-none absolute -inset-2"
                    viewBox="0 0 100 40"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <path
                      d="M8 22 C 8 6, 92 4, 94 20 C 96 36, 12 38, 6 24"
                      fill="none"
                      stroke="#c8423b"
                      strokeWidth="3"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: 260,
                        strokeDashoffset: 0,
                        animation: 'draw-circle 260ms ease-out',
                      }}
                    />
                  </svg>
                )}
              </span>
              {isCircled && (
                <span className="anim-stamp absolute right-1 -bottom-1 rounded-sm bg-rush px-1 text-[10px] font-bold text-paper">
                  {r.callout}
                </span>
              )}
              {flash === r.slot && (
                <span className="absolute right-2 text-xs font-bold text-phosphor">✓ matches</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[11px] text-tile">Tap anything that doesn’t match.</p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => decide('refire')}
          data-coach="check-refire"
          className={`min-h-[56px] flex-1 rounded-md border-2 border-rush text-lg font-bold tracking-widest ${
            circled.size > 0 ? 'animate-pulse bg-rush text-paper' : 'text-rush'
          }`}
        >
          REFIRE
        </button>
        <button
          onClick={() => decide('good')}
          data-coach="check-good"
          className="min-h-[56px] flex-1 rounded-md bg-amber text-lg font-bold tracking-widest text-ink"
        >
          GOOD ✓
        </button>
      </div>
    </Sheet>
  );
}
