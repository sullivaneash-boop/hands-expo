import { engine } from '../../engine/runtime';
import { useGameStore } from '../../store/useGameStore';
import { track } from '../telemetry';
import { dockActions, type DockAction } from './dock';

/** Context actions near the thumb (D-073). Big primary, smaller secondaries; no tiny inline buttons. */
export function ActionDock() {
  const ticketId = useGameStore((s) => s.selectedTicketId);
  const ticket = useGameStore((s) => (ticketId ? s.snap?.tickets[ticketId] : undefined));
  const nowMs = useGameStore((s) => Math.floor((s.snap?.nowMs ?? 0) / 250) * 250);

  if (!ticket || !ticketId) {
    return (
      <nav
        className="flex min-h-[76px] shrink-0 items-center justify-center border-t border-steel bg-night px-4 text-center text-xs text-tile"
        onClick={() => track('mis_tap', { where: 'dock-empty' })}
      >
        Tap a ticket to fire it · tap a plate to check it
      </nav>
    );
  }

  const actions = dockActions(ticket, nowMs);
  const run = (a: DockAction) => {
    track('action', { kind: a.kind, table: ticket.table });
    switch (a.kind) {
      case 'flagAllergy':
        return engine.dispatch({ type: 'ackAllergy', ticketId });
      case 'fire':
        return engine.dispatch({ type: 'fire', ticketId, courseIdx: a.courseIdx });
      case 'send':
        return engine.dispatch({ type: 'send', ticketId, courseIdx: a.courseIdx });
      case 'resolve86':
      case 'details':
        return useGameStore.getState().openSheet({ kind: 'ticket', id: ticketId });
    }
  };
  const [primary, ...rest] = actions;
  const tone = (a: DockAction) =>
    a.kind === 'send' && !a.partial
      ? 'bg-amber text-ink'
      : a.kind === 'flagAllergy' || a.kind === 'resolve86'
        ? 'bg-rush text-paper'
        : a.kind === 'fire' && !a.early
          ? 'bg-paper text-ink'
          : 'border border-steel text-paper';
  return (
    <nav
      className="flex shrink-0 items-stretch gap-2 border-t border-steel bg-night px-3 py-2"
      data-coach="dock"
    >
      {primary && (
        <button
          onClick={() => run(primary)}
          data-coach={`dock-${primary.kind}`}
          className={`min-h-[60px] flex-[2] rounded-md text-lg font-bold tracking-widest active:scale-[0.97] ${tone(primary)}`}
        >
          {primary.label}
          <span className="block text-[10px] font-normal tracking-normal opacity-70">T{ticket.table}</span>
        </button>
      )}
      {rest.map((a) => (
        <button
          key={a.label}
          onClick={() => run(a)}
          data-coach={`dock-${a.kind}`}
          className={`min-h-[48px] flex-1 self-center rounded-md px-1 py-3 text-xs font-bold tracking-wider active:scale-[0.97] ${tone(a)}`}
        >
          {a.label}
        </button>
      ))}
    </nav>
  );
}
