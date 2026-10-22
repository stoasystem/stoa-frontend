/*
 * Each role route names the copy its page reads that loads on demand (#456).
 *
 * The administrators' copy loads with the first screen that asks for it
 * (#414). While a tab's account is read the router loads it with the page's
 * code (preloadWhileAccountLoads.ts), as the route's `copy` says. A page that
 * reads it unannounced waits for it behind the page skeleton after every
 * reload; one that announces it without reading it downloads it for nothing.
 *
 * What a page reads is found in its module and the modules it imports
 * statically: a `useTranslation` that names `admin`, or a key under `admin:`.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { pageRoutes } from '@/app/router/routeManifest'

const ROOT = path.resolve(__dirname, '../..')
const SRC = path.join(ROOT, 'src')

const MANIFEST = path.join(SRC, 'app/router/routeManifest.ts')
const STATIC_IMPORT = /^\s*(?:import|export)\b[^'"]*?\bfrom\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]/gm
const READS_ADMIN_COPY = /useTranslation\(\s*(?:\[[^\]]*)?['"]admin['"]|['"`]admin:/

/** The TypeScript module an import names, or null for a package, a stylesheet or JSON. */
function resolveModule(from: string, specifier: string): string | null {
  if (!specifier.startsWith('@/') && !specifier.startsWith('.')) return null
  const base = specifier.startsWith('@/') ? path.join(SRC, specifier.slice(2)) : path.resolve(path.dirname(from), specifier)
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]
  return candidates.find((candidate) => /\.tsx?$/.test(candidate) && existsSync(candidate)) ?? null
}

// Each page's module, from `lazyPage('Name', () => import('@/...'))`.
const pageModules = new Map(
  [...readFileSync(MANIFEST, 'utf8').matchAll(/lazyPage\('(\w+)', \(\) => import\('(@\/[^']+)'\)\)/g)].map(
    ([, pageName, specifier]) => [pageName, resolveModule(MANIFEST, specifier)],
  ),
)

/** A module and every module it imports statically, transitively. */
function staticClosure(entry: string): Set<string> {
  const seen = new Set<string>()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.pop() as string
    if (seen.has(file)) continue
    seen.add(file)
    for (const [, from, bare] of readFileSync(file, 'utf8').matchAll(STATIC_IMPORT)) {
      const imported = resolveModule(file, from ?? bare)
      if (imported) queue.push(imported)
    }
  }
  return seen
}

function readsAdminCopy(pageName: string): boolean {
  const module = pageModules.get(pageName)
  if (!module) throw new Error(`no module for ${pageName} in the route manifest`)
  return [...staticClosure(module)].some((file) => READS_ADMIN_COPY.test(readFileSync(file, 'utf8')))
}

describe("the routes' on-demand copy", () => {
  it('is found where it is read, also through an import', () => {
    expect(readsAdminCopy('AdminAccountsPage')).toBe(true)
    expect(readsAdminCopy('TeacherDashboardPage')).toBe(false)
    // The learning profile reads it in its header too, an imported component.
    const profile = staticClosure(pageModules.get('StudentLearningProfilePage') as string)
    expect([...profile].map((file) => path.relative(SRC, file))).toContain('components/learning/LearningProfileHeader.tsx')
  })

  it.each(pageRoutes.filter((route) => route.access.kind === 'roles').map((route) => [route.path, route] as const))(
    '%s names what its page reads',
    (_, route) => {
      expect([...(route.copy ?? [])]).toEqual(readsAdminCopy(route.page.pageName) ? ['admin'] : [])
    },
  )
})
