# CLAUDE.md

## Project identity

Local-first **desktop** application for extracting structured engineering /
manufacturing data from PDF documents.

```
PDF
→ local document parsing
→ local AI extraction
→ candidate JSON
→ human verification / correction
→ approved structured data
→ local database / export
```

There is no server. There is no account. The user's machine is the whole system.

## Claude Code is not the application's AI

These are separate systems and must never be confused.

```
        DEVELOPMENT                        PRODUCTION
   ┌──────────────────┐              ┌──────────────────┐
   │   Claude Code    │  builds  ──► │   Application    │
   │ (this agent)     │              │        │         │
   └──────────────────┘              │        ▼         │
                                     │  Local AI model  │
                                     └──────────────────┘
```

Claude Code is the development agent. The shipped application depends on a local
inference runtime and never on Claude, Anthropic, or any hosted API. Nothing in
`apps/` or `packages/` may reference an external AI service.

## Non-negotiable requirements

1. PDFs must never be uploaded to a SaaS backend.
2. No S3 or cloud object storage in MVP.
3. AI inference must run locally.
4. No external AI API in MVP.
5. No telemetry containing document contents.
6. Extracted data remains local.
7. Human review is mandatory before treating extraction as approved.
8. Never silently invent missing values.
9. Preserve extraction provenance where practical.
10. Prefer deterministic processing over AI when deterministic processing is
    sufficient.

Rule 8 in practice: a value the model cannot ground in the document is emitted
as `null` with state `UNKNOWN`. Never guessed, never defaulted, never
back-filled from a similar document.

Rule 10 in practice: page geometry, text extraction, reading order, table cell
reconstruction, units, numeric parsing, and cross-field arithmetic are
deterministic code. The model is used only for the step that genuinely needs
language understanding — mapping content to schema fields.

## Working method

**Architecture first, implementation second.**

```
Requirement
    ↓
Architecture
    ↓
ADR if significant
    ↓
Implementation plan
    ↓
Implementation
    ↓
Tests
    ↓
Review
    ↓
Documentation
```

Do not skip to implementation because the task looks small. A change that
alters architecture or behaviour without a corresponding docs update is
incomplete.

Write an ADR in [docs/decisions/](docs/decisions/) when a choice is expensive to
reverse, constrains later work, or would look wrong without context. Not for
routine implementation choices. ADRs are immutable once `Accepted` — supersede,
never edit.

## Current state

Nothing is implemented. No dependencies are installed. No model is downloaded.

**Milestone 1** is the deterministic half of the pipeline only:

```
PDF → Document Processing → Document Representation → SQLite → Viewer
```

It answers one question:

> Can we reliably turn a real 200-page engineering PDF into a local, searchable
> document representation where every piece of extracted text maps back to its
> exact page and bounding box?

**Do not download, install, or integrate a model.** See
[ADR-0007](docs/decisions/0007-model-selection-deferred.md). The
`ExtractionProvider` interface is written; no implementation is. AI is not
postponed — its seam is defined now so it cannot grow into the parser later.

## Stack

Decided in [docs/decisions/](docs/decisions/). Nothing installed yet.

| Concern         | Choice                                          | ADR  |
| --------------- | ----------------------------------------------- | ---- |
| Desktop shell   | Electron + TypeScript                           | 0001 |
| Platforms       | Windows (primary test) + macOS                  | 0002 |
| UI              | React + Vite                                    | 0001 |
| PDF parsing     | `pdfjs-dist`                                    | 0005 |
| OCR (phase 2)   | `tesseract.js` (WASM, no system dependency)     | 0005 |
| Persistence     | SQLite via `better-sqlite3`, raw SQL migrations | 0004 |
| Inference       | undecided — interface only                      | 0006, 0007 |
| Tests           | Vitest                                          | 0008 |
| Packaging       | electron-builder                                | 0001, 0002 |

## Repository layout

pnpm workspace.

