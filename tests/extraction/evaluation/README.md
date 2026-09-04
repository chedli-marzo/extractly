# Evaluation harness

Runs every fixture through the pipeline and scores the result per field.

Reports:

- per-field accuracy, grouped by field and by field type
- reading order and bounding box correctness for the deterministic half
- false `UNGROUNDED` rate, once a provider exists
- a diff per failing field: expected, actual, and the cited source text

Runs in CI on both platforms ([ADR-0002](../../../docs/decisions/0002-windows-and-macos.md)),
because bounding boxes are exactly the kind of thing that differs by platform.

Not implemented yet.
