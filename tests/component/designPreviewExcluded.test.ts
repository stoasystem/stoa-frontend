/*
 * The design preview (#115) answers every API request from demo data and signs
 * a demo student in without a password. It is safe only because it never
 * ships: it lives under src/dev/, which is no build input, and nothing the
 * application loads imports it. Both halves are checked here - the import
 * graph of src/main.tsx, and a fresh production build - so that one import of
 * the preview from the application turns this red. The walk follows every way
 * Vite takes a file in (`@/`, relative and root-absolute `/src/...` imports,
 * `import.meta.glob`, `new URL(…, import.meta.url)`) and throws on anything it
 * cannot place; behind it, vite.config.ts's `devOnlyCodeStaysOut` fails the
 * production build this test runs if any module or asset comes from src/dev/
 * or src/mocks/. The build is also searched
 * for the demo sky (#131): its ids, its knowledge point and its demo-only
 * words must not ship, wherever they would come from.
 *
 * A component test rather than a release one: `test:release` is a reviewed
 * script that scripts/verify-release.mjs pins word for word.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, globSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import ts from 'typescript'
import { afterAll, describe, expect, it } from 'vitest'
import { DEMO_BRIDGE_STAR, DEMO_KNOWLEDGE_POINT } from '@/dev/demo/sky/demoSky'
import { DEMO_SKY_STRINGS } from '@/dev/demo/sky/strings'

const ROOT = path.resolve(__dirname, '../..')
const SRC = path.join(ROOT, 'src')
const ENTRY = path.join(SRC, 'main.tsx')

// Never reachable from the application: the dev pages (the preview, its
// interception and its demo data among them) and the vitest-only MSW handlers.
const FORBIDDEN_DIRS = ['src/dev/', 'src/mocks/']

// Strings only the preview's code carries (src/dev/preview/interception.ts).
const FORBIDDEN_IN_BUNDLES = ['stoa.design-preview.v1', 'api.design-preview.invalid', '__stoaPreview']

// The demo sky (#131): it reaches the map only through the star map source the
// preview and the bench provide, never from the application. Its ids, the demo
// knowledge point's name, and its demo-only words in every language (the Demo
// notice, the placeholder star's note, the long nebula names).
const DEMO_SKY_IN_BUNDLES = [
  'demo-sine-cosine',
  DEMO_BRIDGE_STAR,
  ...Object.values(DEMO_KNOWLEDGE_POINT.name),
  // A placeholder star's skill, only in demo-sky.json.
  'Ordering integers',
  ...Object.values(DEMO_SKY_STRINGS).flatMap(({ notice, emptyStar, longNebula }) => [notice, emptyStar, longNebula.replace(' {{index}}', '')]),
]

const EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '/index.ts', '/index.tsx', '/index.js']

// A bare package name (`react`, `@tanstack/react-query/x`).
const BARE_PACKAGE = /^(@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*(\/.*)?$/i

/** Where a specifier points before extensions are tried: `@/`, `/` (the project root, as Vite reads it) or relative. */
function basePath(specifier: string, fromFile: string): string | null {
  if (specifier.startsWith('@/')) return path.join(SRC, specifier.slice(2))
  if (specifier.startsWith('/')) return path.join(ROOT, specifier.slice(1))
  if (specifier.startsWith('.')) return path.resolve(path.dirname(fromFile), specifier)
  return null
}

/**
 * The file a specifier names, or null for an installed package or a node
 * builtin. Anything else - an unknown alias, a `virtual:` id, a URL, a path
 * that does not exist - throws: a specifier this walk cannot place could be
 * hiding anything.
 */
