import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Workspace packages ship TypeScript source (see docs/architecture.md), so they
// must be bundled rather than left as runtime imports — Electron cannot load a
// `.ts` file at runtime. Third-party dependencies stay external as usual.
const externalizeDeps = { exclude: ['@app/shared'] };

export default defineConfig({
  main: {
    build: {
      externalizeDeps,
      rollupOptions: {
        // The worker is built alongside main so it lands next to it in `out/`.
        // It is a separate entry, not an import: it runs in its own process.
        input: {
          index: resolve(import.meta.dirname, 'src/main/index.ts'),
          worker: resolve(import.meta.dirname, 'src/worker/index.ts'),
        },
        // CommonJS, like the preload. Electron's `electron` module is CJS and
        // provides no named ESM exports, so an ESM main process fails at load
        // with `does not provide an export named 'BrowserWindow'`.
        output: { format: 'cjs', entryFileNames: '[name].cjs' },
      },
    },
  },
  preload: {
    build: {
      externalizeDeps,
      // A sandboxed preload cannot be an ES module, even though this workspace
      // is `"type": "module"`. CommonJS output, with a .cjs extension so Node
      // does not read it as ESM.
      rollupOptions: {
        input: resolve(import.meta.dirname, 'src/preload/index.ts'),
        output: { format: 'cjs', entryFileNames: 'index.cjs' },
      },
    },
  },
  renderer: {
    root: resolve(import.meta.dirname, 'src/renderer'),
    plugins: [react()],
    // Loopback only. The dev server must never be reachable from the network.
    server: { host: '127.0.0.1', strictPort: true },
    build: {
      // Explicit: the renderer root is `src/renderer`, so a relative outDir
      // would resolve from there and land outside the app.
      outDir: resolve(import.meta.dirname, 'out/renderer'),
      emptyOutDir: true,
      rollupOptions: {
        input: resolve(import.meta.dirname, 'src/renderer/index.html'),
      },
    },
  },
});
