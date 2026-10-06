# HANDS! — Architecture

> Status: Phase 0 draft, 2026-10-06. Source of truth for _how_ we build.
> Based on `docs/research/01-stack.md`, adjusted where it conflicts with the operating principles (see `docs/DECISIONS.md`).

---

## 1. Stack

| Layer           | Package                                                                                | Version policy                                                    | Source           |
| --------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------- |
| Language        | `typescript`                                                                           | 5.x, `strict: true` plus `noUncheckedIndexedAccess`               | D-020            |
| UI              | `react`, `react-dom`                                                                   | 19.x                                                              | report 01        |
| Build           | `vite`, `@vitejs/plugin-react`                                                         | 6.x (report 01). Pin the exact version at scaffold; see D-021     | report 01        |
| Styling         | `tailwindcss`, `@tailwindcss/vite`                                                     | 4.x (CSS-first config, **no** `tailwind.config.js`)               | report 01, D-022 |
| State mirror    | `zustand`                                                                              | 5.0.x, named import `{ create }`                                  | report 01        |
| Audio           | `howler`, `@types/howler`                                                              | 2.2.4. **Never** `react-howler`                                   | report 01        |
| Icons           | `lucide-react`                                                                         | **Deferred.** Not installed until a non-diegetic UI needs icons   | D-023            |
| Sprite compiler | `audiosprite` + `ffmpeg`                                                               | Phase 4 only. Version verified then                               | D-024            |
| Tests           | `vitest`                                                                               | 3.x (whatever matches the Vite major)                             | D-020            |
| Lint/format     | `eslint` 9 (flat config), `typescript-eslint`, `eslint-plugin-react-hooks`, `prettier` | latest stable                                                     | D-020            |
| Script runner   | `tsx`                                                                                  | latest stable. Runs headless sims in Node                         | D-020            |
| Hosting         | Vercel (static SPA)                                                                    | `vercel.json` with SPA rewrite and immutable cache for `/assets/` | report 01        |

Node ≥ 20 (local dev is Node 25). Package manager: **npm** (lockfile committed).

Not used: Phaser, Pixi, Three, any canvas engine for the game scene, XState, Redux, React Context for game state, `react-howler`, HTML `<audio>` for SFX. Phase 4 adds **one** WebGL post-process pass over the scene (report 03). That's a filter layer, not a game engine.

## 2. The three layers

```
┌──────────────────────────────────────────────────────────────────┐
│  SIM  (src/sim/)  pure TypeScript, deterministic, no DOM/React   │
│  step(state, commands, ctx) → { state, events }                  │
│  fixed timestep · integer ms · seeded RNG · data-driven content  │
└───────────────▲───────────────────────────────┬──────────────────┘
                │ PlayerCommand[] (queued)       │ SimEvent[] (per tick)
┌───────────────┴───────────────────────────────▼──────────────────┐
│  ENGINE  (src/engine/)  the only place that touches time         │
│  rAF driver with a fixed-step accumulator · speed/pause · event  │
│  bus · pushes snapshots into the Zustand store once per frame    │
└───────┬───────────────────────────┬──────────────────────────────┘
        │ store.setState(snapshot)  │ bus.emit(event)
┌───────▼─────────────┐    ┌────────▼──────────────┐   ┌────────────────────┐
│ STORE (src/store/)  │    │ AUDIO (src/audio/)    │   │ SAVE (src/engine/  │
│ Zustand mirror of   │    │ Howler singleton;     │   │ save.ts) Zustand   │
│ the latest snapshot │    │ subscribes to the bus;│   │ persist →          │
│ + UI-only state     │    │ data map event→sound  │   │ localStorage       │
└───────┬─────────────┘    └───────────────────────┘   └────────────────────┘
        │ narrow selectors
┌───────▼──────────────────────────────────────────────────────────┐
│  UI  (src/ui/)  React components. Read the store, dispatch       │
│  commands through engine.dispatch(). Never mutate sim state.     │
└──────────────────────────────────────────────────────────────────┘
```

**Hard rules** (enforced by ESLint `no-restricted-imports` / `no-restricted-globals` on `src/sim/**`):

