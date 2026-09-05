import type { BrowserWindowConstructorOptions } from 'electron';

/**
 * The hardening from docs/security.md, as data rather than as arguments at a
 * `new BrowserWindow(...)` call site. Exported so US-03 can assert it without
 * launching Electron.
 *
 * The literal types are load-bearing: `contextIsolation: true` rather than
 * `boolean` means a change to `false` is a type error before it is a test
 * failure.
 */
export interface HardenedWebPreferences {
  readonly contextIsolation: true;
  readonly sandbox: true;
  readonly webSecurity: true;
  readonly nodeIntegration: false;
  readonly nodeIntegrationInWorker: false;
  readonly nodeIntegrationInSubFrames: false;
  readonly allowRunningInsecureContent: false;
  readonly experimentalFeatures: false;
}

export interface HardenedWindowOptions extends Pick<
  BrowserWindowConstructorOptions,
  'width' | 'height' | 'show'
> {
  readonly webPreferences: HardenedWebPreferences;
}

export function createWindowOptions(): HardenedWindowOptions {
  return {
    width: 1280,
    height: 800,
    // Shown on `ready-to-show` instead, so the first paint is not a white flash.
    show: false,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
  };
}
