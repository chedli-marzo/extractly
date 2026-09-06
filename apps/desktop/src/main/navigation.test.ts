import { describe, expect, it } from 'vitest';
import { shouldAllowNavigation } from './navigation.js';

const APP = 'file:///Applications/app/out/renderer';

describe('shouldAllowNavigation', () => {
  it('allows the application origin itself', () => {
    expect(shouldAllowNavigation(APP, APP)).toBe(true);
  });

  it('allows a page inside the application', () => {
    expect(shouldAllowNavigation(APP, `${APP}/index.html`)).toBe(true);
  });

  /**
   * The case a naive `startsWith` gets wrong. `file:///…/renderer-evil` shares
   * a prefix with the app but is a different directory, and admitting it would
   * let anything the user has on disk render inside the trusted window.
   */
  it('rejects a sibling directory that merely shares the prefix', () => {
    expect(shouldAllowNavigation(APP, `${APP}-evil/index.html`)).toBe(false);
  });

  it.each([
    ['a remote page', 'https://example.com'],
    ['plain http', 'http://example.com'],
    ['a protocol-relative url', '//evil.com/index.html'],
    ['a javascript url', 'javascript:alert(1)'],
    ['about:blank', 'about:blank'],
    ['a file outside the app', 'file:///Users/someone/secret.pdf'],
    ['a data url', 'data:text/html,<script>alert(1)</script>'],
  ])('rejects %s', (_label, url) => {
    expect(shouldAllowNavigation(APP, url)).toBe(false);
  });

  it('treats a trailing slash on the allowed prefix the same way', () => {
    expect(shouldAllowNavigation(`${APP}/`, `${APP}/index.html`)).toBe(true);
    expect(shouldAllowNavigation(`${APP}/`, `${APP}-evil/x.html`)).toBe(false);
  });
});
