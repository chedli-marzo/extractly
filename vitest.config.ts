import { defineConfig } from 'vitest/config';

// One project per workspace package plus the two test roots. Packages hold no
// tests yet, so `passWithNoTests` keeps an empty project from failing the run.
export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      { test: { name: 'shared', root: 'packages/shared' } },
      { test: { name: 'database', root: 'packages/database' } },
      { test: { name: 'extraction', root: 'packages/extraction' } },
      { test: { name: 'ui', root: 'packages/ui' } },
      { test: { name: 'desktop', root: 'apps/desktop' } },
      { test: { name: 'evaluation', root: 'tests/extraction' } },
      { test: { name: 'workspace', root: 'tests/workspace' } },
      // Reads `apps/desktop/out/`, so it needs `pnpm build` to have run. It
      // fails rather than skips when the bundle is missing.
      { test: { name: 'security', root: 'tests/security' } },
    ],
  },
});
