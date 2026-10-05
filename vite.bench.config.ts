/*
 * The star map bench as a production build (#44), so a phone times the
 * renderer the way it ships -- minified, React in production mode -- not the
 * dev server's build. Builds src/dev/starmap.html alone into dist-bench/,
 * which never deploys:
 *
 *   npm run bench:build
 *   npm run bench:preview    # prints a Network address for the phone
 *
 * then open <address>/src/dev/starmap.html?points=500&bench=1.
 */
import path from 'node:path'
import { defineConfig, mergeConfig } from 'vite'
import base from './vite.config'

export default mergeConfig(
  base,
  defineConfig({
    build: {
      outDir: 'dist-bench',
      emptyOutDir: true,
      rollupOptions: { input: path.resolve(__dirname, 'src/dev/starmap.html') },
    },
    preview: { host: true, port: 4173 },
  }),
)
