# MS-01 — Approved user stories

Full user stories for [MS-01](01-ms-workspace-and-shell.md), as approved at the
end of Phase 2 and before any implementation. The milestone file carries the
plan — criteria, commits, estimates. This file carries the reasoning that was
agreed before code existed, so a later reader can tell what was decided from
what was discovered.

A story is added here only once it has been approved. It is not edited
afterwards to match what shipped; that is what the milestone file's `Status`
line and the review report are for.

---

# US-02 — Stand up the Electron main, preload, renderer and worker skeleton

**Status:** Implemented. Deviations recorded at the end of this story.
**Branch:** `feat/us-02-electron-process-skeleton`

## User story

**As a** developer, **I want** the three-process structure plus the pipeline
worker in place, **so that** privileged and unprivileged code are separated
before either exists.

## Context

[US-01](01-ms-workspace-and-shell.md) delivered a workspace that builds, tests
and lints but runs nothing. This story makes it an application: a window, a
bundled asset, one typed channel, a killable worker.

The process model is already specified in [architecture.md](../architecture.md)
"Process model" — main owns everything privileged, the renderer owns nothing,
the worker does the slow work and holds ids rather than handles.
[security.md](../security.md) fixes the hardening values and the CSP string.
Neither is being decided here; both are being made real.

The order matters: US-03 asserts the hardening in tests. That only works if this
story exposes window options, CSP and path resolution as **pure values**, not as
arguments inlined at a `new BrowserWindow(...)` call site. A skeleton that
hardcodes them is a skeleton US-03 has to rewrite.

Decisions taken in DISCUSS and locked here:

| Decision | Choice |
| -------- | ------ |
| CSP in development | Relaxed, dev-only, HMR permitted. Production CSP is the [security.md](../security.md) string, unchanged, and is what US-03 tests |
| Dev branch removal | Compile-time via `import.meta.env.DEV`, never a runtime `app.isPackaged` guard |
| Electron install script | `onlyBuiltDependencies: ['electron']` in `pnpm-workspace.yaml` — one named package, explicitly |
| Zod | Not in this story. Introduced when the first channel accepts arguments |
| Worker location | `apps/desktop/src/worker/`, with the docs updated to match |
| Renderer lint ban | In scope. `node:*` and `electron` banned under `src/renderer/**` |

## Acceptance criteria

1. `pnpm dev` opens a window. `pnpm build` produces a bundle and the packaged
   main process loads the renderer from a bundled local asset over the app's own
   scheme or `file://` — never over http.
2. `pnpm install --frozen-lockfile` yields a working Electron binary.
   `pnpm-workspace.yaml` contains `onlyBuiltDependencies: ['electron']` and
   nothing else; `.npmrc` still sets `ignore-scripts=true`.
3. `createWindowOptions()` is exported as a pure function returning exactly the
   [security.md](../security.md) values: `contextIsolation`, `sandbox`,
   `webSecurity` true; `nodeIntegration`, `nodeIntegrationInWorker`,
   `nodeIntegrationInSubFrames`, `allowRunningInsecureContent`,
   `experimentalFeatures` false. It is called with no arguments by main and is
   unit-testable without launching Electron.
4. `contentSecurityPolicy()` is exported as a pure function returning the
   production CSP string from [security.md](../security.md), byte for byte. It
   takes no mode parameter — the relaxed development policy is a separate export
   reachable only under `import.meta.env.DEV`.
5. A CSP header is set on every response via
   `session.defaultSession.webRequest.onHeadersReceived`.
6. The production bundle contains no development URL, no `ws://` literal, and no
   relaxed CSP string. Verified by grepping the built main bundle — the same
   grep US-03 formalises.
7. Preload exposes a hand-written object of named channels over `contextBridge`.
   Exactly one channel exists: `app:getVersion`, taking no arguments. No generic
   `invoke(channel, args)` passthrough exists anywhere, and the channel name
   union lives in `@app/shared`.
8. The renderer is React rendered through Vite, calls `app:getVersion` through
   the preload bridge, and displays the result. The dev server binds `127.0.0.1`
   with `strictPort: true`.
9. A `utilityProcess` worker at `apps/desktop/src/worker/` can be spawned and
   killed by main. It receives `{ documentId, jobId }`, replies with a message
   echoing the `jobId`, and terminates. It imports no database module and
   receives no handle.
