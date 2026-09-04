# ADR-0004: SQLite persistence

**Status:** Accepted

## Decision

SQLite through `better-sqlite3`, accessed only from the Electron main process.
Schema managed by numbered SQL migration files applied at startup under
`PRAGMA user_version`. Repository functions return domain types. No ORM and no
query builder.

Original PDFs and rendered page images stay on the filesystem, addressed by
SHA-256. The database stores hashes and relative paths.

## Context

Single user, single machine, no sync, no concurrent writers. The data model in
[data-model.md](../data-model.md) is relational and append-heavy, and it must
stay readable years later, after the code has changed — an approved extraction
is a record about a document, and records outlive the software that made them.

Prisma was rejected: a codegen step, a query engine binary to package per
platform, and migration tooling built for a server lifecycle. It would also make
the schema an output of the ORM rather than the durable artifact we want.

Drizzle was the closest alternative and lost narrowly. The query surface here is
small and fixed; schema-in-TypeScript does not pay for a dependency in the
privileged process when the SQL is a few dozen statements.

`node:sqlite` needs no dependency at all, but its availability inside a given
Electron version's bundled Node is a packaging risk this early.

Storing blobs in the database was rejected because page renders for a 200-page
document are large, and because a content-addressed file means a filename taken
from a document never becomes a path on disk.

## Consequences

Positive:

- the `.db` file is inspectable with any SQLite tool, so a user is never locked
  out of their own extracted data
- transactions make a parse of a 200-page document atomic: it lands completely
  or not at all
- hand-written migrations are reviewable, which matters when a migration could
  touch approved records
- no codegen, no query engine binary, no per-platform runtime to sign

Negative:

- `better-sqlite3` is synchronous, so it blocks; all database access must stay
  in main and all long work must stay in the pipeline worker, without exception
- it is a native module: rebuild per Electron version and per architecture, on
  both platforms from ADR-0002
- migrations are hand-written and forward-only, which is slower to author
- no schema-derived TypeScript types, so repository return types are maintained
  by hand and must be covered by tests

## Revisit when

The query surface outgrows hand-written SQL, or full-text and vector indexes for
context selection make the schema large enough to want generated types.
