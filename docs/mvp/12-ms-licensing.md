# MS-12 — Licensing

**Phase:** Commercial hardening · **Estimate:** 3 weeks · **Depends on:** MS-11

Governed by [ADR-0010](../decisions/0010-licensing-and-paid-distribution.md),
still `Proposed`. It must be accepted before this milestone starts, and it has
one open item: whether a team licence is seated or unlimited, and whether it
binds per user or per machine.

## Goal

Make the product sellable, after it has been shown to work. Licensing is the
release gate, not a way to sell before the pipeline is proven.

## Exit criteria

- A licence file verifies offline, on an air-gapped machine, with no server
- A licence copied to a second machine refuses to run
- Reaching the allowance blocks new imports and nothing else
- Term expiry degrades to read-only and export-only — never a lockout

## Stories

| ID | Title | Branch | Est. |
| -- | ----- | ------ | ---- |
| US-51 | Licence file format and offline signature verification | `feat/us-51-licence-verification` | `3d` |
| US-52 | Offline activation via request code | `feat/us-52-offline-activation` | `3d` |
| US-53 | Online activation and silent refresh | `feat/us-53-online-activation` | `3d` |
| US-54 | Allowance counter and clock high-water mark | `feat/us-54-allowance-counter` | `4d` |
| US-55 | Grace period and read-only mode | `feat/us-55-grace-and-read-only` | `3d` |

## Watch for

The allowance counter is local and, on an air-gapped machine, unverifiable. It
is a commercial boundary rather than a technical control. Enforce it visibly and
simply; no obfuscation, no anti-tamper arms race.

## Commit plan

Not written yet. Commit messages are mapped to acceptance criteria, and this
milestone has story titles only — see
[README](README.md#story-detail). Both are written when the milestone before
this one completes.
