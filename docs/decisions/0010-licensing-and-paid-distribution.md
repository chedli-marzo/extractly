# ADR-0010: Licensing and paid distribution

**Status:** Proposed

**Supersedes:** [ADR-0003](0003-local-first-architecture.md)

## Decision

The application is commercial software, licensed per user per device, sold
against a purchase order on an annual or monthly term.

Access is granted by a **signed license file** — Ed25519, verified offline
against a public key compiled into the binary — and never by an account, a
login, or a session. The reference delivery mechanism is offline: the
application displays a request code, a human issues the corresponding license
file, and the user installs it. An online activation and renewal endpoint
exists as a convenience for connected customers and is not required for the
product to function.

This restates ADR-0003's network rule **for solo mode**. **Two** destinations
are permitted in the shipped application, and no others:

1. loopback, for the local model runtime, and
2. one license host, reachable only from the licensing module.

The license request carries a license key, a salted device hash, and the
application version. It is a fixed, typed shape that structurally cannot carry
document content, and a test asserts this.

**A solo licence runs on exactly one machine.** The device hash is inside the
signed payload, and the application compares it against the hash it computes at
launch. A mismatch refuses to run. Copying the licence file to a second machine
therefore does not work, and cannot be made to work by editing it — the
signature covers the binding. This holds offline and air-gapped, where there is
no server to ask.

Moving to a new machine is a **reissue**, not a transfer: the user supplies a
request code from the new machine and receives a new licence file. Reissues are
a human step and are rate-limited by that fact — a customer asking for a fifth
reissue in a year is a conversation, not an automated approval. The old file is
revoked where the customer is connected, and left to expire where they are not;
an air-gapped installation cannot be revoked remotely, which is why the term and
its grace period are the real bound on a stale licence.

Entitlement is a **local cap, not a meter**. A license file carries a document
allowance and an optional page allowance for a period anchored to its issue
date. Nothing about usage is transmitted anywhere, ever. Reaching a cap blocks
new imports; it never blocks review, approval, or export of work already
imported. Term expiry behaves the same way: after a grace period the
application becomes read-only and export-only rather than refusing to open.

No licensing code is written until milestone 1 is met.

Team mode
([ADR-0011](0011-team-collaboration-and-cloud-structured-data.md)) adds a third
destination and an account-based identity. ADR-0011 deliberately leaves the
relationship between device-bound licences and team accounts to this ADR, which
does not yet settle it — that is an open item to resolve before this ADR is
accepted.

## Context

ADR-0003 stated that loopback is the only permitted network destination, and
listed "no privacy policy, data processing agreement, or breach surface to
defend" as a benefit. Charging for the software makes both statements false:
subscriptions require revocation, and billing means processing names, email
addresses, and payment records regardless of what the application does. The
honest move is to supersede that ADR rather than to quietly carve an exception
out of it.

The exception is narrow on purpose, because the threat ADR-0003 names has not
changed. The adversary is accidental egress: a dependency that phones home, a
crash reporter that attaches a page image, a cloud fallback added under
deadline. A licensing channel is precisely the kind of "it's only metadata"
channel through which document content eventually leaks. Hence the same
enforcement shape already used for the inference adapter — a single module, a
fixed request type, an allowlisted host, and a test over the built bundle —
rather than a general-purpose HTTP client the rest of the application can
reach for.

Several alternatives lost.

**Accounts and login in the application** were rejected. They require
authentication, a session store, a password reset flow, and a support queue,
for a single-user application that shares nothing and syncs nothing. They also
introduce a per-launch dependency on a server the product otherwise does not
need. The billing relationship lives in commercial records; the application
only needs to know whether it may run.

**Purely offline keys with no revocation** were rejected. A key that cannot be
revoked is a perpetual licence being billed as a subscription, with no recourse
against a non-paying or fraudulent customer.

**Online activation as the required mechanism** was rejected because part of
the target market is air-gapped. A plant workstation with no route to the
internet is not an edge case in this domain, and a licensing scheme that
assumes connectivity would disqualify the customers whose constraints justify
the product in the first place. Making offline the reference flow — with online
as an optimisation — also keeps the ADR-0003 promise nearly intact: an
air-gapped installation performs no network activity whatsoever.

