import type { SimEvent, SimEventType } from '../sim';

/**
 * Data: which sprite sound plays for which sim event (STYLE.md §6), with mix level and pitch jitter
 * so repeats don't stack identically. Phase 4 swaps the sprite; this map stays.
 */
export interface SoundCue {
  id: string;
  volume: number;
  /** ± fraction of random playback-rate variation. */
  jitter?: number;
}

type CueFor = SoundCue | ((e: SimEvent) => SoundCue | null);

export const soundMap: Partial<Record<SimEventType, CueFor>> = {
  ticketPrinted: { id: 'print', volume: 0.55 },
  plateUp: { id: 'plate', volume: 0.6, jitter: 0.04 },
  courseSent: { id: 'bell', volume: 0.55, jitter: 0.02 },
  plateRefired: { id: 'scrape', volume: 0.6 },
  plateDied: { id: 'wilt', volume: 0.6 },
  plateDropped: { id: 'scrape', volume: 0.5 },
  interruptArrived: { id: 'door', volume: 0.7, jitter: 0.03 },
  bark: (e) =>
    e.type === 'bark' && e.source === 'kitchen' ? { id: 'clang', volume: 0.45, jitter: 0.05 } : null,
  itemFired: { id: 'tick', volume: 0.5 },
  fired86: { id: 'thunk', volume: 0.7 },
  allergyIncident: { id: 'alarm', volume: 0.7 },
  commandRejected: { id: 'thunk', volume: 0.45 },
};
