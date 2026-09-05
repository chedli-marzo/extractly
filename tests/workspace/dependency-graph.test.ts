import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { PACKAGE_NAME as DATABASE } from '@app/database';
import { PACKAGE_NAME as DESKTOP } from '@app/desktop';
import { PACKAGE_NAME as EXTRACTION } from '@app/extraction';
import { PACKAGE_NAME as SHARED } from '@app/shared';
import { PACKAGE_NAME as UI } from '@app/ui';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

interface Manifest {
  name: string;
  private?: boolean;
  dependencies?: Record<string, string>;
}

/**
 * The one rule this repository cannot afford to lose. `packages/extraction` and
 * `packages/database` never importing from `apps/desktop` is what lets the
 * evaluation harness run headlessly in Vitest (ADR-0008, docs/architecture.md).
 *
 * A lint rule catches an import statement; this catches a manifest that has
 * quietly acquired the wrong dependency before any code imports it.
 */
const allowedDependencies: Record<string, readonly string[]> = {
  '@app/shared': [],
  '@app/database': ['@app/shared'],
  '@app/extraction': ['@app/shared'],
  '@app/ui': ['@app/shared'],
  '@app/desktop': [
    '@app/shared',
    '@app/database',
    '@app/extraction',
    '@app/ui',
  ],
};

function readManifests(): Manifest[] {
  return ['apps', 'packages'].flatMap((workspaceDir) =>
    readdirSync(join(repoRoot, workspaceDir), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map(
        (entry) =>
          JSON.parse(
            readFileSync(
              join(repoRoot, workspaceDir, entry.name, 'package.json'),
              'utf8',
            ),
          ) as Manifest,
      ),
  );
}

const manifests = readManifests();

describe('workspace dependency graph', () => {
  it('contains exactly the five expected packages', () => {
    expect(manifests.map((m) => m.name).sort()).toEqual(
      Object.keys(allowedDependencies).sort(),
    );
  });

  it.each(manifests.map((m) => [m.name, m] as const))(
    '%s is private and never published',
    (_name, manifest) => {
      expect(manifest.private).toBe(true);
    },
  );

  it.each(manifests.map((m) => [m.name, m] as const))(
    '%s declares only permitted workspace dependencies',
    (name, manifest) => {
      // Only `@app/*` edges are checked here. A third-party runtime dependency
      // is a dependency-policy question for review, not a layering violation —
      // and `@app/shared` keeps its absolute rule in the next test regardless.
      const declared = Object.keys(manifest.dependencies ?? {}).filter((dep) =>
        dep.startsWith('@app/'),
      );
      const allowed = allowedDependencies[name];
      expect(allowed, `unknown package ${name}`).toBeDefined();
      expect(declared.sort()).toEqual([...(allowed ?? [])].sort());
    },
  );

  it('keeps @app/shared free of runtime dependencies', () => {
    const shared = manifests.find((m) => m.name === '@app/shared');
    expect(Object.keys(shared?.dependencies ?? {})).toEqual([]);
  });

  it('resolves every package by name through its exports map', () => {
    expect([SHARED, DATABASE, EXTRACTION, UI, DESKTOP]).toEqual([
      '@app/shared',
      '@app/database',
      '@app/extraction',
      '@app/ui',
      '@app/desktop',
    ]);
  });
});
