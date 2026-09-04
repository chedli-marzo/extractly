# packages/extraction

The pipeline. Two halves, split at the document representation
([ADR-0005](../../docs/decisions/0005-document-processing-boundary.md)).

```
src/processing/   PDF → document representation. Deterministic.
src/extraction/   representation + schema → validated candidate
```

**Never imports Electron.** That is what lets `tests/extraction/` run headlessly
in Vitest. It is a hard rule, not a preference.

## `src/processing` — milestone 1

PDF inspection, page geometry, text extraction with per-item bounding boxes,
reading order, table cell reconstruction, page rendering. Behind
`DocumentParser`; `pdfjs-dist` is an implementation detail.

Re-runnable: same PDF plus same parser version gives byte-identical output.
That property is what makes provenance verifiable.

Coordinates are normalised once, at parse time, to PDF points with a
bottom-left origin and rotation applied.

## `src/extraction` — later

Schema handling, context selection, the `ExtractionProvider` interface
([ADR-0006](../../docs/decisions/0006-ai-provider-abstraction.md)), validation,
provenance grounding, deterministic post-processing.

The provider does not validate, repair, retry, or decide what happens next.
No provider implementation exists yet
([ADR-0007](../../docs/decisions/0007-model-selection-deferred.md)).

Not implemented yet.
