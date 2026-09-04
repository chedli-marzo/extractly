# ADR-0009: Synthetic fixtures only

**Status:** Accepted

## Decision

Real customer documents are never used as development fixtures, test data, or
evaluation inputs. Everything under `tests/` is synthetic or sanitised and
publishable.

Provenance of each fixture is recorded in `tests/extraction/fixtures/README.md`:
where it came from, and why it is safe to commit.

## Context

The product exists because these documents are confidential. Committing one to
a repository — even a private one — copies it onto every developer machine,
every CI runner, and every backup, permanently and irreversibly, and does so
under a licence nobody granted.

This is also the rule most likely to be broken casually and with good intentions.
Real documents are right there, they are representative, and synthetic ones are
work to produce. The temptation appears precisely when someone is debugging a
parser failure on a document that is hard to reproduce.

The evaluation dataset in ADR-0008 makes this sharper, because that dataset has
to be representative to be useful, and the most representative documents are
exactly the ones that must not be committed.

The mitigation for genuinely undebuggable cases is a local, git-ignored
directory for scratch documents — never committed, never referenced by a test —
plus generating synthetic documents that reproduce the structural feature that
broke, rather than the document that contained it.

## Consequences

Positive:

- the repository can be shared, open-sourced, or handed to a contractor without
  a review of what is in `tests/`
- no customer confidentiality obligation is ever breached by a clone
- fixtures can be published alongside bug reports and regression tests

Negative:

- synthetic fixtures are work to produce, and producing realistic engineering
  drawings, tables, and stamps is skilled work
- synthetic documents are cleaner than reality, so the system will score better
  on them than on real input, and that gap will be invisible
- sanitising a real document well enough to commit is harder than it looks:
  redacting rendered text does not remove the text layer, and metadata carries
  author, producer, and file paths
- debugging a customer-specific failure requires reproducing it synthetically
  first, which is slower

## Revisit when

Never. A customer explicitly licensing a document for the test suite is the only
exception, and it requires the licence recorded in the fixtures README.
