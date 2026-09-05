# ADR-0011: Team collaboration and cloud structured-data storage

**Status:** Proposed

## Decision

The application gains a second, post-MVP deployment mode.

**Solo mode** is unchanged and remains the MVP. One machine, one user, local
SQLite, no account, no network requirement.

**Team mode** allows several users of one customer to share the *approved
structured data* produced on their own machines. Extraction stays entirely
local; a synchronisation boundary publishes approved records to a shared cloud
store behind a cloud API.

What crosses the boundary in team mode:

| Never leaves the machine | May be synchronised in team mode |
| ------------------------ | -------------------------------- |
| Original PDFs and PDF binaries | Approved **normalised** values (`approved_extraction.payload_json`) |
| Page images and renders | The schema name and version they were approved against |
| Text blocks and their coordinates | Review and approval *attribution* — actor, timestamp, state |
| Provenance quotes and bounding boxes | `document.filename`, classified as metadata |
| Raw pre-normalisation values (`raw_value`) | Identifiers needed to address a shared record |
| Candidate extractions and raw model output | |
| Correction history and its before/after values | |

The governing rule is stated as a property rather than a list:

> **Only human-approved normalised structured data and explicitly allowed
> metadata may leave the local machine. Source representations and unapproved
> or raw document content remain local.**

`filename` is the one deliberate metadata allowance. It identifies a record for
a colleague and carries no document contents; it is metadata, not extracted
document content, and the distinction is recorded so it is not later used to
justify others.

**Architecture.** The desktop application talks to a **cloud API**. It never
holds database credentials. The API owns the database and enforces every
authorization rule.

```
                    LOCAL
PDF → Parse → AI → Review
                    ↓
             Approved data
                    ↓
               Cloud API
                    ↓
                PostgreSQL
                    ↓
             Team members
```

**Deployment.** The first team implementation is **vendor-hosted**: a cloud API
over PostgreSQL, operated by us. The architecture must stay deployable
**customer-hosted**, which becomes a separate enterprise option rather than a
rewrite. The managed-PostgreSQL vendor is not chosen here.

**Roles.** Two, and no more for the first implementation:

| Role | May |
| ---- | --- |
| Member / Reviewer | extract, edit, submit |
| Approver | approve into the shared store |

**Concurrency.** Optimistic. A shared record carries a version; a save against
a stale version is rejected and returned for explicit resolution. No
last-write-wins and no silent merge.

**Licensing.** Out of scope here. Licensing and team identity are separate
concerns; their integration is resolved in the licensing ADR, not this one.

This ADR authorises no implementation. It records the boundary so that later
work cannot quietly place it somewhere more convenient.

## Context

Solo mode was built on a promise that admits no exception: nothing leaves the
machine ([ADR-0003](0003-local-first-architecture.md)). That promise is the
reason the product is buyable by customers whose documents are contractually
forbidden from leaving their network, and it is not being weakened for them —
solo mode is unchanged and remains the default.

The commercial fact that forces this ADR is different: some customers are
teams, and a team that cannot see each other's approved data re-does each
other's work. The output the product exists to create — approved, reviewed,
traceable structured data — is exactly the thing a team needs to share.

The line drawn here is between the *document* and the *conclusions a human drew
from it*. A 200-page specification is confidential in a way its approved
extraction is not: the extraction is a set of values an engineer has read,
checked, and signed off, of the kind that is already retyped into an ERP or a
spreadsheet today. Sharing it inside the customer's own organisation is the
existing workflow, not a new exposure.

That line has to be defended structurally, because it is easy to erode. The
representation — `text_block`, `field_provenance` — is the entire document text
with coordinates. Synchronising it "so remote reviewers can see the source"
would be a reasonable-sounding request that reconstructs the PDF in the cloud.
Hence the rule above rather than an enumerated deny-list: a list gets extended
one reasonable request at a time, a rule has to be argued against.

The rule is deliberately worded around *approval* and *normalisation* rather
than around whether content is "document-derived". Everything the product
produces is document-derived — an approved pipe diameter is a value read out of
a drawing — so a rule phrased that way would forbid the thing team mode exists
to do. What actually distinguishes the shareable half is that a human looked at
it and signed it off, and that it has been through deterministic
post-processing into canonical units. Raw values, quotes, and coordinates fail
both tests and stay local.

