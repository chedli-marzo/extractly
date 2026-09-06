# MS-01 — Manual QA

How to verify [MS-01](01-ms-workspace-and-shell.md) by hand. Covers **only what
this milestone built**. Anything not listed here does not exist yet.

## There is no staging environment

This is a local-first desktop application ([ADR-0003](../decisions/0003-local-first-architecture.md)).
There is no server, no deployment, no URL, and nothing to promote between
environments. "Staging" here means the two things that are not a developer's own
dev server:

| Environment | What it is | Available now? |
| ----------- | ---------- | -------------- |
| **Local dev** | `pnpm dev`, hot reload, Vite dev server on loopback | yes |
| **Local production build** | `pnpm build`, then launching the built output — no dev server involved | yes |
| **Signed installer on a clean machine** | the real pre-release check | **no** — packaging is [MS-11](11-ms-packaging-and-distribution.md) |
| **CI artifacts per commit** | build output downloaded from a workflow run | **partly** — the workflow runs on GitHub Actions; it is not green yet |

So today the meaningful QA pass is: **local production build, on both Windows
and macOS, on someone else's machine as well as the author's.**

## Prerequisites

| Requirement | Value |
| ----------- | ----- |
| Node | 24.13.0 or later |
| pnpm | 10.33.0 exactly |
| OS | Windows 10/11 x64, or macOS on Apple Silicon |
| Network | needed once, to install dependencies and fetch the Electron binary |

### One environment variable will ruin your day

```sh
echo $ELECTRON_RUN_AS_NODE      # must be empty
```

If it is set, the Electron binary behaves as plain Node: the app refuses to
start and `electron --version` reports a Node version. Two failures during
development were misdiagnosed as application bugs because of it. Unset it, or
prefix every command with `env -u ELECTRON_RUN_AS_NODE`.

On Windows, if a clone predates `.gitattributes`, Git may have checked files out
with CRLF line endings and `pnpm check` will report every file as badly
formatted. Refresh the working tree once:

```sh
git rm --cached -r . && git reset --hard
```

```sh
pnpm install --frozen-lockfile
```

Install scripts are disabled deliberately, so the Electron binary downloads on
first launch instead. The first run is slower and needs network. That is
expected.

---

## 1. The checks pass

```sh
pnpm check
```

**Expect:** the six steps in order, then `✓ all checks passed`.

```
▸ environment
  node 24.13.0 · pnpm 10.33.0
  install scripts disabled · 0 build exception(s) allowed
▸ install ▸ typecheck ▸ lint ▸ format:check ▸ build ▸ test
```

**Fails if:** any step reports non-zero. The run stops at the first failure.

## 2. The application opens — development

```sh
pnpm dev
```

**Expect:** a 1280×800 window titled *Manufacturing*, showing

```
Manufacturing document extraction
app 0.0.0 · electron 44.2.0
```

That second line is the whole feature: the renderer asked the main process for
the version over the one IPC channel that exists, and got an answer.

**Fails if:** the window is blank (the renderer did not load), or the version
line reads `loading…` forever (the IPC bridge is broken).

## 3. The application opens — production build

```sh
pnpm build
env -u ELECTRON_RUN_AS_NODE pnpm --filter @app/desktop exec electron .
```

**Expect:** the same window, with no dev server running. Stop any `pnpm dev`
first so you are certain which one you are looking at.

**Fails if:** the window opens but is blank, or the console reports a module
error — that means the build wired something incorrectly, which the dev server
would have hidden.

## 4. The renderer really is sandboxed

Open DevTools (`Cmd`/`Ctrl` + `Alt` + `I`) and run each line in the console:

| Type this | Expect |
| --------- | ------ |
| `window.desktop` | an object with a single `getVersion` function |
| `window.desktop.getVersion()` | a promise resolving to `{app, electron}` |
| `typeof require` | `"undefined"` |
| `typeof process` | `"undefined"` |
| `window.desktop.invoke` | `undefined` — there is no generic passthrough |
| `fetch('https://example.com')` | blocked, with a Content-Security-Policy error |

The last one is the product promise made visible: the window that will one day
display document contents cannot reach the network at all.

## 5. Navigation is locked

In the DevTools console:

```js
window.location.href = 'https://example.com'
```

**Expect:** nothing happens. The window stays on the app.

```js
window.open('https://example.com')
```

**Expect:** no new window, no browser tab.

## 6. Permissions are denied

```js
navigator.geolocation.getCurrentPosition(
  () => console.log('ALLOWED — this is a bug'),
  (e) => console.log('denied:', e.message),
)
```

**Expect:** the denial branch. The same holds for camera, microphone,
notifications and clipboard read.

## 7. Application data stays in one place

The app resolves — but does not yet create — its storage under the OS
per-user application directory:

| OS | Location |
| -- | -------- |
| macOS | `~/Library/Application Support/Electron/` |
| Windows | `%APPDATA%\Electron\` |

**Expect:** a `crash-dumps` folder may appear there after a crash. Nothing else
is written yet, because nothing is imported yet. **No file should ever appear
outside this directory.**

The folder is named `Electron` rather than a product name because the
application has no name yet — that arrives with packaging at MS-11. Verified:
`app.getName()` returns `Electron`, and `userData` resolves to
`~/Library/Application Support/Electron` on macOS.

---

## Not testable in this milestone

Be explicit about these when reporting QA results, so absence is not read as
failure:

- **Importing a PDF, extraction, AI, review, export** — none exist. MS-02
  onward.
- **The pipeline worker.** It builds and can receive a job, but nothing in the
  application spawns it yet, so there is no way to observe it by hand. It earns
  a caller at MS-04.
- **An installer, an app icon, a product name, code signing** — MS-11.
- **Windows-versus-macOS differences in file handling** — nothing writes files
  yet.
- **Automatic checks on every change.** The checks are real; the automation that
  runs them per commit needs a git remote that does not exist.

## Reporting a problem

State the OS, the Node and pnpm versions from step 1, whether
`ELECTRON_RUN_AS_NODE` was set, and whether it was a dev run or a production
build. Those four facts explain most failures on their own.
