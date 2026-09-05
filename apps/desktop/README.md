# apps/desktop

The Electron application ([ADR-0001](../../docs/decisions/0001-electron.md)).

```
src/main/       main process: lifecycle, windows, IPC handlers, orchestration
src/preload/    contextBridge — the only renderer↔main channel
src/renderer/   React UI shell and routing
src/worker/     utilityProcess pipeline worker: receives ids, returns results
```

This is the only package allowed to import Electron. It wires `packages/*` to
IPC and to the window; it should contain as little logic as possible.

Rules:

- all filesystem, database, and inference access happens in `src/main`
- `src/preload` is a hand-written, typed list of named channels — never a
  generic `invoke(channel, args)` passthrough
- `src/renderer` has no Node, no filesystem, no network
- long work runs in a `utilityProcess` worker, never in main

Hardening requirements are in [docs/security.md](../../docs/security.md) and are
CI-asserted, not optional.

Built by `electron-vite` into `out/`. The emitted main, worker and preload
entry points are CommonJS — Electron's module has no named ESM exports and a
sandboxed preload cannot be ESM — while the source stays ESM like the rest of
the workspace.
