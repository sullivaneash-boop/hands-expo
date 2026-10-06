import { Howl } from 'howler';

/**
 * Global audio singleton (vanilla howler, outside React — report 01). Never react-howler, never <audio>.
 * Phase 1: skeleton only. Phase 2 loads the generated placeholder sprite; Phase 4 swaps in the real one.
 */
export type SpriteMap = Record<string, [offsetMs: number, durationMs: number] | [number, number, boolean]>;

let howl: Howl | null = null;

export const AudioManager = {
  load(src: string[], sprite: SpriteMap, format?: string[]): void {
    howl?.unload();
    howl = new Howl({ src, sprite, preload: true, ...(format ? { format } : {}) });
  },
  setMuted(muted: boolean): void {
    howl?.mute(muted);
  },
  play(id: string, opts: { volume?: number; rate?: number } = {}): void {
    if (!howl) return;
    const soundId = howl.play(id);
    if (opts.volume !== undefined) howl.volume(opts.volume, soundId);
    if (opts.rate !== undefined) howl.rate(opts.rate, soundId);
  },
  get loaded(): boolean {
    return howl?.state() === 'loaded';
  },
};
