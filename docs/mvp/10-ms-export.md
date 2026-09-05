# MS-10 — Export

**Phase:** MVP completion · **Estimate:** 1.5 weeks · **Depends on:** MS-09

## Goal

Get approved data out, in the formats a maintenance system will import.

Exports read the approved snapshot only. Candidate data is never exported, and
the snapshot is never recomputed — recomputing it would let an approved record
change without anyone approving the change.

## Exit criteria

- JSON, CSV and XLSX produced from `approved_extraction.payload_json`
- Export writes only to a path the user chose
- Every export recorded locally, for the user's benefit and never as telemetry

## Stories

| ID | Title | Branch | Est. |
| -- | ----- | ------ | ---- |
| US-45 | JSON and CSV export from the approved snapshot | `feat/us-45-json-csv-export` | `2d` |
| US-46 | XLSX export | `feat/us-46-xlsx-export` | `3d` |
| US-47 | Export log | `feat/us-47-export-log` | `1d` |

## Open decision

**XLSX needs a dependency or hand-written SpreadsheetML.** Under the dependency
policy that requires a stated reason and a look at the library's own dependency
tree — it would run with main-process privileges on a machine holding
confidential documents. Decide before US-46 starts, not during it.

## Commit plan

Not written yet. Commit messages are mapped to acceptance criteria, and this
milestone has story titles only — see
[README](README.md#story-detail). Both are written when the milestone before
this one completes.