function resolveSpecifier(rawSpecifier: string, fromFile: string): string | null {
  const specifier = rawSpecifier.split('?')[0] // `?raw`, `?url`, `?worker` name the same file
  const base = basePath(specifier, fromFile)
  if (base === null) {
    if (specifier.startsWith('node:')) return null
    const name = BARE_PACKAGE.test(specifier) ? specifier.split('/').slice(0, specifier.startsWith('@') ? 2 : 1).join('/') : null
    if (name && existsSync(path.join(ROOT, 'node_modules', name))) return null
    throw new Error(`${path.relative(ROOT, fromFile)} imports ${rawSpecifier}, which is neither a file nor an installed package`)
  }
  for (const extension of EXTENSIONS) {
    const candidate = `${base}${extension}`
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  throw new Error(`${path.relative(ROOT, fromFile)} imports ${rawSpecifier}, which does not resolve`)
}

/** The files an `import.meta.glob` pattern matches, read the way Vite reads it. */
function globFiles(rawPattern: string, fromFile: string): string[] {
  const pattern = rawPattern.split('?')[0]
  if (pattern.startsWith('!')) return [] // a negation only narrows; leaving it out over-approximates
  const base = basePath(pattern, fromFile)
  if (base === null) throw new Error(`${path.relative(ROOT, fromFile)} globs ${rawPattern}, which this walk cannot place`)
  const relative = path.relative(ROOT, base).split(path.sep).join('/')
  return globSync(relative, { cwd: ROOT })
    .map((match) => path.join(ROOT, match))
    .filter((match) => statSync(match).isFile())
}

const isImportMeta = (node: ts.Node) =>
  ts.isMetaProperty(node) && node.keywordToken === ts.SyntaxKind.ImportKeyword && node.name.text === 'meta'

/** The patterns of an `import.meta.glob(...)` call, or null for any other call. */
function globPatterns(node: ts.CallExpression, where: string): string[] | null {
  const callee = node.expression
  if (!ts.isPropertyAccessExpression(callee) || !isImportMeta(callee.expression) || !callee.name.text.startsWith('glob')) return null
  const [argument] = node.arguments
  const elements = argument && ts.isArrayLiteralExpression(argument) ? [...argument.elements] : [argument]
  const patterns = elements.map((element) => (element && ts.isStringLiteralLike(element) ? element.text : null))
  if (patterns.includes(null)) throw new Error(`${where} has an import.meta.${callee.name.text}() this walk cannot follow`)
  return patterns as string[]
}

/** The target of a `new URL(target, import.meta.url)`, or null for any other `new`. */
function urlAsset(node: ts.NewExpression, where: string): string | null {
  const [target, base] = node.arguments ?? []
  if (!ts.isIdentifier(node.expression) || node.expression.text !== 'URL' || !base) return null
  if (!ts.isPropertyAccessExpression(base) || !isImportMeta(base.expression) || base.name.text !== 'url') return null
  if (target && ts.isStringLiteralLike(target)) return target.text
  throw new Error(`${where} has a new URL(…, import.meta.url) this walk cannot follow`)
}

/**
 * Every file a module brings into the build: static imports, re-exports,
 * import() with a literal, import.meta.glob matches and new URL(…,
 * import.meta.url) assets. Any of those it cannot read statically throws.
 */
function dependenciesOf(file: string): string[] {
  const source = readFileSync(file, 'utf8')
  const kind = file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const syntax = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind)
  const where = path.relative(ROOT, file)
  const found: string[] = []
  const add = (specifier: string) => {
    const resolved = resolveSpecifier(specifier, file)
    if (resolved) found.push(resolved)
  }
  const visit = (node: ts.Node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      add(node.moduleSpecifier.text)
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const [argument] = node.arguments
      if (argument && ts.isStringLiteralLike(argument)) add(argument.text)
      else throw new Error(`${where} has an import() this walk cannot follow`)
    }
    if (ts.isCallExpression(node)) {
      for (const pattern of globPatterns(node, where) ?? []) found.push(...globFiles(pattern, file))
    }
    if (ts.isNewExpression(node)) {
      const asset = urlAsset(node, where)
      if (asset !== null) add(asset)
    }
    ts.forEachChild(node, visit)
  }
  visit(syntax)
  return found
}

function importGraph(entry: string): string[] {
  const seen = new Set<string>()
  const pending = [entry]
  while (pending.length > 0) {
    const file = pending.pop() as string
    if (seen.has(file)) continue
    seen.add(file)
    if (!/\.(tsx?|jsx?|mjs)$/.test(file)) continue
    for (const dependency of dependenciesOf(file)) {
      if (!seen.has(dependency)) pending.push(dependency)
    }
  }
  return [...seen].map((file) => path.relative(ROOT, file).split(path.sep).join('/'))
}