10. `resolveAppPaths(userDataDir)` is a pure function mapping a `userData`
    directory to `app.db`, `blobs/`, `renders/` and `tmp/`. Main calls it with
    `app.getPath('userData')`. No path is hardcoded, and no directory is
    created.
11. A lint rule fails the build when a file under
    `apps/desktop/src/renderer/**` imports `electron` or any `node:*` builtin.
    Proven by making it fail once, then reverting.
12. `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm test` all exit
    0.

## Technical considerations

**Boundaries touched.** None of `DocumentParser`, `ExtractionProvider`,
`OcrEngine`. This story creates no seam. The worker is a process boundary, not a
fourth replaceable interface — it has one implementation and no alternative.

**Why the dev branch must be compile-time.** US-03 criterion 6 greps the built
bundle for non-loopback URL literals, and criterion 5 for network imports. A
runtime `app.isPackaged` guard leaves the dev server URL and the relaxed CSP
string in the shipped binary, where they are indistinguishable from an
accidental cloud fallback. `import.meta.env.DEV` removes them from the artifact.
This is the difference between a claim and a checkable one.

**Preload is CommonJS.** A sandboxed preload cannot be an ES module even though
the workspace is `"type": "module"`. electron-vite emits the correct format;
this is a constraint to record, not to solve.

**The one channel is deliberately trivial.** `app:getVersion` takes no
arguments, so no validation is needed and Zod stays out. It exists to prove the
shape of the contract — a named channel, a type in `@app/shared`, a hand-written
bridge entry — not to be useful.

**`packages/ui` stays empty.** The renderer shell is one component inside
`apps/desktop`. Components move to `@app/ui` at MS-05, when there is a second
consumer and a reason.

**Dependencies needed, with reasons.** All dev-time except `electron` itself,
which is the runtime.

| Dependency | Reason |
| ---------- | ------ |
| `electron` | The runtime. [ADR-0001](../decisions/0001-electron.md). Pinned exact — the ABI matters for MS-02's native module. |
| `electron-vite` | Builds main, preload and renderer with the correct formats and dev wiring. Accepted in the US-01 discussion; the alternative is three hand-maintained Vite configs. |
| `vite` | Peer of electron-vite; the bundler ADR-0001 already chose. |
| `react`, `react-dom` | ADR-0001. Criterion 8. |
| `@vitejs/plugin-react` | React refresh and JSX transform for the renderer. |
| `@types/react`, `@types/react-dom` | Types for the above. |

No HTTP client, no state library, no UI kit, no logger, no auto-updater — the
rejected-by-default list in [CLAUDE.md](../../CLAUDE.md) is unchanged by this
story.

**Data model, migrations, provenance, determinism-vs-AI:** untouched. No schema,
no parser, no model.

**Non-negotiables.** No egress path is created. The Vite dev server is a
loopback listener that exists only in development and is absent from the
production artifact by criterion 6. The crash reporter is not started and
`crashDumps` is not relocated — US-03's criterion 7 formalises it; this story
must simply not enable it.

## Affected areas/files

Created:

```
apps/desktop/electron.vite.config.ts
apps/desktop/src/main/index.ts       app lifecycle, window, session, worker control
apps/desktop/src/main/window.ts      createWindowOptions()
apps/desktop/src/main/csp.ts         contentSecurityPolicy(), dev policy
apps/desktop/src/main/paths.ts       resolveAppPaths()
apps/desktop/src/main/ipc.ts         the app:getVersion handler
apps/desktop/src/preload/index.ts    contextBridge, hand-written channel list
apps/desktop/src/renderer/index.html
apps/desktop/src/renderer/main.tsx
apps/desktop/src/renderer/App.tsx
apps/desktop/src/worker/index.ts     spawn target, echoes jobId
packages/shared/src/ipc.ts           channel names and payload types
apps/desktop/src/main/window.test.ts
apps/desktop/src/main/csp.test.ts
apps/desktop/src/main/paths.test.ts
```

Modified: root and package manifests for the new dependencies and scripts,
`pnpm-workspace.yaml` for `onlyBuiltDependencies`, `eslint.config.js` for the
renderer import ban, `packages/shared/src/index.ts` to re-export the IPC
contract, `apps/desktop/tsconfig.json` for JSX and the DOM lib,
[architecture.md](../architecture.md) and
[apps/desktop/README.md](../../apps/desktop/README.md) for the worker path.

