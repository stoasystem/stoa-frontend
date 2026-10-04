import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Code that must never ship: the dev pages (the design preview, its demo data
// and network replacement, the benches) and the vitest-only MSW handlers.
const DEV_ONLY_DIRS = ['src/dev/', 'src/mocks/']

/** The project-relative, slash-separated path of a module id, query dropped. */
function projectPath(id: string) {
  const file = id.replace(/^\0/, '').split('?')[0]
  return path.relative(__dirname, path.resolve(__dirname, file)).split(path.sep).join('/')
}

/**
 * Fails a build whose module graph or emitted assets take anything from
 * DEV_ONLY_DIRS, however it got there: a root-absolute import, an
 * `import.meta.glob`, a `new URL(..., import.meta.url)`, an alias.
 * Build-only, so the dev server (which serves src/dev/ on purpose) is
 * untouched; the star map bench config, which builds src/dev/starmap.html,
 * removes it by name. tests/component/designPreviewExcluded.test.ts runs a
 * production build, so it turns red with it.
 */
export function devOnlyCodeStaysOut(): Plugin {
  const isDevOnly = (file: string) => DEV_ONLY_DIRS.some((dir) => file.startsWith(dir))
  return {
    name: 'stoa:dev-only-code-stays-out',
    apply: 'build',
    buildEnd(error) {
      if (error) return
      const found = [...this.getModuleIds()].map(projectPath).filter(isDevOnly)
      if (found.length > 0) this.error(`The production build takes in dev-only code: ${found.sort().join(', ')}`)
    },
    generateBundle(_options, bundle) {
      const found = Object.values(bundle).flatMap((output) =>
        output.type === 'asset' ? output.originalFileNames.map(projectPath).filter(isDevOnly) : [],
      )
      if (found.length > 0) this.error(`The production build emits dev-only files: ${found.sort().join(', ')}`)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devOnlyCodeStaysOut()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          const normalizedId = id.replaceAll('\\', '/')

          // Naming a chunk here overrides where a dynamic import would place a
          // dependency. KaTeX is loaded on demand, so it is left unnamed and
          // travels with the screen that needs it.
          if (normalizedId.includes('/katex/')) return undefined

          if (
            normalizedId.includes('/react/') ||
            normalizedId.includes('/react-dom/') ||
            normalizedId.includes('/scheduler/') ||
            normalizedId.includes('/@floating-ui/')
          ) {
            return 'vendor-react'
          }

          if (
            normalizedId.includes('/react-router/') ||
            normalizedId.includes('/react-router-dom/') ||
            normalizedId.includes('/@tanstack/react-query/') ||
            normalizedId.includes('/zustand/')
          ) {
            return 'vendor-router-state'
          }

          if (
            normalizedId.includes('/i18next/') ||
            normalizedId.includes('/react-i18next/')
          ) {
            return 'vendor-i18n'
          }

          if (
            normalizedId.includes('/aws-amplify/') ||
            normalizedId.includes('/@aws-amplify/')
          ) {
            return 'vendor-aws'
          }

          if (
            normalizedId.includes('/@radix-ui/') ||
            normalizedId.includes('/lucide-react/') ||
            normalizedId.includes('/sonner/') ||
            normalizedId.includes('/class-variance-authority/') ||
            normalizedId.includes('/tailwind-merge/')
          ) {
            return 'vendor-ui'
          }

          if (normalizedId.includes('/axios/')) {
            return 'vendor-http'
          }

          return 'vendor'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