**Why this does not supersede ADR-0003.** ADR-0003 governs the MVP and says
"revisit: never for the MVP." Solo mode still satisfies it in full. Team mode is
a second, post-MVP deployment shape, not a loosening of the first. Both ADRs
stand; ADR-0003's guarantees remain the definition of solo mode.

**Alternatives considered.**

*Sync everything, including the representation.* Rejected. It would put the
document in the cloud in all but name, and it would forfeit the one property
that makes the product saleable to its primary buyer.

*Sync nothing; share by exporting files.* This is what MVP already supports and
what the customer is already doing. It loses versioning, attribution, and any
notion of a shared current state — the team ends up reconciling spreadsheets,
which is the problem being solved.

*Peer-to-peer sync with no server.* No authorization is possible without a
trusted party. "Only supervisors may approve" cannot be enforced between equal
peers, and role-based approval is a stated requirement.

*Desktop clients connecting directly to a shared database.* Rejected outright.
If the client holds the connection string, every user holds it, and every
authorization rule becomes advisory — bypassable with any SQL client. Approval
is the control this whole mode exists to provide; an approval rule that a
determined user can step around is not a control. Hence a cloud API, and hence
database credentials never reaching the desktop application.

*Customer-hosted first.* Considered, because the primary buyer of solo mode
cannot accept vendor-hosted anything. It lost for the first implementation:
every customer-hosted install is an upgrade path, a support surface, and a
deployment the vendor cannot observe, which is a heavy price before the
collaboration model has been validated by anyone. Keeping the architecture
deployable customer-hosted preserves the option at close to zero cost, and that
customer is served by solo mode meanwhile.

**Identity.** [data-model.md](../data-model.md) currently attributes review and
approval to the local OS username. That is adequate for solo mode and
meaningless across machines: `admin` is three different people. Team mode
requires a stable `actor_id`. The display name is kept alongside it, because a
record from six months ago should still say who signed it.

**Package boundaries are unchanged.** `packages/extraction` must not learn
about Electron, authentication, HTTP, or a database — that rule already exists
in CLAUDE.md and it is what allows the pipeline to run headlessly. The
synchronisation boundary lives at the application boundary, in `apps/desktop`,
alongside every other privileged concern.

## Consequences

Positive:

- solo mode is untouched, so the customer who cannot accept any egress is not
  asked to
- extraction, provenance, and review remain local in both modes, so the
  expensive and sensitive half of the system has one implementation
- the sync payload is small and structured, which makes it auditable: a
  reviewer can read what is transmitted
- role-based approval gives the maker/checker control that engineering
  organisations already run on paper

Negative:

- the product now has two security postures and the documentation must be
  explicit about which applies, in the application as well as in the marketing
- a cloud API and a database must be operated, secured, and kept available
- authentication and authorization become permanent product surface: accounts,
  roles, invitations, revocation, and the support burden of all four
- a synchronised approved record cannot show its provenance to a remote
  colleague, because provenance stays local — a team member sees *what* was
  approved and by whom, not the page it came from. **Accepted as a known
  limitation; not designed around.** It is the request most likely to arrive
  from a customer and most likely to erode the boundary above
- optimistic concurrency means a user can be told their save was rejected, so
  the review UI needs a conflict-resolution path it does not have today
- vendor-hosted first means operating a production service: availability,
  backups, incident response, and a data processing agreement
- the customer-hosted option must be kept honest — an architecture that is
  "deployable customer-hosted" in principle but never deployed that way will
  quietly stop being so
- two identity systems now exist: device-bound licences
  ([ADR-0010](0010-licensing-and-paid-distribution.md)) and team accounts.
  Deliberately not reconciled here

## Revisit when

A customer requires remote reviewers to see source provenance. That cannot be
satisfied without moving the boundary this ADR draws, so it is a new decision
rather than a feature.

Also revisit when the first customer-hosted deployment is actually sold, since
that is the point at which "deployable customer-hosted" stops being a claim and
starts being tested; and when a third role is requested, since two is a
deliberate floor rather than an accident.
