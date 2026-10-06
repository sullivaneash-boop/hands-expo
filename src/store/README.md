# src/store — Zustand mirror

`useGameStore` holds the latest sim snapshot (`snap`) plus UI-only state (speed, pause, fps, current view). It is a **read-only mirror** (D-001): only the engine calls `setSnapshot`.

- Zustand v5: `import { create } from 'zustand'`.
- Always select narrow slices: `useGameStore((s) => s.snap?.tick)`. Never call `useGameStore()` bare.
- Imports only sim **types**.
