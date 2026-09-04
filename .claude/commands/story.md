---
description: Phase 2 — write the user story from the agreed requirement
argument-hint: [feature name or extra context]
---

# Phase 2 — USER STORY

$ARGUMENTS

You are in the USER STORY phase. Base the story **only** on the requirement
agreed during DISCUSS. If DISCUSS did not happen or the requirement is still
ambiguous, stop and say so instead of guessing.

Produce exactly this structure:

## Title

Short imperative title.

## User story

As a <user>, I want <capability>, so that <value>.

## Context

Why this is needed, and how it fits the current architecture. Reference concrete
files and docs.

## Acceptance criteria

Numbered, specific, testable. Each one must be verifiable by a test, a command,
or a concrete manual check. No vague criteria ("works well", "is fast").

## Technical considerations

Architecture fit, the boundaries touched (`InferenceProvider`, `DocumentParser`,
`OcrEngine`), data-model impact, migrations, IPC contract changes, determinism vs
AI split, provenance, and any dependency that would be needed — with its reason.

## Affected areas/files

Concrete paths under `apps/`, `packages/`, `docs/`, `tests/`.

## Out of scope

Explicit exclusions, so scope cannot drift silently.

## Testing requirements

Which unit tests, which fixtures, what must be tested without Electron. Remember:
never assert "the model returns X" — test schema conformance, grounding
rejection, repair, and failure paths.

## Rules

- Do NOT implement anything.
- Do NOT create files other than the story itself if the user asked for it saved.
- After presenting the story, STOP and wait for explicit approval.
