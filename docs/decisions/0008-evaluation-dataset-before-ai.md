# ADR-0008: Evaluation dataset before AI

**Status:** Accepted

## Decision

An evaluation dataset and a scoring harness are built before any model is
integrated. They live at:

```
tests/extraction/
├── fixtures/      fixture-001.pdf
├── expected/      fixture-001.expected.json
└── evaluation/    harness, scoring, reports
```

The harness runs: PDF → processing → representation → extraction → JSON →
compare against expected → accuracy metrics. It runs headlessly, without
Electron, and reports per-field accuracy rather than a single pass or fail.

Before any model exists, the same harness scores the deterministic half from
ADR-0005: text extracted per page, reading order, and bounding box correctness.

## Context

Extraction quality is not a boolean and cannot be judged by looking at output.
Every meaningful question about this system — is model A better than model B,
did that prompt change help, did the parser upgrade break table reading, is this
field type systematically worse than the others — is a measurement question. If
the measurement does not exist, those questions get answered by impression, and
impressions do not survive a refactor.

Building it before the model matters for a second reason: it forces the expected
output format to be designed against real documents rather than against whatever
the first model happens to emit. Expected files written after a model exists tend
to encode that model's habits.

The dataset also gives ADR-0007 its decision procedure, and gives the grounding
check in [extraction.md](../extraction.md) a way to measure false `UNGROUNDED`
rates, which is the failure that would make review slower rather than faster.

Per-field scoring rather than whole-document pass/fail is deliberate: a run that
gets nineteen of twenty fields right is a good run, and a metric that calls it a
failure hides all the signal.

## Consequences

Positive:

- model choice, prompt changes, and parser upgrades become measurable rather
  than debatable
- regressions are caught by CI instead of by a user
- the expected format is designed against documents, not against a model
- the harness is the same tool used for benchmarking, evaluation, and regression
  testing, so it only has to be built once

Negative:

- writing expected JSON by hand for a real engineering PDF is slow, careful work
  and is the main cost of this decision
- the dataset must be synthetic or sanitised under ADR-0009, so it will be less
  messy than real input and will flatter the system
- fixtures are binary files in git; they need a size discipline or eventually
  LFS
- expected files must be versioned against schema versions, or a schema change
  silently invalidates the whole dataset
- a dataset of a handful of documents will not be statistically meaningful for
  some time

## Revisit when

The dataset is large enough that per-document expected files become unmaintainable
by hand, at which point approved extractions from real use become the source —
which is exactly why corrections are recorded append-only.
