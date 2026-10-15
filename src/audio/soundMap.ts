import type { SimEvent, SimEventType } from '../sim';

/**
 * Data: what plays for each sim event (STYLE.md §6). Recorded clips come from the owner (D-062);
 * the 'synth' clip is the generated sprite (door, clang, tick, thunk, scrape, wilt).
 * No bell and no alarm/buzzer (owner preference).
 */
export interface SoundCue {
  clip: string;
  sprite?: string;
  volume: number;
  /** ± fraction of random playback-rate variation, so repeats don't stack identically. */
  jitter?: number;
  /** Start this long after the event (ms), or after the previous cue in the list ends ('after'). */
  delay?: number | 'after';
  fadeOutMs?: number;
}

/** Printer length follows the ticket: short chits chatter briefly, party tickets run long (STYLE §4). */
const printerFor = (lineCount: number) => (lineCount <= 12 ? 'short' : lineCount <= 18 ? 'medium' : 'long');

/** Two plate recordings: alternate-ish by random pick. */
const plate = (volume: number): SoundCue => ({
  clip: Math.random() < 0.5 ? 'plate1' : 'plate2',
  volume,
  jitter: 0.04,
});

export const soundMap: Partial<Record<SimEventType, (e: SimEvent) => SoundCue[]>> = {
  ticketPrinted: (e) =>
    e.type === 'ticketPrinted'
      ? [
          { clip: 'printer', sprite: printerFor(e.lineCount), volume: 0.45, fadeOutMs: 140 },
          { clip: 'tear', volume: 0.6, jitter: 0.05, delay: 'after' },
        ]
      : [],
  plateUp: () => [plate(0.45)],
  courseSent: () => [plate(0.25)],
  plateRefired: () => [{ clip: 'synth', sprite: 'scrape', volume: 0.55 }],
  plateDropped: () => [{ clip: 'synth', sprite: 'scrape', volume: 0.5 }],
  plateDied: () => [{ clip: 'synth', sprite: 'wilt', volume: 0.5 }],
  interruptArrived: () => [{ clip: 'synth', sprite: 'door', volume: 0.6, jitter: 0.03 }],
  bark: (e) =>
    e.type === 'bark' && e.source === 'kitchen'
      ? [{ clip: 'synth', sprite: 'clang', volume: 0.4, jitter: 0.05 }]
      : [],
  itemFired: () => [{ clip: 'synth', sprite: 'tick', volume: 0.45 }],
  fired86: () => [{ clip: 'synth', sprite: 'thunk', volume: 0.5 }],
};
