# packages/shared

Types and contracts. **No runtime dependencies.**

```
src/          domain types, IPC contract types
schemas/      JSON Schemas defining extractable document types
```

Imported by every other package. Imports nothing.

The JSON Schemas here are the single source of truth for what can be extracted.
They are persisted per version in the `schema_definition` table
([data-model.md](../../docs/data-model.md)), so an approved extraction from an
old schema stays readable after the code moves on.

Every extractable field must be nullable — requirement 8 means a missing value
is `null`, never a guess. This is enforced by a test over all registered
schemas.

Not implemented yet.
