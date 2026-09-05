import { app, BrowserWindow, session } from 'electron';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentSecurityPolicy } from './csp.js';
import { developmentContentSecurityPolicy } from './csp.dev.js';
import { registerIpcHandlers } from './ipc.js';
import { resolveAppPaths } from './paths.js';
import { createWindowOptions } from './window.js';

// Resolved from `import.meta.url` rather than `here` so it
// survives the CommonJS output format the Electron main process requires.
const here = dirname(fileURLToPath(import.meta.url));

/**
 * Main owns everything privileged: lifecycle, windows, the session, and later
 * the filesystem, the database and the model connection. Nothing slow runs
 * here — that is what the pipeline worker exists for
 * (docs/architecture.md, "Process model").
 */

// Resolved once, from Electron rather than from a constant. Nothing is created;
// the milestone that writes to a directory creates it.
const appPaths = resolveAppPaths(app.getPath('userData'));

function applyContentSecurityPolicy(): void {
  const policy = import.meta.env.DEV
    ? developmentContentSecurityPolicy(
        process.env['ELECTRON_RENDERER_URL'] ?? '',
      )
    : contentSecurityPolicy();

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [policy],
      },
    });
  });
}

function createWindow(): BrowserWindow {
  const options = createWindowOptions();
  const window = new BrowserWindow({
    ...options,
    webPreferences: {
      ...options.webPreferences,
      preload: join(here, '../preload/index.cjs'),
    },
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  if (import.meta.env.DEV && process.env['ELECTRON_RENDERER_URL']) {
    void window.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    void window.loadFile(join(here, '../renderer/index.html'));
  }

  return window;
}

void app.whenReady().then(() => {
  applyContentSecurityPolicy();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

export { appPaths };
