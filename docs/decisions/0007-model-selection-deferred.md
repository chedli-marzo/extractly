# ADR-0007: Model selection deferred

**Status:** Accepted

## Decision

No model is chosen, downloaded, or integrated yet. No model name is written into
the code or into configuration defaults.

Model selection happens after the document representation is proven, and is
decided by benchmarking two or three candidate local models against the
evaluation dataset from ADR-0008. That benchmark result becomes its own ADR.

## Context

Picking a model now would be guessing, and the guess would be sticky: prompts,
context budgets, and output-parsing quirks accrete around whichever model is
first, and the cost of changing it grows quietly.

There is also nothing to judge a model with yet. Without the representation and
the evaluation dataset, "which model is better" can only be answered by looking
at a few outputs and forming an impression, which is exactly the manual judgement
ADR-0008 exists to replace.

Two facts already constrain the eventual choice. The development machine has
24 GB of unified memory, so a quantised 7–8 B model is comfortable and larger
models contend with the application. And a text-only model is not sufficient for
the drawing, P&ID, and diagram content that is a real part of this document
domain — that needs a capable vision-language model, which changes memory
requirements, request shape, and latency. Committing to a text-only 7 B model now
would mean re-deciding as soon as drawings are addressed.

The only currently installed model, `deepseek-r1:1.5b`, is unsuitable regardless:
too small for schema-faithful extraction, and its reasoning traces interfere with
constrained JSON output.

## Consequences

Positive:

- the pipeline is built against the interface from ADR-0006 and a stub provider,
  so nothing is blocked by this
- when the choice is made it will be made on measured accuracy over
  representative documents, not on impression
- no prompt or parsing workaround gets built for a model we were never going to
  keep
- vision-language requirements can inform the decision rather than invalidate it

Negative:

- no end-to-end demo of real extraction until this is resolved, which will feel
  like slow progress
- the stub provider may not exercise failure modes a real model produces, so
  some validation and repair work will only surface later
- benchmarking two or three local models is itself several days of work,
  including pulling multi-gigabyte weights
- `ExtractionRequest` may need to change when a vision-language model is
  evaluated

## Revisit when

The first milestone is met and the evaluation dataset has enough fixtures to
distinguish models. That is the trigger to run the benchmark.