## Out of scope

- `electron-builder`, signing, notarisation, installers — MS-11. MS-01's goal
  sentence mentions packaging, but no US-01–04 criterion does.
- Hardening assertions as a suite: `will-navigate`, `setWindowOpenHandler`,
  `setPermissionRequestHandler`, bundle greps as committed tests, crash reporter
  checks — **US-03**. This story must not enable anything US-03 will have to
  disable, but it does not write those tests.
- CI, matrix, caching — **US-04**.
- Zod and any channel taking arguments — MS-02.
- SQLite, `better-sqlite3`, its `onlyBuiltDependencies` entry, and any directory
  creation under `userData` — MS-02.
- pdfjs, parsing, page rendering, real worker jobs — MS-04.
- Any component in `packages/ui` — MS-05.
- Window state persistence, application menus, tray, dark mode, routing.
- An ADR. [ADR-0001](../decisions/0001-electron.md) already decided the stack;
  nothing here is expensive to reverse.

## Testing requirements

Everything asserted in this story is tested **without launching Electron**,
because everything asserted is a pure function. That is the point of extracting
them.

1. `window.test.ts` — `createWindowOptions()` returns each of the eight
   [security.md](../security.md) values. Written as an exact object comparison,
   not per-key assertions, so a *newly added* unsafe option fails the test rather
   than passing unnoticed.
2. `csp.test.ts` — `contentSecurityPolicy()` equals the
   [security.md](../security.md) string byte for byte, and contains no `ws:`, no
   `http:`, and no `unsafe-eval`. The test embeds the expected string as a
   literal; it does not import the value it is checking.
3. `paths.test.ts` — `resolveAppPaths('/tmp/x')` maps to the four documented
   locations, and every returned path is inside the given directory after
   normalisation. Includes a Windows-style input, since
   [ADR-0002](../decisions/0002-windows-and-macos.md) makes Windows the primary
   test platform.
4. Criterion 11's lint ban is verified once by hand — add a `node:fs` import to
   the renderer, watch `pnpm lint` fail, remove it. No deliberately-broken
   fixture is committed.
5. Criterion 6's bundle grep is run manually here and becomes a committed test
   in US-03.

No test asserts that a window opened, that Electron booted, or that the worker
was scheduled — those need a real runtime and belong to manual verification,
recorded in the PR.

No fixtures. No PDFs. No model. Nothing here touches extraction, validation,
grounding or the state machine, so none of those testing rules apply yet.


## Deviations found during implementation

The story is not edited to match what shipped. What follows is what implementing
it revealed, in the order it was found.

### 1. Criterion 2 was wrong, and was not implemented

The story required `onlyBuiltDependencies: ['electron']`, on the premise that
`ignore-scripts=true` would leave Electron without a binary. Measured, that
premise is false:

| Test | Result |
| ---- | ------ |
| `ignore-scripts=true`, clean install, then invoke electron | works — the binary downloads lazily on first invocation, `dist/version` reports `44.2.0` |
| `onlyBuiltDependencies: ['electron']` | never fires; pnpm reports only esbuild as blocked |
| `vite --version` with scripts disabled | `vite/7.3.6` — esbuild ships prebuilt platform packages |

No install-script exception is needed, so none was added. Implementing the
criterion as written would have loosened a security control to buy nothing.
`pnpm-workspace.yaml` records the empty list and why, and names `better-sqlite3`
at MS-02 as the expected first genuine entry.

**Consequence for US-04:** the Electron binary arrives at first *launch*, not at
install. A cold CI runner downloads it during the test step rather than the
install step.

### 2. Workspace packages had to be bundled, not externalised

The first build left `import { IPC_CHANNELS } from "@app/shared"` in the output.
Workspace packages ship TypeScript source by design
([architecture.md](../architecture.md), "Repository layout"), and Electron cannot
load a `.ts` file at runtime — so the packaged app would have failed to start.
Fixed with `build.externalizeDeps: { exclude: ['@app/shared'] }`. Only `electron`
and `node:path` remain external.

### 3. Main and the worker are CommonJS, not ESM

