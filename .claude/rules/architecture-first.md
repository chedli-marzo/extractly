# Architecture first, implementation second

**Rule:** work follows this order, and skipping steps because a task looks small
is how a project becomes a pile of generated code.

```
Requirement
    ↓
Architecture
    ↓
ADR if significant
    ↓
Implementation plan
    ↓
Implementation
    ↓
Tests
    ↓
Review
    ↓
Documentation
```

## When an ADR is required

Write one when a choice is expensive to reverse, constrains later work, or would
look wrong to a reader without context. Not for routine implementation choices.

ADRs live in [docs/decisions/](../../docs/decisions/), use the format in
`0000-template.md`, and are immutable once `Accepted` — supersede, never edit.
An ADR that does not say why the alternative lost is a changelog entry.

## Before implementing anything

1. Inspect the relevant existing files.
2. Understand the current architecture.
3. Check existing dependencies before adding new ones.
4. Prefer the simplest implementation that satisfies the requirement.
5. Do not introduce cloud infrastructure unless explicitly requested.
6. Do not introduce an abstraction merely for theoretical future flexibility.
7. Keep the three named boundaries replaceable: `DocumentParser`,
   `ExtractionProvider`, `OcrEngine`. Do not add a fourth.
8. Write tests for extraction and validation logic.
9. Never weaken tests to make an implementation pass.
10. Update documentation when architecture or behavior changes.

## Definition of done

A change is not finished until the docs that describe the changed behaviour are
updated in the same commit. If a change contradicts an ADR, the ADR is
superseded in that commit or the change does not land.
