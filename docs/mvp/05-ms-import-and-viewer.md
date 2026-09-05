# MS-05 — Import, page viewer, and the milestone 1 gate

**Phase:** Validation release · **Estimate:** 3 weeks · **Depends on:** MS-04

## Goal

Close the loop: a real PDF goes in, and any block in it can be highlighted on
the page it came from. Then run the harness and find out whether the answer to
the milestone 1 question is yes.

## Exit criteria

- Import → parse → view → highlight works on a real 200-page engineering PDF
- The harness reports against all four thresholds
- **The gate:** thresholds met, or a written account of which were missed and by how much
- An unsigned local build runs on both platforms

> If the gate fails, milestones 06 onward do not proceed in this form. That is
> the point of having a gate. The failure report is the input to what happens
> instead.

---

## US-19 — Import · `3d`

**As a** user, **I want** to bring PDFs into the application, **so that** they
can be processed.

- File dialog opened from main; the renderer cannot enumerate the disk
- SHA-256 computed; file copied to `blobs/<sha256>.pdf` — copied, not referenced, so moving the original cannot break processing
- Blob filenames are the content hash: a filename from a document never becomes a path on disk
- Original filename kept as a display string only
- Byte-identical re-import reuses the existing document silently, with no second copy
- Windows path rules respected: length limits, reserved device names, trailing dots and spaces
- Document row created with state `IMPORTED`

**Branch:** `feat/us-19-import`

**Commits**

1. `feat: open the file dialog from main` — *criterion 1*
   > The renderer must not be able to enumerate the disk.
2. `feat: hash and copy pdfs into the blob store` — *criteria 2, 3*
   > Content-addressed, so a filename from a document never becomes a path.
3. `feat: keep original filename as display only` — *criterion 4*
4. `feat: reuse the document on identical re-import` — *criterion 5*
5. `feat: apply windows path rules to all writes` — *criterion 6*
6. `feat: create the document row as IMPORTED` — *criterion 7*

## US-20 — Page rendering · `3d`

**As a** reviewer, **I want** page images, **so that** a highlight can be drawn
over the page as it looks.

- Pages rendered to `renders/<sha256>/<page>.png` by the worker
- `render_scale` stored per page, in pixels per point, so box-to-pixel mapping is arithmetic
- Rendering is cancellable and resumable per page
- A render failure on one page does not fail the document

**Branch:** `feat/us-20-page-rendering`

**Commits**

1. `feat: render pages to png in the worker` — *criterion 1*
2. `feat: store render scale per page` — *criterion 2*
   > Box-to-pixel mapping becomes arithmetic rather than a guess.
3. `feat: make rendering cancellable per page` — *criterion 3*
4. `feat: tolerate a single page render failure` — *criterion 4*

## US-21 — Page viewer with highlight · `5d`

**As a** reviewer, **I want** to click any text block and see it highlighted on
its page, **so that** provenance is verifiable by eye rather than asserted.

- Page navigation over a 200-page document without a visible stall
- Any block highlighted on demand, at the correct position, at any zoom
- Box-to-pixel conversion uses stored page dimensions and render scale
- Extracted text rendered as text, never as HTML
- Manual check against a real document: highlights land on the right line

**Branch:** `feat/us-21-page-viewer-highlight`

**Commits**

1. `feat: add page viewer with navigation` — *criterion 1*
2. `feat: highlight any block on demand` — *criteria 2, 3*
   > If the highlight lands on the wrong line the reviewer stops trusting the
   > tool, and then retypes the document anyway.
3. `feat: render extracted text as text, never html` — *criterion 4*

## US-22 — Run the gate · `2d`

**As a** stakeholder, **I want** the milestone 1 question answered with numbers,
**so that** the decision to continue is evidence rather than optimism.

- Harness run across the full fixture set
- Report per threshold: bounding box deltas, text recall, missing blocks, reading order
- Actual box deltas inspected: if they cluster near 0.2 pt, tighten the tolerance to ±0.5 pt and record why
- Result written up, including what failed and by how much
- Which criteria — if any — the parser engine benchmark in MS-06 needs to answer

**Branch:** `test/us-22-milestone-1-gate`

**Commits**

1. `test: run the harness across the fixture set` — *criteria 1, 2*
2. `docs: record the gate result and shortfalls` — *criteria 4, 5*
   > Including what failed and by how much. This report decides whether MS-06
   > runs and which criteria it has to answer.
3. `test: tighten box tolerance if deltas justify it` — *criterion 3*
   > A tolerance that never fails measures nothing.

## US-23 — Unsigned validation build · `2d`

**As a** stakeholder, **I want** an installable build, **so that** the
validation release can be run by someone who is not the developer.

- electron-builder produces an installer for win-x64 and mac-arm64
- Unsigned, and labelled as such — signing is MS-11
- Runs on a machine that has never had the toolchain installed
- Not for customer distribution

**Branch:** `build/us-23-unsigned-validation-build`

**Commits**

1. `build: produce unsigned installers for both platforms` — *criteria 1, 2*
2. `test: verify the build runs on a clean machine` — *criteria 3, 4*
   > Labelled unsigned. Not for customer distribution — signing is MS-11.
