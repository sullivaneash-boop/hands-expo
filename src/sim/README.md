# src/sim — the simulation

Pure, deterministic game rules: `step(state, commands, ctx) → { state, events }`.

- **Imports:** only `src/sim`, `src/data`, `src/config`. No React, Zustand, Howler, DOM, timers, `Date`, `performance`, or `Math.random`. ESLint enforces this.
- **Time:** integer ms from the tick counter (`tuning.sim.tickMs`). **Randomness:** the RNG streams in `state.rng`.
- **State:** plain JSON, updated immutably. Never mutate `prev`.
- `systems/`: one file per rule area (schedule, tickets, kitchen, pass, interrupts, scoring, shift). `bot/`: the headless bot player (Phase 3).
- Every rule needs a colocated `*.test.ts`.
