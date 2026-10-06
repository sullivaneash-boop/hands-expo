# src/audio — sound

- `audio.ts`: the `AudioManager` singleton (vanilla howler, outside React). **Never `react-howler`, never `<audio>`.**
- `soundMap.ts`: data mapping `SimEvent` type → sprite sound ids. Sounds are triggered by bus events, never by sim code.
- Phases 1–3 use generated placeholder beeps (`scripts/gen-placeholder-audio.ts`); Phase 4 swaps in the licensed sprite (see STYLE.md §6 and ASSETS.md).
