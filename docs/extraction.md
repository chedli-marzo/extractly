# Extraction

## Scope of milestone 1

Only the deterministic half of the pipeline is implemented first
([ADR-0005](decisions/0005-document-processing-boundary.md)):

```
PDF → Document Processing → Document Representation → SQLite → Viewer
```

Everything below the `AI` line in the diagram is designed now and built later.
No model is downloaded or integrated
([ADR-0007](decisions/0007-model-selection-deferred.md)); the
`ExtractionProvider` interface exists with no implementation, and the pipeline
is tested against a stub. The reason is not caution about AI — it is that the
document representation is the ground truth every later stage is checked
against, so it has to be right first.


## Pipeline

```
Raw PDF
    ↓  hash, store, register
Document representation      (pages, text blocks, bboxes, page images)
    ↓  deterministic context selection
Extraction input             (schema + selected blocks, token-bounded)
    ↓
AI                           (local model, JSON-Schema-constrained)
    ↓
Candidate extraction         (raw + parsed)
    ↓  schema validation
    ↓  provenance grounding
    ↓  deterministic post-processing (units, numbers, cross-field checks)
Validated candidate
    ↓
Human review
    ↓
Approved extraction
```

## The rule

**AI output is never considered final data.**

It is always:

```
Candidate → Validated → Reviewed → Approved
```

Each arrow is a persisted transition, not a variable reassignment. A candidate
is never mutated into an approved record; the approved record is a new row that
points back at the candidate it came from.

## Document states

```
IMPORTED
PROCESSING
PARSED
EXTRACTING
EXTRACTED
PARTIALLY_EXTRACTED
NEEDS_REVIEW
REVIEWED
APPROVED
FAILED
```

Avoid a simple `status = "done"`, because you need to distinguish **AI
finished** from **human approved** — and, separately, from *some fields
extracted and the rest unknown*, which is the normal case on real documents,
not an edge case.

### Legal transitions

```
IMPORTED     → PROCESSING → PARSED → EXTRACTING → EXTRACTED
                                                → PARTIALLY_EXTRACTED
EXTRACTED            → NEEDS_REVIEW
PARTIALLY_EXTRACTED  → NEEDS_REVIEW
NEEDS_REVIEW → REVIEWED → APPROVED
any          → FAILED
FAILED       → PROCESSING            (explicit user retry only)
APPROVED     → (terminal)
```

`APPROVED` is terminal. Re-extracting an approved document creates a **new
extraction run**; the existing approved snapshot is never invalidated by a later
model run. The state machine lives in `core/` and is unit-tested; illegal
transitions throw rather than being clamped.

`REVIEWED` and `APPROVED` are separate on purpose: a reviewer may finish
checking every field and still not be the person authorised to approve. In MVP
one user does both, but the record keeps them apart, so the audit trail does
not have to be rebuilt later.

## Field states

Per field, independent of document state:

| State       | Meaning                                                       |
| ----------- | ------------------------------------------------------------- |
| `EXTRACTED` | Model proposed a value, schema-valid and grounded             |
| `UNGROUNDED`| Model proposed a value whose cited source text was not found  |
| `UNKNOWN`   | Not present in the document, or the model declined — value `null` |
| `CORRECTED` | Human changed the value                                       |
| `CONFIRMED` | Human accepted the proposed value unchanged                   |

`UNKNOWN` is a first-class success, not a failure. Requirement 8 — *never
silently invent missing values* — means the schema must permit `null` for every
extracted field, and the prompt must make declining cheaper than guessing.

A document cannot reach `APPROVED` while any field is `EXTRACTED` or
`UNGROUNDED`: every field must be `CONFIRMED`, `CORRECTED`, or an
explicitly-accepted `UNKNOWN`. That is the mechanism behind requirement 7.

## Provenance

Every extracted field should be able to point back to:

- document
- page
- source element
- source text
- bounding box
- confidence

Example:

```json
{
  "value": "DN150",
  "confidence": 0.94,
  "source": {
    "page": 87,
    "text": "Pipe size: DN150",
    "bbox": [120, 440, 280, 470]
  }
}
```

You do not need a sophisticated knowledge graph. Just make the data model
capable of this. See [data-model.md](data-model.md).

### Coordinate space

