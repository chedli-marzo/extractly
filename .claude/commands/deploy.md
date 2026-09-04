---
description: Phase 5 — build, package, and verify the release
argument-hint: [target, e.g. win | mac]
---

# Phase 5 — DEPLOY

$ARGUMENTS

Only proceed with explicit deployment approval from the user. If REVIEW has not
completed, stop and say so.

This project is a local-first desktop application. "Deploy" means build and
package the app (electron-builder) — **not** a cloud deployment. Do not create
cloud infrastructure, and do not push anything containing document contents.

## Before deploying

1. Run the full validation set: tests, lint, typecheck.
2. Confirm the production build succeeds.
3. Confirm the correct target/platform and version.
4. Confirm no debug or development-only network endpoint is enabled.

## Deploy

Run the project's packaging command for the requested target. Report the exact
command used.

## After deploying

- Verify the produced artifact exists and report its path and size.
- Smoke-check: app launches, a fixture PDF from `tests/fixtures/` parses, and the
  review UI renders a candidate.
- Report deployment status.
- Report any issue encountered, with exact error output.
