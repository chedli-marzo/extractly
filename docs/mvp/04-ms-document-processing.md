# MS-04 — Document processing

**Phase:** Validation release · **Estimate:** 5 weeks · **Depends on:** MS-02, MS-03

> **This milestone carries most of the project's risk.** Reading order and table
> reconstruction are the genuinely unknown work. Five weeks is a guess, and if
> the plan breaks anywhere it breaks here. Re-estimate the rest of the programme
> from what this actually costs, not from what it was supposed to cost.

## Goal

`pdfjs-dist` behind `DocumentParser`, turning a PDF into pages, text blocks,
bounding boxes, reading order and table cells — deterministically, in a
killable worker process, with coordinates normalised once.

## Exit criteria

- Same PDF plus same parser version gives byte-identical output
- The harness from MS-03 runs against real output and reports real numbers
- A parser crash or hang kills a child process, not the application
- No Electron import anywhere in `packages/extraction`

---

## US-13 — DocumentParser interface and types · `2d`

**As a** developer, **I want** the parser contract defined before an
implementation exists, **so that** engine details cannot leak into callers.

- Interface and its types live in `packages/shared` / `packages/extraction`
- Output is the normalised representation only: pages with geometry, blocks with text and boxes, sequence, table cell assignments
- No pdfjs type, transform matrix or pixel coordinate appears in the contract
- The contract is written so a second implementation can satisfy it — three will, in MS-06
- Test asserts `packages/extraction` imports neither Electron nor any network module

**Branch:** `feat/us-13-document-parser-contract`

**Commits**

1. `feat: define DocumentParser interface and types` — *criteria 1, 3, 4*
   > No pdfjs type, transform matrix or pixel coordinate in the contract.
   > Three implementations will satisfy it in MS-06.
2. `feat: define the normalised representation` — *criterion 2*
3. `test: assert extraction imports no electron or network` — *criterion 5*

## US-14 — pdfjs adapter, hardened · `4d`

**As a** user, **I want** malformed or hostile PDFs to fail safely, **so that** a
vendor document cannot compromise the machine it is read on.

- `isEvalSupported: false`, `disableAutoFetch: true`, `disableRange: true`
- Document-level JavaScript never executed; embedded files and annotation actions ignored
- No PDF-supplied URL is ever fetched — asserted by test
- Page inventory: count, size, rotation, encryption, producer, presence of a text layer
- A PDF with no text layer stops with an explicit reason, never an empty success
- An encrypted or corrupt PDF fails with a stated cause

**Branch:** `feat/us-14-pdfjs-adapter-hardened`

**Commits**

1. `feat: add pdfjs adapter with hardened options` — *criterion 1*
2. `feat: ignore embedded files and annotation actions` — *criterion 2*
   > A PDF is attacker-controlled data.
3. `test: assert no pdf-supplied url is fetched` — *criterion 3*
4. `feat: report page inventory and text-layer presence` — *criterion 4*
5. `feat: fail explicitly with no text layer` — *criteria 5, 6*
   > An empty result that looks like success is worse than an obvious failure.

## US-15 — Text blocks with normalised bounding boxes · `5d`

**As a** reviewer, **I want** every piece of text recorded with its exact
position, **so that** clicking a value lands on the right place in the document.

- Every text item extracted with its box
- Coordinates normalised once at parse time to PDF user-space points, origin bottom-left, rotation applied
- Storing raw pdfjs transform values is explicitly not acceptable — the highlight must be arithmetic, not a rendering-time guess
- Rotated pages and rotated text both handled
- Harness reports actual box deltas against expected
- Bounding-box assertions carry a tolerance and a comment explaining it

**Branch:** `feat/us-15-normalised-text-blocks`

**Commits**

1. `feat: extract text items with bounding boxes` — *criterion 1*
2. `feat: normalise coordinates once at parse time` — *criteria 2, 3*
   > PDF points, origin bottom-left, rotation applied. Storing raw transforms
   > would make every highlight a rendering-time guess.
3. `feat: handle rotated pages and rotated text` — *criterion 4*
4. `test: report box deltas with a commented tolerance` — *criteria 5, 6*

## US-16 — Reading order · `5d`

**As an** extraction consumer, **I want** blocks in the order a person would read
them, **so that** a value's context is meaningful.

- Blocks sequenced per page, stored as `seq`
- Two-column layouts produce column-by-column order, never straight across
- Headers, footers and page furniture do not interrupt body sequence
- Harness reports exact-match pass or fail per page, no partial credit
- Where order is genuinely ambiguous, the rule chosen is documented rather than emergent

**Branch:** `feat/us-16-reading-order`

**Commits**

1. `feat: sequence blocks per page` — *criterion 1*
2. `feat: order two-column layouts by column` — *criterion 2*
   > Reading straight across a two-column page yields alternating half-
   > sentences from unrelated paragraphs.
3. `feat: exclude headers and footers from body order` — *criterion 3*
4. `test: assert exact reading order per page` — *criterion 4*
5. `docs: document the ordering rule for ambiguous cases` — *criterion 5*

## US-17 — Table cell reconstruction · `5d`

**As an** extraction consumer, **I want** table structure recovered from
geometry, **so that** a value stays attached to its row and header.

- Cells assigned to rows and columns from alignment alone
- Merged cells spanning columns handled
- A table continuing across a page break keeps its header association
- Multi-line cells stay one cell
- Harness reports cell assignment accuracy
- Where reconstruction is uncertain the output says so rather than guessing a structure

**Branch:** `feat/us-17-table-reconstruction`

**Commits**

1. `feat: assign cells to rows and columns` — *criterion 1*
2. `feat: handle merged cells spanning columns` — *criterion 2*
3. `feat: keep headers across a page break` — *criterion 3*
4. `feat: keep multi-line cells as one cell` — *criterion 4*
5. `test: score table cell assignment` — *criterion 5*
6. `feat: mark uncertain reconstruction as uncertain` — *criterion 6*
   > Never invent a structure. An admitted unknown is a first-class result.

## US-18 — Pipeline worker, NDJSON handoff, job model · `4d`

**As a** user, **I want** a 200-page document not to freeze the window, **so
that** the application stays usable while it works.

- Parsing runs in the `utilityProcess`; it receives a document id and a job id, never a database handle
- Large results stream as NDJSON to a temp file under `userData`; main ingests in one transaction
- Progress reported over IPC; main persists state transitions
- Cancellation kills the process rather than waiting for a promise to notice
- Jobs left `RUNNING` at startup become `FAILED` with reason `INTERRUPTED`, never silently resumed
- `tmp/` cleared at startup

**Branch:** `feat/us-18-pipeline-worker`

**Commits**

1. `feat: parse in the utilityProcess` — *criterion 1*
   > It receives ids, never a database handle: a parser crash must not be able
   > to corrupt the database.
2. `feat: stream large results as ndjson to tmp` — *criterion 2*
3. `feat: report progress and persist transitions` — *criterion 3*
4. `feat: cancel by killing the worker` — *criterion 4*
5. `feat: mark interrupted jobs failed at startup` — *criterion 5*
   > A half-written extraction that looks complete is worse than an obvious
   > failure.
6. `chore: clear tmp at startup` — *criterion 6*
