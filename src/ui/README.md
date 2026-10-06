# src/ui — React components

Presentation only. Read the store with narrow selectors and send actions with `engine.dispatch(command)`. Never mutate sim state, and never run game timers in `useEffect`.

| Folder     | Contents                                                       |
| ---------- | -------------------------------------------------------------- |
| `screens/` | Title, night select, summary (and the Phase 1 boot screen)     |
| `views/`   | PASS and FLOOR views and the view switcher                     |
| `pass/`    | Rail, ticket, window, plate card, printer                      |
| `floor/`   | Door, interrupt cards                                          |
| `hud/`     | Clock, Service Health strip (the only non-diegetic HUD, D-013) |
| `debug/`   | Debug overlay (`` ` `` or `?debug=1`)                          |

Use palette tokens (`bg-night`, `text-paper`, `text-rush`…) from `src/index.css`, not raw hex.
