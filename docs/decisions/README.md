# Decisions

Architecture Decision Records. One file per decision, numbered, immutable once
`Accepted`.

A decision that changes is not edited — a new ADR supersedes it, and the old one
is marked `Superseded by ADR-XXXX`. The point is that someone reading this code
in a year can find out *why*, including why the obvious alternative lost.

Statuses: `Proposed` · `Accepted` · `Rejected` · `Superseded by ADR-XXXX`

Write one when a choice is expensive to reverse, constrains later work, or looks
wrong without context. Do not write one for routine implementation choices.

| #    | Title                             | Status   |
| ---- | --------------------------------- | -------- |
| 0001 | Electron                          | Accepted |
| 0002 | Windows and macOS                 | Accepted |
| 0003 | Local-first architecture          | Accepted |
| 0004 | SQLite persistence                | Accepted |
| 0005 | Document-processing boundary      | Accepted |
| 0006 | AI provider abstraction           | Accepted |
| 0007 | Model selection deferred          | Accepted |
| 0008 | Evaluation dataset before AI      | Accepted |
| 0009 | Synthetic fixtures only           | Accepted |
| 0010 | Licensing and paid distribution   | Proposed |
| 0011 | Team collaboration and cloud structured data | Proposed |
| 0012 | Parser engine selected by measurement | Proposed |
