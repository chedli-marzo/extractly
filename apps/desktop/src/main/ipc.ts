import { app, ipcMain } from 'electron';
import { IPC_CHANNELS, type AppVersion } from '@app/shared';

/**
 * One handler, one channel. It takes no arguments, which is why there is no
 * schema validation here yet — docs/security.md requires every handler that
 * accepts input to validate it, and the first such handler arrives with import
 * at MS-02. Zod is introduced then, not speculatively now.
 */
export function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.getVersion, (): AppVersion => {
    return {
      app: app.getVersion(),
      electron: process.versions.electron ?? 'unknown',
    };
  });
}
