import { describe, expect, it } from 'vitest';
import { applyCspHeaders, contentSecurityPolicy } from './csp.js';

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

describe('applyCspHeaders', () => {
  const policy = contentSecurityPolicy();

  it('adds the policy to headers that have none', () => {
    expect(applyCspHeaders({ 'X-Thing': ['1'] }, policy)).toStrictEqual({
      'X-Thing': ['1'],
      'Content-Security-Policy': [policy],
    });
  });

  it('handles a response with no headers at all', () => {
    expect(applyCspHeaders(undefined, policy)).toStrictEqual({
      'Content-Security-Policy': [policy],
    });
  });

  /**
   * Replaced, never appended. Two CSP headers are enforced as an intersection,
   * so an upstream one can only break the page in a way that invites someone to
   * relax our policy instead of removing theirs.
   */
  it('replaces an existing policy rather than appending to it', () => {
    const result = applyCspHeaders(
      { 'Content-Security-Policy': ['default-src *'] },
      policy,
    );
    expect(result['Content-Security-Policy']).toStrictEqual([policy]);
  });

  it('replaces a differently-cased existing policy exactly once', () => {
    const result = applyCspHeaders(
      { 'content-security-policy': ['default-src *'] },
      policy,
    );
    expect(Object.keys(result)).toStrictEqual(['Content-Security-Policy']);
    expect(result['Content-Security-Policy']).toStrictEqual([policy]);
  });
});
