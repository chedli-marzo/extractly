/**
 * Development-only CSP. Vite's HMR needs a WebSocket back to the dev server and
 * injects inline scripts, neither of which the production policy permits.
 *
 * Reachable only from inside an `import.meta.env.DEV` branch. It must never
 * appear in a production bundle — US-03 greps for exactly that.
 */
export function developmentContentSecurityPolicy(
  devServerOrigin: string,
): string {
  const socket = devServerOrigin.replace(/^http/, 'ws');
  return [
    "default-src 'none'",
    `script-src 'self' 'unsafe-inline' ${devServerOrigin}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    `connect-src 'self' ${devServerOrigin} ${socket}`,
    "font-src 'self' data:",
  ].join('; ');
}
