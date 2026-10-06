# AGENTS.md — Conventions for any agent working in this repo

## 0. Before you start ANY task
1. Read `docs/GDD.md` (what we're building; §10 is the **scope contract**) and `docs/DECISIONS.md` (why things are the way they are).
2. Find your task in `docs/ROADMAP.md`. If it isn't there, or isn't in GDD §10 MVP, **stop and ask the owner**.
3. Skim `docs/ARCHITECTURE.md` for the layer you're touching. For visuals or audio, read `docs/STYLE.md`.
4. `docs/research/*` are background sources. Don't re-research what they cover. If they're wrong once you're in the code, fix the code, log a decision, and tell the owner.

## 1. Non-negotiables
- **Sim purity.** `src/sim/**` imports only `src/sim`, `src/data`, and `src/config`. No React, Zustand, Howler, DOM, timers, `Date`, `performance`, or `Math.random`. Randomness comes from `ctx.rng`; time comes from the tick. ESLint enforces this, so never disable those rules.
- **Determinism.** Same seed + same command log = same state. Don't iterate objects where order matters without sorting keys. Ids come from `state.ids.next`.
- **No magic numbers.** Any number that affects feel or difficulty goes in `src/config/tuning.ts`. Layout pixel values in UI are fine.
- **Content is data.** Menu, mods, tickets, shifts, interrupts, dialogue, and sounds live in `src/data/` or `src/audio/soundMap.ts`. Logic never hardcodes a menu id, table number, or line of dialogue.
- **No game loop in React.** Never `setInterval`/`requestAnimationFrame` in `useEffect` for game logic. Never `useGameStore()` without a selector. Select the narrowest slice.
- **Audio:** vanilla `howler` through `AudioManager` only. **Never `react-howler`. Never `<audio>`.**
- **Zustand v5:** `import { create } from 'zustand'` (named import).
- **No new dependencies** unless ARCHITECTURE §1 lists them. Otherwise add a DECISIONS.md entry saying why, and mention it in your report.
- **IP:** nothing from FNAF (names, characters, art, sounds, tablet/camera-map UI, door buttons, power meters, 6 AM chime). No real POS or printer brands (Toast, Square, Aloha, NCR, MICROS, Oracle, Epson, Star…) anywhere: tickets, UI, filenames, commits.
- **Assets:** never add an audio, font, or image file without a row in `docs/ASSETS.md` (source URL, author, licence, date). No CC BY-NC, no BBC Sound Effects, no CC-BY-SA/GPL assets.
- **Scope:** if it isn't in GDD §10 MVP, don't build it. Ask.

## 2. Folder rules (see ARCHITECTURE §3)
| Folder | Contains | May import |
|---|---|---|
| `src/config` | `tuning.ts` only | nothing |
| `src/data` | typed content + `schema.ts` + `validate.ts`; no logic beyond validation | `src/data`, `src/config` (types) |
| `src/sim` | pure rules: state, commands, events, systems, rng, bot | `src/sim`, `src/data`, `src/config` |
| `src/engine` | rAF loop, bus, session, save | everything except `src/ui` |
| `src/store` | Zustand mirror + UI-only state | `src/sim` (types), `src/engine` |
| `src/audio` | Howler singleton + event→sound map | `src/sim` (event types), `src/engine/bus` |
| `src/ui` | React components | `src/store`, `src/engine` (dispatch), `src/data` (display text), `src/sim` (types) |
| `scripts` | Node scripts (balance, asset gen), run with `tsx` | `src/sim`, `src/data`, `src/config` |

## 3. Naming
- Files: `camelCase.ts` for modules, `PascalCase.tsx` for components, `*.test.ts` colocated.
- Types/interfaces `PascalCase`; functions and vars `camelCase`; data ids `snake_case` strings (`side_fries`, `server_status`).
- Commands are imperative (`fire`, `send`); events are past tense (`ticketPrinted`, `plateUp`).
- Tuning keys describe the unit: `plateDieMs`, `lateDrainPerSec`, `defectRate`.
- Ticket-facing text is ALL CAPS in data (`ticketName: 'HOUSE BURGER'`).

## 4. How to add…

**A menu item** (data only)
1. Add a `MenuItemDef` to `src/data/menu.ts`: id, ticketName, course, station, cookTier, doneness, legalMods, allergens.
2. Any new mods go in `src/data/mods.ts`.
3. Use it in a shift's beats or a procedural profile's item weights (`tuning.nights[n].procedural.itemWeights`).
4. `npm test` (validation catches bad references).

**An interrupt** (data only, if it reuses an existing `effect`)
1. Add an `InterruptDef` to `src/data/interrupts.ts` and its lines to `src/data/dialogue.ts`.
2. Add `patienceMs` / rate keys to `tuning.interrupts` if new.
3. Schedule it in a shift's beats, or enable it in a night's procedural profile.
4. Map `interruptArrived` for it in `src/audio/soundMap.ts` if it needs a distinct sound.

**A new interrupt *effect* (event type)** (needs sim code)
1. Add the variant to `InterruptEffect` in `src/data/schema.ts`.
2. Handle it in `src/sim/systems/interrupts.ts` (pure; state in → state + events out).
3. Add any new `SimEvent` to `src/sim/events.ts`.
4. Write tests for each outcome (correct, wrong, timeout). Add a DECISIONS.md entry describing the mechanic.

**A sound**
1. Phases 1–3: add a tone to `scripts/gen-placeholder-audio.ts` and run it.
   Phase 4+: add the source file to `assets-src/audio/`, add the ASSETS.md row, and rebuild the sprite with audiosprite.
2. Add a `SoundDef` and map the triggering event in `src/audio/soundMap.ts`.
3. Trigger it **only** from events via the bus, never from sim code and rarely from components (UI clicks are OK).

**A shift / night**
1. Create `src/data/shifts/nightN.ts` exporting a `ShiftDef` (name, clockStart, beats, features, procedural profile key) and register it in `shifts/index.ts`.
2. Add `tuning.shift.durationMs[N]` and `tuning.nights[N]` (procedural numbers, defect and interrupt rates).
3. Run `npm run balance -- --night N` and record the metrics in your report.

## 5. Testing expectations
- Every sim rule gets a unit test: lifecycle, each scoring rule, each interrupt outcome, win and lose.
- Bug fix = failing test first, then the fix.
- Sim tests construct state with helpers and step it. They never touch the DOM.
- Keep the determinism/replay test green. If it breaks, you introduced impurity.
- UI is checked by playing the dev build (use the debug overlay). Describe what you verified.

## 6. Git and commits
- One feature per branch: `<phase>/<task-id>-<slug>` (e.g. `p2/2.4-pass-send-refire`). Branch from up-to-date `main`.
- Small commits, Conventional Commit style: `feat(sim): plates die after plateDieMs`, `fix(ui): …`, `test(sim): …`, `docs: …`, `chore: …`, `tune: …` (tuning-only changes, with before/after metrics in the body).
- Before every push: `npm run lint && npm run typecheck && npm test && npm run build`.
- **Never leave `main` broken.** Never force-push `main`. Push branches so Vercel builds a preview.
- Don't commit secrets, `.env*`, `node_modules`, `dist`, `scripts/out/`, or audio masters (WAV masters stay outside the repo or in LFS).

## 7. Reporting
At the end of a task or phase: what you built, what you decided (with DECISIONS ids), what's next, and what you need from the owner. Report test and build results faithfully, including failures.
