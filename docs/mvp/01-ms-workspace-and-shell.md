# MS-01 — Workspace and application shell

**Phase:** Validation release · **Estimate:** 2 weeks · **Depends on:** nothing

## Goal

A repository that builds, tests, lints and packages on both target platforms,
with an Electron shell whose security posture is asserted by tests rather than
by intention.

Nothing in this milestone does anything a user would recognise. Its value is
that every later milestone lands on a floor that already holds.

## What this milestone delivers, for a non-technical reader

**Milestone 1 has no feature.** That is the headline, and it should be said
first, or four weeks look like nothing happened.

What it delivers:

> An application that opens on Windows and Mac and does nothing yet — plus
> automated proof that it *cannot* send a document anywhere.

Why that is worth the time:

- The privacy promise is checked by machine, not promised in a meeting. If
  someone later adds code that could upload a document, the build stops.
- Both platforms are tested from the start, so "works on Mac, breaks in the
  plant" is caught here rather than at a customer site.
- Everything after this ships onto a floor that already holds.

What it is not: no PDF import, no extraction, no AI, nothing to demo.

The first milestone worth showing a stakeholder is
[MS-05](05-ms-import-and-viewer.md) — a real PDF opened, its text searchable,
every value clickable back to its exact spot on the page. This milestone is what
makes that demo trustworthy rather than a prototype.

**Caveat when presenting:** the security checks pass locally, but no CI service
is connected yet. "Checked on every change" is true of the checks and not yet of
the automation.

Manual verification steps are in
[01-qa-workspace-and-shell.md](01-qa-workspace-and-shell.md).

## Exit criteria

- `pnpm install --frozen-lockfile`, typecheck, lint and test all pass on Windows and macOS in CI
- The window opens, loads a bundled asset, and cannot reach the network or the filesystem
- A change that weakens Electron hardening fails CI

---

## US-01 — Workspace scaffold · `2d` · **✅ Done**

**As a** developer, **I want** the pnpm workspace and its packages to exist with
TypeScript and Vitest configured, **so that** code has somewhere to live and a
way to be tested.

- `apps/desktop`, `packages/shared`, `packages/database`, `packages/extraction`, `packages/ui` exist as workspace packages
- TypeScript strict mode, project references, no `any` in committed code
- Vitest runs and reports zero tests without failing
- Dependency direction is enforced: a lint rule fails a build where `packages/extraction` or `packages/database` imports from `apps/desktop`
- `packages/shared` has no runtime dependencies
- Lockfile committed; install scripts disabled by default

**Status:** Done, 2026-09-05. All six criteria verified, both guards proven to
fail on purpose before being trusted. Review found one real defect — the import
ban covered `packages/*/src` only, so a test file inside a package and the whole
evaluation harness could import Electron with lint passing — fixed and
re-proven.

**Carried forward from implementation**

- `typescript` is pinned to `6.0.3`, one major behind, because
  `typescript-eslint@8` declares a peer range of `>=4.8.4 <6.1.0`. TypeScript 7
  is the native compiler and unsupported by the lint toolchain today. Unpin when
  `typescript-eslint` supports it; the pin is exact rather than ranged so the
  upgrade is a deliberate act.

**Branch:** `chore/us-01-workspace-scaffold`

**Commits**

1. `chore: scaffold pnpm workspace and packages` — *criteria 1, 6*
2. `chore: configure typescript strict and project refs` — *criterion 2*
3. `test: add vitest with an empty passing suite` — *criterion 3*
4. `chore: enforce package dependency direction in lint` — *criteria 4, 5*
   > extraction and database must never import from apps/desktop; that rule is
   > what keeps the evaluation harness runnable without Electron.

## US-02 — Electron main, preload, renderer skeleton · `3d` · **✅ Done**

**As a** developer, **I want** the three-process structure in place, **so that**
privileged and unprivileged code are separated before either exists.

- Main process opens a window loading a bundled local asset
- Preload exposes a hand-written, typed list of named channels — no generic `invoke(channel, args)` passthrough
- Renderer is React via Vite, dev server loopback-only
- `utilityProcess` pipeline worker can be spawned and killed, receives ids rather than handles, and holds no database connection
- Application data resolves under Electron's `userData`; no hardcoded path

**Status:** Done, 2026-09-05. Full story and its five implementation deviations
in [01-us-workspace-and-shell.md](01-us-workspace-and-shell.md). Two are worth
knowing before reading the code: the install-script allowlist this story
specified turned out to be unnecessary and was not added, and the Electron main
process is CommonJS because `electron` exposes no named ESM exports.

**Branch:** `feat/us-02-electron-process-skeleton`

**Commits**

1. `feat: open a window loading a bundled asset` — *criterion 1*
2. `feat: add typed preload channel list` — *criterion 2*
   > No generic invoke(channel, args) passthrough — that would hand the
   > renderer the main process.
