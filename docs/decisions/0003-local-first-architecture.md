# ADR-0003: Local-first architecture

**Status:** Accepted

## Decision

The application runs entirely on the user's machine. There is no server, no
account, and no sync. The only network destination permitted in the codebase is
loopback, for the local model runtime. There is no telemetry of any kind in the
MVP.

## Context

Engineering PDFs contain confidential business information: pricing, tolerances,
supplier identities, and unreleased designs. Many are covered by NDAs that
forbid transmission to third parties outright. For a large part of the target
audience, a cloud tool is not a harder sell — it is disqualified before
evaluation.

This is the product's premise rather than a feature of it, so it needs to be
enforced structurally. The realistic threat is not a targeted attacker; it is
accidental egress. A dependency that phones home. A crash reporter that attaches
a page image. A cloud fallback added under deadline. Documentation does not stop
any of those.

Enforcement therefore lives in four places: the inference adapter validates its
host against a loopback allowlist and throws otherwise; no module outside that
adapter may import `fetch`, `node:http`, or `node:https`, checked by lint and by
a grep over the built bundle; the renderer is blocked from any request that is
not a local asset; and CI runs the full import-to-export flow with all
non-loopback traffic blocked.

The trade being accepted is real: no frontier model, no crash telemetry, no
usage analytics, no cross-device access, and no server-side heavy lifting.

## Consequences

Positive:

- documents never leave the machine, and that claim is testable rather than
  asserted
- no per-document API cost, no rate limits, no vendor availability risk
- the application works on an air-gapped workstation, which some plants require
- no privacy policy, data processing agreement, or breach surface to defend

Negative:

- accuracy is bounded by what runs on the user's hardware, which is below what a
  hosted frontier model would give
- hardware requirements land on the user: RAM and disk for a local model
- no crash telemetry, so debugging depends on local logs the user chooses to
  send
- adding any legitimate network feature later requires an ADR, which is intended
  friction and will occasionally be annoying
- model distribution and management become our responsibility (see ADR-0007)

## Revisit when

Never for the MVP. A customer requiring an on-premises shared inference host is
a different product decision, not a loosening of this one.
