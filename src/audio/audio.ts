import { Howl, Howler } from 'howler';

/**
 * Global audio singleton (vanilla howler, outside React — report 01). Never react-howler, never <audio> tags.
 * A small bank of clips (each a Howl, optionally with sprite regions) + one looping ambience bed.
 */
export type SpriteMap = Record<string, [offsetMs: number, durationMs: number]>;

export interface ClipDef {
  src: string[];
  sprite?: SpriteMap;
  format?: string[];
}

export interface PlayOpts {
  sprite?: string;
  volume?: number;
  rate?: number;
  /** Fade to silence over this many ms before the region ends (cut recordings cleanly). */
  fadeOutMs?: number;
}

const clips = new Map<string, { howl: Howl; def: ClipDef }>();
let bed: Howl | null = null;
let bedId: number | null = null;
let bedTarget = 0;

export const AudioManager = {
  load(defs: Record<string, ClipDef>, ambience?: ClipDef): void {
    for (const { howl } of clips.values()) howl.unload();
    clips.clear();
    for (const [id, def] of Object.entries(defs)) {
      const howl = new Howl({
        src: def.src,
        preload: true,
        ...(def.sprite ? { sprite: def.sprite } : {}),
        ...(def.format ? { format: def.format } : {}),
      });
      clips.set(id, { howl, def });
    }
    bed?.unload();
    // Long beds stream through HTML5 audio so minutes of PCM aren't decoded into memory (STYLE §6).
    bed = ambience
      ? new Howl({
          src: ambience.src,
          loop: true,
          volume: 0,
          html5: true,
          preload: true,
          ...(ambience.format ? { format: ambience.format } : {}),
        })
      : null;
  },

  /** Play a clip (or one sprite region of it). Returns the region length in ms if known. */
  play(clipId: string, opts: PlayOpts = {}): number | null {
    const clip = clips.get(clipId);
    if (!clip) return null;
    const { howl, def } = clip;
    const id = opts.sprite ? howl.play(opts.sprite) : howl.play();
    const volume = opts.volume ?? 1;
    howl.volume(volume, id);
    if (opts.rate !== undefined) howl.rate(opts.rate, id);
    const lengthMs = opts.sprite ? (def.sprite?.[opts.sprite]?.[1] ?? null) : null;
    if (opts.fadeOutMs && lengthMs !== null) {
      const fade = opts.fadeOutMs;
      setTimeout(() => howl.fade(volume, 0, fade, id), Math.max(0, lengthMs - fade));
    }
    return lengthMs;
  },

  /** Length of a sprite region in ms (null if unknown). */
  lengthOf(clipId: string, sprite?: string): number | null {
    return sprite ? (clips.get(clipId)?.def.sprite?.[sprite]?.[1] ?? null) : null;
  },

  /** Fade the ambience bed in/out, or to a new level (e.g. louder at the door). */
  ambience(volume: number): void {
    if (!bed || volume === bedTarget) return;
    const from = bedId !== null ? (bed.volume(bedId) as number) : 0;
    bedTarget = volume;
    if (volume > 0) {
      if (bedId === null || !bed.playing(bedId)) bedId = bed.play();
      bed.fade(from, volume, 700, bedId);
    } else if (bedId !== null) {
      const id = bedId;
      bed.fade(from, 0, 600, id);
      bed.once(
        'fade',
        () => {
          if (bedTarget === 0) bed?.pause(id);
        },
        id,
      );
    }
  },

  setMuted(muted: boolean): void {
    Howler.mute(muted);
  },
};
