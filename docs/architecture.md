# Architecture

## Shape

One desktop application. One local database. Later, one local model runtime. No
server, no sync, no shared state between machines. See
[ADR-0003](decisions/0003-local-first-architecture.md).

## The pipeline

The spine of the system. Every stage has one job and a defined artifact on
either side of it.

```
PDF
 ↓
Document Processing        deterministic, re-runnable
 ↓
Document Representation    pages · text blocks · bounding boxes · geometry
 ↓
Extraction Provider        the only stage that involves a model
 ↓
Validation                 schema · grounding · post-processing
 ↓
Review                     human confirms or corrects every field
 ↓
Approved Extraction
```

The **document representation** is the boundary
([ADR-0005](decisions/0005-document-processing-boundary.md)). It is persisted,
complete, and self-sufficient: nothing downstream ever reads the PDF again. The
extraction provider receives text blocks and their ids — never a file path.

Provenance coordinates always come from the parser. A model is never asked for
a bounding box, and any it volunteers is discarded.

### Milestone 1 implements only the left half

```
PDF → Document Processing → Document Representation → SQLite → Viewer
```

The question it has to answer:

> Can we reliably turn a real 200-page engineering PDF into a local, searchable
> document representation where every piece of extracted text maps back to its
> exact page and bounding box?

No model is downloaded or integrated
([ADR-0007](decisions/0007-model-selection-deferred.md)). The
`ExtractionProvider` interface and its types are written; no implementation is.
AI is not postponed — its seam is defined now, precisely so it cannot grow into
the parser later.

## Repository layout

A pnpm workspace. The split exists so that the parts that must be testable
without a desktop runtime actually are.

```
apps/
  desktop/            Electron application
    src/main/         main process: lifecycle, windows, IPC, orchestration
    src/preload/      contextBridge — the only renderer↔main channel
    src/renderer/     React UI shell and routing
packages/
  shared/             types, JSON Schemas, IPC contract. No runtime deps.
  database/           SQLite schema, migrations, repositories
  extraction/         document processing + extraction provider interface
  ui/                 React components, presentational
tests/
  extraction/         evaluation dataset and scoring harness
docs/
  decisions/          ADRs
```

Dependency direction, enforced in review and by lint:

```
apps/desktop ──► ui ──────────► shared
             ──► database ────► shared
             ──► extraction ──► shared
```

`packages/extraction` and `packages/database` never import from
`apps/desktop`, and `packages/extraction` never imports Electron. That is what
lets the evaluation harness in `tests/extraction/` run headlessly in Vitest
([ADR-0008](decisions/0008-evaluation-dataset-before-ai.md)).

`packages/ui` is presentational: it takes props and emits events. It does not
call IPC.

## Process model

Three processes, one hard rule each.

```
┌──────────────────────────────────────────────────────────────┐
│ Main process (Node, privileged)                              │
│   lifecycle · windows · IPC handlers · job orchestration      │
│   owns: filesystem, SQLite, model connection                  │
└───────────▲──────────────────────────┬───────────────────────┘
            │ typed IPC via preload    │ spawns / kills
            │                          ▼
┌───────────┴────────────┐   ┌──────────────────────────────────┐
│ Renderer (sandboxed)   │   │ utilityProcess: pipeline worker   │
│   React UI             │   │   parse · render · (later) infer  │
│   no Node, no fs, no   │   │   CPU-heavy, killable, no DB      │
│   network              │   │   handle                          │
└────────────────────────┘   └──────────────────────────────────┘
```

**Main** owns everything privileged. It is the only process that touches user
data on disk. `better-sqlite3` is synchronous, so it blocks — which is why
nothing slow is allowed to run here
([ADR-0004](decisions/0004-sqlite-persistence.md)).

**Renderer** owns nothing. `contextIsolation: true`, `nodeIntegration: false`,
`sandbox: true`. It receives data over a narrow typed IPC surface and renders
it. It cannot open a file, run a query, or reach the network. See
[security.md](security.md).

**Pipeline worker** (`utilityProcess`) does the slow work. It exists so a
200-page document does not freeze the window, and so a job is cancelled by
killing a process rather than by hoping a promise notices. It receives a
document id and a job id, not a database handle; it returns results to main,
which writes them.

For a large document the worker streams results as NDJSON to a temp file under
`userData` and returns the path, rather than pushing tens of megabytes of JSON
through a pipe. Main ingests it in one transaction.

## Layers inside the packages

### `packages/extraction`

Two halves, matching [ADR-0005](decisions/0005-document-processing-boundary.md).

