# MS-09 — Review and approval

**Phase:** MVP completion · **Estimate:** 4 weeks · **Depends on:** MS-08

## Goal

Review is the product, not a safety checkbox. The interface has to make checking
a value faster than retyping it — if it does not, the user retypes the document
and the software has made their job slower.

## Exit criteria

- No field reaches approved state without a person having seen it
- Every field shows its proposed value, its source text, and its page one click away
- Corrections are stored alongside the candidate, never overwriting it
- The review queue is ordered by grounding state, not by model confidence

## Stories

| ID | Title | Branch | Est. |
| -- | ----- | ------ | ---- |
| US-40 | Document and field state machines | `feat/us-40-state-machines` | `3d` |
| US-41 | Field table with states, ordered by grounding | `feat/us-41-field-table` | `5d` |
| US-42 | Inline edit with append-only corrections | `feat/us-42-inline-corrections` | `4d` |
| US-43 | Click-to-source page highlight | `feat/us-43-click-to-source` | `4d` |
| US-44 | Approval gate and approved snapshot | `feat/us-44-approval-gate` | `3d` |

## Watch for

Model self-reported confidence is a weak signal and must not be the primary
flag. The reliable ordering is how the grounding check resolved — unmatched,
matched elsewhere, normalised, exact — plus fields the model declined.

## Commit plan

Not written yet. Commit messages are mapped to acceptance criteria, and this
milestone has story titles only — see
[README](README.md#story-detail). Both are written when the milestone before
this one completes.
