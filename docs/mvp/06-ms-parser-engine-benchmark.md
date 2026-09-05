# MS-06 — Parser engine benchmark

**Phase:** MVP completion · **Estimate:** 3 weeks · **Depends on:** MS-05
**Conditional:** only the criteria the baseline missed at the gate

Governed by [ADR-0012](../decisions/0012-parser-engine-selected-by-measurement.md).

## Goal

Decide the document-processing engine from numbers on our own fixtures rather
than from vendor claims. Three candidates behind one interface, one scorer,
one decision.

The Python engines run **in the harness only** — never imported by
`apps/desktop`, never packaged, never signed. Benchmarking commits to nothing.

## Exit criteria

- All three engines scored on the same fixtures at the same render scale
- Report per criterion per engine, not a single winner ranking
- A selection ADR carrying the scores and naming what the losing engines were better at
- If a Python engine wins, its packaging is opened as a separate, deliberate problem

## Stories

| ID | Title | Branch | Est. |
| -- | ----- | ------ | ---- |
| US-24 | Python bench runner, harness-only, never packaged | `build/us-24-python-bench-runner` | `3d` |
| US-25 | PP-Structure adapter and coordinate normalisation | `feat/us-25-ppstructure-adapter` | `4d` |
| US-26 | Surya adapter and coordinate normalisation | `feat/us-26-surya-adapter` | `4d` |
| US-27 | Comparative scoring report, per criterion per engine | `feat/us-27-comparative-report` | `3d` |
| US-28 | Selection ADR from the results | `docs/us-28-engine-selection-adr` | `1d` |

## Watch for

A conversion bug in an adapter looks exactly like a bad engine. Normalisation to
PDF points, origin bottom-left, is the thing most likely to produce a wrong
conclusion — and the split outcome (exact text from the text layer, structure
from a model) is the one the report has to be able to show.

## Commit plan

Not written yet. Commit messages are mapped to acceptance criteria, and this
milestone has story titles only — see
[README](README.md#story-detail). Both are written when the milestone before
this one completes.
