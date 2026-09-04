# No cloud, no hosted AI, no telemetry

**Rule:** the shipped application has exactly one permitted network
destination — loopback, for the local model runtime. Nothing else.

See [ADR-0003](../../docs/decisions/0003-local-first-architecture.md) and
[docs/security.md](../../docs/security.md).

## Why

Six of the ten non-negotiable requirements are about data never leaving the
machine. The realistic failure is not malice — it is accidental egress: a
dependency that phones home, a crash reporter that attaches a page image, a
cloud fallback added under deadline.

## How to apply

Do not add, suggest, or scaffold:

- object storage (S3, GCS, Blob, R2), hosted databases, or any backend service
- hosted AI APIs — including Anthropic, OpenAI, or any other provider
- telemetry, analytics, crash reporting, or update pings
- an auto-updater
- authentication, accounts, or multi-user features
- deployment tooling for a web platform

Do not import `fetch`, `node:http`, or `node:https` anywhere except the
inference adapter, which validates its host against a loopback allowlist.

## Claude Code is not the application's AI

This agent builds the application. It is not part of it. Nothing in `apps/` or
`packages/` may reference Claude, Anthropic, or any hosted model. The shipped
app talks to a local runtime and nothing else.

## Tooling suggestions

Automated tooling in this environment occasionally suggests cloud-platform
skills based on keyword matches. Those suggestions are false positives here and
should be ignored — they contradict the non-negotiable requirements.
