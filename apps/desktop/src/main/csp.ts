/**
 * The production Content-Security-Policy, byte for byte as docs/security.md
 * specifies it. No CDN, no remote font, no analytics origin.
 *
 * This function takes no mode parameter on purpose. The development policy is a
 * separate export in `./csp.dev.ts`, reachable only under
 * `import.meta.env.DEV`, so the relaxed string is removed from the production
 * bundle at compile time rather than skipped at runtime. A runtime guard would
 * leave it in the shipped binary, where US-03's bundle grep cannot tell it from
 * an accidental cloud fallback.
 */
export function contentSecurityPolicy(): string {
  return [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "font-src 'self'",
  ].join('; ');
}

/**
 * Applies the policy to a response's headers.
 *
 * An existing `Content-Security-Policy` is replaced, never appended to. Two CSP
 * headers are not additive — the browser enforces the intersection, so an
 * upstream header could only ever loosen what we intend or break the page in a
 * way that invites someone to relax our policy instead. Header names are
 * case-insensitive, so the match is too.
 */
export function applyCspHeaders(
  existingHeaders: Record<string, string[]> | undefined,
  policy: string,
): Record<string, string[]> {
  const headers: Record<string, string[]> = {};
  for (const [name, value] of Object.entries(existingHeaders ?? {})) {
    if (name.toLowerCase() !== 'content-security-policy') {
      headers[name] = value;
    }
  }
  headers['Content-Security-Policy'] = [policy];
  return headers;
}
