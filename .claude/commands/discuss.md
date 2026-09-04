---
description: Phase 1 — clarify a requirement before any story or code
argument-hint: <requirement or feature description>
---

# Phase 1 — DISCUSS

Requirement under discussion:

$ARGUMENTS

You are in the DISCUSS phase of the mandatory workflow
(DISCUSS → USER STORY → IMPLEMENT → REVIEW → DEPLOY).

## Do

1. Restate the requested behavior in your own words.
2. Inspect the relevant existing code and docs before reasoning about design.
   Start with `CLAUDE.md`, then `docs/architecture.md`, `docs/extraction.md`,
   `docs/data-model.md`, `docs/security.md`, and the affected package under
   `apps/` or `packages/`.
3. List ambiguities, missing requirements, constraints, and edge cases.
4. Check the requirement against the non-negotiable requirements in `CLAUDE.md`
   (locality, no cloud, no external AI API, mandatory human review, never invent
   values, deterministic over AI). Flag any conflict explicitly.
5. State every assumption you are making, as a list.
6. Ask focused questions — only the ones whose answers change the implementation.
7. Summarize the agreed requirement at the end.

## Do NOT

- Write or modify any code, config, or test.
- Write the user story.
- Propose new dependencies without a recorded reason.
- Invent requirements the user did not state.

## Finish with

An explicit question asking for approval to move to Phase 2 and create the user
story. Then stop.
