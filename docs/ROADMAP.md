# HANDS! — Roadmap

> Ordered task list for Phases 1–4. Each task is one session and one branch. Do them in order unless a task says otherwise.
> **Every** task's DoD also includes: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass; DECISIONS.md is updated if anything non-obvious was decided; the branch is pushed.
> Branch naming: `<phase>/<task-id>-<slug>`, e.g. `p2/2.3-kitchen-cook`.
> The owner approves at the end of each phase. Don't start the next phase before that.

---

## Phase 1 — Scaffold

| ID | Task | Definition of done |
|---|---|---|
| 1.1 | **Init project.** Vite + React + TS (strict) + Tailwind 4 + Zustand + Howler at versions verified with `npm view`; exact versions logged in DECISIONS.md | `npm install` is clean; `npm run dev` serves a page; lockfile committed |
| 1.2 | **Tooling.** ESLint flat config (TS, react-hooks, **sim purity rules**), Prettier, Vitest, `tsx`; scripts `dev/build/preview/test/lint/typecheck/format` | A deliberate `Math.random()` in `src/sim` fails lint; `npm test` runs |
| 1.3 | **Folder skeleton.** Every folder from ARCHITECTURE §3 with a placeholder `index.ts` and a short `README.md` in each major folder (sim, data, config, engine, store, audio, ui, scripts) | Tree matches ARCHITECTURE; each README states the folder's purpose and its import rules |
| 1.4 | **Config + RNG + clock.** `tuning.ts` with sections stubbed; `rng.ts` (sfc32, fork); tick↔ms helpers | Tests: same seed gives the same sequence; forks are independent; `int()` stays in bounds |
| 1.5 | **Sim loop + bus.** `createSim(seed)`, `step(state, commands, ctx)` that advances `tick` and emits a `tick` debug event; `engine/loop.ts` fixed-step accumulator (speed, pause, maxFrame clamp); `engine/bus.ts` | Tests: accumulator runs the right tick count for given deltas and speeds and drops excess after a long frame; bus delivers typed events |
| 1.6 | **Data schemas + one example each.** `schema.ts`; one menu item, one mod, one server, one interrupt, one dialogue line, one shift with one beat; `validate.ts` | Validation test passes; a deliberately broken reference fails it |
| 1.7 | **Boot screen.** `App` boots a session, the loop runs, and a Zustand mirror shows tick count, sim ms, and render FPS on a dark `--color-night` screen | `npm run dev` shows counters incrementing; no React re-render of the root per frame (only the counter component) |
| 1.8 | **Vercel.** `vercel.json` (SPA rewrite, immutable `/assets/` cache); `npm run build && npm run preview` works; README "clone → install → dev" | Production build passes locally; branch pushed. The owner links the repo to Vercel (or the agent does via the Vercel connector with approval), and a preview URL loads the counter |

## Phase 2 — Grey-box core loop (Night 1)

