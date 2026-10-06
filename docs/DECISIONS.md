# Decision Log

> Read this before starting any task. Append new decisions at the bottom with the next ID. Never renumber.
> Format: **ID — date — decision.** _Reason._ (Source of the conflict or gap.)

---

### Architecture

**D-001 — 2026-10-06 — The sim is a pure, deterministic TS module. Zustand is a read-only mirror of sim snapshots, not the home of `tick()`.**
_Reason:_ Report 01 puts `tick(deltaTime)` inside the Zustand store, driven by rAF with a variable delta. That breaks operating principle 4 (pure sim, fixed timestep, seeded RNG, headless-testable). Keeping the sim free of Zustand also lets `scripts/balance.ts` run shifts in Node. Report 01's performance advice still applies: rAF lives outside React, narrow selectors, no loops in `useEffect`. (01-stack vs. principle 4)

**D-002 — 2026-10-06 — Folder layout: `src/{sim,data,config,engine,store,audio,ui}` instead of report 01's `src/{core,store,components,types}`.**
_Reason:_ The report's `core/` mixes DOM-facing code (rAF loop, Howler) with pure config, which the sim needs to import. Splitting `engine/` (time and DOM) from `config/` (pure) makes the "sim imports nothing impure" rule enforceable by lint. Types live next to their layer (`sim/state.ts`, `data/schema.ts`) instead of one global `types/index.ts`, which would become a dumping ground. One store replaces `useGameStore` + `useTicketStore` because the sim owns all game state. (01-stack)

**D-003 — 2026-10-06 — Content lives in typed TS data modules (`src/data/*.ts`, `satisfies` schema), not JSON. Game data is bundled, not served from `public/assets/data`.**
_Reason:_ Compile-time checking catches typos in menu ids and mods with zero dependencies (no zod), and agents edit TS data reliably. A `validate.ts` test catches cross-reference errors. Data is still logic-free, so principle 2 holds. `public/assets/data` stays reserved for the audiosprite JSON map, as report 01 intended. (01-stack, principle 2)

**D-004 — 2026-10-06 — In-house sfc32 PRNG (~15 lines) with RNG state stored in `SimState` and forked per subsystem.**
_Reason:_ Reports don't cover RNG. A dependency isn't worth it. Storing state in `SimState` makes snapshots fully deterministic and replayable. Forked streams keep systems from reshuffling each other when one adds a roll. (gap)

**D-005 — 2026-10-06 — Fixed timestep 50 ms (20 Hz), integer-ms time. Value lives in `tuning.sim.tickMs`.**
_Reason:_ Nothing in the game needs sub-50 ms resolution (no physics, and timers are seconds long). 20 Hz keeps headless runs fast (6,000 ticks per 5-minute shift) and integer ms avoids float drift. Visual smoothness comes from CSS, not the sim. (gap)

### Scope and design

**D-006 — 2026-10-06 — Night 1 is 3:00 of printer time; the report 02 five-minute timeline is compressed ×0.6. Later nights run 3:30 → 5:00.**
_Reason:_ The owner's Phase 2 definition of done says "a 3-minute Night 1". Report 02 sketches 5 minutes. The owner's brief wins, and the beats keep their order and the quiet patch before the final wave. All durations live in tuning. (02-dynamics vs. brief)

**D-007 — 2026-10-06 — MVP = report 02's "five-minute playable shell" **plus** everything the owner's Phase 3 names (manager, bar, kitchen problems, 86s, mods and allergies, Nights 1–5). Report 02's v2/v3 items not named by the owner stay in v2/v3.**
_Reason:_ Report 02 explicitly keeps 86s, allergies, the manager, the bar, and apps/entrées out of the first playable. The owner's phase plan puts them in Phase 3. The owner's brief is the higher authority, and report 02's "prove the core loop first" still holds because Phase 2 ships Night 1 alone and gameplay sign-off gates the rest. **Flagged for owner confirmation.** (02-dynamics vs. brief)