`import { app } from 'electron'` fails at load: the `electron` module provides no
named ESM exports. Main and the worker now emit `.cjs` alongside the preload,
which could never have been ESM anyway. Source stays ESM; `import.meta.dirname`
was replaced with `dirname(fileURLToPath(import.meta.url))`, which survives the
CommonJS output format.

The story had recorded the preload's CJS constraint and missed the main
process's. Recorded now in [architecture.md](../architecture.md), "Build output".

### 4. `ELECTRON_RUN_AS_NODE` makes verification lie

This environment sets `ELECTRON_RUN_AS_NODE=1`. It makes the Electron binary
behave as plain Node: `electron --version` reports a Node version, and
`require('electron')` returns the path to the binary as a string rather than the
module. Two launch failures were diagnosed as application bugs before this was
found; neither was.

Verifying the app requires `env -u ELECTRON_RUN_AS_NODE`. **If the variable is
set on a CI runner, every Electron-dependent check fails misleadingly** — carried
to US-04 as an acceptance criterion.

### 5. Two US-01 guards needed adjusting

Neither was weakened; both were mis-scoped for a repository that now has runtime
dependencies and build output.

- `tests/workspace/dependency-graph.test.ts` asserted *every* declared
  dependency, so adding `react` failed it. Narrowed to `@app/*` edges — the
  layering it exists to protect. `@app/shared`'s zero-dependency rule is
  unchanged and still absolute.
- ESLint and Prettier were scanning `apps/desktop/out/`, producing 696 errors
  from bundled third-party code. `out/` added to both ignore lists.


---

# US-03 — Assert the Electron hardening in CI, and build the three protections it is missing

**Status:** Done, reviewed 2026-09-06. Review findings at the end of this story.
**Branch:** `test/us-03-hardening-assertions`

## User story

**As a** maintainer, **I want** the security posture verified by CI, **so that**
a later change is caught by a test rather than by a customer.

## Context

US-02 built the process split and made three things testable by keeping them
pure — window options, the CSP string, path resolution. What it did not build is
everything that happens *after* a window exists: a link the user clicks, a
`window.open` from a page, a permission prompt, a crash.

So this story is half implementation. The commit plan in
[01-ms-workspace-and-shell.md](01-ms-workspace-and-shell.md) already says so —
commits 3, 4 and 6 are `feat:` and `chore:`.

The threat model in [security.md](../security.md) is accidental egress, not a
targeted attacker: a dependency that phones home, a crash reporter that attaches
a page image, a cloud fallback added under deadline. A convention catches none
of those. A grep over the shipped bundle does.

Decisions taken in DISCUSS and locked here:

| Decision | Choice |
| -------- | ------ |
| Missing `out/` | Test fails with an explicit "run `pnpm build` first". Never skips — a skipped security test reads as a passing one |
| Test location | `tests/security/`, its own repo-level Vitest project |
| URL allowlist | `127.0.0.1`, `localhost`, `[::1]`. Main bundle only — the renderer stays out of scope |
| Criterion 7 | Split: grep for `crashReporter.start`, and add `crashDumps` to `resolveAppPaths` |
| Scope | Implements navigation blocking, window-open denial, permission denial and crash-dump containment, then tests them |

## Acceptance criteria

1. `shouldAllowNavigation(allowedPrefix, targetUrl)` is pure and returns `false`
   for any URL outside the application's own origin, including `https:`,
   `file:` paths outside the app, and `javascript:`. Main wires it to
   `will-navigate`.
2. `setWindowOpenHandler` returns `{ action: 'deny' }` for every URL without
   exception.
3. `permissionDecision(permission)` is pure and returns `false` for every
   permission, asserted for camera, microphone, geolocation, notifications and
   clipboard-read.
4. `applyCspHeaders(existingHeaders, policy)` is pure; an existing
   `Content-Security-Policy` is replaced, not appended to, case-insensitively.
5. `resolveAppPaths` gains `crashDumps` under `userData`, and main calls
   `app.setPath('crashDumps', …)`.
6. `tests/security/` exists as a Vitest project. With the bundle absent every
   test **fails** naming `pnpm build`; none skips.
7. The built main bundle imports none of `node:http`, `node:https`, `http`,
   `https`, `node:net`, `node:dgram` — matched in import position — and contains
   no `fetch(` call.
8. Every `http`/`https`/`ws`/`wss` literal in the built main bundle names
   `127.0.0.1`, `localhost` or `[::1]`. The allowlist is a named constant with a
   comment: MS-08's inference adapter must pass deliberately.
