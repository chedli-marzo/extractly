/**
 * Navigation is locked to the application's own content
 * (docs/security.md, "Electron hardening").
 *
 * The origin is passed in rather than derived, because it differs between a
 * packaged app (`file://`) and development (the loopback dev server). Deriving
 * it here would mean reading `import.meta.env.DEV`, which would make this
 * impure and untestable — and this is exactly the decision that must be
 * testable.
 */
export function shouldAllowNavigation(
  allowedPrefix: string,
  targetUrl: string,
): boolean {
  // A bare prefix match is wrong: `file:///app` would also admit
  // `file:///app-evil/index.html`. The prefix must end at a path boundary.
  const boundary = allowedPrefix.endsWith('/')
    ? allowedPrefix
    : `${allowedPrefix}/`;
  return targetUrl === allowedPrefix || targetUrl.startsWith(boundary);
}
