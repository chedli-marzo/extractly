# .github

## The workflow is a transcription, not the source of truth

[`workflows/ci.yml`](workflows/ci.yml) runs one command: `pnpm check`. The
sequence it runs lives in [`../scripts/ci.mjs`](../scripts/ci.mjs).

That split is deliberate. The order of the steps is load-bearing —
`tests/security` reads `apps/desktop/out/`, so `build` must precede `test` — and
an order that exists in two places drifts. Keeping it in a script also means it
can be run, and was run, on a developer machine.

That mattered here more than usual: the workflow was written before a remote
existed, so it was proven locally first rather than debugged through a series of
red commits.

## What it does not do

- It does not launch the application. The checks that matter are pure functions
  precisely so they need no display.
- It uploads `apps/desktop/out/` and nothing else. No test reporter, no coverage
  service, no action that transmits source or results anywhere.

## First real run

The prediction held: the sequence was fine, the wiring around it was not.

The first run failed on both runners at `pnpm/action-setup` with *"Multiple
versions of pnpm specified"*. The cause was `version: false`, written to mean
"take it from `packageManager`". The action does not read it that way — it
treats any present value as a specified version, and then conflicts with
`packageManager`. The fix is to omit the input entirely.

The Windows Electron cache path was also switched from backslashes to forward
slashes, which `actions/cache` handles on every platform.

Neither was reachable locally. What was proven locally — the six steps and their
order — needed no change.
