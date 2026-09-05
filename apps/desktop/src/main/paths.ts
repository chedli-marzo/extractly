import { join } from 'node:path';

/**
 * The on-disk layout from docs/architecture.md, "Storage on disk". Pure, so it
 * is testable without Electron and so no path is ever hardcoded: main passes
 * `app.getPath('userData')` and nothing else knows where that is.
 *
 * Nothing is created here. The milestone that writes to a directory creates it.
 */
export interface AppPaths {
  readonly database: string;
  readonly blobs: string;
  readonly renders: string;
  readonly tmp: string;
}

export function resolveAppPaths(userDataDir: string): AppPaths {
  return {
    database: join(userDataDir, 'app.db'),
    blobs: join(userDataDir, 'blobs'),
    renders: join(userDataDir, 'renders'),
    tmp: join(userDataDir, 'tmp'),
  };
}
