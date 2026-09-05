# MS-11 — Packaging and distribution

**Phase:** Commercial hardening · **Estimate:** 2 weeks · **Depends on:** MS-10

## Goal

A signed, installable application on both platforms, with the locality claim
verified rather than asserted.

An unsigned build will be blocked or loudly warned about on both platforms, and
in a locked-down plant it simply will not run.

## Exit criteria

- Signed installers for win-x64 and mac-arm64
- macOS build notarised and stapled
- Full import-to-export flow completes with all non-loopback traffic blocked
- No auto-updater — an update channel into a machine holding confidential documents needs its own decision

## Stories

| ID | Title | Branch | Est. |
| -- | ----- | ------ | ---- |
| US-48 | electron-builder configuration for both platforms | `build/us-48-electron-builder` | `4d` |
| US-49 | Authenticode signing and Developer ID notarisation | `build/us-49-signing-notarisation` | `4d` |
| US-50 | Offline verification: deny-all network run in CI | `test/us-50-offline-verification` | `2d` |

## Commit plan

Not written yet. Commit messages are mapped to acceptance criteria, and this
milestone has story titles only — see
[README](README.md#story-detail). Both are written when the milestone before
this one completes.
