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

## How fixtures are generated

Hand-authored HTML, printed to PDF by the Chromium that ships inside Electron.

No PDF-generation dependency is added: Chromium is already present, guaranteed
to embed a text layer, and its output is deterministic for a pinned Electron
version. Because the source HTML sets the geometry, **expected bounding boxes
are derived from the source rather than measured from the output** — which is
what makes the ±2 pt tolerance a check on the parser instead of a check on
whoever transcribed the numbers.

Pin the Electron version used to generate each fixture in the table below. A
Chromium upgrade can shift glyph positions, and a fixture whose expected values
were produced by a different renderer is a false failure waiting to happen.

Regenerate rather than hand-edit. A fixture PDF is a build output of its HTML,
and the HTML is the artifact under review.

| Fixture | Origin | Why it is safe to commit | What it exercises | Electron |
| ------- | ------ | ------------------------ | ----------------- | -------- |
| _(none yet)_ | | | | |
