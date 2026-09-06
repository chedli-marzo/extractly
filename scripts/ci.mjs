#!/usr/bin/env node
/**
 * The check sequence, in the order CI runs it.
 *
 * It lives in a script rather than in the workflow YAML for two reasons. Two
 * copies of a sequence drift, and the order here is load-bearing: the security
 * tests in `tests/security` read `apps/desktop/out/`, so `build` must precede
 * `test`. Keeping the order in one executable place means it can be proven on a
 * developer machine — which matters more than usual, because this repository
 * has no remote and the workflow has never run.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

/**
 * On Windows `pnpm` is `pnpm.cmd`, and Node refuses to spawn a `.cmd` without a
 * shell — a deliberate restriction since the batch-file argument-injection fix
 * (CVE-2024-27980). Without this, every `execFileSync('pnpm', …)` here dies
 * with `ENOENT` on a Windows runner while working perfectly on macOS, where
 * `pnpm` is an ordinary executable.
 *
 * Every argument this script passes is a literal defined below — none comes
 * from the environment or from a file — so shell interpretation adds no
 * injection surface.
 */
const useShell = process.platform === 'win32';
const manifest = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

/**
 * Packages allowed to run an install script. Empty, and that is the point:
 * `.npmrc` disables install scripts for everything, and nothing in the tree
 * needs one yet. `better-sqlite3` is the expected first entry at MS-02, and it
 * has to be added here deliberately.
 */
const REVIEWED_BUILD_DEPENDENCIES = [];

const STEPS = [
  ['install', ['install', '--frozen-lockfile']],
  ['typecheck', ['run', 'typecheck']],
  ['lint', ['run', 'lint']],
  ['format:check', ['run', 'format:check']],
  // Before `test`, always. `tests/security` reads the built artifact and fails
  // when it is missing, by design.
  ['build', ['run', 'build']],
  ['test', ['run', 'test']],
];

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

/**
 * Refused rather than unset.
 *
 * `ELECTRON_RUN_AS_NODE` makes the Electron binary behave as plain Node:
 * `electron --version` reports a Node version, and `require('electron')`
 * returns the path to the binary as a string rather than the module. Two
 * failures during US-02 were diagnosed as application bugs before this was
 * found.
 *
 * Unsetting it here would make this run pass while leaving the developer's
 * shell still lying about Electron for every command they type afterwards.
 */
function checkElectronEnvironment() {
  if (process.env.ELECTRON_RUN_AS_NODE) {
    fail(
      'ELECTRON_RUN_AS_NODE is set.\n' +
        '  It makes the Electron binary behave as plain Node, so `electron --version`\n' +
        '  reports a Node version and `require("electron")` returns a path string.\n' +
        '  Every Electron-dependent check then fails for a reason unrelated to the code.\n' +
        '  Unset it in your shell, or run: env -u ELECTRON_RUN_AS_NODE pnpm check',
    );
  }
}

function versionAtLeast(actual, minimum) {
  const a = actual.split('.').map(Number);
  const b = minimum.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return true;
}

function checkToolVersions() {
  const node = process.versions.node;
  const pnpm = execFileSync('pnpm', ['--version'], {
    encoding: 'utf8',
    shell: useShell,
  }).trim();

  const required = manifest.engines?.node ?? '';
  const minimum = /^>=\s*(\d+\.\d+\.\d+)$/.exec(required)?.[1];
  if (!minimum) {
    // An unrecognised range is not permission to continue. It means this guard
    // no longer understands the manifest and is silently allowing anything.
    fail(`engines.node is "${required}", which this script cannot evaluate.`);
  }
  if (!versionAtLeast(node, minimum)) {
    fail(`Node ${node} does not satisfy engines.node "${required}".`);
  }

  const expectedPnpm = (manifest.packageManager ?? '').replace(/^pnpm@/, '');
  if (pnpm !== expectedPnpm) {
    fail(`pnpm ${pnpm} does not match packageManager "pnpm@${expectedPnpm}".`);
  }

  console.log(`  node ${node} · pnpm ${pnpm}`);
}

/**
 * `.npmrc` is a security control, not configuration. Every direct dependency
 * runs with full main-process privileges on a machine holding confidential
 * engineering documents, and an install script runs before anyone has read a
 * line of it.
 */
function checkInstallScriptsDisabled() {
  const npmrc = readFileSync(new URL('../.npmrc', import.meta.url), 'utf8');
  if (!/^\s*ignore-scripts\s*=\s*true\s*$/m.test(npmrc)) {
    fail('.npmrc no longer sets ignore-scripts=true.');
  }

  // The workspace file is ours and its shape is simple, so it is read with a
  // regex rather than by adding a YAML parser as a dependency.
  const workspace = readFileSync(
    new URL('../pnpm-workspace.yaml', import.meta.url),
    'utf8',
  );
  const block = /^onlyBuiltDependencies:\s*$((?:\s*#.*$|\s*-\s*\S+$)*)/m.exec(
    workspace,
  );
  const listed = (block?.[1] ?? '')
    .split('\n')
    .map((line) => /^\s*-\s*(\S+)\s*$/.exec(line)?.[1])
    .filter((name) => name !== undefined);

  const unreviewed = listed.filter(
    (name) => !REVIEWED_BUILD_DEPENDENCIES.includes(name),
  );
  if (unreviewed.length > 0) {
    fail(
      `onlyBuiltDependencies lists unreviewed packages: ${unreviewed.join(', ')}.\n` +
        '  A package here runs arbitrary code at install time. Add it to\n' +
        '  REVIEWED_BUILD_DEPENDENCIES in this script once its install script has\n' +
        '  actually been read.',
    );
  }

  console.log(
    `  install scripts disabled · ${listed.length} build exception(s) allowed`,
  );
}

function run(name, args) {
  console.log(`\n▸ ${name}`);
  try {
    execFileSync('pnpm', args, {
      cwd: repoRoot,
      stdio: 'inherit',
      shell: useShell,
    });
  } catch {
    fail(`${name} failed.`);
  }
}

console.log('▸ environment');
checkElectronEnvironment();
checkToolVersions();
checkInstallScriptsDisabled();

for (const [name, args] of STEPS) {
  run(name, args);
}

console.log('\n✓ all checks passed\n');
