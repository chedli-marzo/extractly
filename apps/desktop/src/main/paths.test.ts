import { describe, expect, it } from 'vitest';
import { resolveAppPaths } from './paths.js';

describe('resolveAppPaths', () => {
  it('maps a userData directory to the layout in docs/architecture.md', () => {
    expect(resolveAppPaths('/home/u/.config/app')).toStrictEqual({
      database: '/home/u/.config/app/app.db',
      blobs: '/home/u/.config/app/blobs',
      renders: '/home/u/.config/app/renders',
      tmp: '/home/u/.config/app/tmp',
    });
  });

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
