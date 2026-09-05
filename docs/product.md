# Product

## Goal

Convert engineering / manufacturing PDF documents into candidate structured
data automatically, then allow a human to verify and correct the result.

The output the user actually wants is not "AI output". It is **approved data**:
a record a human has looked at, with every field traceable back to a place in
the source document.

## Who it is for

An engineer, estimator, or technical buyer who receives PDFs — datasheets,
specifications, bills of material, drawings, inspection reports — and today
retypes values out of them into a spreadsheet or ERP. They work on documents
that are commercially sensitive and often contractually forbidden from leaving
the company network. That constraint is why this is a desktop application and
not a web service.

## Two modes

**Solo mode** is the MVP. One machine, one user, no account, no network
requirement:

```
PDF → local parsing → local AI → human review → local SQLite
```

**Team mode** is post-MVP. Extraction stays local; only *approved structured
data* is synchronised so a team shares one view of what has been signed off:

```
PDF → local parsing → local AI → human review → local structured data
                                                        ↓
                                                   cloud sync
                                                        ↓
                                                shared team data
```

Only human-approved normalised structured data and explicitly allowed metadata
may leave the machine. Source representations and unapproved or raw document
content — PDFs, page images, text blocks, provenance, raw values, correction
history — stay local in both modes.

Team mode gives a team one shared view of what has been approved, with two
roles: **Member/Reviewer** (extract, edit, submit) and **Approver** (approve
into the shared store). A colleague sees the approved values and who approved
them; provenance stays on the machine that produced it, which is an accepted
limitation for now. See
[ADR-0011](decisions/0011-team-collaboration-and-cloud-structured-data.md).

## MVP

The MVP is solo mode. It supports:

- PDF import
- local PDF parsing
- text extraction
- image / page rendering
- local AI processing
- candidate JSON generation
- validation
- human review
- correction
- approved extraction
- local persistence
- JSON / CSV / XLSX export

## MVP does not include

- cloud processing
- cloud storage of documents, page images, or the document representation
- SaaS accounts
- multi-user collaboration
- online dashboards
- billing
- external AI APIs
- automatic publishing without review

## Explicitly deferred (not "never", just not MVP)

| Deferred                    | Why it is deferred                                          |
| --------------------------- | ----------------------------------------------------------- |
| OCR for scanned PDFs        | Needs its own quality bar; MVP targets PDFs with a text layer |
| Drawing / geometry understanding | Vision models on engineering drawings are not reliable enough yet |
| Table extraction beyond deterministic reconstruction | Diminishing returns before review UX exists |
| Batch / folder watch import | Single-document flow must be correct first                  |
| Custom schema editor in UI  | Schemas ship as code in MVP                                 |
| Team collaboration (cloud sync of approved data) | Solo mode must be correct first; see ADR-0011 |
| Model fine-tuning           | Requires an approved-data corpus that does not exist yet     |

## The review contract

Review is the product, not a safety checkbox. The UI must make it faster to
*check* a value than to *retype* it. That implies, for every field:

- the proposed value, editable in place
- the exact source text the value came from
- the page, scrolled and highlighted, one click away
- a visible state: extracted / needs review / corrected / unknown
- no field silently defaulted or hidden

A document is not "done". It is `APPROVED`, by a person, at a time, against a
schema version. See [extraction.md](extraction.md).

## Milestone 1

Before any model is involved, one question has to be answered:

> Can we reliably turn a real 200-page engineering PDF into a local, searchable
> document representation where every piece of extracted text maps back to its
> exact page and bounding box?

It is answered by measurement, not impression. The bar: bounding boxes within
±2 pt, ≥ 99 % character recall per page with no expected block missing entirely,
and exact reading order — scored by the harness in
[tests/extraction/README.md](../tests/extraction/README.md), which states each
threshold and why it is set there.

The deliverable is import → parse → text blocks with bounding boxes → SQLite →
a page viewer that highlights any block on demand. No AI
([ADR-0007](decisions/0007-model-selection-deferred.md)) — not because AI is
being postponed, but because the representation is the ground truth every later
stage is checked against.

If that answer is no, no model fixes it. If it is yes, adding local AI is a
comparatively safe step.

## What success looks like for MVP

- A user imports a 40-page specification and reaches approved data faster than
  manual entry, including the time spent correcting the model.
- Zero fields reach approved state without a human having seen them.
- No network egress of document content, verifiable by inspection.
- Corrections are recorded, so the gap between candidate and approved output is
  measurable — that measurement is the input to every later quality decision.

## Non-goals

- Being a PDF viewer or editor.
- Being a general-purpose document Q&A chatbot.
- Beating a cloud frontier model on raw extraction accuracy. The trade is
  deliberate: locality and reviewability over peak accuracy.
