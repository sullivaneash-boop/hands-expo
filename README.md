# HANDS! (working title)

A restaurant **expo** simulator for the browser. You work the window: tickets print, you fire orders, check plates, call for hands, and fend off servers, the manager, the bar, and the line. Fixed first-person POV, switchable views, low-fi indie mood.

**Status:** Phase 1 (scaffold). Boots a deterministic sim loop and shows a frame counter.
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

`?seed=123` in the URL fixes the RNG seed.

## Docs

- Design: [docs/GDD.md](docs/GDD.md) · Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Style: [docs/STYLE.md](docs/STYLE.md)
- Decisions: [docs/DECISIONS.md](docs/DECISIONS.md) · Roadmap: [docs/ROADMAP.md](docs/ROADMAP.md)
- Agent conventions: [AGENTS.md](AGENTS.md)
