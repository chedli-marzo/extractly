# No cloud, no hosted AI, no telemetry

**Rule:** the shipped application has exactly one permitted network
destination — loopback, for the local model runtime. Nothing else.

Two post-MVP exceptions are recorded and **neither is implemented**: a licence
host ([ADR-0010](../../docs/decisions/0010-licensing-and-paid-distribution.md),
Proposed) and a sync endpoint for approved structured data in team mode
([ADR-0011](../../docs/decisions/0011-team-collaboration-and-cloud-structured-data.md),
Proposed). Neither authorises writing code, adding a dependency, or naming a
provider. Until an ADR is Accepted and its work is scheduled, this rule applies
unchanged — and it applies in full to documents, page images, text blocks, and
provenance in every mode.

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
  — ADR-0011 records a future cloud API over PostgreSQL for team mode, but
  chooses no managed-database vendor and authorises no code. Do not add a
  client, a dependency, or a vendor
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
