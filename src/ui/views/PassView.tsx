import { BuildCard } from '../pass/BuildCard';
import { Printer } from '../pass/Printer';
import { Rail } from '../pass/Rail';
import { Window } from '../pass/Window';

export function PassView() {
  return (
    <div className="flex h-full flex-col">
      <Rail />
      <div className="flex min-h-0 flex-1 gap-3 p-3">
        <Window />
        <aside className="flex w-64 shrink-0 flex-col gap-3">
          <Printer />
          <div className="min-h-48 flex-1">
            <BuildCard />
          </div>
        </aside>
      </div>
    </div>
  );
}
