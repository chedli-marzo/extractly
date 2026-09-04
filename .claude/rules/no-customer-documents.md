# Never use real customer documents

**Rule:** real customer PDFs are never used as fixtures, test data, evaluation
inputs, or debugging material inside the repository.

`tests/extraction/fixtures/` contains synthetic or sanitised documents only,
each recorded in that directory's README with its origin and why it is safe to
commit. See [ADR-0009](../../docs/decisions/0009-synthetic-fixtures-only.md).

## Why

The product exists because these documents are confidential. Committing one
copies it onto every developer machine, every CI runner, and every backup —
permanently, irreversibly, and under a licence nobody granted.

## How to apply

- Never copy a PDF from outside the repository into `tests/`, `packages/`, or
  anywhere else tracked by git.
- Never write a test that reads from an absolute path outside the repository.
- When debugging a failure on a document you cannot commit, reproduce the
  *structural feature* that broke — a rotated dimension label, a merged table
  cell, a missing text layer — as a synthetic fixture. Do not launder the real
  document.
- Sanitising is harder than it looks: redacting rendered text does not remove
  the text layer, and metadata carries author, producer, and original paths.
  Prefer generating over sanitising.
- Scratch documents belong in a git-ignored local directory, never referenced
  by a test.

If you are ever unsure whether a document is safe to commit: it is not.
