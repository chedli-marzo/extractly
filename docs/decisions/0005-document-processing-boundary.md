# ADR-0005: Document-processing boundary

**Status:** Accepted

## Decision

Document processing and AI extraction are separate stages with a defined
artifact between them: the **document representation**.

```
PDF
 ↓
Document Processing        deterministic, re-runnable
 ↓
Document Representation    pages, text blocks, bounding boxes, geometry
 ↓
Extraction Provider        the only stage that involves a model
 ↓
Validation
 ↓
Review
```

The document representation is persisted in SQLite and is a complete,
self-sufficient artifact. Nothing downstream reads the PDF again. The extraction
provider receives text blocks and their identifiers, never a file path and never
a page image supplied by the parser's caller.

The first milestone implements only the left half:

```
PDF → Document Processing → Document Representation → SQLite → Viewer
```

## Context

The failure mode this prevents is the common one: AI extraction and PDF parsing
growing into each other, so the prompt starts depending on parser quirks and the
parser starts being tuned to whatever the current model happens to like. Once
that happens, neither can be changed or evaluated alone, and provenance becomes
unverifiable because nobody can say which stage produced a given coordinate.

Defining the boundary now, before either side exists, costs nothing. Defining it
after both exist costs a rewrite of the part that carries provenance.

The boundary also determines what the first milestone has to prove, which is a
harder and more fundamental question than whether a model can fill in a schema:

> Can we reliably turn a real 200-page engineering PDF into a local, searchable
> document representation where every piece of extracted text maps back to its
> exact page and bounding box?

If that answer is no, no model can fix it. If it is yes, adding local AI is a
comparatively safe step, because the representation is the ground truth the
model's claims get checked against.

Deterministic processing is preferred wherever it is sufficient: page geometry,
text extraction, reading order, table cell reconstruction, unit and number
parsing, and cross-field arithmetic are all code. The model is used only for the
step that genuinely needs language understanding — mapping content to schema
fields.

## Consequences

Positive:

- the representation can be built, tested, and trusted before any model exists
- parser changes are evaluated against fixtures, not against model output
- provenance coordinates always come from the parser, never from a model, which
  is what makes the grounding check in [extraction.md](../extraction.md)
  meaningful
- re-extraction with a different model is cheap: the representation is reused,
  not rebuilt
- swapping the parser later — a native library, a Python sidecar — changes one
  package

Negative:

- the representation must be designed before its consumer fully exists, so some
  fields will be added later
- the full representation for a large document is a lot of rows, written and
  read even when a run needs a handful of pages
- an extra persisted stage means an extra migration surface
- the discipline has to be enforced in review; nothing in the compiler stops
  someone passing a file path to the extraction stage

## Revisit when

The representation turns out to be missing something the model genuinely needs
that is not expressible as text plus geometry — for example, when drawings force
page images into the extraction input. That is an extension of the artifact, not
a removal of the boundary.
