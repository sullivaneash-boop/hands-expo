# HANDS! (working title)

A restaurant **expo** simulator for the browser. You work the window: tickets print, you fire orders, check plates, call for hands, and fend off servers, the manager, the bar, and the line. Fixed first-person POV, switchable views, low-fi indie mood.

**Status:** Phase 5 (Rules v2). Stations have cook slots and queues, the pass holds 6 plates, Service Heat (recoverable, with a critical "manager at the pass" window) replaces health, and clean synchronized service scores with a ×1–×3 combo and stars. Next: the portrait mobile UI (Phase 6).
**Live:** https://hands-expo.vercel.app (`main`); every pushed branch gets a Vercel preview.

## Quickstart

```bash
git clone https://github.com/sullivaneash-boop/hands-expo.git && cd hands-expo
npm install
npm run dev        # http://localhost:5173
```

| Script                                  | What it does                                                                                                                     |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                           | Vite dev server                                                                                                                  |
| `npm run build`                         | Typecheck + production build to `dist/` (what Vercel runs)                                                                       |
| `npm run preview`                       | Serve the production build locally                                                                                               |
| `npm test`                              | Vitest (sim, engine, data validation)                                                                                            |
| `npm run lint` / `typecheck` / `format` | ESLint (including sim-purity rules) / tsc / Prettier                                                                             |
| `npm run check`                         | Everything above; run before every push                                                                                          |
| `npm run balance`                       | Headless bot shifts → balance table (`-- --night 3 --skill average --runs 500 --json`); `-- --ablate` compares expert strategies |
| `npm run gen:audio`                     | Re-synthesize the SFX sprite + kitchen ambience                                                                                  |
| `npm run build:icons`                   | Regenerate favicons/app icons from `icon-mark.svg`                                                                               |

`?seed=123` in the URL fixes the RNG seed. `?debug=1` opens the debug panel in any build (toggle with `` ` ``): speed, pause/step, +10s/+30s, spawn ticket, trigger interrupt, set health, reveal bad plates, restart/seed, event log, state JSON.

**Controls:** click **FIRE** on a ticket (or click one item line to fire just that item) → plates land in the window → click a plate to **CHECK** it → **REFIRE** or **HANDS!**. `A`/`D` or the arrow keys switch between the pass and the door. On allergy tickets, **FLAG ALLERGY TO LINE** before firing. HOLD courses wait for the server's fire request at the door. 86'd items need a **SUB** or **VOID** before they can fire.

## Docs

- Design: [docs/GDD.md](docs/GDD.md) · Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Style: [docs/STYLE.md](docs/STYLE.md)
- Decisions: [docs/DECISIONS.md](docs/DECISIONS.md) · Roadmap: [docs/ROADMAP.md](docs/ROADMAP.md)
- Agent conventions: [AGENTS.md](AGENTS.md)
