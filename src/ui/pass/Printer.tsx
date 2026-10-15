import { useEffect, useState } from 'react';
import { bus } from '../../engine/bus';
import { useGameStore } from '../../store/useGameStore';

const FLASH_MS = 1_300;

/** The kitchen printer: paper feeds out while it chatters (grey-box stand-in for the Phase 4 print-in). */
export function Printer() {
  const [last, setLast] = useState<{ table: number; at: number; addon: boolean } | null>(null);
  const nowMs = useGameStore((s) => s.snap?.nowMs ?? 0);
  const stopped = useGameStore((s) => s.snap?.phase !== 'running');
  useEffect(
    () =>
      bus.on('ticketPrinted', (e) =>
        setLast({ table: e.table, addon: e.addon, at: useGameStore.getState().snap?.nowMs ?? 0 }),
      ),
    [],
  );
  const printing = last !== null && nowMs - last.at < FLASH_MS && nowMs >= last.at;
  return (
    <div className="border-2 border-steel bg-[#24221f] p-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-bold text-tile">PRINTER</span>
        <span
          className={`h-2 w-2 rounded-full ${printing ? 'animate-pulse bg-phosphor' : stopped ? 'bg-steel' : 'bg-phosphor/40'}`}
        />
      </div>
      <div className="mx-auto mt-1 h-2 w-28 rounded-sm bg-night" aria-hidden />
      <div className="mx-auto h-10 w-24 overflow-hidden">
        {printing && (
          <div
            key={last.at}
            className="anim-print-in h-10 w-24 bg-paper px-1 pt-1 text-[9px] leading-tight text-ink"
          >
            {last.addon ? 'ADD ON' : 'TABLE'} {last.table}
            <div className="mt-0.5 h-0.5 w-16 bg-ink/40" />
            <div className="mt-0.5 h-0.5 w-12 bg-ink/40" />
            <div className="mt-0.5 h-0.5 w-14 bg-ink/40" />
          </div>
        )}
      </div>
      <div className="text-center text-[10px] text-tile">
        {stopped ? '— LAST CALL —' : printing ? 'printing…' : 'idle'}
      </div>
    </div>
  );
}
