/*
 * Each role route names the copy its page reads that loads on demand (#456).
 *
 * The administrators' copy loads with the first screen that asks for it
 * (#414). While a tab's account is read the router loads it with the page's
 * code (preloadWhileAccountLoads.ts), as the route's `copy` says. A page that
 * reads it unannounced waits for it behind the page skeleton after every
 * reload; one that announces it without reading it downloads it for nothing.
 *
 * What a page reads is found in the syntax of its module and of the modules
 * it imports statically (comments are not code): a `useTranslation` naming
 * the namespace, a key under `namespace:`, or an `ns` option or attribute. A
 * `useTranslation` whose namespace is not written out fails the test, since
 * what it reads cannot be told here.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { pageRoutes } from '@/app/router/routeManifest'
import { namespaces, startupNamespaces } from '@/i18n/namespaces'

const SRC = path.resolve(__dirname, '../../src')
const MANIFEST = path.join(SRC, 'app/router/routeManifest.ts')
const ON_DEMAND: readonly string[] = namespaces.filter(
  (namespace) => !(startupNamespaces as readonly string[]).includes(namespace),
)

function parse(file: string, text = readFileSync(file, 'utf8')) {
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
}

/** What one module imports statically (not type-only) and which namespaces it reads. */
function scan(file: string, text?: string) {
  const source = parse(file, text)
  const imports: string[] = []
  const reads = new Set<string>()
  const visit = (node: ts.Node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const typeOnly = ts.isImportDeclaration(node) ? node.importClause?.isTypeOnly : node.isTypeOnly
      if (!typeOnly) imports.push(node.moduleSpecifier.text)
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'useTranslation') {
      const [first] = node.arguments
      for (const name of first && ts.isArrayLiteralExpression(first) ? first.elements : first ? [first] : []) {
        if (!ts.isStringLiteralLike(name)) {
          throw new Error(`${path.relative(SRC, file)}: a namespace this test cannot read: ${first.getText(source)}`)
        }
        reads.add(name.text)
      }
    }
    // `t('admin:…')`, and `{ ns: 'admin' }` or `ns="admin"`.
    if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node)) {
      const key = /^(\w+):[A-Za-z]/.exec(node.text)
      if (key) reads.add(key[1])
    }
    if ((ts.isPropertyAssignment(node) || ts.isJsxAttribute(node)) && node.name.getText(source) === 'ns') {
      const value = ts.isPropertyAssignment(node) ? node.initializer : node.initializer
      if (value && ts.isStringLiteralLike(value)) reads.add(value.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return { imports, reads }
}

/** The TypeScript module an import names, or null for a package, a stylesheet or JSON. */
function resolveModule(from: string, specifier: string): string | null {
  if (!specifier.startsWith('@/') && !specifier.startsWith('.')) return null
  const base = specifier.startsWith('@/') ? path.join(SRC, specifier.slice(2)) : path.resolve(path.dirname(from), specifier)
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]
  return candidates.find((candidate) => /\.tsx?$/.test(candidate) && existsSync(candidate)) ?? null
}

// Each page's module, from `lazyPage('Name', () => import('@/...'))` in the manifest.
const pageModules = new Map<string, string>()
parse(MANIFEST).forEachChild(function find(node: ts.Node): void {
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'lazyPage') {
    const [name, load] = node.arguments
    if (name && ts.isStringLiteral(name) && load && ts.isArrowFunction(load) && ts.isCallExpression(load.body)) {
      const [specifier] = load.body.arguments
      const module = specifier && ts.isStringLiteral(specifier) ? resolveModule(MANIFEST, specifier.text) : null
      if (module) pageModules.set(name.text, module)
    }
  }
  node.forEachChild(find)
})

/** A module and every module it imports statically, transitively. */
function staticClosure(entry: string): Set<string> {
  const seen = new Set<string>()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.pop() as string
    if (seen.has(file)) continue
    seen.add(file)
    for (const specifier of scan(file).imports) {
      const imported = resolveModule(file, specifier)
      if (imported) queue.push(imported)
    }
  }
  return seen
}

/** The on-demand namespaces a page reads, in its module or anything it imports statically. */
function onDemandCopyOf(pageName: string): string[] {
  const module = pageModules.get(pageName)
  if (!module) throw new Error(`no module for ${pageName} in the route manifest`)
  const reads = new Set([...staticClosure(module)].flatMap((file) => [...scan(file).reads]))
  return ON_DEMAND.filter((namespace) => reads.has(namespace))
}

describe("the routes' on-demand copy", () => {
  it('is read from the syntax, not from comments or the shape of an import', () => {
    expect([...scan('x.tsx', "// never calls useTranslation('admin')\nconst a = 1").reads]).toEqual([])
    expect(
      scan('x.tsx', "import {\n  // the administrators' panel\n  Panel,\n} from '@/components/Panel'").imports,
    ).toEqual(['@/components/Panel'])
    expect([...scan('x.tsx', "t('admin:moderation.title'); t('x', { ns: 'admin' })").reads]).toEqual(['admin'])
    expect(() => scan('x.tsx', "const NS = 'admin'\nuseTranslation(NS)")).toThrow(/cannot read/)
  })

  it('is found where it is read, also through an import', () => {
    expect(onDemandCopyOf('AdminAccountsPage')).toEqual(['admin'])
    expect(onDemandCopyOf('TeacherDashboardPage')).toEqual([])
    // The learning profile reads it in its header too, an imported component.
    const profile = staticClosure(pageModules.get('StudentLearningProfilePage') as string)
    expect([...profile].map((file) => path.relative(SRC, file))).toContain('components/learning/LearningProfileHeader.tsx')
  })

  it.each(pageRoutes.filter((route) => route.access.kind === 'roles').map((route) => [route.path, route] as const))(
    '%s names what its page reads',
    (_, route) => {
      expect([...(route.copy ?? [])]).toEqual(onDemandCopyOf(route.page.pageName))
    },
  )
})
