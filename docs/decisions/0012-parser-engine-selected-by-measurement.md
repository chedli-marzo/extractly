# ADR-0012: Parser engine selected by measurement

**Status:** Proposed

## Decision

No document-processing engine is chosen on description. Three candidates are
implemented behind the existing `DocumentParser` interface, scored by the
evaluation harness against the same fixtures, and one is selected from the
result. That result becomes its own ADR.

The candidates:

| # | Engine | Approach | Runtime |
| - | ------ | -------- | ------- |
| 1 | `pdfjs-dist` | reads the PDF's embedded text layer; geometric reconstruction | Node, in-process |
| 2 | PaddleOCR / PP-Structure | renders pages to images; neural layout, table and text recognition | Python, bench only |
| 3 | Surya | renders pages to images; neural layout, reading order, table recognition | Python, bench only |

`pdfjs-dist` is the baseline and is not optional in the comparison. On a PDF
that carries a text layer it is the only candidate that is *exact* rather than
approximate: the characters are stored in the file, and reading them is not a
recognition problem.

**The Python engines run in the evaluation harness only.** They are invoked as
subprocesses by `tests/extraction/evaluation`, never imported by
`apps/desktop`, never packaged, never signed, never shipped. If one wins, its
packaging is a deliberate, separately-decided problem — not a consequence of
having benchmarked it.

**The switch is a bench, not a product feature.** The shipped application
contains one engine. There is no runtime engine selector, no plugin registry,
and no fourth seam: three implementations of one existing interface.

**Every adapter normalises before the scorer sees anything.** All output is
converted to the coordinate space [extraction.md](../extraction.md) already
mandates — PDF user-space points, origin bottom-left, rotation applied. No
engine concept reaches a caller: no Paddle layout labels, no Surya block types,
no pixel coordinates. An engine concept that escapes the adapter means the seam
has already failed.

Each benchmark run records the engine name, engine version, model version, and
the render scale used, so a result stays attributable after an upgrade.

The comparison is scoped by what the baseline misses. Milestone 1 runs against
`pdfjs-dist` first; the criteria it fails are the criteria the benchmark exists
to answer. If the baseline clears every threshold, the benchmark is not run.

## Context

[ADR-0005](0005-document-processing-boundary.md) named `pdfjs-dist` as the
implementation behind `DocumentParser` and built the seam precisely so that it
could be replaced. This ADR uses that seam for the purpose it was created for,
and applies the pattern [ADR-0007](0007-model-selection-deferred.md) and
[ADR-0008](0008-evaluation-dataset-before-ai.md) already established for
models: name the candidates, build the measurement, then decide.

The reason is the same reason. An engine choice is sticky — coordinate
conventions, output shapes, failure modes and quirks accrete around whichever
one arrives first, and the cost of changing it grows quietly. Choosing from a
product description, before a single fixture has been scored, is choosing by
impression. The harness exists to make this a measurement.

What each candidate is actually good at is not in dispute, and that is the
point. Reading a text layer is exact and free; reconstructing a merged table
cell from glyph positions alone is hard. Neural layout models invert both:
approximate on text, strong on structure. The plausible outcome is therefore
not a winner but a **split** — text and coordinates from the text layer,
structure from a model where geometry falls short — and a comparison run per
criterion is what would reveal that. A single-engine decision taken now would
foreclose it.

The bench-only constraint is what makes this affordable. PP-Structure is a
Python stack; Surya is PyTorch and heavier still. Bundling either means a
frozen Python runtime, signed and notarised on two platforms, an installer an
order of magnitude larger, and a very large dependency tree running with
main-process privileges on machines holding confidential documents — the exact
cost [ADR-0001](0001-electron.md) weighed when it rejected a Python sidecar.
None of that applies to a subprocess invoked by a test harness on a developer
machine. Benchmarking an engine commits to nothing.

**Alternatives considered.**

*Choose one engine now.* Rejected for the reason above: it is a decision by
description, and the description is not in dispute — the measurement is.

*Ship all three with a user-facing switch.* Rejected. Three engines is three
runtimes, well past a gigabyte with two of them dead weight, three signing
problems, and a support surface where every bug report starts with "which
engine were you on". "Test accuracy and choose one" implies one survives.

*Include `tesseract.js` as a fourth candidate.* Rejected.
[ADR-0005](0005-document-processing-boundary.md) already names it for the
no-text-layer case, where it is an OCR engine rather than a layout engine. It
would not compete on the criteria this comparison is about.

*Skip the baseline and compare the two neural engines.* Rejected, and worth
stating explicitly because it is the tempting shortcut: it would measure which
approximation is better while ignoring the candidate that is exact.

## Consequences

Positive:

- the engine decision is made from numbers on the project's own fixtures rather
  than from vendor claims
- a hybrid outcome — exact text, modelled structure — is visible if that is what
  the data says, instead of being foreclosed
- benchmarking costs nothing in installer size, signing, or dependency exposure,
  because the Python engines never leave the harness
- the normalisation contract is exercised by three independent implementations,
  which is a far better test of `DocumentParser` than one implementation
- ADR-0001's rejection of a Python sidecar is left standing and unreopened

Negative:

- three adapters and their coordinate conversions are real work before any
  engine is selected
- a conversion bug in an adapter looks exactly like a bad engine; the
  normalisation is the thing most likely to produce a wrong conclusion
- OCR accuracy depends on render scale, so a fixed scale must be chosen and
  recorded, and a change to it invalidates prior runs
- Python engines mean a Python toolchain on developer machines and in CI, for
  the harness only, which is friction on both platforms
- if a Python engine wins, packaging becomes a genuinely large problem that this
  ADR deliberately does not solve

## Revisit when

The benchmark has run. The selection is a new ADR carrying the scores, per
criterion and per engine, and naming what the losing engines were better at —
because a later requirement may make that the deciding factor.
