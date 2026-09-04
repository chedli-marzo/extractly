# packages/database

SQLite schema, migrations, and repositories
([ADR-0004](../../docs/decisions/0004-sqlite-persistence.md)).

```
migrations/   numbered forward-only SQL files
src/          connection, migration runner, repository functions
```

Schema documented in [docs/data-model.md](../../docs/data-model.md).

Rules:

- migrations apply at startup, in order, inside a transaction, tracked with
  `PRAGMA user_version`
- forward-only; a migration may never rewrite `approved_extraction.payload_json`
  or delete from `field_correction`
- prepared statements only — no SQL string is ever built from input
- repository functions return domain types from `packages/shared`
- no ORM, no query builder

`better-sqlite3` is synchronous. Everything here blocks, so it runs only in the
Electron main process and never in the pipeline worker.

Not implemented yet.