**D-008 — 2026-10-06 — Two-course tickets (apps + mains, `COURSE 2 - HOLD`) are in MVP (Night 2).**
_Reason:_ The owner wants Nights 1–5 "with escalating pressure", and report 02's progression introduces courses on Night 2. Without coursing, HOLD has no meaning and the game loses report 02's "soul" (synchronization and restraint). (02-dynamics v2 list vs. brief's Nights 1–5)

**D-009 — 2026-10-06 — Allergy is a procedure, never a visual check: ACK ALLERGY before firing → the kitchen follows protocol (+cook time) → the plate arrives with an allergy pick → the player sends it to the right seat. Sending an allergy-seat plate without a pick is an "allergy incident" (−50; ends the shift on Night 5).**
_Reason:_ Report 02 insists the game must not imply that looking at a plate makes it safe, and should only include allergies with a proper workflow. The owner's Phase 3 asks for allergy flags. This satisfies both. (02-dynamics)

**D-010 — 2026-10-06 — Menu items declare a `cookTier` (quick, standard, long). The tier→ms table lives in `tuning.ts`.**
_Reason:_ Principle 2 (adding a menu item never touches engine code) and principle 3 (every cook time in one tuning file) pull against each other. Tiers satisfy both: a new item is data-only, and feel stays centrally tunable. If per-item precision is needed later, add an optional `cookMsOverride` key in tuning (not in data). (principles 2 vs. 3)

**D-011 — 2026-10-06 — HOLD is a state, not a button. Every unfired course is held; "COURSE 2 - HOLD" marks a course that shouldn't fire until it's ready (server fire request, or app sent + eat time). Firing early is allowed but costs −5 if the food lands before the table is ready.**
_Reason:_ The owner's example verbs include "hold" and report 02 defines HOLD as "do not start/release". A separate HOLD button would do nothing that "not pressing FIRE" doesn't already do. Per-item FIRE gives the player real staggering control for synchronization. "Call" from the owner's examples maps to SEND ("HANDS!"). (brief examples vs. 02-dynamics)

**D-012 — 2026-10-06 — The current view is UI state, not sim state. The sim doesn't know where the player is looking.**
_Reason:_ The attention cost of looking away is real because the player physically can't see the window. Putting views in the sim would complicate determinism for no gameplay gain. The bot models attention cost explicitly instead. (gap)

**D-013 — 2026-10-06 — The only non-diegetic HUD is the clock and a single Service Health strip.**
_Reason:_ Report 03 says no floating HUD except a small clock. Report 02 says to show one big service-health score. Both hold. (03 vs. 02)

**D-014 — 2026-10-06 — The MVP has two views: PASS (rail, window, printer, 86 clipboard) and FLOOR (dining door where interrupts wait). Printer close-up, KDS/camera monitor, and others are v2.**
_Reason:_ The owner's premise is "switchable views". Report 03 suggests four (pass, rail, printer, door). Report 02's MVP is one screen. Two views give the core attention trade-off (answer the server or watch the window) without splitting the rail and window, which must be seen together for the core loop to read. (02 vs. 03 vs. brief)

**D-015 — 2026-10-06 — Tickets carry no POS or printer brand in the MVP. Any future invented brand gets a USPTO check by the owner before it appears in art.**
_Reason:_ Report 03: fake brands cost nothing, real ones are risk. A brand isn't needed for the core loop, and choosing and clearing a name is the owner's call. (03-aesthetic)

**D-016 — 2026-10-06 — Skip the "Fake Receipt" font; use Courier Prime (ticket), VT323 (monitor/clock), and Press Start 2P (title cards), all OFL.**
_Reason:_ Report 03 flags conflicting licence histories for Fake Receipt. OFL alternatives remove the risk entirely. (03-aesthetic caveat)

**D-017 — 2026-10-06 — "Rehash" is excluded from game vocabulary.**
_Reason:_ Report 02 couldn't verify it as standard expo jargon. (02-dynamics)

**D-018 — 2026-10-06 — Sending an incomplete course is allowed with a −8 penalty; items not yet up stay live and can be sent later. Rejecting a correct plate costs −3.**
_Reason:_ Report 02 teaches "don't send an incomplete course" but doesn't say whether it's blocked. Allowing it creates a real mistake the player can make under pressure. The unneeded-refire penalty stops "reject everything" from being a safe strategy. Both values are in tuning. (gap)

**D-019 — 2026-10-06 — Interrupt mechanics for bar and manager (report 02 lists them only loosely):** `bar_delay` sets a not-before time on a table (sending food before it costs −5, so the player must _remember_). `manager_push` shrinks grace and doubles late drain for one ticket. `manager_vip` doubles error penalties for one ticket. `server_status` is answered by picking the ticket's real status.
_Reason:_ Report 02 requires interrupts to force a decision or a memory, not a dismissal. Each of these mutates state the player must track. (gap)

**D-020 — 2026-10-06 — Dependencies added beyond report 01: `typescript`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `@types/howler`, `vitest`, `eslint` + `typescript-eslint` + `eslint-plugin-react-hooks`, `prettier`, `tsx`.**
_Reason:_ Report 01 lists runtime packages only. Strict TS, linting, formatting, a test runner, and a Node script runner are required by the owner's Phase 1 brief and principles 4 and 6. Vitest shares Vite's config and transformer, so it's the lowest-friction runner. (gap)

**D-021 — 2026-10-06 — Use the Vite major named in report 01 (6.x) unless it's incompatible with Node 25 or Tailwind 4's plugin at scaffold time. Verify with `npm view` in Phase 1 and log the exact versions.**
_Reason:_ Report 01 itself notes that its Vite and Tailwind minors are "projected". Pin exact versions in the lockfile. (01-stack caveat)

**D-022 — 2026-10-06 — Tailwind 4 uses CSS-first config (`@import "tailwindcss"` + `@theme` in `index.css`) via `@tailwindcss/vite`. There's no `tailwind.config.js`.**
_Reason:_ Report 01's folder tree lists `tailwind.config.js`, which is the v3 pattern. It's outdated for Tailwind 4. (01-stack, outdated)

**D-023 — 2026-10-06 — `lucide-react` is deferred and not installed.**
_Reason:_ Report 03 makes UI diegetic (no floating icons). Report 01's version "1.52.0" is also suspect. If a menu screen needs icons later, verify the version and add it then. (01 vs. 03)

**D-024 — 2026-10-06 — Audio sprite format is Opus/WebM + AAC/M4A (report 03), not report 01's webm + mp3. `audiosprite` (needs ffmpeg) is used in Phase 4 only. Placeholder WAVs are generated by a Node script with no ffmpeg.**
_Reason:_ Report 03 shows MP3 clicks on loops, and Safari's Opus support is uneven, so AAC is the right fallback. ffmpeg isn't installed on the dev machine. Report 01's "audiosprite 0.9.x" is unverified (npm has historically shown 0.7.x), so check it in Phase 4. (01 vs. 03, environment)

**D-025 — 2026-10-06 — The debug overlay ships in all builds but only mounts in dev or with `?debug=1`.**
_Reason:_ The owner playtests on Vercel previews, where the overlay is most useful. Its code is small. (principle 5)

**D-026 — 2026-10-06 — Night numbers are split: shift files (`src/data/shifts/`) hold _content_ (scripted beats, which features are on); `tuning.nights[id]` holds the _numbers_ (durations, procedural arrival ranges, defect and interrupt rates).**
_Reason:_ This reconciles principle 2 (nights in data) with principle 3 (every difficulty number in one file). Scripted beat times are authored content but can be scaled by `tuning.shift.timeScale`. (principles 2 vs. 3)

**D-027 — 2026-10-06 — Progress is saved with Zustand `persist` → localStorage (highest night cleared, best grade per night, settings). No mid-shift saves.**
_Reason:_ Report 01 recommends it. Mid-shift saves add complexity for a 3–5 minute session. (01-stack)

**D-028 — 2026-10-06 — Housekeeping: renamed `docs/research/03-aesthetic.md.md` → `03-aesthetic.md`. npm is the package manager.**
_Reason:_ Fixes the double extension so it matches the owner's brief. npm is already installed and is what report 01 assumes.

### Phase 1 — Scaffold

**D-029 — 2026-10-06 — Shipped media (audio sprites, fonts, images) live in `src/assets/` and are imported, so Vite content-hashes them. `public/` only holds unhashed files (favicon). Supersedes the `public/assets/*` paths in report 01 and the first ARCHITECTURE draft.**
_Reason:_ `vercel.json` marks `/assets/*` as `immutable` for a year. Unhashed files under `public/assets/` would then never update in players' browsers after we replace a sound. Hashed imports make the immutable header safe. (01-stack, found while writing vercel.json)

**D-030 — 2026-10-06 — Exact versions pinned (`npm install -E`):** react/react-dom 19.3.0, zustand 5.0.15, howler 2.2.4, vite **6.4.4**, @vitejs/plugin-react **5.2.0**, tailwindcss + @tailwindcss/vite 4.3.3, typescript **5.9.3**, vitest 5.0.3, eslint **9.39.5** + @eslint/js 9.39.5, typescript-eslint 8.71.1, eslint-plugin-react-hooks 7.1.1, globals 17.13.0, prettier 3.9.9, tsx 4.23.15, @types/node 24.
_Reason:_ npm's latest versions have moved past the report: Vite 8, TypeScript 7, ESLint 10, plugin-react 6. Per D-021 we stay on report 01's Vite 6. plugin-react 6 requires Vite 8, so we use 5.2.0. typescript-eslint supports TypeScript `<6.1`, so TS 7 is off the table. ESLint 9 is the most-documented flat-config major. Vitest 5 supports Vite `^6.4`. **Upgrade path:** move Vite 8 and plugin-react 6 together in one dedicated branch if we ever need them.

**D-031 — 2026-10-06 — `engine/runtime.ts` writes into the store, and the store imports only sim types.**
_Reason:_ This avoids an engine↔store import cycle and keeps "only the engine sets snapshots" true by construction. AGENTS.md's folder table is updated.

**D-032 — 2026-10-06 — The Phase 1 heartbeat event is `secondElapsed` (once per sim second), not a per-tick event. `shiftStarted` is emitted by the sim on its first step.**
_Reason:_ A per-tick event would flood the bus at 10× speed with no listener that needs it. ROADMAP 1.5's "tick debug event" is satisfied by this.

**D-033 — 2026-10-06 — Frame delta is clamped to `tuning.sim.maxFrameMs` (250 ms) before speed applies, so the sim runs slower than real time when the browser delivers fewer than 4 frames/s.**
_Reason:_ A backgrounded or throttled tab must not wake up and dump a minute of tickets on the player. Verified in the in-app browser pane, which throttles rAF to about 4 fps when unfocused: the counter advances at roughly real time or slower there. At normal frame rates the accumulator is exact (unit-tested: 60 frames → 20 ticks).

**D-034 — 2026-10-06 — The sim purity lint rules also cover `src/data` and `src/config`.**
_Reason:_ The sim imports both, so an impure import there would leak into the sim. Verified by a probe file: `Math.random`, `Date`, `setTimeout`, a zustand import, and an engine import each produce a lint error.