- `src/sim` must not import `react`, `zustand`, `howler`, `src/engine`, `src/ui`, `src/store`, or `src/audio`.
- `src/sim` must not use `window`, `document`, `requestAnimationFrame`, `setTimeout`, `setInterval`, `performance`, `Date`, or `Math.random`. Time comes from the tick counter; randomness comes from `ctx.rng`.
- `src/sim` may import only `src/sim/**`, `src/data/**`, and `src/config/**`.
- UI never calls `setInterval` / `requestAnimationFrame` in `useEffect` for game logic (report 01 pitfall #2). CSS animations and transient visual effects are fine.

> This deliberately deviates from report 01's "`tick()` lives inside the Zustand store" pattern. Zustand becomes a read-only mirror. See D-001.

## 3. Folder structure

```
hands-expo/
├── AGENTS.md                 # agent conventions (CLAUDE.md points here)
├── CLAUDE.md
├── README.md
├── docs/
│   ├── GDD.md  ARCHITECTURE.md  STYLE.md  DECISIONS.md  ROADMAP.md
│   ├── ASSETS.md             # Phase 4: every asset's source and license
│   └── research/             # the three source reports (read-only)
├── public/                 # unhashed static files only (favicon) — D-029
├── scripts/
│   ├── balance.ts            # headless N-shift runner with bot → metrics (Phase 3)
│   └── gen-placeholder-audio.ts  # writes beep WAVs + sprite map, no ffmpeg (Phase 2)
├── src/
│   ├── config/
│   │   └── tuning.ts         # THE tuning file. Every feel/difficulty number.
│   ├── data/                 # content as typed TS modules (no logic)
│   │   ├── schema.ts         # content types (MenuItemDef, TicketTemplate, ShiftDef, …)
│   │   ├── menu.ts
│   │   ├── mods.ts
│   │   ├── servers.ts
│   │   ├── interrupts.ts
│   │   ├── dialogue.ts       # barks/lines keyed by id, {table}-style placeholders
│   │   ├── shifts/night1.ts … night5.ts, index.ts
│   │   └── validate.ts       # cross-reference checks (run in tests + at boot in dev)
│   ├── sim/
│   │   ├── index.ts          # createSim(), step() — public API
│   │   ├── state.ts          # SimState and entity types
│   │   ├── commands.ts       # PlayerCommand union
│   │   ├── events.ts         # SimEvent union
│   │   ├── rng.ts            # seeded PRNG (sfc32) with fork()
│   │   ├── clock.ts          # tick ↔ ms helpers
│   │   ├── systems/          # schedule, tickets, kitchen, pass, interrupts, scoring, shift
│   │   ├── bot/              # bot player for headless runs (Phase 3)
│   │   └── *.test.ts         # tests colocated
│   ├── assets/               # shipped media, imported so Vite hashes it (D-029): audio/ fonts/ img/
│   ├── engine/
│   │   ├── loop.ts           # rAF fixed-step driver (speed, pause, step-once)
│   │   ├── bus.ts            # typed pub/sub for SimEvents
│   │   ├── session.ts        # owns the sim instance; command queue; replay log
│   │   ├── runtime.ts        # `engine` facade for the UI; pushes snapshots to the store (D-031)
│   │   └── save.ts           # persisted progress (Phase 3)
│   ├── store/
│   │   └── useGameStore.ts   # Zustand: { snap: SimSnapshot, ui: UiState }
│   ├── audio/
│   │   ├── audio.ts          # Howler singleton: AudioManager.play(id)
│   │   └── soundMap.ts       # data: SimEvent type → sound id(s)
│   ├── ui/
│   │   ├── views/            # PassView, FloorView, ViewSwitcher
│   │   ├── pass/             # Rail, TicketCard, Window, PlateCard, Printer
│   │   ├── floor/            # Door, InterruptCard
│   │   ├── hud/              # Clock, HealthBar
│   │   ├── screens/          # Title, NightSelect, Summary
│   │   └── debug/            # DebugOverlay
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css             # Tailwind import + @theme tokens from STYLE.md
├── index.html
├── vercel.json
├── vite.config.ts            # also holds the vitest config
├── eslint.config.js
├── tsconfig.json (+ tsconfig.node.json)
└── package.json
```

Changes from report 01's layout: `core/` splits into `engine/` (time/DOM-facing) and `config/` (pure). `sim/` and `data/` are new. Two Zustand stores become one mirror. `components/` becomes `ui/`. Game data goes in `src/data` (bundled, type-checked), not `public/assets/data`. See D-002 and D-003.

## 4. Time model

- **Fixed timestep:** `tuning.sim.tickMs = 50` (20 Hz). All sim times are **integer milliseconds** derived from `tick * tickMs`. No floats accumulate.
- **Engine accumulator:** each rAF frame adds `realDelta * speed` (clamped to `maxFrameMs` to avoid a spiral after a tab sleeps) and runs whole ticks until it's drained. Speed ranges from 0.5× to 10× (debug). Pause stops accumulation. "Step" runs exactly one tick.
- **Snapshots:** after the ticks for a frame, the engine calls `useGameStore.setState({ snap })` **once**. React re-renders only the components whose selected slices changed.
- **Headless:** `scripts/balance.ts` calls `step()` in a tight loop with no engine. A 5-minute shift is 6,000 ticks.

## 5. Determinism and RNG

- `rng.ts` implements **sfc32**, seeded from a 32-bit integer (~15 lines, no dependency; D-004). It exposes `next()`, `int(lo, hi)`, `chance(p)`, `pick(arr)`, `fork(label)`.
- The RNG state lives **inside `SimState`** (`state.rng: [a,b,c,d]`), so a state snapshot fully determines the future.
- Subsystems use forked streams (`kitchen`, `defects`, `schedule`, `interrupts`) so adding a roll in one system doesn't reshuffle another.
- Seed source: `?seed=` URL param, otherwise random at night start. It's shown in the debug overlay and on the summary screen.
- **Replay:** the session records `{ seed, nightId, commands: [tick, command][] }`. Re-running it reproduces the shift exactly. A determinism test asserts this.

## 6. Commands and events

### Commands (UI → sim), applied at the start of the next tick, in order

```ts
type PlayerCommand =
  | { type: 'fire'; ticketId: string; courseIdx: number; itemId?: string } // itemId → single item
  | { type: 'send'; ticketId: string; courseIdx: number }
  | { type: 'refire'; plateId: string }
  | { type: 'check'; plateId: string } // recorded for metrics/bot; no rule effect
  | { type: 'answer'; interruptId: string; choice: string }
  | { type: 'ackAllergy'; ticketId: string } // Phase 3
  | { type: 'resolve86'; ticketId: string; itemId: string; subMenuId: string | null } // Phase 3
  | { type: 'debug'; action: DebugAction }; // spawn ticket, trigger interrupt, set health…
```

View switching is **UI state**, not a sim command. It doesn't change sim rules (D-012).

Invalid commands (firing an already-fired item, sending a cleared ticket) are ignored and emit `commandRejected { reason }`. They never throw.

### Events (sim → bus), emitted per tick

```ts
type SimEvent =
  | { type: 'shiftStarted'; nightId; seed }
  | { type: 'ticketPrinted'; ticketId; lineCount } // audio: printer; lineCount drives print length (Ph4)
  | { type: 'itemFired'; ticketId; itemId; station }
  | { type: 'plateUp'; plateId; ticketId; station } // audio: food-up
  | { type: 'plateDied'; plateId }
  | { type: 'plateRefired'; plateId; correct: boolean }
  | { type: 'courseSent'; ticketId; courseIdx; errors: PlateError[]; synced: boolean }
  | { type: 'ticketCleared'; ticketId; ticketTimeMs }
  | { type: 'ticketLate'; ticketId } // fires once at the threshold
  | { type: 'interruptArrived'; interruptId; source }
  | { type: 'interruptResolved'; interruptId; outcome: 'correct' | 'wrong' | 'timeout' }
  | { type: 'bark'; lineId; source } // kitchen/floor voice lines
  | { type: 'healthChanged'; delta; reason: ScoreReason }
  | { type: 'printerStopped' }
  | { type: 'shiftEnded'; outcome: 'won' | 'lost'; summary: ShiftSummary }
  | { type: 'commandRejected'; command; reason };
```

### Event bus (`src/engine/bus.ts`)

A tiny typed pub/sub: `on(type, handler)`, `onAny(handler)`, `emit(event)`. About 30 lines, no dependency. Events are delivered **after** the snapshot is pushed for that frame, so a handler that reads the store sees consistent state. Subscribers: `audio/` (sounds), `ui/` (transient effects such as shake or flash, via `onAny`), and the debug event log. **The sim never subscribes to anything.**

## 7. State model

`SimState` is a plain, JSON-serializable object. It's updated **immutably** (new objects only for entities that changed) so Zustand selectors detect changes by reference. Ages are never stored per tick; they're derived as `now - createdAt`, so most entities don't change while they're idle.

```ts
interface SimState {
  tick: number;
  nowMs: number;
  rng: RngState;
  nightId: NightId;
  phase: 'running' | 'overtime' | 'ended';
  health: number;
  tickets: Record<TicketId, Ticket>;
  railOrder: TicketId[];
  plates: Record<PlateId, Plate>;
  windowOrder: PlateId[];
  cooking: CookJob[]; // items in progress, with doneAtMs
  stations: Record<StationId, { dragMultiplier: number; dragUntilMs: number }>;
  interrupts: Record<InterruptId, ActiveInterrupt>;
  eighty6: MenuItemId[]; // Phase 3
  schedule: { cursor: number; nextProceduralMs: number };
  stats: ShiftStats; // accumulators for the summary
  ids: { next: number }; // deterministic id counter
  outcome: null | 'won' | 'lost';
}

interface Ticket {
  id;
  table: number;
  server: ServerId;
  guests: number;
  printedAtMs: number;
  kind: 'order' | 'addon' | 'refire';
  parentId?: TicketId;
  courses: Course[];
  note?: string;
  allergy?: { seat: number; allergen: string; acked: boolean };
  flags: { vip: boolean; pushed: boolean; notBeforeMs?: number };
  lateAtMs: number;
  clearedAtMs?: number;
}
interface Course {
  kind: 'app' | 'main' | 'side';
  hold: boolean;
  readyAtMs?: number;
  status: 'held' | 'fired' | 'partial' | 'up' | 'sent';
  items: TicketItem[];
}
interface TicketItem {
  id;
  seat: number | 'share';
  menuId;
  mods: ModId[];
  state: 'held' | 'cooking' | 'up' | 'sent' | '86';
  plateId?: PlateId;
}
interface Plate {
  id;
  ticketId;
  itemId;
  upAtMs: number;
  build: PlateBuild;
  defect: PlateDefect | null;
  allergyPick: boolean;
}
```

## 8. Data schemas (`src/data/schema.ts`)

Content is **typed TS modules** using `satisfies` (D-003). Adding content never touches `src/sim`. `data/validate.ts` checks cross-references (menu ids, legal mods per item, server ids, interrupt ids) and runs in a unit test, so a typo fails CI.

```ts
type StationId = 'grill' | 'saute' | 'pantry';
type CookTier = 'quick' | 'standard' | 'long'; // durations live in tuning.ts

interface MenuItemDef {
  id: string;
  ticketName: string; // "HOUSE BURGER"
  course: 'app' | 'main' | 'side';
  station: StationId;
  cookTier: CookTier;
  doneness: boolean;
  defaultSide?: ModId;
  legalMods: ModId[];
  allergens: string[];
}
interface ModDef {
  id: string;
  text: string;
  kind: 'doneness' | 'remove' | 'add' | 'side' | 'prep';
  emphasize?: boolean;
} // emphasize → *** NO BUTTER ***

interface TicketTemplate {
  table: number;
  server: ServerId;
  guests: number;
  note?: string;
  allergy?: { seat: number; allergen: string };
  courses: {
    kind: 'app' | 'main' | 'side';
    hold?: boolean;
    items: { seat: number | 'share'; menuId: string; mods?: ModId[] }[];
  }[];
  forceDefect?: { itemIdx: number; defect: PlateDefectKind }; // scripted teaching moments
}

interface ShiftDef {
  id: NightId;
  name: string; // "The Window"
  clockStart: string; // "5:00 PM" (display only)
  beats: ShiftBeat[]; // scripted, by atMs
  procedural?: { profile: string }; // key into tuning.nights[id].procedural
  features: FeatureFlag[]; // e.g. 'courses','86','allergy','manager'; gates systems per night
}
type ShiftBeat =
  | { atMs: number; type: 'ticket'; ticket: TicketTemplate }
  | { atMs: number; type: 'interrupt'; interrupt: string; target?: { table: number } }
  | { atMs: number; type: 'kitchen'; event: '86' | 'drag' | 'refire'; arg: string };

interface InterruptDef {
  id: string;
  source: 'server' | 'manager' | 'bar' | 'kitchen';
  blocking: boolean; // waits at the door vs. a bark
  lines: string[]; // dialogue ids
  choices?: 'ticketStatus' | 'heard';
  effect: InterruptEffect; // discriminated union interpreted by sim/systems/interrupts.ts
  patienceKey: keyof Tuning['interrupts']['patienceMs'];
}

interface DialogueLine {
  id: string;
  text: string;
  voice?: string;
} // "Where's my {table}?"
interface SoundDef {
  id: string;
  sprite: string;
  volume: number;
  pitchJitter?: number;
}
```

**Adding a new interrupt _kind_** (a new `effect` variant) is the one content change that needs sim code. New interrupts that reuse existing effects are data-only.

## 9. Tuning (`src/config/tuning.ts`)

A single exported `const tuning = { … } as const`. Sections: `sim` (tickMs, maxFrameMs), `shift` (durations per night, overtime cap), `cook` (tier ms, jitter %, on-the-fly factor, allergy extra ms), `pass` (plate die ms, sync window ms), `tickets` (grace base + per-item ms), `score` (every weight in GDD §6, grade bands), `defects` (rate per night, kind weights), `interrupts` (patience ms, rates per night), `nights` (procedural profiles: arrival interval ranges, wave shapes, table-size weights, feature rates), `debug` (speed steps). The sim receives `tuning` through `ctx`, so tests and the balancer can pass overrides.

## 10. A ticket's life, end to end

1. **Spawn:** `systems/schedule` sees a beat with `atMs <= nowMs` (or a procedural roll fires). It instantiates the `TicketTemplate`: assigns deterministic ids, computes `lateAtMs = printedAtMs + grace(base + perItem × items)`, rolls defects for each item with the `defects` RNG stream (or applies `forceDefect`), and stores the pre-rolled defect on the item. It emits `ticketPrinted`.
2. **Engine → presentation:** the store gets the new snapshot and the rail renders the ticket. Audio hears `ticketPrinted` and plays the printer (placeholder beep in Phase 2; start/loop/end in Phase 4).
3. **Fire:** the player clicks FIRE → `engine.dispatch({type:'fire', ticketId, courseIdx})` → queued → next tick, `systems/tickets` validates it, sets items to `cooking`, and pushes a `CookJob { doneAtMs = now + tierMs × jitter × stationDrag }` per item. It emits `itemFired`. If the course was `hold` and not yet ready, it records `firedEarly`.
4. **Cook:** `systems/kitchen` checks `cooking` each tick. When a job is done, it creates a `Plate` with a `build` derived from the item spec plus its pre-rolled defect, adds it to `windowOrder`, and emits `plateUp`.
5. **Check:** the player clicks the plate. The UI shows the build card next to the ticket (`check` is recorded for metrics only).
6. **Send / Refire:**
   - `refire(plate)` bins the plate, scores `refireCorrect` vs. `refireUnneeded`, and starts an on-the-fly `CookJob` (fresh defect roll at a lower rate).
   - `send(ticket, course)` moves the course's up plates out, scores each plate's defect, applies an incomplete penalty if items aren't up, applies the sync bonus if all plates landed within `syncWindowMs`, and emits `courseSent`. Items not yet up stay live (they're sent individually later).
