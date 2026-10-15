import { useGameStore } from '../../store/useGameStore';
import { Figure } from '../scene/Figure';
import { speakerName } from '../format';

/**
 * The swing door's porthole, seen from the pass (diegetic "someone's waiting" cue, STYLE §5).
 * Click it (or press D) to turn around and deal with them.
 */
export function DoorPorthole({ onLook }: { onLook: () => void }) {
  const firstId = useGameStore((s) => s.snap?.interruptOrder[0]);
  const count = useGameStore((s) => s.snap?.interruptOrder.length ?? 0);
  const first = useGameStore((s) => (firstId ? s.snap?.interrupts[firstId] : undefined));
  return (
    <button
      onClick={onLook}
      title="The door (D)"
      className={`relative flex w-full flex-col items-center border-2 bg-[#3b3530] pt-2 pb-1 ${
        first ? 'border-amber' : 'border-steel'
      }`}
    >
      <div
        key={count}
        className={`${count ? 'anim-door-swing' : ''} relative h-20 w-20 overflow-hidden rounded-full border-4 border-steel bg-[#151719]`}
      >
        {first && (
          <div className="anim-bubble-in absolute inset-x-0 top-3 flex justify-center">
            <Figure source={first.source} who={first.speaker} scale={0.75} />
          </div>
        )}
      </div>
      <div className={`mt-1 text-[10px] tracking-widest ${first ? 'animate-pulse text-amber' : 'text-tile'}`}>
        {first
          ? `${speakerName(first.speaker, first.source)}${count > 1 ? ` +${count - 1}` : ''} AT THE DOOR (D)`
          : 'THE DOOR (D)'}
      </div>
    </button>
  );
}
