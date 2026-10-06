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

### Phase 2 — Grey-box core loop

**D-035 — 2026-10-06 — One branch per phase (`p2/grey-box`) with one commit per ROADMAP task, instead of one branch per task.**
_Reason:_ The owner playtests at phase gates and doesn't want PRs. Thirteen micro-branches merged into `main` would only add ceremony. Commits stay task-sized and `main` only moves at phase approval.

**D-036 — 2026-10-06 — The sim updates state through a copy-on-write `Work` draft (`src/sim/work.ts`). An entity is `structuredClone`d on first touch in a step; untouched tickets and plates keep their object identity.**
_Reason:_ This gives immutable snapshots (cheap React selectors, safe replays) without hand-written spread chains in every system, which agents get wrong. Verified by a test that steps 400 ticks and asserts the previous state never changes.

**D-037 — 2026-10-06 — Plate defects use a fallback chain: wrongDoneness → wrongMod, missingComponent → wrongMod, wrongMod → wrongDish, then none. Errors are judged by comparing ordered vs. made (`plateError`), not by trusting the rolled defect. A swapped side counts as wrongMod; a missing side counts as missingComponent.**
_Reason:_ Not every defect applies to every item (a salmon has no doneness). Judging by comparison means a fizzled defect can never be punished. SIDE FRIES has nothing that can go wrong, so its defects fizzle (tested).

**D-038 — 2026-10-06 — The sync bonus requires a course of 2+ plates, sent whole in one HANDS!, with no bad plates, and all plates landing within `syncWindowMs`.**
_Reason:_ Without the 2-plate rule, every one-plate ticket would earn it for free.

**D-039 — 2026-10-06 — `server_status` is judged against the board at the moment the player answers. If the ticket clears first, the question resolves as "moot" with no penalty. The FLOOR view hides the rail, so the player answers from memory.**
_Reason:_ Answering from memory is the GDD §4 attention trade-off. Judging at answer time means a player who checks the rail, turns around, and answers fast is never wrong because the board moved. "Moot" avoids punishing the player for clearing the table, which is the best outcome.

**D-040 — 2026-10-06 — Final score = 0.4·health + 0.25·time + 0.25·accuracy + 0.1·pass (weights in tuning). The Ticket Time sub-score counts tickets still open at shift end at their age then. A lost shift is capped at score 49 and grade F.**
_Reason:_ In playtest, losing with 1 of 7 tickets cleared showed "time 100", which rewarded abandoning tickets. Fixed and covered by a test.

**D-041 — 2026-10-06 — Health is an integer. Late drain is charged once per whole second per late ticket, aggregated into one `healthChanged` per tick.**
_Reason:_ Integer health keeps the state exact and the HUD honest. Per-second charging matches GDD "−1/s" without fractional health.

**D-042 — 2026-10-06 — The wall clock shows 1.5 game minutes per sim second (`tuning.shift.clockMinutesPerSec`), so 5:00 PM becomes about 9:30 PM over Night 1's 3:00. Ticket print times use the same clock.**
_Reason:_ A clock running at real seconds would read 5:03 PM at close and kill the "service is passing" mood. Display only; no rule depends on it.

**D-043 — 2026-10-06 — Debug adds `+10s` / `+30s` fast-forward (runs ticks immediately), a "reveal bad plates" toggle, and (in debug builds only) `window.__hands = { engine, store }`.**
_Reason:_ Principle 5. The in-app browser throttles rAF to about 1 fps when unfocused, so time-based playtesting there needs fast-forward. `__hands` lets agents run scripted playtests through the real runtime. Fast-forward is equivalent to playing that time with no input, so determinism holds.

**D-044 — 2026-10-06 — The placeholder sprite has 5 sounds (print, food_up, interrupt, error, send), not just the 2 the brief named, generated as one WAV by `scripts/gen-placeholder-audio.ts`.**
_Reason:_ Each extra sound is a few lines of synthesis, and the interrupt cue is how the player knows to turn to the door. The event→sound mapping in `soundMap.ts` is final; Phase 4 only swaps the sprite.

