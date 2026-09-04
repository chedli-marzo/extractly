# tests/extraction

Evaluation dataset and scoring harness
([ADR-0008](../../docs/decisions/0008-evaluation-dataset-before-ai.md)).

```
fixtures/     fixture-001.pdf
expected/     fixture-001.expected.json
evaluation/   harness, scoring, reports
```

## What it runs

```
fixture PDF → processing → representation → extraction → JSON
           → compare against expected → per-field accuracy
```

Headless, in Vitest, without Electron — possible because
`packages/extraction` does not depend on it.

## Before a model exists

The same harness scores the deterministic half:

- text extracted per page, against expected page text
- reading order of blocks
- bounding box correctness, within a stated tolerance
- table cell assignment

## Scoring

Per field, never whole-document pass or fail. A run that gets nineteen of twenty
fields right is a good run; a metric that calls it a failure hides the signal.

Once a provider exists the harness also reports the false `UNGROUNDED` rate —
the number that decides whether the grounding gate is making review faster or
slower.

## Fixture rules

Synthetic or sanitised only
([ADR-0009](../../docs/decisions/0009-synthetic-fixtures-only.md)). Never a real
customer document. Provenance for every fixture is recorded in
[fixtures/README.md](fixtures/README.md).

Expected files are versioned against a schema version. A schema change that
invalidates them must say so.
