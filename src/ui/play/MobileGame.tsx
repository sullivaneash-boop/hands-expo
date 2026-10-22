import { useEffect, useRef, useState } from 'react';
import { bus } from '../../engine/bus';
import { useGameStore } from '../../store/useGameStore';
import { ActionDock } from './ActionDock';
import { CheckSheet } from './CheckSheet';
import { Coach } from './Coach';
import { CriticalBanner } from './CriticalBanner';
import { InterruptTray } from './InterruptTray';
import { LineStrip } from './LineStrip';
import { PassGrid } from './PassGrid';
import { RailStrip } from './TicketMini';
import { TicketSheet } from './TicketSheet';
import { TopBar } from './TopBar';

const SHAKE: Keyframe[] = [
  { transform: 'none' },
  { transform: 'translate(-4px, 1px)' },
  { transform: 'translate(4px, -1px)' },
  { transform: 'translate(-2px, 1px)' },
  { transform: 'none' },
];

/**
 * The portrait game screen (D-065, D-073): top bar · rail · line · pass · interrupt tray · action dock,
 * with bottom sheets for ticket details and the plate CHECK. Desktop shows the same stage, centred.
 */
export function MobileGame() {
  const stage = useRef<HTMLDivElement>(null);
  const pass = useRef<HTMLDivElement>(null);
  const sheet = useGameStore((s) => s.sheet);
  const [flash, setFlash] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const offs = [
      bus.on('heatChanged', (e) => {
        if (!reduce && e.delta >= 8) pass.current?.animate(SHAKE, { duration: 260 });
      }),
      bus.on('allergyIncident', () => setFlash((n) => n + 1)),
    ];
    return () => offs.forEach((off) => off());
  }, []);

  // A selected plate that left the pass closes its sheet.
  const plateGone = useGameStore((s) => s.sheet?.kind === 'plate' && !s.snap?.plates[s.sheet.id]);
  const ticketGone = useGameStore((s) => s.sheet?.kind === 'ticket' && !s.snap?.tickets[s.sheet.id]);
  useEffect(() => {
    if (plateGone || ticketGone) useGameStore.getState().openSheet(null);
  }, [plateGone, ticketGone]);

  return (
    <div className="flex h-dvh w-full justify-center bg-[#08090a]">
      <div
        ref={stage}
        className="relative flex h-full w-full max-w-[480px] flex-col overflow-hidden bg-night sm:border-x sm:border-steel"
      >
        <TopBar />
        <RailStrip />
        {/* The critical banner covers the line strip: the rail and the plates stay readable and tappable. */}
        <div className="relative">
          <LineStrip />
          <CriticalBanner />
        </div>
        <div ref={pass} className="flex min-h-0 flex-1 flex-col">
          <PassGrid />
        </div>
        <InterruptTray />
        <ActionDock />
        {sheet?.kind === 'ticket' && <TicketSheet key={sheet.id} id={sheet.id} />}
        {sheet?.kind === 'plate' && <CheckSheet key={sheet.id} id={sheet.id} />}
        <Coach stage={stage} />
        {flash > 0 && (
          <div
            key={flash}
            className="anim-flash pointer-events-none absolute inset-0 z-40 shadow-[inset_0_0_120px_40px_rgba(200,66,59,0.75)]"
          />
        )}
      </div>
    </div>
  );
}
