# src/config — the one tuning file

`tuning.ts` holds every number that affects feel or difficulty (principle 3): tick rate, cook tiers, grace times, score weights, defect and interrupt rates, and per-night profiles.

- Pure data, no imports. The sim reads it through `ctx.tuning`, so tests and the balancer can pass overrides.
- Tuning-only commits use the `tune:` prefix, with before/after balance metrics in the body.
