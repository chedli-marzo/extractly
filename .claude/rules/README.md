# Agent rules

Reasoning behind [../settings.json](../settings.json), plus the rules that a
permission system cannot express.

`settings.json` is a guardrail, not a boundary. Prefix matching on shell
commands is bypassable by anything creative — a script, a different binary, a
pipe. It exists to make the wrong thing require deliberate effort and to make
the intent explicit. The rules here are the actual contract.

| Rule | Subject |
| ---- | ------- |
| [no-customer-documents.md](no-customer-documents.md) | Real PDFs never enter the repo |
| [no-cloud.md](no-cloud.md) | No cloud services, no hosted AI, no telemetry |
| [no-model-downloads.md](no-model-downloads.md) | No model weights, no provider implementation yet |
| [architecture-first.md](architecture-first.md) | Order of work, and when an ADR is required |
