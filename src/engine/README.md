# src/engine — time, wiring, persistence

The only layer that touches real time and the browser loop.

- `loop.ts`: fixed-step accumulator (pure `accumulate`) and the rAF shell `startLoop`.
- `session.ts`: owns a sim, queues commands, records a replay log.
- `bus.ts`: typed pub/sub for `SimEvent`s.
- `runtime.ts`: the `engine` facade the UI calls (`start`, `dispatch`, `stepOnce`). It pushes snapshots into the store and then emits events.
- `save.ts` (Phase 3): progress persisted to localStorage.

May import anything except `src/ui`.
