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

The second run got further and failed on Windows only: `execFileSync('pnpm', …)`
died with `ENOENT`. On Windows `pnpm` is `pnpm.cmd`, and Node refuses to spawn a
`.cmd` without a shell — a deliberate restriction since the batch-file
argument-injection fix (CVE-2024-27980). On macOS `pnpm` is an ordinary
executable, so the same line worked. The runner now passes `shell: true` on
Windows; every argument the script spawns is a literal, so shell interpretation
adds no injection surface.

That one is the reason ADR-0002 makes Windows the primary test platform. It is
invisible on macOS and fails every step on Windows.

The third run failed on Windows only again, this time at `format:check`, on
**every file in the repository**. Git converts text files to CRLF when checking
out on Windows; Prettier enforces LF. A `.gitattributes` with `* text=auto
eol=lf` fixes it at the source, for every tool rather than just Prettier — ESLint
and any byte-comparing test would have hit the same wall. It also marks binary
types, which matters before MS-03 commits fixture PDFs: a line-ending-converted
PDF is a corrupt PDF, and it corrupts silently.

None of these were reachable locally. What was proven locally — the six steps
and their order — needed no change in any of the three.

## If you already have a Windows clone

`.gitattributes` applies at checkout. An existing Windows working tree will show
every file as modified until it is refreshed:

```sh
git rm --cached -r . && git reset --hard
```
