import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The enforcement half of docs/security.md.
 *
 * The threat model is accidental egress — a dependency that phones home, a
 * crash reporter that attaches a page image, a cloud fallback added under
 * deadline. None of those are caught by a convention, and none are visible in
 * source review once they are three levels down a dependency tree. They are
 * visible in the artifact that actually ships, which is what this file reads.
 */

const bundlePath = fileURLToPath(
  new URL('../../apps/desktop/out/main/index.cjs', import.meta.url),
);

/**
 * The only hosts a URL literal may name. `127.0.0.1` is here deliberately, not
 * incidentally: MS-08's inference adapter talks to a local model runtime and
 * must pass this test on purpose.
 */
// Brackets included: `new URL('http://[::1]/').hostname` keeps them.
const ALLOWED_HOSTS = ['127.0.0.1', 'localhost', '[::1]'];

/**
 * Network-capable modules. `node:path`, `node:url` and `node:fs` are absent on
 * purpose — this rule is about reachability, not about Node.
 */
const NETWORK_MODULES = [
  'node:http',
  'node:https',
  'http',
  'https',
  'node:net',
  'node:dgram',
];

function readBundle(): string {
  // Fails rather than skips. A skipped security test reads as a passing one in
  // every CI summary anyone actually looks at.
  expect(
    existsSync(bundlePath),
    `The main-process bundle is missing. Run \`pnpm build\` first — this test ` +
      `reads the shipped artifact, not the source.\nExpected: ${bundlePath}`,
  ).toBe(true);
  return readFileSync(bundlePath, 'utf8');
}

describe('the built main-process bundle', () => {
  it.each(NETWORK_MODULES)('does not import %s', (moduleName) => {
    const bundle = readBundle();
    // Import position only. A substring search would match an identifier or a
    // comment, and a rule that false-positives once gets deleted the next time
    // it is inconvenient.
    const imported = new RegExp(
      `(?:require\\(|from\\s*)['"]${moduleName.replace('/', '\\/')}['"]`,
    );
    expect(bundle).not.toMatch(imported);
  });

  it('makes no fetch call', () => {
    expect(readBundle()).not.toMatch(/\bfetch\s*\(/);
  });

  it('names no host outside the loopback allowlist', () => {
    const urls = readBundle().match(/\b(?:wss?|https?):\/\/[^\s'"`)]+/g) ?? [];

    const forbidden = urls.filter((url) => {
      // Parsed rather than split on punctuation. Hand-splitting cannot read an
      // IPv6 host: `http://[::1]:8080/` splits at the first colon and yields
      // `[`, so the allowlist entry for the IPv6 loopback would silently never
      // apply and a legitimate loopback URL would be reported as a violation.
      let host: string;
      try {
        host = new URL(url).hostname;
      } catch {
        // A literal that does not parse as a URL is not evidence of safety.
        return true;
      }
      return !ALLOWED_HOSTS.includes(host);
    });

    expect(forbidden, 'non-loopback URLs in the shipped bundle').toStrictEqual(
      [],
    );
  });

  it('does not start the crash reporter', () => {
    expect(readBundle()).not.toMatch(/crashReporter\s*\.\s*start/);
  });
});
