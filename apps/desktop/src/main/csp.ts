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
