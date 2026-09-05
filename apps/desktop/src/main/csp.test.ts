import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy } from './csp.js';

describe('contentSecurityPolicy', () => {
  /**
   * The expected string is written out here rather than imported. A test that
   * imports the value it is checking asserts only that a function is
   * deterministic; this one asserts that it matches docs/security.md.
   */
  it('matches docs/security.md byte for byte', () => {
    expect(contentSecurityPolicy()).toBe(
      "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob:; connect-src 'self'; font-src 'self'",
    );
  });

  it.each(['ws:', 'wss:', 'http:', 'https:', 'unsafe-eval'])(
    'permits no %s',
    (forbidden) => {
      expect(contentSecurityPolicy()).not.toContain(forbidden);
    },
  );
});
