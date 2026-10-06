# scripts — Node tooling (run with `tsx`)

- `gen-placeholder-audio.ts` (Phase 2): writes placeholder beep WAVs and the Howler sprite map.
- `balance.ts` (Phase 3): runs N headless shifts with the bot and writes metrics to `scripts/out/` (gitignored).

May import `src/sim`, `src/data`, `src/config`. Never the UI or engine.
