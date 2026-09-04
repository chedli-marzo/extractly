# ADR-0001: Electron

**Status:** Accepted

## Decision

The desktop application is built with Electron, TypeScript, React, and Vite,
packaged with electron-builder.

## Context

The application must run offline on engineering workstations, read PDFs from
disk, run a local database, and later talk to a local model runtime.

The heaviest dependency is PDF parsing with per-item geometry. `pdfjs-dist` is
the mature option for that and is JavaScript.

Tauri v2 was the serious alternative: smaller binaries, lower idle memory, and a
Rust backend better suited to CPU-bound parsing. It loses on two points that
matter more at this stage. It adds a second language and a Rust toolchain that
is not installed on the development machine. And its webview is the operating
system's — WebKit on macOS, WebView2 on Windows — so rendering and text-layer
behaviour differ per platform, which is precisely the surface where provenance
bugs would appear. Under ADR-0002 that divergence is a first-class cost, not a
footnote.

A Python processing sidecar was also considered, for PyMuPDF and the wider
document-processing ecosystem. It was rejected for the MVP because distributing
a frozen Python runtime as a signed, notarised sidecar on two platforms is a
larger problem than the parsing it would solve, and because ADR-0005 keeps the
option open behind an interface.

Native per-platform (SwiftUI plus WinUI) gives the best result and two
codebases. A browser-based local web app removes packaging but breaks the
product promise: no controlled filesystem access, and a user who cannot tell it
apart from a SaaS.

## Consequences

Positive:

- one language across the whole application; domain logic is testable in plain
  Vitest with no desktop runtime
- `pdfjs-dist`, `tesseract.js`, and `better-sqlite3` work without an FFI layer
- identical rendering on both target platforms, so a bounding box that is
  correct on Windows is correct on macOS
- large, well-documented ecosystem for the boring parts: packaging, updates,
  file dialogs, window state

Negative:

- roughly a 100 MB installer and a Chromium-sized memory floor
- Electron's default configuration is unsafe; the hardening in
  [security.md](../security.md) is mandatory and must be asserted in CI
- native modules must be rebuilt per Electron version and per architecture
- the main process is privileged Node, so every direct dependency is a supply
  chain concern

## Revisit when

Startup time or memory becomes a user complaint, or parsing throughput forces
work into a native language anyway. ADR-0005 is what makes that move survivable.