Bounding boxes are stored in **PDF user-space points, origin bottom-left,
rotation already applied**, normalised at parse time. The renderer converts to
image pixels using the stored page width, height, and render scale. Storing
raw pdfjs transform values would make every highlight a rendering-time guess;
normalising once at parse time makes it arithmetic.

### Grounding check

The single most important deterministic guard in the system.

The model is required to return, for each field, the literal source text it
read the value from. Before a candidate is accepted:

1. Normalise whitespace, ligatures, and hyphenation in both the quote and the
   text blocks of the cited page.
2. Search the cited page's text blocks for the quote.
3. If found → attach the matching block id and its bbox. The bbox comes from
   the parser, **never from the model** — models do not produce reliable
   coordinates.
4. If not found → search the rest of the document. Found elsewhere → keep the
   value, correct the page, lower confidence.
5. Still not found → field state `UNGROUNDED`, value retained but flagged, and
   surfaced first in review.

Confidence stored on a field is the model's self-reported number, and it is
treated as a weak signal for ordering the review queue — not as a gate. The
grounding result is the gate.

## Context selection

A 400-page specification does not fit in a local model's context, and stuffing
it would degrade accuracy even if it did. Selection is deterministic code in
`core/`, chosen per schema field group:

1. **Structural** — use the PDF outline, page labels, and heading-like blocks
   to locate candidate sections.
2. **Lexical** — score pages by occurrence of the field's declared keywords and
   units (a `nominal_diameter` field declares `DN`, `NPS`, `Ø`, `mm`).
3. **Bounded** — take the top-scoring pages up to a token budget, always whole
   pages, always in document order, always recorded on the extraction run so
   the selection is reproducible.

If nothing scores above threshold, the fields are marked `UNKNOWN` without
calling the model. Not calling the model is a valid outcome; requirement 10
says deterministic first.

## Model invocation

- Structured output is constrained by JSON Schema at the runtime level, not
  requested politely in the prompt.
- Temperature 0. Extraction is not a creative task, and reproducibility is
  worth more than variety.
- The prompt carries the selected text blocks **with their block ids**, and
  requires the model to cite a block id and quote per field.
- One repair retry on unparseable output, with the parse error included. Then
  `FAILED`, with the raw output kept in the run record.
- Reasoning-style models that emit thinking traces are unsuitable here unless
  the trace is stripped before parsing; prefer a plain instruct model.

Every run records: model name, model digest, parameters, prompt hash, parser
version, schema version, and the selected page list. Without those, a candidate
that looks wrong six months later cannot be explained.

## Post-processing

Deterministic, after the model, before review:

- unit parsing and normalisation (`DN150`, `150 mm`, `6"` → canonical value + unit)
- number parsing including European decimal separators and thousand separators
- range and tolerance parsing (`150 ±0.5`, `140–160`)
- enum snapping to the schema's allowed values, or `UNGROUNDED` if no exact match
- cross-field arithmetic checks — inconsistency flags the fields, it does not
  silently correct them

None of this may change a value's meaning without being visible in review.

## Re-extraction

Running extraction again creates a new `extraction_run`. Nothing is deleted.
Review carries forward: a field whose candidate value and grounding are
identical to a previously `CONFIRMED` field is pre-marked as confirmed; any
field whose value changed returns to review. That is what makes it safe to
upgrade the model on a document that is already half-reviewed.

## What is not in the pipeline yet

- OCR — documents with no text layer are rejected with an explicit reason.
- Vision models on drawings.
- Cross-document reasoning.

Each is a schema-visible gap, not a silent zero.

## Evaluation

Quality is measured, not judged. The harness in `tests/extraction/`
([ADR-0008](decisions/0008-evaluation-dataset-before-ai.md)) runs:

```
fixture PDF → processing → representation → extraction → JSON
           → compare against expected → per-field accuracy
```

It runs headlessly in Vitest, without Electron, because `packages/extraction`
does not depend on it.

Before any model exists, the same harness scores the deterministic half:

- text extracted per page, against expected page text
- reading order of blocks
- bounding box correctness within a tolerance
- table cell assignment

Once a provider exists it also scores per-field extraction accuracy, and the
false `UNGROUNDED` rate — the metric that decides whether the grounding gate is
making review faster or slower.

Scoring is per field, never whole-document pass or fail. A run that gets
nineteen of twenty fields right is a good run, and a metric that calls it a
failure hides all the signal.

Fixtures are synthetic or sanitised, always
([ADR-0009](decisions/0009-synthetic-fixtures-only.md)).
