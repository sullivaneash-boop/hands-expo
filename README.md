# HANDS! (working title)

A restaurant **expo** simulator for the browser. You work the window: tickets print, you fire orders, check plates, call for hands, and fend off servers, the manager, the bar, and the line. Fixed first-person POV, switchable views, low-fi indie mood.

**Status:** Phase 2 (grey-box). Night 1 is playable: tickets, firing, plate checks, refires, a server at the door, scoring, win/lose, summary.
**Live:** https://hands-expo.vercel.app (`main`); every pushed branch gets a Vercel preview.

## Quickstart

```bash
git clone https://github.com/sullivaneash-boop/hands-expo.git && cd hands-expo
npm install
npm run dev        # http://localhost:5173
```

| Script                                  | What it does                                               |
| --------------------------------------- | ---------------------------------------------------------- |
| `npm run dev`                           | Vite dev server                                            |
| `npm run build`                         | Typecheck + production build to `dist/` (what Vercel runs) |
| `npm run preview`                       | Serve the production build locally                         |
| `npm test`                              | Vitest (sim, engine, data validation)                      |
| `npm run lint` / `typecheck` / `format` | ESLint (including sim-purity rules) / tsc / Prettier       |
| `npm run check`                         | Everything above; run before every push                    |

`?seed=123` in the URL fixes the RNG seed. `?debug=1` opens the debug panel in any build (toggle with `` ` ``): speed, pause/step, +10s/+30s, spawn ticket, trigger interrupt, set health, reveal bad plates, restart/seed, event log, state JSON.

**Controls:** click **FIRE** on a ticket (or click one item line to fire just that item) → plates land in the window → click a plate to **CHECK** it → **REFIRE** or **HANDS!**. `A`/`D` or the arrow keys switch between the pass and the door. Placeholder audio: generate with `npx tsx scripts/gen-placeholder-audio.ts` (output is committed).

## Docs

- Design: [docs/GDD.md](docs/GDD.md) · Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Style: [docs/STYLE.md](docs/STYLE.md)
- Decisions: [docs/DECISIONS.md](docs/DECISIONS.md) · Roadmap: [docs/ROADMAP.md](docs/ROADMAP.md)
- Agent conventions: [AGENTS.md](AGENTS.md)