**D-045 — 2026-10-06 — Window plates show table, seat and dish name only. Doneness, mods and sides appear only on the CHECK card.**
_Reason:_ CHECK must cost something (a click and a read), or there's no QC skill. Report 02: "the player should lose because they lost the thread."

### Brand assets (owner request, `feat/brand-assets`)

**D-046 — 2026-10-06 — Brand files live in `public/assets/brand/` (owner-specified) as unhashed, stable URLs. `vercel.json`'s immutable cache rule now matches `/assets/((?!brand/).*)`, so brand files get Vercel's default revalidating cache. Amends D-029.**
_Reason:_ Favicons, the manifest icon, the apple-touch icon, and the OG image are fetched by browsers and crawlers at fixed URLs, so they can't be content-hashed. Under the old rule they'd have been cached as immutable for a year, and a replaced logo would never update. Game media (audio sprite, fonts) stays in `src/assets/` (hashed).

**D-047 — 2026-10-06 — Brand palette tokens are added to `:root` in `src/index.css`. Where the brand sheet differs from STYLE.md, STYLE.md wins per the owner's rule: `--ticket-paper` #F2EFE6 (brand #F2EDE4), `--heat-amber` #E8A33D (brand #E8A13A), `--ticket-red` #C8423B (brand #C8372D). `--thermal-black` keeps #1A1A1A because STYLE.md has no equivalent. The `<meta name="theme-color">` moves from #0E1012 to #1A1A1A to match the manifest. Flagged for the owner.**
_Reason:_ The owner's instruction. The brand art itself uses #C8372D and #1A1A1A, so the owner may prefer to update STYLE.md to the brand values instead; that's their call, and it's a one-line token change.

**D-048 — 2026-10-06 — SVG cleanup was limited to what the owner allowed:** each file's Illustrator `id="Layer_2" data-name="Layer 2"` was stripped, and the one exact palette fill, `#1a1a1a`, became `var(--thermal-black, #1a1a1a)` in logo-wordmark, logo-wordmark-mono and logo-lockup-stacked. `#c8372d` was **not** tokenized: `--ticket-red` resolves to STYLE's #C8423B, so swapping it would recolor the art. No empty groups existed.
_Reason:_ With the fallback, rendering is identical. Verified by rasterizing all five SVGs before and after with sharp: 0 differing bytes.

**D-049 — 2026-10-06 — Added `sharp` 0.35.5 (devDependency, pinned) and `scripts/build-icons.mjs` (`npm run build:icons`), which generates favicon.svg, favicon-32.png, icon-512.png and apple-touch-icon.png from icon-mark.svg.**
_Reason:_ Owner request, so icons can be regenerated whenever the mark changes. Dev-only; not in the shipped bundle.

**D-050 — 2026-10-06 — The existing Phase 2 title screen was restyled to the brand spec (keyart full bleed, stacked lockup in the upper third, one START SHIFT button) rather than adding a second screen. The manager's how-to sticky note stays (it's the game's only instructions and isn't a button). The lockup's empty viewBox margin is cropped in CSS (`aspect-ratio` + `object-fit`); the file is untouched. No inverse lockup is used because the stacked lockup carries its own paper ground.**
_Reason:_ A title screen already existed, and the owner asked not to edit the art. Verified at 1280×800 and 375×812 (no horizontal scroll; START SHIFT enters Night 1).

**D-051 — 2026-10-06 — `feat/brand-assets` is branched from `p2/grey-box`, not `main`.**
_Reason:_ Phase 2 isn't merged yet, and the title screen and game loop the brand wires into only exist there. Merge order: `p2/grey-box` → `main`, then `feat/brand-assets`.

**D-052 — 2026-10-06 — Open Graph/Twitter `og:image` uses the absolute production URL `https://hands-expo.vercel.app/assets/brand/og-image.png`.**
_Reason:_ Crawlers require absolute image URLs. The file hasn't been provided, so link previews show no image until `og-image.png` is dropped into `public/assets/brand/`. No other change is needed.
