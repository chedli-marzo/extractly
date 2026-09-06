import { app, BrowserWindow, session } from 'electron';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { applyCspHeaders, contentSecurityPolicy } from './csp.js';
import { developmentContentSecurityPolicy } from './csp.dev.js';
import { registerIpcHandlers } from './ipc.js';
import { shouldAllowNavigation } from './navigation.js';
import { permissionDecision } from './permissions.js';
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
      responseHeaders: applyCspHeaders(details.responseHeaders, policy),
    });
  });

  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      callback(permissionDecision(permission));
    },
  );
}

/**
 * The origin the renderer is allowed to stay within: the packaged app's own
 * files, or the loopback dev server. Passed to `shouldAllowNavigation` rather
 * than read inside it, so the decision stays pure and testable.
 */
function allowedNavigationPrefix(): string {
  if (import.meta.env.DEV && process.env['ELECTRON_RENDERER_URL']) {
    return process.env['ELECTRON_RENDERER_URL'];
  }
  return pathToFileURL(join(here, '../renderer')).href;
}

function lockNavigation(window: BrowserWindow): void {
  const allowed = allowedNavigationPrefix();

  window.webContents.on('will-navigate', (event, targetUrl) => {
    if (!shouldAllowNavigation(allowed, targetUrl)) {
      event.preventDefault();
    }
  });

  // Denied without exception. docs/security.md permits opening an external
  // link in the system browser only after an explicit user action, and no such
  // action exists in the application yet.
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
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

  lockNavigation(window);

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

// Set before the app is ready, which is when Electron first resolves the path.
app.setPath('crashDumps', appPaths.crashDumps);

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
