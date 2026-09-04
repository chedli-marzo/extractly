# Do not download or integrate a model

**Rule:** no model weights are downloaded, no model name is hardcoded, and no
`ExtractionProvider` implementation is written until milestone 1 is met and the
benchmark in [ADR-0008](../../docs/decisions/0008-evaluation-dataset-before-ai.md)
has been run.

See [ADR-0007](../../docs/decisions/0007-model-selection-deferred.md).

## Why

Picking a model now is a guess, and the guess is sticky: prompts, context
budgets, and output-parsing quirks accrete around whichever model is first.
There is also nothing to judge one with yet — the evaluation dataset is what
turns "which model is better" from an impression into a measurement.

A text-only 7 B model is also not sufficient for the drawing and P&ID content in
this domain, so committing to one now means re-deciding later anyway.

## How to apply

- Do not run `ollama pull`, `huggingface-cli download`, or any equivalent.
- Do not write a model name into code, config, or a default value.
- Do write the `ExtractionProvider` interface and its types — that is milestone
  1 work ([ADR-0006](../../docs/decisions/0006-ai-provider-abstraction.md)).
- Test the pipeline against a stub provider that returns fixed candidates,
  including malformed ones.

This is a deferral with a defined trigger, not a ban. AI is not being
postponed — its seam is being defined before it can grow into the parser.
