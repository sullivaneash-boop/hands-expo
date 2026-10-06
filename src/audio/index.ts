import { bus } from '../engine/bus';
import { AudioManager, type SpriteMap } from './audio';
import { soundMap } from './soundMap';
import spriteUrl from '../assets/audio/placeholder/sprite.wav?url';
import spriteJson from '../assets/audio/placeholder/sprite.json';

let started = false;

/** Load the sprite and subscribe to sim events. Call once at boot; Howler unlocks on first click. */
export function initAudio(): void {
  if (started) return;
  started = true;
  AudioManager.load([spriteUrl], spriteJson as unknown as SpriteMap, ['wav']);
  bus.onAny((event) => {
    for (const id of soundMap[event.type] ?? []) AudioManager.play(id);
  });
}

export { AudioManager };
