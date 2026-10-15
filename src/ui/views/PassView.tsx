import { useGameStore } from '../../store/useGameStore';
import { DoorPorthole } from '../pass/DoorPorthole';
import { EightySixBoard } from '../pass/EightySixBoard';
import { KitchenLine } from '../pass/KitchenLine';
import { Printer } from '../pass/Printer';
import { Rail } from '../pass/Rail';
import { Window } from '../pass/Window';

export function PassView() {
  return (
    <div className="flex h-full flex-col">
      <Rail />
      <KitchenLine />
      <div className="flex min-h-0 flex-1 gap-3 p-3">
        <Window />
        <aside className="flex w-60 shrink-0 flex-col gap-2 overflow-y-auto">
          <DoorPorthole onLook={() => useGameStore.getState().setView('floor')} />
          <Printer />
          <EightySixBoard />
        </aside>
      </div>
    </div>
  );
}
