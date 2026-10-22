/**
 * #419: the versions that cleared `npm audit --omit=dev`, what that audit
 * counts, and the one advisory a visitor's browser could meet.
 *
 * Both gates run the audit itself (tests/release/verify-release.test.mjs pins
 * the step). It asks the registry, and it says nothing about why a version is
 * in the lock. This pins the floors the ticket set, offline: axios 1.20.0, and
 * react-router with react-router-dom on one version, 7.18.2 or later.
 *
 * #454: react-router-dom is written down exactly, 7.18.4, not as a range. A
 * range let a regenerated lock move the router on unseen, and 7.18.3 changed
 * what `navigate()` does with a target off the site (navigationTargets454).
 * react-router-dom names its react-router exactly, so the pair moves together.
 *
 * `--omit=dev` audits `dependencies` and what they pull in. Vite bundles
 * whatever src imports, wherever package.json lists it, so a browser package
 * moved to `devDependencies` would drop out of the audit unseen. Every package
 * the shipped code imports has to be a dependency; build tools (Vite,
 * Tailwind) are dev dependencies, and their dev-server advisories do not stop
 * a deploy.
 *
 * Then the router's backslash fix (GHSA-wrjc-x8rr-h8h6, in 7.18.0). To a
 * browser `/\evil.example` is `//evil.example`, another host. Before the fix
 * `navigate()` kept the backslash, `pushState` refused the other origin, and
 * the router fell back to `location.assign`: off the site. 7.18.0 to 7.18.2
 * collapsed the slashes into a path here; from 7.18.3 `navigate()` and
 * `<Navigate>` read the target as the browser would and refuse it (#454).
 * `<Link>` instead treats such a `to` as an external URL and leaves the site
 * on a click, so a `to` built from input still goes through `URL` first
 * (`resolveDestination` in authRoutes); every `to` in src today is a literal
 * or starts with one.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { act, render } from '@testing-library/react'
import { useEffect, useRef } from 'react'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'

const ROOT = path.resolve(__dirname, '../..')
const LOCK = path.join(ROOT, 'package-lock.json')

type LockEntry = { version?: string; dependencies?: Record<string, string> }
type Lock = { packages: Record<string, LockEntry> }

const readLock = () => JSON.parse(readFileSync(LOCK, 'utf8')) as Lock

/** Every copy of `name` the lock installs, nested ones included. */
function lockedVersions(name: string): string[] {
  const lock = readLock()
  return Object.entries(lock.packages)
    .filter(([key]) => key === `node_modules/${name}` || key.endsWith(`/node_modules/${name}`))
    .map(([, entry]) => entry.version ?? '')
}

/** `version` is at least `floor`, compared as major.minor.patch. */
function atLeast(version: string, floor: string) {
  const parts = (value: string) => value.split('-')[0].split('.').map(Number)
  const [have, want] = [parts(version), parts(floor)]
  for (let index = 0; index < 3; index += 1) {
    if (have[index] !== want[index]) return have[index] > want[index]
  }
  return true
}

describe('#419: the lock carries the versions the audit cleared', () => {
  it('compares versions numerically, not as text', () => {
    // Negative control: as strings, '1.9.0' sorts after '1.20.0'.
    expect(atLeast('1.9.0', '1.20.0')).toBe(false)
    expect(atLeast('1.20.0', '1.20.0')).toBe(true)
    expect(atLeast('7.18.10', '7.18.2')).toBe(true)
  })

  it('installs axios 1.20.0 or later, once', () => {
    const versions = lockedVersions('axios')
    expect(versions).toHaveLength(1)
    expect(versions.filter((version) => !atLeast(version, '1.20.0'))).toEqual([])
  })

  it('installs react-router and react-router-dom on one version, 7.18.2 or later', () => {
    const router = lockedVersions('react-router')
    const dom = lockedVersions('react-router-dom')
    expect(router).toHaveLength(1)
    expect(dom).toHaveLength(1)
    expect(dom).toEqual(router)
    expect(atLeast(router[0], '7.18.2')).toBe(true)
  })
})

/** A version written down exactly: no range, no tag, nothing a new lock could resolve differently. */
const isExact = (spec: string) => /^\d+\.\d+\.\d+$/.test(spec)

describe('#454: the router is written down exactly, not only in the lock', () => {
  const manifest = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as {
    dependencies: Record<string, string>
  }

  it('tells an exact version from a range', () => {
    // Negative control: each of these lets a regenerated lock take another release.
    for (const range of ['^7.18.4', '~7.18.4', '>=7.18.4', '7.18.x', '7.18', '7.18.4 - 7.18.9', '7.18.4 || 7.18.5', '*', 'latest', '']) {
      expect(isExact(range), range).toBe(false)
    }
    expect(isExact('7.18.4')).toBe(true)
  })

  it('pins react-router-dom, and react-router with it, to the version the lock installs', () => {
    const spec = manifest.dependencies['react-router-dom']
    expect(isExact(spec), `react-router-dom is "${spec}" in package.json`).toBe(true)
    expect(atLeast(spec, '7.18.4')).toBe(true)
    const lock = readLock()
    expect(lock.packages[''].dependencies?.['react-router-dom']).toBe(spec)
    expect(lockedVersions('react-router-dom')).toEqual([spec])
    // react-router-dom names its react-router exactly, so the pair cannot part.
    expect(lock.packages['node_modules/react-router-dom'].dependencies?.['react-router']).toBe(spec)
    expect(lockedVersions('react-router')).toEqual([spec])
  })
})

