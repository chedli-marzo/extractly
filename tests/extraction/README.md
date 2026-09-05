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
- bounding box correctness, within the tolerance below
- table cell assignment

## Milestone 1 exit criteria

These are what "reliably" means in the milestone 1 question. They are thresholds
to act on, not aspirations: the harness reports them, and CI fails below them.

| Measure | Threshold | Failure is |
| ------- | --------- | ---------- |
| Bounding box | every edge within **±2 pt** of expected | per block |
| Text recall | **≥ 99 %** of expected characters per page, after normalisation | per page |
| Missing block | **zero** expected blocks absent entirely | per block, absolute |
| Reading order | **exact** sequence match | per page, absolute |

**Bounding box, ±2 pt.** One point is 1/72 inch, so this is about 0.7 mm — under
half a line of body text, tight enough that a highlight lands on the right line
and loose enough to absorb the round trip. Expected boxes come from the layout
that generated the fixture; measured boxes come from pdfjs re-deriving them from
the PDF's text-item transforms. Those two paths agree closely but not exactly.

A tolerance that never fails measures nothing. Record the actual deltas from the
first fixtures: if they land around 0.2 pt, tighten this to ±0.5 pt. The number
is provisional by design and this paragraph is why.

**Text recall, ≥ 99 % with a floor.** The percentage alone hides the failure that
matters — 99 % of a 3 000-character page still permits an entire missing line.
So the second rule is absolute: no expected block may be missing entirely,
whatever the percentage says. A percentage catches degradation, a floor catches
categorical breakage, and only both together are worth running.

Normalisation before comparison is the **same normaliser the grounding check
uses** (whitespace, ligatures, hyphenation — see
[extraction.md](../../docs/extraction.md)). One implementation, so the harness
cannot pass text that grounding would later reject.

**Reading order, exact.** Any ordering error is a failure, with no partial
credit: reading order is what makes a value's context meaningful, and a
"mostly right" order is silently wrong in exactly the cases that matter. The
fixture set must include a two-column page and a page mixing a table with body
text — single-column documents cannot exercise this at all, so a suite without
them would pass while proving nothing.

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
