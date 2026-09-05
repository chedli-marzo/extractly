# MS-02 — Local persistence

**Phase:** Validation release · **Estimate:** 1.5 weeks · **Depends on:** MS-01

## Goal

SQLite owned by `packages/database`, reachable only from the main process,
with hand-written forward-only migrations and async repository functions.

Only the representation tables are exercised in the validation release, but the
full schema from [data-model.md](../data-model.md) lands here — a migration is
cheaper to write once than to retrofit around existing rows.

## Exit criteria

- Database creates itself on first launch and migrates on every subsequent one
- A parse of a 200-page document lands completely or not at all
- Repository functions are `async` and return domain types
- Deleting a document leaves nothing behind, on disk or in the database

---

## US-05 — Migration runner · `2d`

**As a** developer, **I want** numbered SQL migrations applied at startup,
**so that** the schema is a reviewable artifact rather than an ORM output.

- Numbered `.sql` files in `packages/database/migrations/`, applied in order
- Each migration runs inside a transaction; a failure rolls back and the application reports it rather than starting on a half-migrated database
- Version tracked with `PRAGMA user_version`
- Forward-only: no down migrations
- Test asserts a migration cannot rewrite `approved_extraction.payload_json` or delete from `field_correction`
- `FOREIGN KEYS` on

**Branch:** `feat/us-05-migration-runner`

**Commits**

1. `feat: apply numbered sql migrations at startup` — *criteria 1, 3, 4*
2. `feat: run each migration in a transaction` — *criterion 2*
   > A failure must roll back and report, never start the app on a
   > half-migrated database.
3. `test: forbid rewriting approved payloads` — *criterion 5*
   > approved_extraction and field_correction are the audit trail; a migration
   > that edits them destroys the measurement everything later depends on.
4. `chore: enable foreign keys` — *criterion 6*

## US-06 — Schema migration 001 · `2d`

**As a** developer, **I want** the full schema from
[data-model.md](../data-model.md) created, **so that** later milestones add
behaviour rather than tables.

- All tables, indexes and constraints as documented
- `id` is `TEXT`, UUIDv7, sortable by creation
- Timestamps `TEXT`, ISO-8601, UTC
- `reviewer_actor_id` / `approved_by_actor_id` present alongside display names
- Test round-trips a row through every table

**Branch:** `feat/us-06-schema-migration-001`

**Commits**

1. `feat: create schema in migration 001` — *criteria 1, 4*
2. `feat: use uuidv7 ids and utc iso timestamps` — *criteria 2, 3*
   > Sortable by creation, and globally unique so local databases could later
   > merge without collision.
3. `test: round-trip a row through every table` — *criterion 5*

## US-07 — Async repositories for the representation · `3d`

**As a** developer, **I want** repository functions for documents, pages and
text blocks, **so that** the parser has somewhere to write and the viewer has
somewhere to read.

- Functions are `async` despite `better-sqlite3` being synchronous — see [architecture.md](../architecture.md) for why, and do not "fix" it
- Prepared statements only; no SQL built from caller input
- Insert of a full document representation is one transaction
- Return types are domain types from `packages/shared`, maintained by hand and covered by tests
- No repository function reaches the filesystem

**Branch:** `feat/us-07-async-representation-repos`

**Commits**

1. `feat: add async repositories for representation` — *criteria 1, 4*
   > async despite better-sqlite3 being synchronous: a future non-SQLite
   > backend should cost this layer, not every call site. See architecture.md.
2. `feat: use prepared statements only` — *criterion 2*
3. `feat: insert a representation in one transaction` — *criterion 3*
4. `test: assert repositories never touch the filesystem` — *criterion 5*

## US-08 — Delete cascade and retention · `2d`

**As a** user, **I want** deleting a document to remove everything it produced,
**so that** removing a confidential document actually removes it.

- Cascade covers pages, blocks, runs, fields, provenance, reviews, corrections, approvals
- Blob and rendered page images deleted from disk in the same operation
- Deletion is explicit and confirmed; it is the only destructive operation
- Test asserts nothing survives, in the database or on disk
- An orphaned blob with no document row is detectable and reported

**Branch:** `feat/us-08-delete-cascade`

**Commits**

1. `feat: cascade document delete across all tables` — *criterion 1*
2. `feat: remove blob and renders on delete` — *criterion 2*
3. `feat: confirm deletion explicitly in the ui` — *criterion 3*
   > The user's local disk is the only copy. This is the one destructive
   > operation in the product.
4. `test: assert nothing survives a delete` — *criteria 4, 5*
