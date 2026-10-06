import { useEffect, useState } from 'react';
import { bus } from '../../engine/bus';
import { useGameStore } from '../../store/useGameStore';

const FLASH_MS = 1500;

/** The printer: flashes when a ticket comes out (grey-box stand-in for the Phase 4 print-in). */
export function Printer() {
  const [last, setLast] = useState<{ table: number; at: number } | null>(null);
  const nowMs = useGameStore((s) => s.snap?.nowMs ?? 0);
  const stopped = useGameStore((s) => s.snap?.phase !== 'running');
  useEffect(
    () =>
      bus.on('ticketPrinted', (e) =>
        setLast({ table: e.table, at: useGameStore.getState().snap?.nowMs ?? 0 }),
      ),
    [],
  );
  const printing = last !== null && nowMs - last.at < FLASH_MS && nowMs >= last.at;
  return (
    <div
      className={`border-2 p-2 text-xs ${printing ? 'border-paper bg-paper text-ink' : 'border-steel text-tile'}`}
    >
      <div className="font-bold">PRINTER</div>
      <div>{printing ? `▮▮▮ TABLE ${last.table}` : stopped ? '— LAST CALL —' : 'idle'}</div>
    </div>
  );
}
