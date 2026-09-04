# ADR-0002: Windows and macOS

**Status:** Accepted

## Decision

Both Windows and macOS are supported targets from the start. Windows is the
primary test platform. Linux is not a target for the MVP.

## Context

Engineering and manufacturing environments are Windows-heavy. The users who
receive datasheets, specifications, and inspection reports as PDFs are, in most
plants, on Windows workstations — often locked-down ones. Development happens on
an Apple M3, which makes macOS the platform that gets tested by accident and
Windows the one that gets tested by discipline.

Deciding this now rather than later is deliberate. Cross-platform problems in
this application are not cosmetic: file path handling, native module builds,
per-user data directory semantics, code signing, and PDF font rendering all
differ, and the last of those can change a bounding box. Discovering that after
a Mac-only MVP would mean rewriting the parts that carry provenance.

Linux is excluded because it adds a third packaging and signing path for a user
population that is small in this domain.

## Consequences

Positive:

- the platform most users are actually on is the one that gets exercised first
- cross-platform assumptions are tested continuously rather than discovered late
- ADR-0001's identical-webview property is being paid for, not wasted

Negative:

- CI must build and test on both platforms, including native module rebuilds for
  each Electron version and architecture (win-x64, mac-arm64, mac-x64)
- two signing and distribution pipelines: Authenticode on Windows, Developer ID
  plus notarisation on macOS
- the primary test platform is not the development machine, so a Windows test
  environment — VM or CI runner — is required infrastructure from day one
- filesystem behaviour must be written to the stricter platform: path length
  limits, reserved filenames, case-insensitivity, file locking

## Revisit when

Real user distribution turns out to be macOS-dominant, or a Linux deployment is
requested by an actual customer rather than anticipated.
