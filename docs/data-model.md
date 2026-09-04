# Data model

SQLite, one file at `<userData>/app.db`, owned by `packages/database` and
accessed only from the Electron main process
([ADR-0004](decisions/0004-sqlite-persistence.md)). Original PDFs and rendered
page images live on disk beside it, not in the database.

The `document`, `document_page`, and `text_block` tables together are the
**document representation** — the boundary artifact from
[ADR-0005](decisions/0005-document-processing-boundary.md), and the only part of
this schema that milestone 1 populates.

## Principles

1. **Candidate and approved data are different rows.** Nothing overwrites a
   model proposal; approval adds a record.
2. **Provenance is a table, not a JSON blob.** Highlighting a field in the UI is
   a join, not a parse.
3. **Every AI-derived row records what produced it** — model, digest,
   parameters, prompt hash, schema version, parser version.
4. **Blobs stay on the filesystem**, addressed by SHA-256. The database stores
   the hash and relative path.
5. **No soft deletes and no `updated_at`-as-history.** History that matters is
   an explicit row.

Conventions: `id` is `TEXT` (UUIDv7, sortable by creation). Timestamps are
`TEXT` ISO-8601 UTC. Booleans are `INTEGER` 0/1. `FOREIGN KEYS` are on.

## Schema

### Documents and parsed representation

```sql
CREATE TABLE document (
  id            TEXT PRIMARY KEY,
  sha256        TEXT NOT NULL UNIQUE,        -- dedupe key
  filename      TEXT NOT NULL,               -- original name, display only
  stored_path   TEXT NOT NULL,               -- relative: blobs/<sha256>.pdf
  byte_size     INTEGER NOT NULL,
  page_count    INTEGER,
  has_text_layer INTEGER,                    -- null until parsed
  is_encrypted  INTEGER NOT NULL DEFAULT 0,
  pdf_producer  TEXT,
  state         TEXT NOT NULL,               -- see extraction.md
  state_reason  TEXT,                        -- why FAILED / why blocked
  imported_at   TEXT NOT NULL,
  parser_version TEXT                        -- which DocumentParser produced blocks
);

CREATE TABLE document_page (
  id            TEXT PRIMARY KEY,
  document_id   TEXT NOT NULL REFERENCES document(id) ON DELETE CASCADE,
  page_index    INTEGER NOT NULL,            -- 0-based
  page_label    TEXT,                        -- printed label, may differ ("iv", "A-3")
  width_pt      REAL NOT NULL,
  height_pt     REAL NOT NULL,
  rotation      INTEGER NOT NULL DEFAULT 0,
  has_text      INTEGER NOT NULL DEFAULT 0,
  render_path   TEXT,                        -- renders/<sha256>/<page>.png
  render_scale  REAL,                        -- px per pt, for bbox → pixel mapping
  UNIQUE (document_id, page_index)
);

CREATE TABLE text_block (
  id            TEXT PRIMARY KEY,
  document_id   TEXT NOT NULL REFERENCES document(id) ON DELETE CASCADE,
  page_index    INTEGER NOT NULL,
  seq           INTEGER NOT NULL,            -- reading order within page
  text          TEXT NOT NULL,
  x0 REAL NOT NULL, y0 REAL NOT NULL,        -- PDF points, origin bottom-left,
  x1 REAL NOT NULL, y1 REAL NOT NULL,        -- rotation already applied
  source        TEXT NOT NULL,               -- 'pdf_text' | 'ocr'
  ocr_confidence REAL,                       -- null for pdf_text
  UNIQUE (document_id, page_index, seq)
);
CREATE INDEX idx_text_block_page ON text_block(document_id, page_index);
```

`text_block` is the grounding corpus. Full-text search over it (FTS5 on `text`)
is added when context selection needs it, not before.

### Schemas

```sql
CREATE TABLE schema_definition (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,               -- 'pipe_spec'
  version       INTEGER NOT NULL,
  json_schema   TEXT NOT NULL,               -- serialised JSON Schema
  created_at    TEXT NOT NULL,
  UNIQUE (name, version)
);
```

Schemas live as JSON Schema in `packages/shared/schemas/`, and a row is inserted
on first use. Persisting them means an approved record from six months ago can
still be interpreted, even after the code has moved on. Schema rows are
append-only: a change is a new `version`.

### Jobs

```sql
CREATE TABLE job (
  id            TEXT PRIMARY KEY,
  document_id   TEXT NOT NULL REFERENCES document(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL,               -- 'parse' | 'render' | 'extract'
  state         TEXT NOT NULL,               -- 'QUEUED'|'RUNNING'|'DONE'|'FAILED'|'CANCELLED'
  progress      REAL NOT NULL DEFAULT 0,
  error         TEXT,
  started_at    TEXT,
  finished_at   TEXT,
  created_at    TEXT NOT NULL
);
CREATE INDEX idx_job_state ON job(state, created_at);
```

On startup, rows left `RUNNING` become `FAILED` with error `INTERRUPTED`.

### Extraction runs and candidates

```sql
CREATE TABLE extraction_run (
  id            TEXT PRIMARY KEY,
  document_id   TEXT NOT NULL REFERENCES document(id) ON DELETE CASCADE,
  job_id        TEXT REFERENCES job(id),
  schema_id     TEXT NOT NULL REFERENCES schema_definition(id),
  provider      TEXT NOT NULL,               -- 'ollama'
  model_name    TEXT NOT NULL,               -- 'qwen2.5:7b-instruct'
  model_digest  TEXT,                        -- exact weights identity
  params_json   TEXT NOT NULL,               -- temperature, num_ctx, seed
  prompt_hash   TEXT NOT NULL,
  selected_pages TEXT NOT NULL,              -- JSON array, reproducible selection
  raw_output    TEXT,                        -- verbatim model text, kept on failure
  parse_ok      INTEGER NOT NULL DEFAULT 0,
  validation_errors TEXT,                    -- JSON array, null when clean
  duration_ms   INTEGER,
  created_at    TEXT NOT NULL
);
CREATE INDEX idx_run_document ON extraction_run(document_id, created_at);
```

