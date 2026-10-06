# Decision Log

> Read this before starting any task. Append new decisions at the bottom with the next ID. Never renumber.
> Format: **ID — date — decision.** *Reason.* (Source of the conflict or gap.)

---

### Architecture

**D-001 — 2026-10-06 — The sim is a pure, deterministic TS module. Zustand is a read-only mirror of sim snapshots, not the home of `tick()`.**
*Reason:* Report 01 puts `tick(deltaTime)` inside the Zustand store, driven by rAF with a variable delta. That breaks operating principle 4 (pure sim, fixed timestep, seeded RNG, headless-testable). Keeping the sim free of Zustand also lets `scripts/balance.ts` run shifts in Node. Report 01's performance advice still applies: rAF lives outside React, narrow selectors, no loops in `useEffect`. (01-stack vs. principle 4)

**D-002 — 2026-10-06 — Folder layout: `src/{sim,data,config,engine,store,audio,ui}` instead of report 01's `src/{core,store,components,types}`.**
*Reason:* The report's `core/` mixes DOM-facing code (rAF loop, Howler) with pure config, which the sim needs to import. Splitting `engine/` (time and DOM) from `config/` (pure) makes the "sim imports nothing impure" rule enforceable by lint. Types live next to their layer (`sim/state.ts`, `data/schema.ts`) instead of one global `types/index.ts`, which would become a dumping ground. One store replaces `useGameStore` + `useTicketStore` because the sim owns all game state. (01-stack)

**D-003 — 2026-10-06 — Content lives in typed TS data modules (`src/data/*.ts`, `satisfies` schema), not JSON. Game data is bundled, not served from `public/assets/data`.**
*Reason:* Compile-time checking catches typos in menu ids and mods with zero dependencies (no zod), and agents edit TS data reliably. A `validate.ts` test catches cross-reference errors. Data is still logic-free, so principle 2 holds. `public/assets/data` stays reserved for the audiosprite JSON map, as report 01 intended. (01-stack, principle 2)

**D-004 — 2026-10-06 — In-house sfc32 PRNG (~15 lines) with RNG state stored in `SimState` and forked per subsystem.**
*Reason:* Reports don't cover RNG. A dependency isn't worth it. Storing state in `SimState` makes snapshots fully deterministic and replayable. Forked streams keep systems from reshuffling each other when one adds a roll. (gap)

**D-005 — 2026-10-06 — Fixed timestep 50 ms (20 Hz), integer-ms time. Value lives in `tuning.sim.tickMs`.**
*Reason:* Nothing in the game needs sub-50 ms resolution (no physics, and timers are seconds long). 20 Hz keeps headless runs fast (6,000 ticks per 5-minute shift) and integer ms avoids float drift. Visual smoothness comes from CSS, not the sim. (gap)

### Scope and design

**D-006 — 2026-10-06 — Night 1 is 3:00 of printer time; the report 02 five-minute timeline is compressed ×0.6. Later nights run 3:30 → 5:00.**
*Reason:* The owner's Phase 2 definition of done says "a 3-minute Night 1". Report 02 sketches 5 minutes. The owner's brief wins, and the beats keep their order and the quiet patch before the final wave. All durations live in tuning. (02-dynamics vs. brief)

**D-007 — 2026-10-06 — MVP = report 02's "five-minute playable shell" **plus** everything the owner's Phase 3 names (manager, bar, kitchen problems, 86s, mods and allergies, Nights 1–5). Report 02's v2/v3 items not named by the owner stay in v2/v3.**
*Reason:* Report 02 explicitly keeps 86s, allergies, the manager, the bar, and apps/entrées out of the first playable. The owner's phase plan puts them in Phase 3. The owner's brief is the higher authority, and report 02's "prove the core loop first" still holds because Phase 2 ships Night 1 alone and gameplay sign-off gates the rest. **Flagged for owner confirmation.** (02-dynamics vs. brief)