9. The built main bundle contains no `crashReporter.start`.
10. US-02's assertions are extended, never duplicated or rewritten.
11. `pnpm typecheck`, `lint`, `format:check`, `build` and `test` all exit 0.

## Technical considerations

**Why pure decision functions rather than mocks.** Every criterion is an
Electron event handler. Mocking `session`, `BrowserWindow` and `app` would test
the mock — it drifts from the real API and needs rewriting whenever Electron
moves. Extracting the decision keeps the test honest and main free of logic,
which is the pattern US-02 established.

**The gap this leaves.** These tests prove the *decision*, not the *wiring*.
Nothing headless can prove `setPermissionRequestHandler` was handed the right
function. That is one line per handler, reviewed by eye. Recording the gap beats
a mock that only tests itself.

**`shouldAllowNavigation` takes the origin as an argument** because deriving it
needs `import.meta.env.DEV`, which would make it impure.

**The greps must be precise or they will be deleted.** A rule that
false-positives once gets disabled the next time it is inconvenient. Hence
import-position matching, and hence the renderer bundle staying out: React
embeds `https://react.dev` in error messages and would fail on day one for a
reason unrelated to egress.

**Dependencies.** None.

## Out of scope

- Renderer bundle scanning, with the React-URL problem as the stated reason.
- Opening external links in the system browser — no user action produces one.
- `session.webRequest.onBeforeRequest` request blocking; it interacts with the
  dev server and belongs to the first story that loads remote-shaped content.
- A source lint rule banning `fetch`/`node:http`; the bundle grep covers the
  artifact that ships. MS-08 is where a source rule with an exception belongs.
- CI wiring and build ordering — US-04.
- An ADR. This implements decisions already in [security.md](../security.md).

## Testing requirements

All in Vitest, no Electron.

1. `navigation.test.ts` — table-driven over the app origin, a sibling directory
   sharing the prefix, `https:`, `http:`, protocol-relative, `javascript:`,
   `about:blank`, a file outside the app, and a `data:` URL.
2. `permissions.test.ts` — the five named permissions plus one the code has
   never seen.
3. `csp.test.ts` — extended: added when absent, replaced when present, replaced
   once when differently cased.
4. `paths.test.ts` — extended for `crashDumps`.
5. `tests/security/bundle.test.ts` — existence first, then imports, URL
   literals, and `crashReporter.start`.
6. Each guard verified by making it fail on purpose, then reverting. Nothing
   deliberately broken is committed.


## Review findings — US-03

Four defects, all fixed in the review pass.

**1. The IPv6 loopback allowlist entry could never match.** The bundle scan split
each URL on `[/:?#]`, so `http://[::1]:8080/` yielded a host of `[`. The `[::1]`
entry was dead configuration, and a legitimate IPv6 loopback URL would have been
reported as a violation — precisely the false positive that gets a security test
deleted the first time it is inconvenient. Now parsed with `new URL()`; a
literal that does not parse is treated as a violation rather than as safe.

**2. Permission checks bypassed the handler.** Only `setPermissionRequestHandler`
was wired. Synchronous queries — `navigator.permissions.query` among them — go
through `setPermissionCheckHandler`, which was unset and therefore answering
with Chromium's defaults. Both now share `permissionDecision`. Beyond the
literal criterion, and exactly the gap the criterion existed to close.

**3. `applyContentSecurityPolicy()` also registered the permission handler.** A
function whose name describes half of what it does is how the other half gets
removed by someone tidying up. Renamed `hardenSession()`.

**4. A comment had been mangled by an earlier mechanical rename**, reading
"resolved from `import.meta.url` rather than `here`". Restored.

### Correction to US-02

US-02 criterion 9 was reported as passing. It is **partial**: the worker exists,
builds, and receives ids rather than handles, but `spawnPipelineWorker`,
`sendJob`, `onWorkerAck` and `killPipelineWorker` have no callers and no test.
Main never spawns it. MS-04 is where it earns a caller.

### Risks carried forward

- The bundle greps assume unminified output. MS-11 enabling minification
  weakens them silently — that needs to be a criterion there, not a surprise.
- URLs built by concatenation are invisible to a literal scan. The import ban is
  the mitigation: it catches the transport rather than the address.