// The build refuses anything from these (DEV_ONLY_DIRS in vite.config.ts).
const DEV_ONLY_DIRS = ['src/dev/', 'src/mocks/']

/** The package a bare specifier names, or null for a path, an alias or a builtin. */
function packageOf(specifier: string): string | null {
  if (/^(\.|\/|@\/|node:|virtual:)/.test(specifier)) return null
  const [first, second] = specifier.split('?')[0].split('/')
  return first.startsWith('@') ? `${first}/${second}` : first
}

/*
 * The one import() whose address is read at run time: after a failed load,
 * MathRenderer asks for KaTeX's file again under a new address (#447). It is
 * our own file, the one its `import('./katexLoader')` names: no package.
 */
const RUNTIME_IMPORT_IN = 'src/components/ui/MathRenderer.tsx'

/** The packages a module's code imports: type-only imports left out, they are erased. */
function packagesImportedBy(file: string, source: string): string[] {
  const kind = file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const syntax = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind)
  const found: string[] = []
  const add = (specifier: string) => {
    const name = packageOf(specifier)
    if (name) found.push(name)
  }
  let runtimeImports = 0
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && !node.importClause?.isTypeOnly) {
      add(node.moduleSpecifier.text)
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) && !node.isTypeOnly) {
      add(node.moduleSpecifier.text)
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const [argument] = node.arguments
      if (argument && ts.isStringLiteralLike(argument)) add(argument.text)
      else if (file !== RUNTIME_IMPORT_IN || (runtimeImports += 1) > 1) {
        throw new Error(`${file} has an import() this check cannot read`)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(syntax)
  return found
}

function shippedSources(dir = path.join(ROOT, 'src')): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    const relative = path.relative(ROOT, file).split(path.sep).join('/')
    if (entry.isDirectory()) return DEV_ONLY_DIRS.includes(`${relative}/`) ? [] : shippedSources(file)
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [relative] : []
  })
}

/** Packages the shipped code imports that `dependencies` does not list, with where. */
function importsOutsideDependencies(sources: { file: string; source: string }[], dependencies: string[]) {
  return sources.flatMap(({ file, source }) =>
    [...new Set(packagesImportedBy(file, source))]
      .filter((name) => !dependencies.includes(name))
      .map((name) => `${name} in ${file}`),
  )
}

describe('#419: the production audit counts every package the browser runs', () => {
  const manifest = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as {
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
  }
  const dependencies = Object.keys(manifest.dependencies)

  it('finds an import of a dev dependency, and leaves type-only imports out', () => {
    // Negative control: msw is a dev dependency.
    const sources = [
      { file: 'src/a.ts', source: "import { http } from 'msw'\nimport type { Plugin } from 'vite'\nexport type { UserConfig } from 'vite'" },
      { file: 'src/b.tsx', source: "export { setupWorker } from 'msw/browser'\nconst k = () => import('katex')" },
    ]
    expect(importsOutsideDependencies(sources, dependencies)).toEqual(['msw in src/a.ts', 'msw in src/b.tsx'])
  })

  it('lists every package src imports in dependencies', () => {
    const files = shippedSources()
    expect(files.length).toBeGreaterThan(100)
    const sources = files.map((file) => ({ file, source: readFileSync(path.join(ROOT, file), 'utf8') }))
    expect(importsOutsideDependencies(sources, dependencies)).toEqual([])
  })

  it('keeps the build tools out of dependencies', () => {
    const buildTools = ['vite', '@vitejs/plugin-react', '@tailwindcss/vite', 'tailwindcss']
    expect(buildTools.filter((name) => name in manifest.dependencies)).toEqual([])
    expect(buildTools.filter((name) => !(name in manifest.devDependencies))).toEqual([])
  })
})

function NavigateOnMount({ to, onRefusal }: { to: string; onRefusal: (error: unknown) => void }) {
  const navigate = useNavigate()
  // Once: outside a data router `navigate` is a new function after each move.
  const sent = useRef(false)
  useEffect(() => {
    if (sent.current) return
    sent.current = true
    try {
      navigate(to)
    } catch (error) {
      onRefusal(error)
    }
  }, [navigate, to, onRefusal])
  return null
}

describe('#419: navigate() never hands the browser a backslash path', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.history.replaceState(null, '', '/')
  })

  // A slash and a backslash, a backslash and a slash, two backslashes: each
  // reads as `//evil.example` to the browser.
  it.each(['/\\evil.example/path', '\\/evil.example/path', '\\\\evil.example/path'])(
    'refuses %s and stays here',
    async (to) => {
      window.history.replaceState(null, '', '/start')
      const pushState = vi.spyOn(window.history, 'pushState')
      let refusal: unknown = null

      await act(async () => {
        render(
          <BrowserRouter>
            <NavigateOnMount to={to} onRefusal={(error) => (refusal = error)} />
          </BrowserRouter>,
        )
      })

      // 7.18.2 handed the browser `<origin>/evil.example/path`; 7.18.3 and
      // later refuse the target outright (#454). jsdom cannot leave the page,
      // so the address alone would not show an attempt to: read what the
      // router asked the browser for, which is nothing.
      expect(refusal).toEqual(new Error('External navigation is not allowed'))
      expect(pushState).not.toHaveBeenCalled()
      expect(window.location.pathname).toBe('/start')
    },
  )
})
