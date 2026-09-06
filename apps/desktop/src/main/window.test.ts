import { describe, expect, it } from 'vitest';
import { createWindowOptions } from './window.js';

describe('createWindowOptions', () => {
  /**
   * An exact comparison, not per-key assertions. A newly added web preference
   * — the realistic way hardening erodes — fails this test instead of slipping
   * through a checklist that only knows the keys it was written with.
   */
  it('returns exactly the hardening docs/security.md specifies', () => {
    expect(createWindowOptions().webPreferences).toStrictEqual({
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    });
  });

  it('does not carry a preload path — main resolves that at runtime', () => {
    expect(createWindowOptions().webPreferences).not.toHaveProperty('preload');
  });
});
