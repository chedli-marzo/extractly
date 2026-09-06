# tests/security

Tests that read the **built artifact**, not the source.

Everything else in this repository tests code. These tests test what ships,
because the failure they exist to catch does not appear in code anyone wrote:
a dependency three levels down that opens a socket, a crash reporter that
attaches a page image, a cloud fallback added under deadline and removed from
the diff but not from the bundle.

They are the enforcement half of [docs/security.md](../../docs/security.md),
"Verification".

## What they assert

Over `apps/desktop/out/main/index.cjs`:

| Assertion | Why |
| --------- | --- |
| No network module imported | `node:http`, `node:https`, `node:net`, `node:dgram` and their bare forms. Matched in import position, never as a substring |
| No `fetch(` call | The built-in that needs no import |
| Every URL literal is loopback | `127.0.0.1`, `localhost`, `[::1]` and nothing else |
| No `crashReporter.start` | A crash dump can contain document contents held in memory |

## Requires a build

These tests read `out/`, so `pnpm build` must have run. When the bundle is
missing they **fail** with a message saying so. They never skip — a skipped
security test is indistinguishable from a passing one in a CI summary.

## Scope

The main-process bundle only, for now. The renderer bundle carries React, which
embeds `https://react.dev` in its error messages; scanning it would fail on day
one for a reason unrelated to egress. Extending coverage there needs a curated
allowlist and its own story.

`127.0.0.1` is allowed deliberately. The local model runtime at MS-08 is the
one permitted network destination, and it must pass this test on purpose rather
than by accident.
