---
description: Phase 4 — verify the implementation against the approved story
argument-hint: [story title or area to review]
---

# Phase 4 — REVIEW

$ARGUMENTS

Verify the implementation against the approved user story before any deployment.

## Review dimensions

- **Acceptance criteria** — each one, individually, pass/fail with evidence.
- **Correctness** — logic, boundary conditions, off-by-one, async ordering.
- **Edge cases** — empty, malformed, scanned-only, huge, and multi-page PDFs;
  missing fields; partial extraction.
- **Error handling** — failure paths surface, never silently swallow.
- **Security** — Electron hardening (`contextIsolation`, no `nodeIntegration`,
  the preload `contextBridge` as the only renderer↔main channel), no network
  egress beyond the loopback-only local AI endpoint, no document contents in
  logs or telemetry.
- **Data integrity** — migrations, provenance preserved, no invented values,
  human-review gate intact.
- **Performance** — where the story made it relevant.
- **Architecture consistency** — layer boundaries respected, no fourth
  replaceable boundary invented, no rejected dependency class added.
- **Regression risk** — what existing behavior could this break.
- **Test coverage** — extraction, validation, grounding, state machine. Confirm
  no test was weakened to make the implementation pass.

Fix the issues you find. Do not weaken tests.

## Report

1. Acceptance criteria status (one line each).
2. Tests and checks performed, with actual results.
3. Issues found and how they were fixed.
4. Remaining risks, if any.

STOP and wait for explicit approval to deploy.
