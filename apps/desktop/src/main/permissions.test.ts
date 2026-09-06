import { describe, expect, it } from 'vitest';
import { permissionDecision } from './permissions.js';

describe('permissionDecision', () => {
  it.each([
    'media',
    'camera',
    'microphone',
    'geolocation',
    'notifications',
    'clipboard-read',
  ])('denies %s', (permission) => {
    expect(permissionDecision(permission)).toBe(false);
  });

  /**
   * Default-deny, not a deny-list. A permission introduced by a future Chromium
   * must be refused because it was never allowed — not because someone
   * remembered to add it here.
   */
  it('denies a permission it has never heard of', () => {
    expect(permissionDecision('some-permission-from-a-future-chromium')).toBe(
      false,
    );
  });
});
