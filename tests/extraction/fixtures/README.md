# Fixtures

**Real customer documents are never committed here.**
[ADR-0009](../../../docs/decisions/0009-synthetic-fixtures-only.md).

Every fixture is synthetic or sanitised and publishable. Each one is recorded in
the table below before it is committed. A fixture with no row is a bug.

Sanitising a real PDF is harder than it looks: redacting rendered text does not
remove the text layer, and metadata carries author, producer, and original file
paths. The default is to generate a synthetic document reproducing the
*structural feature* you need — a rotated dimension label, a merged table cell,
a missing text layer — not to launder a real one.

Scratch documents for debugging go in a git-ignored local directory. Never here.

| Fixture | Origin | Why it is safe to commit | What it exercises |
| ------- | ------ | ------------------------ | ----------------- |
| _(none yet)_ | | | |
