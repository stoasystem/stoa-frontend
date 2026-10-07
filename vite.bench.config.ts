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
 *
 * The bench is dev-only code by design, so the production guard that rejects
 * src/dev/ in a build is left out here, and only here.
 */
import path from 'node:path'
import { defineConfig, mergeConfig, type PluginOption } from 'vite'
import base, { devOnlyCodeStaysOut } from './vite.config'

const guard = devOnlyCodeStaysOut().name
const notTheGuard = (plugin: PluginOption) => !(plugin && typeof plugin === 'object' && 'name' in plugin && plugin.name === guard)

export default mergeConfig(
  { ...base, plugins: base.plugins?.filter(notTheGuard) },
  defineConfig({
    build: {
      outDir: 'dist-bench',
      emptyOutDir: true,
      rollupOptions: { input: path.resolve(__dirname, 'src/dev/starmap.html') },
    },
    preview: { host: true, port: 4173 },
  }),
)
