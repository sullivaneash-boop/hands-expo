import { useGameStore } from '../../store/useGameStore';
import { TicketCard } from './TicketCard';

/** The rail: oldest left, newest right (GDD §4). Spatial, not a sorted list. */
export function Rail() {
  const order = useGameStore((s) => s.snap?.railOrder);
  return (
    <section className="relative border-b-4 border-steel bg-night/60">
      <div className="absolute inset-x-0 top-0 h-1 bg-steel" aria-hidden />
      <div className="flex min-h-64 items-start gap-3 overflow-x-auto px-4 pt-3 pb-4">
        {order && order.length > 0 ? (
          order.map((id) => <TicketCard key={id} id={id} />)
        ) : (
          <p className="self-center text-sm text-tile">The rail is empty. Listen for the printer.</p>
        )}
      </div>
    </section>
  );
}
