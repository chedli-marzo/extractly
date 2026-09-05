import tseslint from 'typescript-eslint';

/**
 * The import bans below are the reason this config exists.
 *
 * `packages/extraction` must never import Electron: that is what lets the
 * evaluation harness in `tests/extraction/` run headlessly (ADR-0008), and it
 * is a hard rule rather than a preference. The same ban applies to every
 * package so the rule cannot be sidestepped by routing through a sibling.
 *
 * Dependency direction is enforced in three independent layers, because they
 * fail differently:
 *   1. pnpm's strict node_modules — an undeclared import does not resolve
 *   2. this lint rule — catches an import statement
 *   3. tests/workspace/dependency-graph.test.ts — catches a declared manifest
 *      dependency that no import has used yet
 */
const forbiddenInPackages = [
  {
    group: ['electron', 'electron/*'],
    message:
      'This code must never import Electron — that is what keeps the ' +
      'evaluation harness runnable without a desktop runtime (ADR-0008). ' +
      'Electron belongs in apps/desktop.',
  },
  {
    group: ['@app/desktop', '@app/desktop/*'],
    message:
      'Dependency direction is apps/desktop -> packages/*, never the reverse.',
  },
  {
    group: ['**/apps/**'],
    message:
      'A relative path into apps/ inverts the dependency direction. Move the ' +
      'shared code into packages/shared instead.',
  },
];

/**
 * `apps/desktop` is the only package allowed to import Electron — but that
 * exemption must not reach the renderer. The renderer has no Node, no
 * filesystem and no network (docs/security.md); an import of `node:fs` there is
 * the exact bug the process split exists to prevent, and it would otherwise be
 * invisible to lint because it lives inside the one exempt package.
 */
const forbiddenInRenderer = [
  {
    group: ['electron', 'electron/*'],
    message:
      'The renderer reaches main through the preload bridge only. Add a named ' +
      'channel to @app/shared instead.',
  },
  {
    group: ['node:*', 'fs', 'path', 'child_process', 'os', 'crypto'],
    message:
      'The renderer has no Node. Anything needing the filesystem belongs in ' +
      'the main process, behind a named IPC channel.',
  },
];

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/out/**', '**/node_modules/**'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['apps/desktop/src/renderer/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { patterns: forbiddenInRenderer },
      ],
    },
  },
  {
    // Every file in a package, not only `src` — a test or a config file inside
    // a package would otherwise reach Electron unchecked. `tests/extraction`
    // is held to the same rule for the reason it exists: the evaluation
    // harness must run headlessly (ADR-0008), and it is the place most likely
    // to be handed an Electron API by someone debugging a fixture.
    //
    // `tests/workspace` is deliberately not covered. It asserts the dependency
    // graph, so importing every package by name — `@app/desktop` included — is
    // its job.
    files: ['packages/*/**/*.ts', 'tests/extraction/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { patterns: forbiddenInPackages },
      ],
    },
  },
);