7. **Pass upkeep:** each tick, `systems/pass` kills plates whose `nowMs - upAtMs > plateDieMs` (`plateDied`, penalty, auto on-the-fly refire).
8. **Lateness:** `systems/scoring` drains `lateDrainPerSec` per late live ticket. The `ticketLate` event fires once per ticket.
9. **Clear:** when every course is sent, the ticket is cleared, moves to `stats`, and is removed from `railOrder`. It emits `ticketCleared` (+5 if clean).
10. **Shift end:** `systems/shift` checks whether health ≤ 0 (lost), or the printer has stopped and the rail is empty (won), or the overtime cap has passed (won with penalties). It freezes state, emits `shiftEnded` with the summary, and the UI routes to the Summary screen.

## 11. Testing

- **Vitest**, colocated `*.test.ts`. Sim tests run in Node with no DOM.
- Required: RNG determinism; loop accumulator math; ticket lifecycle (spawn → fire → up → send → clear); every scoring rule; win/lose transitions; replay determinism (same seed + commands → identical final state hash); data validation.
- UI is verified by playing (the debug overlay makes that fast). There are no component snapshot tests.
- CI later (GitHub Actions): `npm run lint && npm run typecheck && npm test && npm run build`.

## 12. Build and deploy

- Scripts: `dev`, `build` (`tsc -b && vite build`), `preview`, `test`, `lint`, `typecheck`, `format`, `balance`.
- `vercel.json`: SPA rewrite to `/index.html`; `Cache-Control: public, max-age=31536000, immutable` on `/assets/(.*)`.
- Branch → push → Vercel preview (the GitHub repo must be linked to a Vercel project once). `main` is always green.
- The debug overlay is available in dev and in any build via `?debug=1` (previews are where you playtest).
