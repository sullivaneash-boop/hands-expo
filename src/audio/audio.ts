import { Howl, Howler } from 'howler';

/**
 * Global audio singleton (vanilla howler, outside React — report 01). Never react-howler, never <audio>.
 * One SFX sprite + one looping ambience bed (STYLE.md §6).
 */
export type SpriteMap = Record<string, [offsetMs: number, durationMs: number]>;

let sfx: Howl | null = null;
let bed: Howl | null = null;
let bedId: number | null = null;

export const AudioManager = {
  load(opts: {
    sfx: { src: string[]; sprite: SpriteMap };
    ambience?: { src: string[] };
    format?: string[];
  }): void {
    sfx?.unload();
    bed?.unload();
    const format = opts.format ? { format: opts.format } : {};
    sfx = new Howl({ src: opts.sfx.src, sprite: opts.sfx.sprite, preload: true, ...format });
    bed = opts.ambience
      ? new Howl({ src: opts.ambience.src, loop: true, volume: 0, preload: true, ...format })
      : null;
  },

  play(id: string, opts: { volume?: number; rate?: number } = {}): void {
    if (!sfx) return;
    const soundId = sfx.play(id);
    sfx.volume(opts.volume ?? 1, soundId);
    if (opts.rate !== undefined) sfx.rate(opts.rate, soundId);
  },

  /** Fade the kitchen bed in (shift running) or out. */
  ambience(on: boolean, volume = 0.3): void {
    if (!bed) return;
    if (on) {
      if (bedId === null || !bed.playing(bedId)) bedId = bed.play();
      bed.fade(bed.volume(bedId) as number, volume, 800, bedId);
    } else if (bedId !== null) {
      const id = bedId;
      bed.fade(bed.volume(id) as number, 0, 600, id);
      bed.once('fade', () => bed?.stop(id), id);
      bedId = null;
    }
  },

  setMuted(muted: boolean): void {
    Howler.mute(muted);
  },
};