- `will-redirect` and `will-frame-navigate` are unhandled. Low exposure under
  `default-src 'none'` and `sandbox: true`; it stops being low the moment
  anything loads remote-shaped content.
- The tests assert every decision and no registration.


---

# US-04 — Run the full check sequence on Windows and macOS, and prove it locally first

**Status:** Implemented, pending Phase 4 review.
**Branch:** `ci/us-04-windows-and-macos`

## User story

**As a** developer, **I want** both platforms built and tested on every change,
**so that** cross-platform assumptions fail in CI rather than at a customer site.

## Context

MS-01's first three stories built a floor and left it unenforced. A guard nobody
runs is a comment.

This story carries an unusual constraint: **there is no git remote**, so no
workflow can execute. Writing YAML that has never run and calling it done would
make every criterion an unverifiable claim — the exact failure the previous
stories were written against. So it delivers two things, and the local runner
carries the proof:

```
scripts/ci.mjs           the sequence, executable here, exit code is the verdict
.github/workflows/ci.yml a thin translation onto two runners
```

Step order is load-bearing. `tests/security` reads `apps/desktop/out/` and fails
when it is absent, so `build` must precede `test`.

Decisions taken in DISCUSS and locked here:

| Decision | Choice |
| -------- | ------ |
| No remote | Write the workflow *and* the local runner. Prove the sequence now |
| Provider | GitHub Actions |
| Matrix | `windows-latest` (x64), `macos-latest` (arm64). Intel macOS out of scope |
| Native module rebuild | Deferred to MS-02, where `better-sqlite3` first exists |
| Dependency audit | The US-03 bundle test suffices. No tree audit |
| Format check | Hard failure |
| App launch | Not in CI |
| Uploads | Build artifacts only |

## Acceptance criteria

1. `scripts/ci.mjs` runs install → typecheck → lint → format:check → build →
   test, stopping at the first failure with a non-zero exit.
2. It refuses to start when `ELECTRON_RUN_AS_NODE` is set, naming the variable
   and what it breaks. It does not silently unset it.
3. It prints resolved Node and pnpm versions and fails when either falls outside
   `engines` and `packageManager`.
4. It exits 0 on this machine, with output recorded in the PR.
5. Deleting `apps/desktop/out/` still exits 0; swapping `build` and `test` makes
   it fail.
6. `.github/workflows/ci.yml` runs the same six steps on both runners.
7. Node and pnpm are pinned, not floating.
8. Any cache keys `dist/` and `*.tsbuildinfo` together, or caches neither.
9. The Electron binary is cached by version — it downloads at first launch.
10. A step asserts `ignore-scripts=true` and that `onlyBuiltDependencies` holds
    nothing unreviewed. It fails, not warns.
11. `apps/desktop/out/` is the only upload.
12. The workflow does not launch the application.
13. All existing checks still pass.

## Technical considerations

**Why a script rather than duplicating steps in YAML.** Two copies of a sequence
drift, and the order is the load-bearing part. The workflow calls `pnpm check`,
so the order exists once and is executable on a developer machine — which is the
only reason this story is worth doing before a remote exists.

**Why `.mjs` and not shell.** Windows is the primary test platform (ADR-0002). A
`.sh` runner would not run there.

**Why the runner refuses rather than unsets `ELECTRON_RUN_AS_NODE`.** Unsetting
it would make the run pass while leaving the developer's shell still lying about
Electron for every command typed afterwards.

**The cache criterion is a bug that already happened.** `tsc -b` reports TS6305
when build info survives without its declarations — unreachable locally,
trivially reachable through a partial cache restore.

**Dependencies.** None.

## Out of scope

Adding a remote, pushing, opening a PR; observing the workflow pass; native
module rebuild (MS-02); a dependency-tree audit; Linux; Intel macOS; signing and
installers (MS-11); coverage; launching the app; an ADR.

## Testing requirements

The deliverable is a harness, so verification is behavioural.

1. `scripts/ci.mjs` exits 0 here, output in the PR.
2. Order proven by deleting `out/`, then by swapping `build` and `test`.
3. The `ELECTRON_RUN_AS_NODE` guard proven by running with it set.
4. The `ignore-scripts` assertion proven by removing the line.
5. The version guard proven by an impossible `engines.node`.
6. No new unit tests. A test asserting "the script calls six commands" restates
   the implementation.
