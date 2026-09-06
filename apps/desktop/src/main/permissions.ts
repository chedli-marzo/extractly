/**
 * Every permission is denied (docs/security.md, "Electron hardening").
 *
 * Written as a default-deny rather than a deny-list on purpose: a permission
 * this code has never heard of — one added by a future Chromium — is denied
 * because it was never allowed, not because someone remembered to list it.
 */
export function permissionDecision(_permission: string): boolean {
  return false;
}
