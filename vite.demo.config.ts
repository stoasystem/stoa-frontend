/*
 * The design preview as a static site: the demo site at app-planet.stoaedu.ch.
 * Builds src/dev/preview.html alone into dist-demo/ and serves it as the site's
 * index.html, so the root address opens the real routes with the demo student
 * signed in and no backend (docs/agents/design-preview.md):
 *
 *   npm run demo:build
 *   npm run demo:preview     # then open the printed address
 *
 * deploy-preview.yml publishes dist-demo/ to the preview bucket on every push
 * to main. It never reaches app.stoaedu.ch: deploy-production.yml builds with
 * vite.config.ts, whose guard still rejects src/dev/.
 *
 * The preview is dev-only code by design, so the production guard that rejects
 * src/dev/ in a build is left out here, as in vite.bench.config.ts.
 */
import path from 'node:path'
import { defineConfig, mergeConfig, type Plugin, type PluginOption } from 'vite'
import base, { devOnlyCodeStaysOut } from './vite.config'

const ENTRY = 'src/dev/preview.html'

const guard = devOnlyCodeStaysOut().name
const notTheGuard = (plugin: PluginOption) => !(plugin && typeof plugin === 'object' && 'name' in plugin && plugin.name === guard)

/** Emits the preview page as index.html, so the site root opens it. Assets are root-absolute, so moving it is safe. */
function previewAsIndex(): Plugin {
  return {
    name: 'stoa:demo-preview-as-index',
    apply: 'build',
    // Vite emits the HTML in its own generateBundle, so this runs after it.
    enforce: 'post',
    generateBundle(_options, bundle) {
      const page = Object.values(bundle).find((output) => output.fileName === ENTRY)
      if (!page) this.error(`The demo build has no ${ENTRY}`)
      page.fileName = 'index.html'
    },
  }
}

export default mergeConfig(
  { ...base, plugins: [...(base.plugins?.filter(notTheGuard) ?? []), previewAsIndex()] },
  defineConfig({
    build: {
      outDir: 'dist-demo',
      emptyOutDir: true,
      rollupOptions: { input: path.resolve(__dirname, ENTRY) },
    },
    preview: { port: 4174 },
  }),
)