describe('the design preview stays out of the application', () => {
  // Reads and parses every module reachable from src/main.tsx and expands its globs: a
  // second or two alone, past the default 5 s beside the full suite (#133).
  it('has nothing under src/dev or src/mocks in the import graph of src/main.tsx', { timeout: 30_000 }, () => {
    const graph = importGraph(ENTRY)
    expect(graph.filter((file) => FORBIDDEN_DIRS.some((dir) => file.startsWith(dir)))).toEqual([])
  })

  it('follows every way Vite takes a file in, and refuses what it cannot place (positive control)', () => {
    const scratch = mkdtempSync(path.join(os.tmpdir(), 'stoa-preview-walk-'))
    const write = (name: string, text: string) => {
      const file = path.join(scratch, name)
      writeFileSync(file, text)
      return file
    }
    try {
      const reached = (text: string) =>
        importGraph(write('entry.ts', text)).filter((file) => FORBIDDEN_DIRS.some((dir) => file.startsWith(dir)))
      // The audit's two poisons (#126 F1), plus the other doors.
      expect(reached("import { PreviewChrome } from '/src/dev/preview/PreviewChrome'\nvoid PreviewChrome")).toContain('src/dev/preview/PreviewChrome.tsx')
      expect(reached("import.meta.glob('/src/dev/preview/PreviewChrome.tsx', { eager: true })")).toContain('src/dev/preview/PreviewChrome.tsx')
      expect(reached("import.meta.glob(['/src/app/*.tsx', '/src/mocks/**/*.ts'])").some((file) => file.startsWith('src/mocks/'))).toBe(true)
      expect(reached("import '/src/dev/preview/PreviewChrome.tsx?raw'")).toContain('src/dev/preview/PreviewChrome.tsx')
      expect(reached("new URL('/src/dev/preview.html', import.meta.url)")).toContain('src/dev/preview.html')
      // What it cannot place is an error, not a pass.
      expect(() => importGraph(write('alias.ts', "import 'dev/preview/main'"))).toThrow(/neither a file nor an installed package/)
      expect(() => importGraph(write('virtual.ts', "import 'virtual:preview'"))).toThrow(/neither a file nor an installed package/)
      expect(() => importGraph(write('missing.ts', "import '/src/dev/nothing-here'"))).toThrow(/does not resolve/)
      expect(() => importGraph(write('glob.ts', 'const at = "/src/dev/*"\nimport.meta.glob(at)'))).toThrow(/cannot follow/)
      expect(() => importGraph(write('url.ts', 'const at = "x"\nnew URL(at, import.meta.url)'))).toThrow(/cannot follow/)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  })

  it('names the demo sky by what it really carries (the markers cannot go stale)', () => {
    expect(DEMO_KNOWLEDGE_POINT.unitId).toBe('demo-sine-cosine')
    const sky = readFileSync(path.join(SRC, 'dev/demo/sky/demo-sky.json'), 'utf8')
    for (const marker of ['demo-sine-cosine', DEMO_BRIDGE_STAR, 'Ordering integers', DEMO_KNOWLEDGE_POINT.name.en]) expect(sky).toContain(marker)
    expect(DEMO_SKY_IN_BUNDLES).toContain('Demo · Sample content and progress')
    expect(DEMO_SKY_IN_BUNDLES).toContain('Placeholder star · demo content, no chapter.')
  })

  it('walks the whole application (negative control)', () => {
    // An empty or truncated walk would pass the test above trivially.
    const graph = importGraph(ENTRY)
    for (const file of ['src/App.tsx', 'src/app/router/AppRoutes.tsx', 'src/layouts/AppLayout.tsx', 'src/services/api/httpClient.ts']) {
      expect(graph, `${file} is missing from the walk`).toContain(file)
    }
    expect(graph.length).toBeGreaterThan(200)
  })

  describe('a production build', () => {
    const outDir = mkdtempSync(path.join(os.tmpdir(), 'stoa-preview-excluded-'))
    afterAll(() => rmSync(outDir, { recursive: true, force: true }))

    it('carries no preview page and no preview code', () => {
      execFileSync(process.execPath, ['scripts/vite.mjs', 'build', '--outDir', outDir, '--emptyOutDir', '--logLevel', 'error'], {
        cwd: ROOT,
        stdio: 'pipe',
      })

      const files = readdirSync(outDir, { recursive: true }).map((name) => String(name).split(path.sep).join('/'))
      expect(files.filter((name) => name.endsWith('.html'))).toEqual(['index.html'])
      expect(files.filter((name) => name.startsWith('src/'))).toEqual([])

      const bundles = files.filter((name) => name.startsWith('assets/') && name.endsWith('.js'))
      expect(bundles.length, 'too few bundles built, so this proves nothing').toBeGreaterThanOrEqual(3)
      const texts = bundles.map((name) => ({ name, text: readFileSync(path.join(outDir, name), 'utf8') }))
      // Negative control: the verified startup path is there to be found.
      expect(texts.some(({ text }) => text.includes('stoa.web.runtime-config.v1'))).toBe(true)

      // Negative control for the demo sky: the star map's own words are there to be found.
      expect(texts.some(({ text }) => text.includes('Your star map is on its way'))).toBe(true)

      const carrying = texts.flatMap(({ name, text }) =>
        [...FORBIDDEN_IN_BUNDLES, ...DEMO_SKY_IN_BUNDLES].filter((marker) => text.includes(marker)).map((marker) => `${name}: ${marker}`),
      )
      expect(carrying).toEqual([])
    }, 120_000)
  })
})
