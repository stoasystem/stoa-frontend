import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Code that must never ship: the dev pages (the design preview, its demo data
// and network replacement, the benches) and the vitest-only MSW handlers.
const DEV_ONLY_DIRS = ['src/dev/', 'src/mocks/']

/*
 * Installed modules that only pages loaded on demand import, by their path
 * below the outermost node_modules/ (#456). The named group of their package
 * would put them on every first screen; left unnamed, they travel with the
 * pages that need them. Radix's dialog and tabs take the slot, context and
 * primitive nested under them along. The top-level primitive is react-label's
 * (the menu on the first screen has copies of its own; react-avatar and
 * react-separator would take it too, but nothing uses them). `persist` serves
 * the star map's store. A module that a named chunk imports stays in that
 * chunk whatever this says: Rollup takes it along.
 *
 * The dialog goes too, though the star map, a student's home, opens one. Out
 * of the UI kit's chunk it saves every first screen 1.4 kB gzip, before
 * anything is asked of the backend. Each page that opens one (the star map,
 * Ask, a teacher's request, and the administrators' Users, Teacher
 * applications, Account operations and Curriculum) pays 1.8 kB and a request,
 * after a reload while the account is read (#456 audits).
 *
 * tests/component/firstScreenChunks415.test.ts fails a build whose first
 * screen carries a package module it never imports. What a package's index
 * re-exports counts as imported there, so it does not see lucide-react's icons.
 */
const LATER_PAGES_ONLY = [
  '@radix-ui/react-dialog/',
  '@radix-ui/react-label/',
  '@radix-ui/react-primitive/',
  '@radix-ui/react-tabs/',
  'zustand/esm/middleware',
]

/** A slash-separated module id's path below the outermost node_modules/. */
function installedPath(normalizedId: string) {
  const at = normalizedId.indexOf('/node_modules/')
  return at === -1 ? normalizedId : normalizedId.slice(at + '/node_modules/'.length)
}

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
  // A worker is a build of its own that only runs worker.plugins: guard it too (PR #126 re-audit, N1).
  worker: { plugins: () => [devOnlyCodeStaysOut()] },
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
          const installed = installedPath(normalizedId)
          if (LATER_PAGES_ONLY.some((prefix) => installed.startsWith(prefix))) return undefined

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