```
apps/desktop/         Electron app: main, preload, renderer
packages/shared/      types, JSON Schemas, IPC contract. No runtime deps.
packages/database/    SQLite schema, migrations, repositories
packages/extraction/  document processing + extraction provider interface
packages/ui/          React components, presentational
tests/extraction/     evaluation dataset and scoring harness
docs/                 product, architecture, extraction, data-model, security
docs/decisions/       ADRs
.claude/              agent rules, commands, permissions
```

Dependency direction:

```
apps/desktop ──► ui ──────────► shared
             ──► database ────► shared
             ──► extraction ──► shared
```

`packages/extraction` and `packages/database` never import from `apps/desktop`.
`packages/extraction` never imports Electron — that is what lets the evaluation
harness run headlessly. A violation is a bug, not a style preference.

## Boundaries that must stay replaceable

Three. Each is a narrow interface with the implementation behind it:

- `DocumentParser` — PDF → pages, text blocks, geometry. `pdfjs-dist` today.
- `ExtractionProvider` — representation + schema → candidate JSON. No
  implementation yet.
- `OcrEngine` — image → text blocks. Not in MVP.

Do not add a fourth for theoretical future flexibility.

## Before implementing anything

1. Inspect the relevant existing files.
2. Understand the current architecture.
3. Check existing dependencies before adding new ones.
4. Prefer the simplest implementation that satisfies the requirement.
5. Do not introduce cloud infrastructure unless explicitly requested.
6. Do not introduce an abstraction merely for theoretical future flexibility.
7. However, keep the three boundaries above replaceable.
8. Write tests for extraction and validation logic.
9. Never weaken tests to make an implementation pass.
10. Update documentation when architecture or behavior changes.

## Dependency policy

Adding a dependency requires a stated reason in the PR, or an ADR if it is
significant. Every direct dependency runs with full main-process privileges on a
machine holding confidential engineering documents — this is a security control,
not tidiness.

Rejected by default: ORMs, query builders, state-management libraries, UI
component kits, HTTP clients (`fetch` is built in), logging frameworks,
telemetry SDKs, anything that phones home at install or runtime.

Lockfile committed. `--frozen-lockfile` in CI. Install scripts disabled by
default; native modules needing a build step are allowlisted explicitly.

## Testing rules

- Extraction, validation, provenance grounding, and the state machine are pure
  and must be unit-tested without Electron.
- **Never use real customer PDFs as fixtures.**
  [`tests/extraction/fixtures/`](tests/extraction/fixtures/) contains synthetic
  or sanitised documents only, with provenance recorded in its README. See
  [ADR-0009](docs/decisions/0009-synthetic-fixtures-only.md).
- Scratch documents for debugging live in a git-ignored local directory, never
  committed, never referenced by a test.
- Evaluation is per-field accuracy, never whole-document pass/fail. See
  [ADR-0008](docs/decisions/0008-evaluation-dataset-before-ai.md).
- A test asserting "the model returns X" is banned — model output is
  non-deterministic. Test the code around it: schema conformance, grounding
  rejection, repair, failure paths.
- Bounding box assertions need a tolerance, and the tolerance needs a comment
  explaining it.

## Permission boundaries

The agent may:

- read and edit files in this repository
- run tests, typecheck, lint, format
- run local development and build commands
- run `git` for local history

The agent may not:

- access production credentials, cloud accounts, or private API keys
- read or copy customer documents into the repository
- add cloud infrastructure, hosted AI APIs, or telemetry
- download model weights (see ADR-0007)
- push, force-push, or open pull requests without being asked

Enforced in [.claude/settings.json](.claude/settings.json); the reasoning is in
[.claude/rules/](.claude/rules/).

## Documentation map

- [docs/product.md](docs/product.md) — scope, MVP boundary, milestone 1
- [docs/architecture.md](docs/architecture.md) — pipeline, processes, layout
- [docs/extraction.md](docs/extraction.md) — states, provenance, grounding
- [docs/data-model.md](docs/data-model.md) — SQLite schema
- [docs/security.md](docs/security.md) — locality guarantees, hardening
- [docs/decisions/](docs/decisions/) — ADRs