One row per model invocation, including failed ones. This is the audit trail.

### Extracted fields and provenance

```sql
CREATE TABLE extracted_field (
  id            TEXT PRIMARY KEY,
  run_id        TEXT NOT NULL REFERENCES extraction_run(id) ON DELETE CASCADE,
  path          TEXT NOT NULL,               -- JSON Pointer: '/items/0/nominal_diameter'
  value_json    TEXT,                        -- null means no value proposed
  value_type    TEXT NOT NULL,               -- 'string'|'number'|'boolean'|'null'|'object'|'array'
  unit          TEXT,                        -- canonical unit after post-processing
  raw_value     TEXT,                        -- pre-normalisation, e.g. '6"'
  confidence    REAL,                        -- model self-report, weak signal
  state         TEXT NOT NULL,               -- EXTRACTED|UNGROUNDED|UNKNOWN|CORRECTED|CONFIRMED
  UNIQUE (run_id, path)
);

CREATE TABLE field_provenance (
  id            TEXT PRIMARY KEY,
  field_id      TEXT NOT NULL REFERENCES extracted_field(id) ON DELETE CASCADE,
  page_index    INTEGER NOT NULL,
  text_block_id TEXT REFERENCES text_block(id),   -- null if quote unmatched
  quote         TEXT NOT NULL,               -- literal text the model cited
  x0 REAL, y0 REAL, x1 REAL, y1 REAL,        -- from the parser, never from the model
  match_kind    TEXT NOT NULL                -- 'exact'|'normalised'|'other_page'|'unmatched'
);
CREATE INDEX idx_prov_field ON field_provenance(field_id);
```

A field may have several provenance rows — a value assembled from a table row
and its header cites both. `match_kind` records how the grounding check
resolved, which is what the review UI sorts by.

### Review and correction

```sql
CREATE TABLE review (
  id            TEXT PRIMARY KEY,
  run_id        TEXT NOT NULL REFERENCES extraction_run(id) ON DELETE CASCADE,
  reviewer      TEXT NOT NULL,               -- local OS user; no accounts in MVP
  state         TEXT NOT NULL,               -- 'IN_PROGRESS'|'COMPLETED'|'ABANDONED'
  started_at    TEXT NOT NULL,
  completed_at  TEXT
);

CREATE TABLE field_correction (
  id            TEXT PRIMARY KEY,
  review_id     TEXT NOT NULL REFERENCES review(id) ON DELETE CASCADE,
  field_id      TEXT NOT NULL REFERENCES extracted_field(id) ON DELETE CASCADE,
  original_value TEXT,                       -- what the model proposed
  corrected_value TEXT,                      -- what the human entered; null = cleared
  reason        TEXT,                        -- optional, free text
  corrected_at  TEXT NOT NULL
);
CREATE INDEX idx_correction_field ON field_correction(field_id);
```

`field_correction` is append-only. It is the measurement of model quality and,
later, the training corpus. Overwriting `extracted_field.value_json` in place
would throw that away — so corrections live here and the effective value is
`COALESCE(latest correction, extracted value)`.

### Approved output

```sql
CREATE TABLE approved_extraction (
  id            TEXT PRIMARY KEY,
  document_id   TEXT NOT NULL REFERENCES document(id) ON DELETE CASCADE,
  run_id        TEXT NOT NULL REFERENCES extraction_run(id),
  review_id     TEXT NOT NULL REFERENCES review(id),
  schema_id     TEXT NOT NULL REFERENCES schema_definition(id),
  payload_json  TEXT NOT NULL,               -- fully resolved, denormalised snapshot
  approved_by   TEXT NOT NULL,
  approved_at   TEXT NOT NULL
);
CREATE INDEX idx_approved_document ON approved_extraction(document_id, approved_at);
```

`payload_json` is a **snapshot**, deliberately denormalised. It is what exports
read. It stays readable even if `core/` changes how values are assembled, and
it is never recomputed — recomputing it would mean an approved record could
change without anyone approving the change.

### Exports

```sql
CREATE TABLE export_log (
  id            TEXT PRIMARY KEY,
  approved_id   TEXT NOT NULL REFERENCES approved_extraction(id) ON DELETE CASCADE,
  format        TEXT NOT NULL,               -- 'json'|'csv'|'xlsx'
  target_path   TEXT NOT NULL,               -- where the user chose to write it
  exported_at   TEXT NOT NULL
);
```

Records that data left the application's own store — for the user's benefit,
not for telemetry. Never leaves the machine. See [security.md](security.md).

## Migrations

Numbered SQL files in `packages/database/migrations/`, applied in order at startup inside
a transaction, tracked with `PRAGMA user_version`. Forward-only. A migration
may never rewrite `approved_extraction.payload_json` or delete from
`field_correction`.

## Retention

Deleting a document cascades to its pages, blocks, runs, fields, provenance,
reviews, corrections, and approvals, and deletes its blob and renders. It is
the only destructive operation, it is explicit, and it is confirmed in the UI —
because on this product the user's local disk is the only copy.