**D-008 — 2026-10-06 — Two-course tickets (apps + mains, `COURSE 2 - HOLD`) are in MVP (Night 2).**
*Reason:* The owner wants Nights 1–5 "with escalating pressure", and report 02's progression introduces courses on Night 2. Without coursing, HOLD has no meaning and the game loses report 02's "soul" (synchronization and restraint). (02-dynamics v2 list vs. brief's Nights 1–5)

**D-009 — 2026-10-06 — Allergy is a procedure, never a visual check: ACK ALLERGY before firing → the kitchen follows protocol (+cook time) → the plate arrives with an allergy pick → the player sends it to the right seat. Sending an allergy-seat plate without a pick is an "allergy incident" (−50; ends the shift on Night 5).**
*Reason:* Report 02 insists the game must not imply that looking at a plate makes it safe, and should only include allergies with a proper workflow. The owner's Phase 3 asks for allergy flags. This satisfies both. (02-dynamics)

**D-010 — 2026-10-06 — Menu items declare a `cookTier` (quick, standard, long). The tier→ms table lives in `tuning.ts`.**
*Reason:* Principle 2 (adding a menu item never touches engine code) and principle 3 (every cook time in one tuning file) pull against each other. Tiers satisfy both: a new item is data-only, and feel stays centrally tunable. If per-item precision is needed later, add an optional `cookMsOverride` key in tuning (not in data). (principles 2 vs. 3)

**D-011 — 2026-10-06 — HOLD is a state, not a button. Every unfired course is held; "COURSE 2 - HOLD" marks a course that shouldn't fire until it's ready (server fire request, or app sent + eat time). Firing early is allowed but costs −5 if the food lands before the table is ready.**
*Reason:* The owner's example verbs include "hold" and report 02 defines HOLD as "do not start/release". A separate HOLD button would do nothing that "not pressing FIRE" doesn't already do. Per-item FIRE gives the player real staggering control for synchronization. "Call" from the owner's examples maps to SEND ("HANDS!"). (brief examples vs. 02-dynamics)

**D-012 — 2026-10-06 — The current view is UI state, not sim state. The sim doesn't know where the player is looking.**
*Reason:* The attention cost of looking away is real because the player physically can't see the window. Putting views in the sim would complicate determinism for no gameplay gain. The bot models attention cost explicitly instead. (gap)

**D-013 — 2026-10-06 — The only non-diegetic HUD is the clock and a single Service Health strip.**
*Reason:* Report 03 says no floating HUD except a small clock. Report 02 says to show one big service-health score. Both hold. (03 vs. 02)

**D-014 — 2026-10-06 — The MVP has two views: PASS (rail, window, printer, 86 clipboard) and FLOOR (dining door where interrupts wait). Printer close-up, KDS/camera monitor, and others are v2.**
*Reason:* The owner's premise is "switchable views". Report 03 suggests four (pass, rail, printer, door). Report 02's MVP is one screen. Two views give the core attention trade-off (answer the server or watch the window) without splitting the rail and window, which must be seen together for the core loop to read. (02 vs. 03 vs. brief)

**D-015 — 2026-10-06 — Tickets carry no POS or printer brand in the MVP. Any future invented brand gets a USPTO check by the owner before it appears in art.**
*Reason:* Report 03: fake brands cost nothing, real ones are risk. A brand isn't needed for the core loop, and choosing and clearing a name is the owner's call. (03-aesthetic)

**D-016 — 2026-10-06 — Skip the "Fake Receipt" font; use Courier Prime (ticket), VT323 (monitor/clock), and Press Start 2P (title cards), all OFL.**
*Reason:* Report 03 flags conflicting licence histories for Fake Receipt. OFL alternatives remove the risk entirely. (03-aesthetic caveat)

**D-017 — 2026-10-06 — "Rehash" is excluded from game vocabulary.**
*Reason:* Report 02 couldn't verify it as standard expo jargon. (02-dynamics)

**D-018 — 2026-10-06 — Sending an incomplete course is allowed with a −8 penalty; items not yet up stay live and can be sent later. Rejecting a correct plate costs −3.**
*Reason:* Report 02 teaches "don't send an incomplete course" but doesn't say whether it's blocked. Allowing it creates a real mistake the player can make under pressure. The unneeded-refire penalty stops "reject everything" from being a safe strategy. Both values are in tuning. (gap)

**D-019 — 2026-10-06 — Interrupt mechanics for bar and manager (report 02 lists them only loosely):** `bar_delay` sets a not-before time on a table (sending food before it costs −5, so the player must *remember*). `manager_push` shrinks grace and doubles late drain for one ticket. `manager_vip` doubles error penalties for one ticket. `server_status` is answered by picking the ticket's real status.
*Reason:* Report 02 requires interrupts to force a decision or a memory, not a dismissal. Each of these mutates state the player must track. (gap)

**D-020 — 2026-10-06 — Dependencies added beyond report 01: `typescript`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `@types/howler`, `vitest`, `eslint` + `typescript-eslint` + `eslint-plugin-react-hooks`, `prettier`, `tsx`.**
*Reason:* Report 01 lists runtime packages only. Strict TS, linting, formatting, a test runner, and a Node script runner are required by the owner's Phase 1 brief and principles 4 and 6. Vitest shares Vite's config and transformer, so it's the lowest-friction runner. (gap)

**D-021 — 2026-10-06 — Use the Vite major named in report 01 (6.x) unless it's incompatible with Node 25 or Tailwind 4's plugin at scaffold time. Verify with `npm view` in Phase 1 and log the exact versions.**
*Reason:* Report 01 itself notes that its Vite and Tailwind minors are "projected". Pin exact versions in the lockfile. (01-stack caveat)

**D-022 — 2026-10-06 — Tailwind 4 uses CSS-first config (`@import "tailwindcss"` + `@theme` in `index.css`) via `@tailwindcss/vite`. There's no `tailwind.config.js`.**
*Reason:* Report 01's folder tree lists `tailwind.config.js`, which is the v3 pattern. It's outdated for Tailwind 4. (01-stack, outdated)

**D-023 — 2026-10-06 — `lucide-react` is deferred and not installed.**
*Reason:* Report 03 makes UI diegetic (no floating icons). Report 01's version "1.52.0" is also suspect. If a menu screen needs icons later, verify the version and add it then. (01 vs. 03)

**D-024 — 2026-10-06 — Audio sprite format is Opus/WebM + AAC/M4A (report 03), not report 01's webm + mp3. `audiosprite` (needs ffmpeg) is used in Phase 4 only. Placeholder WAVs are generated by a Node script with no ffmpeg.**
*Reason:* Report 03 shows MP3 clicks on loops, and Safari's Opus support is uneven, so AAC is the right fallback. ffmpeg isn't installed on the dev machine. Report 01's "audiosprite 0.9.x" is unverified (npm has historically shown 0.7.x), so check it in Phase 4. (01 vs. 03, environment)

**D-025 — 2026-10-06 — The debug overlay ships in all builds but only mounts in dev or with `?debug=1`.**
*Reason:* The owner playtests on Vercel previews, where the overlay is most useful. Its code is small. (principle 5)

**D-026 — 2026-10-06 — Night numbers are split: shift files (`src/data/shifts/`) hold *content* (scripted beats, which features are on); `tuning.nights[id]` holds the *numbers* (durations, procedural arrival ranges, defect and interrupt rates).**
*Reason:* This reconciles principle 2 (nights in data) with principle 3 (every difficulty number in one file). Scripted beat times are authored content but can be scaled by `tuning.shift.timeScale`. (principles 2 vs. 3)

**D-027 — 2026-10-06 — Progress is saved with Zustand `persist` → localStorage (highest night cleared, best grade per night, settings). No mid-shift saves.**
*Reason:* Report 01 recommends it. Mid-shift saves add complexity for a 3–5 minute session. (01-stack)

**D-028 — 2026-10-06 — Housekeeping: renamed `docs/research/03-aesthetic.md.md` → `03-aesthetic.md`. npm is the package manager.**
*Reason:* Fixes the double extension so it matches the owner's brief. npm is already installed and is what report 01 assumes.
