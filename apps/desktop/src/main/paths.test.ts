import { basename, dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveAppPaths } from './paths.js';

/**
 * The layout from docs/architecture.md, "Storage on disk", as names rather than
 * as whole paths.
 *
 * Asserting full path strings would hardcode a separator, and `node:path`
 * correctly produces `\` on Windows and `/` elsewhere — so such a test fails on
 * the primary test platform (ADR-0002) while the code is right. Asserting the
 * name and the parent directory pins the same decision without pinning the
 * platform.
 */
const EXPECTED_LAYOUT = {
  database: 'app.db',
  blobs: 'blobs',
  renders: 'renders',
  tmp: 'tmp',
  crashDumps: 'crash-dumps',
} as const;

describe('resolveAppPaths', () => {
  const root = join('home', 'u', '.config', 'app');

  it('resolves exactly the entries the layout defines', () => {
    expect(Object.keys(resolveAppPaths(root)).sort()).toStrictEqual(
      Object.keys(EXPECTED_LAYOUT).sort(),
    );
  });

  it.each(Object.entries(EXPECTED_LAYOUT))(
    'places %s directly under userData as "%s"',
    (key, name) => {
      const resolved =
        resolveAppPaths(root)[key as keyof typeof EXPECTED_LAYOUT];
      expect(basename(resolved)).toBe(name);
      expect(dirname(resolved)).toBe(root);
    },
  );

  /**
   * Windows is the primary test platform (ADR-0002). Separator normalisation is
   * platform-dependent — `node:path` on macOS will not produce backslashes — so
   * this asserts containment rather than an exact string. Containment is the
   * property that matters: docs/security.md requires every resolved path to sit
   * inside the app data directory.
   */
  it('keeps every path inside a Windows-style userData directory', () => {
    const root = 'C:\\Users\\u\\AppData\\Roaming\\app';
    for (const resolved of Object.values(resolveAppPaths(root))) {
      expect(resolved.startsWith(root)).toBe(true);
    }
  });

  it('creates nothing', async () => {
    const { existsSync } = await import('node:fs');
    const paths = resolveAppPaths('/tmp/definitely-not-created-by-this-test');
    expect(existsSync(paths.blobs)).toBe(false);
  });
});
