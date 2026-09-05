# MS-08 — Model integration

**Phase:** MVP completion · **Estimate:** 3 weeks · **Depends on:** MS-07

## Goal

Choose a local model by benchmarking candidates against the evaluation dataset,
then implement the provider behind the interface MS-07 defined.

The trigger for this milestone is [ADR-0007](../decisions/0007-model-selection-deferred.md):
milestone 1 met and the benchmark run. Not before.

## Exit criteria

- Two or three candidate local models benchmarked on the evaluation dataset
- Selection recorded as its own ADR, with per-field accuracy and false-`UNGROUNDED` rate
- Provider reaches loopback only; a non-loopback host throws at construction
- Every run persisted with model identity, digest, parameters, prompt hash and selected pages

## Stories

| ID | Title | Branch | Est. |
| -- | ----- | ------ | ---- |
| US-36 | Benchmark candidate models, write the selection ADR | `docs/us-36-model-selection-adr` | `5d` |
| US-37 | Provider implementation with loopback allowlist | `feat/us-37-provider-loopback` | `3d` |
| US-38 | Prompt construction and context budget | `feat/us-38-prompt-and-context-budget` | `4d` |
| US-39 | Extraction run persistence and audit trail | `feat/us-39-run-audit-trail` | `3d` |

## Watch for

Prompt injection is real here: a document can contain text instructing the model
to report values as N/A. The defence is structural — constrained output, the
grounding check, and a human reviewing every field — not a more persuasive prompt.

## Commit plan

Not written yet. Commit messages are mapped to acceptance criteria, and this
milestone has story titles only — see
[README](README.md#story-detail). Both are written when the milestone before
this one completes.
