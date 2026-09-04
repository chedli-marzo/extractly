---
description: Check proposed work against milestone 1 scope
---

Check whether this work belongs in the current milestone: $ARGUMENTS

Milestone 1 is the deterministic half of the pipeline only:

```
PDF → Document Processing → Document Representation → SQLite → Viewer
```

Answer, briefly:

1. Which pipeline stage does this touch?
   (see `docs/decisions/0005-document-processing-boundary.md`)
2. Is it inside milestone 1, or after it?
3. Does it cross a boundary it should not — a model in the parser, a file path
   past the representation, Electron inside `packages/extraction`, a network
   call outside the inference adapter?
4. Does it need an ADR?
5. If out of scope: what is the smallest in-scope version that still moves the
   milestone forward?

Be direct. Saying "this is milestone 2 work" is a useful answer.
