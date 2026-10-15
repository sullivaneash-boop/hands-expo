import { bus } from '../engine/bus';
import { AudioManager, type SpriteMap } from './audio';
import { soundMap } from './soundMap';
import synthUrl from '../assets/audio/synth/sfx.wav?url';
import synthJson from '../assets/audio/synth/sfx.json';
import printerUrl from '../assets/audio/recorded/printer.mp3?url';
import tearUrl from '../assets/audio/recorded/paper-tear.mp3?url';
import plate1Url from '../assets/audio/recorded/plate-1.mp3?url';
import plate2Url from '../assets/audio/recorded/plate-2.mp3?url';
import chatterUrl from '../assets/audio/recorded/dining-chatter.mp3?url';

/**
 * The printer recording is one continuous ~9 s run followed by feed pulses. Ticket-length regions
 * are cut from the continuous part (starting where the head kicks in at 0.25 s) and faded out (D-062).
 */
const PRINTER_REGIONS: SpriteMap = { short: [250, 1500], medium: [250, 2500], long: [250, 4000] };

let started = false;

/** Load audio and subscribe to sim events. Call once at boot; Howler unlocks on the first click. */
export function initAudio(): void {
  if (started) return;
  started = true;
  AudioManager.load(
    {
      synth: { src: [synthUrl], sprite: synthJson as unknown as SpriteMap, format: ['wav'] },
      printer: { src: [printerUrl], sprite: PRINTER_REGIONS, format: ['mp3'] },
      tear: { src: [tearUrl], format: ['mp3'] },
      plate1: { src: [plate1Url], format: ['mp3'] },
      plate2: { src: [plate2Url], format: ['mp3'] },
    },
    { src: [chatterUrl], format: ['mp3'] },
  );
  bus.onAny((event) => {
    // Cues play in order; 'after' starts a cue when the previous region ends (printer → tear).
    let cursor = 0;
    for (const cue of soundMap[event.type]?.(event) ?? []) {
      const start = cue.delay === 'after' ? cursor : (cue.delay ?? 0);
      const rate = cue.jitter ? 1 + (Math.random() * 2 - 1) * cue.jitter : undefined;
      const play = () =>
        AudioManager.play(cue.clip, {
          ...(cue.sprite ? { sprite: cue.sprite } : {}),
          volume: cue.volume,
          ...(rate ? { rate } : {}),
          ...(cue.fadeOutMs ? { fadeOutMs: cue.fadeOutMs } : {}),
        });
      if (start > 0) setTimeout(play, start);
      else play();
      cursor = start + (AudioManager.lengthOf(cue.clip, cue.sprite) ?? 0);
    }
  });
}

/** Ambience levels: dining-room chatter is muffled at the pass and louder at the door (it opens onto the floor). */
export const AMBIENCE = { pass: 0.22, door: 0.45 } as const;

export { AudioManager };
