---
description: Phase 3 — implement the approved user story only
argument-hint: [story title or scope reminder]
---

# Phase 3 — IMPLEMENT

$ARGUMENTS

Only proceed if the user story was explicitly approved. If it was not, stop and
ask.

## Before changing code

1. Read the existing files you are about to touch.
2. Understand current architecture and conventions.
3. Check existing dependencies and utilities before adding anything new.
4. For a non-trivial change, present a short implementation plan first.

## During implementation

- Implement only the approved scope. Nothing extra.
- Follow the existing architecture and the layout in `CLAUDE.md`.
- Simplest implementation that satisfies the requirement.
- No new abstraction for theoretical future flexibility.
- No new dependency without a reason recorded in the PR or an ADR.
- Do not touch unrelated code.
- Keep pure domain logic (schemas, validation, state machine, grounding) free of
  Electron so it stays unit-testable.
- Emit `null` + `UNKNOWN` for anything the model cannot ground. Never default,
  never back-fill.
- Add or update tests alongside the change.

If implementation reveals a requirement or architectural decision the approved
story did not cover: **STOP and ask.** Do not decide it yourself.

## After implementation

- Run the relevant tests.
- Run lint, typecheck, and build where applicable.
- Summarize changed files and the behavior change.
- Report actual test results, including failures, with output.
- Suggest commit message

Do not deploy. Finish by offering Phase 4 — REVIEW.
