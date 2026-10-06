# src/data — game content

Typed TS data modules (D-003): menu, mods, servers, interrupts, dialogue, shifts. **No logic** except `validate.ts`.

- Types live in `schema.ts`; content files use `as const satisfies …`.
- `index.ts` exports the `content` bundle the sim receives via `ctx`.
- `validate.ts` checks cross-references and runs in `npm test`.
- Feel and difficulty numbers do **not** go here; they go in `src/config/tuning.ts` (D-026).
- See AGENTS.md §4 for how to add a menu item, interrupt, or night.
