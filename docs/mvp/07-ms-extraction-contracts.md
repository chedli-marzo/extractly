# MS-07 — Extraction contracts and stub provider

**Phase:** MVP completion · **Estimate:** 4.5 weeks · **Depends on:** MS-05

## Goal

Everything around the model, built and tested before any model exists
([ADR-0006](../decisions/0006-ai-provider-abstraction.md),
[ADR-0007](../decisions/0007-model-selection-deferred.md)). Schemas, context
selection, validation, the grounding check and post-processing are deterministic
code and this is where correctness lives.

Tested against a stub provider returning fixed candidates, including malformed
ones. No model name appears in code or configuration.

## Exit criteria

- The full candidate-to-validated path runs end to end against a stub
- A field that cannot be grounded becomes `null` with state `UNKNOWN` — never guessed
- Malformed model output takes the repair path, then fails visibly with raw output retained
- No model is downloaded and no model name is committed

## Stories

| ID | Title | Branch | Est. |
| -- | ----- | ------ | ---- |
| US-29 | JSON Schemas in `packages/shared` | `feat/us-29-json-schemas` | `3d` |
| US-30 | `ExtractionProvider` interface and types | `feat/us-30-extraction-provider-contract` | `2d` |
| US-31 | Deterministic context selection, token-bounded | `feat/us-31-context-selection` | `4d` |
| US-32 | Schema validation and single repair attempt | `feat/us-32-schema-validation-repair` | `3d` |
| US-33 | Grounding check against text blocks | `feat/us-33-grounding-check` | `4d` |
| US-34 | Post-processing: units, numbers, cross-field arithmetic | `feat/us-34-post-processing` | `4d` |
| US-35 | Stub provider, including malformed and hostile output | `test/us-35-stub-provider` | `2d` |

## Commit plan

Not written yet. Commit messages are mapped to acceptance criteria, and this
milestone has story titles only — see
[README](README.md#story-detail). Both are written when the milestone before
this one completes.
