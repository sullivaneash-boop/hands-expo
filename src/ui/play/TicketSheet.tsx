import { content } from '../../data';
import { engine } from '../../engine/runtime';
import { baseCookMs, type TicketItem } from '../../sim';
import { useGameStore } from '../../store/useGameStore';
import { Icon } from '../icons/Icon';
import { COURSE_LABEL, itemName, modText, serverName, wallClock } from '../format';
import { track } from '../telemetry';
import { Sheet } from './Sheet';

const menuById = new Map(content.menu.map((m) => [m.id, m]));
const STATE_LABEL: Record<TicketItem['state'], string> = {
  held: 'HELD',
  queued: 'QUEUED',
  cooking: 'ON THE LINE',
  up: 'ON THE PASS',
  sent: 'SENT',
  void: 'VOID',
};

/** The full printed ticket: every mod in words, per-item FIRE, allergy flag, 86 substitutes. */
export function TicketSheet({ id }: { id: string }) {
  const ticket = useGameStore((s) => s.snap?.tickets[id]);
  const nightId = useGameStore((s) => s.snap?.nightId ?? 1);
  const eighty6 = useGameStore((s) => s.snap?.eighty6 ?? []);
  const close = () => useGameStore.getState().openSheet(null);
  if (!ticket) return null;
  return (
    <Sheet
      title={
        <>
          T{ticket.table} · {ticket.guests}P · {serverName(ticket.server)}{' '}
          <span className="text-xs font-normal text-tile">{wallClock(ticket.printedAtMs, nightId)}</span>
        </>
      }
      onClose={close}
    >
      {ticket.allergy && (
        <div className="mb-3 rounded-sm border-2 border-rush p-2 text-center">
          <div className="text-sm font-bold text-rush">
            ⚑ ALLERGY: {ticket.allergy.allergen.toUpperCase()} — SEAT {ticket.allergy.seat}
          </div>
          {ticket.allergy.acked ? (
            <div className="text-xs text-paper">
              ✓ Line heard — protocol on. Their plate comes back flagged.
            </div>
          ) : (
            <button
              onClick={() => {
                engine.dispatch({ type: 'ackAllergy', ticketId: id });
                track('action', { kind: 'flagAllergy', table: ticket.table });
              }}
              className="mt-2 min-h-12 w-full rounded-md bg-rush font-bold tracking-widest text-paper"
            >
              FLAG ALLERGY TO THE LINE
            </button>
          )}
        </div>
      )}
      {ticket.courses.map((c, ci) => (
        <section key={ci} className="mb-3">
          <div className="mb-1 text-xs font-bold tracking-widest text-amber">
            {COURSE_LABEL[c.kind]}
            {c.hold ? (c.readyAtMs === null ? ' · HOLD — waiting on the table' : ' · table is ready') : ''}
          </div>
          {c.items.map((it) => {
            const fireable = it.state === 'held' && !it.eightySixed;
            const course = menuById.get(it.menuId)?.course;
            return (
              <div key={it.id} className="mb-2 flex items-start gap-2 rounded-md bg-steel/20 p-2">
                <Icon name={menuById.get(it.menuId)?.icon ?? 'unknown'} size={36} />
                <div className="min-w-0 flex-1 text-sm text-paper">
                  <div className={`font-bold ${it.eightySixed ? 'text-rush line-through' : ''}`}>
                    {it.seat === 'share' ? 'SHARE' : `S${it.seat}`} · {itemName(it.menuId)}
                    {ticket.allergy?.seat === it.seat ? ' ⚑' : ''}
                  </div>
                  {it.mods.map((m) => (
                    <div key={m} className="text-xs text-tile">
                      {modText(m)}
                    </div>
                  ))}
                  <div className="mt-1 text-[10px] tracking-widest text-steel">
                    {it.eightySixed ? '86’D — SUB OR VOID' : STATE_LABEL[it.state]}
                    {fireable && ` · ~${Math.round(baseCookMs(engine.ctx, it) / 1000)}s ON THE LINE`}
                  </div>
                  {it.eightySixed && it.state === 'held' && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {content.menu
                        .filter((m) => m.course === course && !eighty6.includes(m.id))
                        .map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              engine.dispatch({
                                type: 'resolve86',
                                ticketId: id,
                                itemId: it.id,
                                subMenuId: m.id,
                              });
                              track('action', { kind: 'resolve86' });
                            }}
                            className="min-h-11 rounded-sm border border-tile px-2 text-[11px] font-bold"
                          >
                            {m.ticketName}
                          </button>
                        ))}
                      <button
                        onClick={() =>
                          engine.dispatch({ type: 'resolve86', ticketId: id, itemId: it.id, subMenuId: null })
                        }
                        className="min-h-11 rounded-sm border border-rush px-2 text-[11px] font-bold text-rush"
                      >
                        VOID
                      </button>
                    </div>
                  )}
                </div>
                {fireable && (
                  <button
                    onClick={() => {
                      engine.dispatch({ type: 'fire', ticketId: id, courseIdx: ci, itemId: it.id });
                      track('action', { kind: 'fireItem', table: ticket.table });
                    }}
                    className="min-h-12 min-w-16 rounded-md bg-paper px-2 text-sm font-bold text-ink"
                  >
                    FIRE
                  </button>
                )}
              </div>
            );
          })}
        </section>
      ))}
      {ticket.note && <p className="text-xs text-tile">NOTE: {ticket.note}</p>}
    </Sheet>
  );
}