**Document processing** — deterministic, no model, no Electron:

- PDF inspection: page count, encryption, producer, whether a text layer exists
- page geometry: MediaBox, rotation, units
- text extraction with per-item bounding boxes
- reading order and table cell reconstruction from geometry
- page image rendering
- OCR when required *(phase 2)*

Everything here is re-runnable. Same PDF plus same parser version gives
byte-identical output — which is what makes provenance verifiable later.

Behind `DocumentParser`. `pdfjs-dist` is an implementation detail, including its
quirks: bottom-left origin, transform matrices, rotation. Coordinates are
normalised once, at parse time.

**Extraction** — schema handling, context selection, validation, grounding,
post-processing, and the `ExtractionProvider` interface from
[ADR-0006](decisions/0006-ai-provider-abstraction.md). Pure. This is where
correctness lives, so this is where the tests are.

### `packages/database`

Documents, pages, text blocks, jobs, extraction runs, candidate fields,
provenance, review state, corrections, approved extractions. Plain SQL
migrations applied in order at startup inside a transaction, tracked with
`PRAGMA user_version`. Repository functions return domain types. No ORM, no
query builder, no lazy loading. Schema in [data-model.md](data-model.md).

### `packages/shared`

Types only, no runtime dependencies: the IPC contract, domain types, and the
JSON Schemas that define extractable document types.

### `packages/ui` and `apps/desktop`

`ui` is components. `desktop` wires packages to IPC and to the window: import,
processing status, the page viewer with highlighting, review, correction,
export.

## Data flow: import to approved

1. **Import.** User picks a PDF. Main hashes it (SHA-256), copies it to
   `blobs/<sha256>.pdf`, inserts a `document` row. A duplicate hash reuses the
   existing document — no second copy. State `IMPORTED`.
2. **Parse.** Worker extracts pages, text blocks with bounding boxes, and page
   images. Main writes `document_page` and `text_block` in one transaction.
   State `PARSED`. No text layer means the document stops here with an explicit
   reason — never a silent empty result.
3. **Select context.** Deterministic code chooses which pages and blocks go to
   the provider for a given schema. On a 200-page document this is a filter, not
   the whole document. See [extraction.md](extraction.md).
4. **Extract.** Provider called with the JSON Schema and the selected context.
   State `EXTRACTING`. *Not in milestone 1.*
5. **Validate and ground.** Parse, validate against the schema, and check that
   each field's quoted source text actually occurs in the text blocks it claims
   to come from. Ungrounded values are downgraded, not kept. State `EXTRACTED`
   or `PARTIALLY_EXTRACTED`, then `NEEDS_REVIEW`.
6. **Review.** Human confirms or corrects each field. Corrections are stored
   alongside the original candidate, never overwriting it.
7. **Approve.** A snapshot of the approved payload is written with schema
   version, model identity, and approver. State `APPROVED`.
8. **Export.** JSON, CSV, or XLSX generated from the approved snapshot only.
   Candidate data is never exported.

## Storage on disk

```
<userData>/
  app.db                        SQLite
  blobs/<sha256>.pdf            imported originals, content-addressed
  renders/<sha256>/<page>.png   page images
  tmp/                          worker NDJSON handoff, cleared at startup
```

Content addressing means a filename taken from a document never becomes a path
on disk. Original filenames are display strings only.

## Job and cancellation model

Every long operation is a `job` row with a state, an engine identity, and an
error field. The worker reports progress over IPC; main persists transitions.
Cancelling kills the worker process.

On startup, any job left running from a previous session is marked `FAILED` with
reason `INTERRUPTED` — never silently resumed. A half-written extraction that
looks complete is worse than an obvious failure.

## Failure posture

The application fails loudly and locally.

- No text layer → explicit "needs OCR, not supported yet", not an empty result.
- Provider unreachable → the UI says so and names the fix. No queued retry that
  looks like progress.
- Unparseable JSON → one repair attempt, then `FAILED`, with the raw output kept
  for inspection.
- Field cannot be grounded → `null` and `UNKNOWN`, surfaced first in review.
- Schema validation fails → the document reaches review with the failure
  visible, never with fields quietly dropped.

## Deliberately absent

No plugin system. No event bus. No dependency-injection container. No repository
interfaces with a single implementation. No microservice split of a single-user
desktop app.

Three seams exist for replaceability and no more: `DocumentParser`,
`ExtractionProvider`, `OcrEngine`. Do not add a fourth for theoretical future
flexibility.
