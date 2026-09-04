---
description: Run typecheck, lint, and tests
---

Run the full local check, in this order, and report results honestly:

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test`

Report actual output for anything that fails. Do not summarise a failure as a
pass, and do not weaken a test to make it go green — if a test is wrong, say so
and explain why.

If the project is not yet scaffolded (no `package.json`), say that rather than
inventing commands.
