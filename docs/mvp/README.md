# MVP milestones

Twelve milestones in three phases. Each has its own file with its user stories.

**Estimates are planning figures, not commitments.** They are re-derived after
each milestone from what that milestone actually cost. MS-04 carries most of
the uncertainty and is the one most likely to move.

A story is marked **✅ Done** in its heading only after Phase 4 review passes,
with a `**Status:**` line recording what the review found. Marking it before
review makes the label mean nothing.

## Phases

| Phase | Milestones | What it proves |
| ----- | ---------- | -------------- |
| **Validation release** | 01 – 05 | The pipeline works. Not sellable, not meant to be. |
| **MVP completion** | 06 – 10 | The product in [product.md](../product.md): extraction, review, export. |
| **Commercial hardening** | 11 – 12 | Signed, distributable, licensed. |

## Milestones

| # | Milestone | Est. | Phase |
| - | --------- | ---- | ----- |
| [01](01-ms-workspace-and-shell.md) | Workspace and application shell | 2 wk | Validation |
| [02](02-ms-local-persistence.md) | Local persistence | 1.5 wk | Validation |
| [03](03-ms-fixtures-and-harness.md) | Fixtures and evaluation harness | 2.5 wk | Validation |
| [04](04-ms-document-processing.md) | Document processing | 5 wk | Validation |
| [05](05-ms-import-and-viewer.md) | Import, page viewer, **M1 gate** | 3 wk | Validation |
| [06](06-ms-parser-engine-benchmark.md) | Parser engine benchmark | 3 wk | MVP |
| [07](07-ms-extraction-contracts.md) | Extraction contracts and stub provider | 4.5 wk | MVP |
| [08](08-ms-model-integration.md) | Model integration | 3 wk | MVP |
| [09](09-ms-review-and-approval.md) | Review and approval | 4 wk | MVP |
| [10](10-ms-export.md) | Export | 1.5 wk | MVP |
| [11](11-ms-packaging-and-distribution.md) | Packaging and distribution | 2 wk | Hardening |
| [12](12-ms-licensing.md) | Licensing | 3 wk | Hardening |

Roughly 35 weeks for one experienced developer, full time, if nothing surprises
anyone. Something will.

## The gate

Milestone 05 answers the question the whole project rests on:

> Can a real 200-page engineering PDF become a local, searchable representation
> where every piece of extracted text maps back to its exact page and bounding
> box?

Measured against the thresholds in
[tests/extraction/README.md](../../tests/extraction/README.md), not by
impression. If it fails, milestones 06 onward do not proceed in this form. If it
passes, everything after it is comparatively ordinary work.

Milestone 06 is **conditional**: the criteria the baseline misses at the gate
are the criteria the benchmark exists to answer
([ADR-0012](../decisions/0012-parser-engine-selected-by-measurement.md)). If the
baseline clears every threshold, it is not run.

## Story detail

Milestones 01 – 05 carry full user stories: they are the approved next work.

Milestones 06 – 12 carry goals, exit criteria and story titles only. Writing
detailed acceptance criteria for work whose inputs do not exist yet — a parser
that has not run, a model that has not been chosen — produces fiction that has
to be rewritten. They are expanded when the milestone before them completes.

## Branches and commits

One story, one branch, merged when its acceptance criteria are met.

```
<type>/us-NN-<slug>        feat/us-15-normalised-text-blocks
```

`type` is the Conventional Commits type the story's work mostly falls under:
`feat`, `test`, `chore`, `build`, `ci`, `docs`.

Commits follow Conventional Commits with a subject of 50 characters or fewer.
Each story lists its commits and the acceptance criteria each one covers, so a
branch is reviewable against the story rather than against a diff. A body is
written only where the *why* is not obvious from the subject — most of these
carry one, because most of them encode a constraint someone will otherwise
undo later.

The mapping is a plan, not a contract. Splitting a commit further is fine;
merging two of them loses the traceability that makes the plan worth having.

Commits made by an agent carry the `Co-Authored-By` trailer configured for this
repository. It is deliberately not baked into the templates below, which are
written for whoever does the work.