**Usage metering and per-document billing** were rejected. Metering requires
reporting counts to a server, and how many documents a plant processed in a
week is exactly the operational metadata an NDA-bound customer objects to. It
also punishes the behaviour the product depends on: a user who rations imports
does not discover that reviewing is faster than retyping. Volume therefore
appears as a purchase-tier boundary enforced locally, not as a billed quantity.

That local cap is unverifiable and this is accepted rather than fought. The
machine enforcing the limit is owned by the person it constrains: a database
row can be deleted, the application reinstalled, the clock moved. No amount of
obfuscation changes that, and an anti-tamper arms race would cost real
engineering time and antagonise honest customers to deter dishonest ones who
will not buy anyway. The cap is a commercial signal and an upgrade prompt. It
is therefore enforced visibly and simply — a counter the user can see, a
warning as it approaches, a block at the limit.

Two consequences of the counting rules follow from the product rather than from
billing. A page allowance is checked *before* parsing, because page count is
available cheaply when a document is opened and refusing a document up front is
better than parsing it and then rejecting the result. A document is counted
*after* a parse succeeds, because a PDF the parser cannot handle should cost
the user nothing. Revisions are free: engineering documents arrive as rev A,
rev B, rev C, and charging per revision taxes the exact workflow the product
exists to serve. Byte-identical re-imports are already detected by the content
hash that names blobs (ADR-0004, architecture.md) and are silent; a document
matching an existing one by title and size but not by hash prompts the user to
declare it a new document or a revision.

Monthly and annual terms are both offered, but they are not equally cheap to
operate. A monthly term needs twelve reissues a year, which is automatic over
the online refresh path and manual otherwise. **Monthly is therefore available
to connected customers only; air-gapped installations are annual.** The term
length is a field in the license file, not a build-time constant, so this is a
sales rule rather than a code path.

Clock manipulation is the one attack worth defending against, because on an
air-gapped machine there is no server to contradict the system clock. The
application keeps a monotonic high-water mark of the latest time it has
observed; a backwards jump refuses to advance the allowance period and forces
reactivation. This is not tamper-proof either, but it costs a few lines and
stops the trivial case.

Licensing is deliberately sequenced after milestone 1. Milestone 1 answers
whether a real engineering PDF can be turned into a trustworthy local
representation. If the answer is no, there is nothing to license.

## Consequences

Positive:

- an air-gapped installation still performs no network activity at all, so the
  strongest version of the product promise survives for the customers who need
  it most
- no authentication, session, or account system in a single-user application
- issuance is a human step that already exists in a purchase-order sale, so the
  MVP needs no checkout integration, no payment webhooks, and no dunning flow
- entitlements live in the license file, so changing a customer's allowance is
  a reissue rather than a release
- expiry degrades to read-only instead of locking the user out of data that
  exists only on their own disk
- the licensing module is a single, narrow, testable seam rather than a general
  network capability

Negative:

- ADR-0003's "no privacy policy or breach surface" benefit is gone: personal
  data is processed, GDPR applies, and a privacy policy, EULA, and refund terms
  are now required
- a second network destination exists in the codebase, and the lint rule, host
  allowlist, and bundle grep that keep it contained are permanent maintenance
- offline activation is manual work per customer, per term, forever
- the document and page caps are unenforceable against a determined user, and
  the product ships knowing it
- device binding breaks on imaged and virtualised workstations, which are
  common in plants, so a manual override and reissue path is required
- a license server must be operated, kept available, and kept boring; its
  downtime must never stop a licensed application from launching
- payment terms of 30 to 60 days on invoices are working capital, not revenue
  timing

## Revisit when

A customer requires shared or floating licences across a team, which is a
different licensing model rather than a parameter of this one; or a self-serve
web or API product exists, at which point accounts become necessary for that
product and the desktop application's relationship to them has to be decided
explicitly rather than inherited.