3. `feat: wire react renderer through vite` — *criterion 3*
4. `feat: spawn and kill the pipeline utilityProcess` — *criterion 4*
5. `chore: resolve app data under userData` — *criterion 5*

## US-03 — Hardening asserted in tests · `2d` · **✅ Done**

**As a** maintainer, **I want** the security posture verified by CI, **so that**
a later change is caught by a test rather than by a customer.

- Test asserts `BrowserWindow` options: `contextIsolation`, `sandbox`, `webSecurity` on; `nodeIntegration`, `nodeIntegrationInWorker`, `nodeIntegrationInSubFrames`, `allowRunningInsecureContent`, `experimentalFeatures` off
- Test asserts the CSP from [security.md](../security.md) is set on every response
- `will-navigate` cancelled outside the app; `setWindowOpenHandler` denies all
- `setPermissionRequestHandler` returns false for camera, microphone, geolocation, notifications, clipboard read
- Test greps the built main-process bundle for `fetch`, `node:http`, `node:https` — none permitted
- Test greps the built bundle for non-loopback URL literals — none permitted
- Electron crash reporter not started; `crashDumps` path kept local

**Status:** Done, 2026-09-06. Review found four defects, all fixed: the bundle
scan's IPv6 loopback entry could never match, `setPermissionCheckHandler` was
unset so synchronous permission queries answered with Chromium's defaults, a
function name described half of what it did, and a comment had been mangled by
an earlier rename. Every guard was verified by making it fail on purpose. Story
and findings in [01-us-workspace-and-shell.md](01-us-workspace-and-shell.md).

Carried forward: the greps assume unminified output and weaken when MS-11
enables minification; `will-redirect` and `will-frame-navigate` are unhandled;
the tests assert the decisions, never the wiring.

**Branch:** `test/us-03-hardening-assertions`

**Commits**

1. `test: assert BrowserWindow security options` — *criterion 1*
2. `test: assert CSP on every response` — *criterion 2*
3. `feat: block navigation and window open` — *criterion 3*
4. `feat: deny all permission requests by default` — *criterion 4*
5. `test: grep bundle for network imports and hosts` — *criteria 5, 6*
   > A lint rule and a grep over the built bundle, not a convention. The
   > realistic failure is a dependency that phones home.
6. `chore: keep crash dumps local, reporter off` — *criterion 7*

## US-04 — CI on Windows and macOS · `3d`

**As a** developer, **I want** both platforms built and tested on every change,
**so that** cross-platform assumptions fail in CI rather than at a customer site.

- Matrix build: win-x64, mac-arm64
- `--frozen-lockfile`, typecheck, lint, format check, unit tests
- Native module rebuild per Electron version and architecture succeeds on both
- Dependency audit runs; a network-capable transitive dependency in the main-process bundle fails the build
- Build artifacts retained per run for inspection
- The Node version in the matrix is pinned to one every dependency accepts, and
  `engines.node` in the root manifest matches it
- Build caching either caches `dist/` together with `*.tsbuildinfo` or caches
  neither
- A check asserts `ignore-scripts=true` is still set and that
  `onlyBuiltDependencies` lists only packages that were reviewed
- `ELECTRON_RUN_AS_NODE` is unset for every job that touches Electron, and a
  check fails the build if it is set

**Branch:** `ci/us-04-windows-and-macos`

**Commits**

1. `ci: build and test on win-x64 and mac-arm64` — *criteria 1, 2*
2. `ci: rebuild native modules per electron and arch` — *criterion 3*
3. `ci: fail on network-capable transitive deps` — *criterion 4*
   > Every direct dependency runs with main-process privileges on a machine
   > holding confidential documents. This is a security control.
4. `ci: retain build artifacts per run` — *criterion 5*
5. `ci: pin the node version and align engines` — *criterion 6*
   > `engines.node` is currently `>=24.0.0`, which permits Node 25 — a version
   > Vitest 5 excludes (`^22.12 || ^24 || >=26`). Nothing enforces the field,
   > so today it is decoration. CI is where it becomes real.
6. `ci: cache dist and tsbuildinfo together` — *criterion 7*
   > Found during the US-01 review: `tsc -b` fails with `TS6305` when
   > `*.tsbuildinfo` survives but `dist/` does not, because the build believes
   > declarations it cannot find are current. A cache that keeps one and drops
   > the other reproduces exactly that state on a runner and nowhere else.
7. `ci: assert install scripts stay disabled` — *criterion 8*
   > `.npmrc` is a security control, not configuration. Nothing currently
   > fails if it is deleted.
8. `ci: fail the build if ELECTRON_RUN_AS_NODE is set` — *criterion 9*
   > Found during US-02. The variable makes the Electron binary behave as plain
   > Node: `electron --version` reports a Node version and `require('electron')`
   > returns a path string. Every Electron-dependent check then fails for a
   > reason that has nothing to do with the code. Two US-02 failures were
   > misdiagnosed as application bugs before this was found.
