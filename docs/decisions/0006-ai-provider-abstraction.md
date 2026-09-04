# ADR-0006: AI provider abstraction

**Status:** Accepted

## Decision

All inference sits behind one interface, in its own package. Callers never see
HTTP, a model name, or a prompt.

```ts
interface ExtractionProvider {
  probe(): Promise<ProviderStatus>;              // reachable? which models?
  extract(req: ExtractionRequest): Promise<RawCandidate>;
}
```

`ExtractionRequest` carries the schema as JSON Schema, the selected document
representation, and generation parameters. `RawCandidate` carries the raw model
output, the parsed JSON if it parsed, the model identity and digest, and
timings.

The provider does not validate, does not repair, does not retry, and does not
decide what happens next. Those are the caller's job. No provider is implemented
in the first milestone; the interface and its types are.

## Context

Under ADR-0003 the runtime must be local, and under ADR-0007 which model runs is
undecided. The interface exists so that the undecided part stays undecided
without blocking everything else, and so that the pipeline can be built and
tested against a fake provider today.

Keeping validation and repair outside the provider is the important constraint.
If the provider validates, then swapping the runtime silently swaps the
validation behaviour, and a model that returns malformed JSON becomes
indistinguishable from a model that returns wrong values. Both are failures we
need to tell apart, and only one of them is worth retrying.

Requiring the provider to report model name and digest per call is what makes a
candidate explainable months later. Without it, a result that looks wrong after a
model upgrade cannot be attributed.

This is one of only three seams in the system that exist for replaceability —
the others being the document parser and the OCR engine from ADR-0005. A fourth
"for future flexibility" is not to be added.

## Consequences

Positive:

- the pipeline, validation, grounding, and review can all be built and tested
  against a stub provider, before any model is chosen
- Ollama, llama.cpp, a bundled runtime, or a vision-language model are all
  implementations of the same interface
- benchmarking two models is running the same harness twice with different
  implementations
- the loopback restriction from ADR-0003 has exactly one place to be enforced

Negative:

- an interface with no real implementation is speculative until it has two, and
  the first real provider will probably force a change to it
- a vision-language model needs page images in the request, which today's
  `ExtractionRequest` shape does not carry; that will be an additive change
- the abstraction can leak: streaming, token budgets, and context windows are
  runtime-specific concerns that will push against it
- indirection costs a little clarity when debugging a bad extraction

## Revisit when

The second real provider is implemented. That is when the interface stops being
a guess and can be corrected against evidence.
