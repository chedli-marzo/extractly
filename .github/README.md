# .github

## The workflow is a transcription, not the source of truth

[`workflows/ci.yml`](workflows/ci.yml) runs one command: `pnpm check`. The
sequence it runs lives in [`../scripts/ci.mjs`](../scripts/ci.mjs).

That split is deliberate. The order of the steps is load-bearing —
`tests/security` reads `apps/desktop/out/`, so `build` must precede `test` — and
an order that exists in two places drifts. Keeping it in a script also means it
can be run, and was run, on a developer machine.

That mattered here more than usual: **this repository has no git remote, so the
workflow has never executed.** It was written after the sequence was proven
locally, rather than debugged through a series of red commits once a remote
appears.

## What it does not do

- It does not launch the application. The checks that matter are pure functions
  precisely so they need no display.
- It uploads `apps/desktop/out/` and nothing else. No test reporter, no coverage
  service, no action that transmits source or results anywhere.

## When a remote exists

Expect the first runs to need adjustment — cache paths and the pnpm setup action
are the likely candidates. What should not need adjustment is the sequence
itself.
