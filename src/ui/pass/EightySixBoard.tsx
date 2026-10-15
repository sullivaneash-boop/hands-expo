import { useGameStore } from '../../store/useGameStore';
import { itemName } from '../format';

/** The clipboard by the window: what's off the menu tonight. */
export function EightySixBoard() {
  const list = useGameStore((s) => s.snap?.eighty6);
  if (!list || list.length === 0) return null;
  return (
    <div className="anim-bubble-in rotate-[0.6deg] border-t-8 border-steel bg-paper p-2 text-xs text-ink shadow-md">
      <div className="font-bold">86 BOARD</div>
      {list.map((id) => (
        <div key={id} className="font-bold text-rush line-through decoration-2">
          {itemName(id)}
        </div>
      ))}
    </div>
  );
}