| ID | Task | Definition of done |
|---|---|---|
| 2.1 | **Content: Night 1.** Full menu and mod tables (GDD §9); servers; Night 1 scripted timeline (report 02 timeline ×0.6, D-006) with forced defects at the teaching beats | Validation passes; the timeline has ~10 tickets, one `server_status`, and a quiet beat |
| 2.2 | **Schedule + tickets.** Beats spawn tickets (ids, lateAt, pre-rolled defects); `ticketPrinted` | Test: running N ticks spawns exactly the beats with `atMs ≤ now`, in order |
| 2.3 | **Fire + kitchen.** `fire` (course and single item); cook jobs by tier × jitter; plates arrive with builds and defects; `plateUp` | Test: a fired burger becomes a plate at `firedAt + tierMs ± jitter`; a defect is reflected in the build |
| 2.4 | **Pass: send/refire/die.** `send` (complete, incomplete, sync), `refire` (on the fly), plate death; ticket clear | Tests: full ticket lifecycle; incomplete send leaves the remaining items live; a dead plate auto-refires |
| 2.5 | **Scoring + shift end.** Health deltas per GDD §6, late drain, `ticketLate`, win/lose/overtime, summary stats and grade | Tests: one per scoring rule; health 0 → lost; printer stopped and rail empty → won; overtime cap |
| 2.6 | **Interrupt: server_status.** Arrival from a beat, patience timer, answer choices from real ticket status, outcomes | Tests: correct, wrong, and timeout outcomes and penalties |
| 2.7 | **Replay determinism.** The session records commands; replay reproduces a state hash | Test: random-command fuzz ×20 seeds, replay hash equal |
| 2.8 | **UI: PASS view.** Rail (tickets as styled boxes, age bar), window (plates), plate build card with SEND/REFIRE, FIRE buttons, clock, health strip | Night 1 is playable with the mouse on the PASS view |
| 2.9 | **UI: FLOOR view + switching.** Door with waiting interrupt cards and answer buttons; `A/D`/arrows; an edge indicator on PASS when someone is waiting | Can answer `server_status`; switching shows a 150 ms transition |
| 2.10 | **Screens.** Title ("Clock In" unlocks audio) → Night 1 → Summary (metrics, grade, seed, retry) | Full flow without a reload |
| 2.11 | **Placeholder audio.** `gen-placeholder-audio.ts` → WAV sprite + map; `AudioManager` (Howler singleton); `soundMap.ts` print and food-up | Hear a beep on print and a ding on plate-up; no `react-howler`, no `<audio>` |
| 2.12 | **Debug overlay.** `` ` `` toggle; speed 0.5/1/2/5/10×; pause and step; spawn ticket; trigger interrupt; jump to night; health set; live state JSON (collapsible); seed display and `?seed=` | Every control works on a preview build with `?debug=1` |
| 2.13 | **Playtest pass.** Play Night 1 several times; fix blockers; tune only obvious breakage | Owner DoD: a 3-minute Night 1 that can be won or lost, with a summary. Preview link in the phase report |

## Phase 3 — Systems + balancing

| ID | Task | Definition of done |
|---|---|---|
| 3.1 | **Courses + HOLD.** Two-course tickets, `hold`, readiness (fire request, or app sent + eat time), early-fire penalty; rail shows course state | Tests: early-landed food penalty; a held course becomes ready on request |
| 3.2 | **Server interrupts.** `server_fire`, `server_addon` (add-on chit attaches to the parent ticket) | Tests + playable |
| 3.3 | **Kitchen problems.** `kitchen_refire` (lost plate → on the fly + REFIRE chit), `kitchen_drag` (station multiplier) | Tests + playable |
| 3.4 | **86.** `kitchen_86`, 86 clipboard, flagged items, RESOLVE 86 (sub/void) UI, fired-86 penalty, procedural generator respects 86 | Tests + playable |
| 3.5 | **Bar + manager.** `bar_delay` (not-before), `manager_push`, `manager_vip` | Tests + playable |
| 3.6 | **Mods + allergy.** Expanded mod pools and emphasized mods; allergy banner; ACK ALLERGY; allergy picks; incident rule | Tests: un-acked allergy plate arrives without a pick; sending it is an incident; Night 5 incident ends the shift |
| 3.7 | **Procedural waves.** Ticket generator from `tuning.nights[n].procedural` (arrival ranges, wave shape, table-size weights) respecting the night's feature flags | Test: generated tickets are valid per `validate.ts` for 1,000 seeds |
| 3.8 | **Nights 2–5 data.** Scripted beats + procedural profiles + feature flags per GDD §7; night select | All five nights are playable from the title screen |
| 3.9 | **Bot player.** `sim/bot/`: perception delay, attention model (one view at a time), check accuracy, fire policy (immediate vs. synced), skill presets (novice/average/expert) | The bot clears Night 1 at "average" on most seeds |
| 3.10 | **Balance script.** `npm run balance -- --night 3 --runs 500 --skill average` → table: avg/p90 ticket time, fail rate, health distribution, grade distribution, interrupt outcomes, dead plates; CSV/JSON out to `scripts/out/` | Runs 500 shifts in under ~30 s |
| 3.11 | **Tune.** Iterate `tuning.ts` toward targets (proposed: novice fails N1 <10% / N5 >70%; average fails N5 ~35–50%; expert clears all with B+) | Before/after metrics table in the phase report; every change logged in DECISIONS.md |
| 3.12 | **Save.** Zustand persist: unlocked nights, best grades, settings; reset-progress button | Reload keeps progress; corrupted storage falls back safely |

## Phase 4 — Feel pass (only after gameplay sign-off)

| ID | Task | Definition of done |
|---|---|---|
| 4.1 | **Fonts + tokens.** Self-hosted OFL WOFF2s with licence files; palette tokens applied to all grey-box surfaces | Fonts load ≤ 80 KB total; ASSETS.md rows |
| 4.2 | **Printed ticket.** Paper, ink bleed, jitter, curl, tear clip-path, emphasis styling | Visual match to STYLE §4 |
| 4.3 | **Audio sourcing.** Download per STYLE §6; verify each licence badge; log in `docs/ASSETS.md`; install ffmpeg and audiosprite (verify version); build webm+m4a sprite and beds | Every asset has a source, author, licence, and date row; no BY-NC |
| 4.4 | **Print-in sync.** Line-stepped reveal driven by the audio clock; printer start/loop×lines/end; tear on hang | A 22-line ticket chatters in sync; reduced-motion path is instant |
| 4.5 | **Ambience + SFX layering.** Hood bed, dining murmur (louder on FLOOR), plate variations ±3% pitch, bell, UI | No clipping with 10 simultaneous events; decoded audio ≤ 40 MB |
| 4.6 | **Voice barks.** Owner/friend recordings (or Kokoro scratch), take randomization, no back-to-back repeats, distance processing | Barks fire on interrupts and kitchen events |
| 4.7 | **View framing + post FX.** 960×540 letterboxed stage, view whip/blip, single WebGL post pass (grain, vignette; scanlines and chroma on monitors only), flicker, reduce-effects toggle | Toggle disables everything; `prefers-reduced-motion` respected |
| 4.8 | **Art stills** *(blocked on the owner's art decision)*. Pre-rendered views + overlays per STYLE §5 | AVIF/WebP within budget |
| 4.9 | **Performance.** Debug "stress" action: 25 live tickets + 12 plates; profile | Stable 60 fps on a mid laptop, ≥ 30 on a mid phone; initial payload ≤ 2.25 MB |
