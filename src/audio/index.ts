import { bus } from '../engine/bus';
import { AudioManager, type SpriteMap } from './audio';
import { soundMap } from './soundMap';
import sfxUrl from '../assets/audio/synth/sfx.wav?url';
import sfxJson from '../assets/audio/synth/sfx.json';
import bedUrl from '../assets/audio/synth/kitchen-loop.wav?url';

let started = false;

/** Load audio and subscribe to sim events. Call once at boot; Howler unlocks on the first click. */
export function initAudio(): void {
  if (started) return;
  started = true;
  AudioManager.load({
    sfx: { src: [sfxUrl], sprite: sfxJson as unknown as SpriteMap },
    ambience: { src: [bedUrl] },
    format: ['wav'],
  });
  bus.onAny((event) => {
    const entry = soundMap[event.type];
    const cue = typeof entry === 'function' ? entry(event) : entry;
    if (!cue) return;
    const rate = cue.jitter ? 1 + (Math.random() * 2 - 1) * cue.jitter : undefined;
    AudioManager.play(cue.id, { volume: cue.volume, ...(rate ? { rate } : {}) });
  });
}

export { AudioManager };
