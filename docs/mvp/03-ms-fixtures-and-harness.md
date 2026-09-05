# MS-03 — Fixtures and evaluation harness

**Phase:** Validation release · **Estimate:** 2.5 weeks · **Depends on:** MS-01

## Goal

The measurement, built before the thing it measures.

This ordering is deliberate ([ADR-0008](../decisions/0008-evaluation-dataset-before-ai.md)):
the expected-output format is designed against documents rather than against
whatever the parser first happens to emit, and the parser in MS-04 is then
developed against a suite that already fails for the right reasons.

## Exit criteria

- Fixtures regenerate reproducibly from source HTML
- Expected files exist for every fixture, with boxes derived from source geometry
- The harness runs headlessly in Vitest, without Electron
- It reports all four milestone-1 thresholds, per page and per block
- It currently fails, because no parser exists

---

## US-09 — Chromium HTML to PDF fixture generation · `3d`

**As a** developer, **I want** fixtures generated from hand-authored HTML by the
Chromium inside Electron, **so that** fixtures are deterministic and add no
dependency.

- A script prints a fixture's HTML to PDF and writes it beside its source
- Output is byte-stable for a pinned Electron version
- Text layer is present and verified by the generator
- Electron version recorded per fixture in [fixtures/README.md](../../tests/extraction/fixtures/README.md)
- Fixture PDFs are build outputs: regenerated, never hand-edited
- No real customer document can enter this path ([ADR-0009](../decisions/0009-synthetic-fixtures-only.md))

**Branch:** `build/us-09-fixture-generation`

**Commits**

1. `build: print fixture html to pdf via chromium` — *criteria 1, 3*
   > Chromium is already in Electron: no PDF-generation dependency, and a
   > guaranteed text layer.
2. `build: make fixture output byte-stable` — *criteria 2, 4*
3. `docs: record fixtures are build outputs` — *criteria 5, 6*

## US-10 — First fixture set · `4d`

**As a** developer, **I want** fixtures that can actually fail the thresholds,
**so that** passing them means something.

- Single-column datasheet with a specification table
- Two-column page — without it, reading order cannot be exercised at all
- Page mixing a table with body text
- A merged table cell spanning two columns
- A table continuing across a page break with the header only on the first page
- A page with no text layer, to assert it is reported rather than silently empty
- Every fixture has a row in the fixtures README recording origin, safety and what it exercises

**Branch:** `test/us-10-first-fixture-set`

**Commits**

1. `test: add single-column datasheet fixture` — *criterion 1*
2. `test: add two-column fixture` — *criterion 2*
   > Without it reading order cannot be exercised at all, and the suite would
   > pass while proving nothing.
3. `test: add table and body-text fixture` — *criterion 3*
4. `test: add merged-cell fixture` — *criterion 4*
5. `test: add table spanning a page break` — *criterion 5*
6. `test: add fixture with no text layer` — *criterion 6*
7. `docs: record provenance for every fixture` — *criterion 7*

## US-11 — Expected-file format · `2d`

**As a** developer, **I want** expected output authored from the fixture source,
**so that** a bounding-box comparison tests the parser and not the person who
typed the numbers.

- Expected JSON records per page: text content, block sequence, block boxes, table cell assignments
- Boxes derived from the source HTML's layout, not measured from the rendered PDF
- Expected files versioned against a schema version; a schema change that invalidates them says so
- Format documented well enough that a second person can author one

**Branch:** `feat/us-11-expected-file-format`

**Commits**

1. `feat: define expected output format` — *criteria 1, 3*
2. `build: derive expected boxes from fixture source` — *criterion 2*
   > Derived, not measured: otherwise the tolerance tests whoever typed the
   > numbers rather than the parser.
3. `docs: document how to author an expected file` — *criterion 4*

## US-12 — Scoring harness · `4d`

**As a** developer, **I want** the four thresholds enforced automatically,
**so that** milestone 1 passes or fails on numbers.

- Bounding boxes: every edge within ±2 pt of expected
- Text recall: ≥99% of expected characters per page after normalisation
- Missing blocks: zero, absolute — the floor the percentage would hide
- Reading order: exact sequence match, no partial credit
- Normalisation uses the same implementation as the grounding check, so the harness cannot pass text grounding would later reject
- Report is per field and per page, never whole-document pass/fail
- Actual bounding-box deltas are reported, not just pass/fail, so the ±2 pt tolerance can be tightened on evidence
- Runs in CI; a threshold breach fails the build

**Branch:** `feat/us-12-scoring-harness`

**Commits**

1. `feat: score bounding boxes within tolerance` — *criterion 1*
2. `feat: score text recall after normalisation` — *criteria 2, 5*
   > Same normaliser as the grounding check, so the harness cannot pass text
   > that grounding would later reject.
3. `feat: fail on any entirely missing block` — *criterion 3*
   > The percentage hides this: 99% of a 3000-character page still permits a
   > whole missing line.
4. `feat: score reading order as exact match` — *criterion 4*
5. `feat: report per field and per page` — *criteria 6, 7*
6. `ci: fail the build on a threshold breach` — *criterion 8*
