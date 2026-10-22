# HANDS! (working title)

A restaurant **expo** simulator for the browser. You work the window: tickets print, you fire orders, check plates, call for hands, and fend off servers, the manager, the bar, and the line. Portrait, one-thumb play; low-fi indie mood.

**Status:** Phase 6 (mobile shell + visual CHECK). Portrait phone layout: ticket rail, line strip with cook slots and queues, a 6-spot pass, an interrupt tray, a bottom action dock and sheets for ticket details and the visual plate CHECK; Night 1 coaches you by doing. Rules v2 (Phase 5): Service Heat with a critical window, ×1–×3 clean-service combo, stars. Next: the feel pass (Phase 7).
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

`?seed=123` in the URL fixes the RNG seed. `?debug=1` opens the debug panel in any build (toggle with `` ` ``): speed, pause/step, +10s/+30s, spawn ticket, trigger interrupt, set heat, reveal bad plates, restart/seed, event log, state JSON.

**Controls (tap or click):** tap a ticket on the rail → the dock offers **FIRE** (or **DETAILS** to fire single items, flag an allergy, or sub an 86) → plates land on the pass → tap a plate to **CHECK** it: tap whatever doesn't match, then **REFIRE**, or **GOOD** → **HANDS!** sends the course. HOLD courses wait for the server's fire request; server questions pop up in the tray above the dock. Desktop shows the same portrait stage, centred.

## Docs

- Design: [docs/GDD.md](docs/GDD.md) · Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Style: [docs/STYLE.md](docs/STYLE.md)
- Decisions: [docs/DECISIONS.md](docs/DECISIONS.md) · Roadmap: [docs/ROADMAP.md](docs/ROADMAP.md)
- Agent conventions: [AGENTS.md](AGENTS.md)
