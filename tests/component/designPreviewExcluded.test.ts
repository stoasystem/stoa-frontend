/*
 * The design preview (#115) answers every API request from demo data and signs
 * a demo student in without a password. It is safe only because it never
 * ships: it lives under src/dev/, which is no build input, and nothing the
 * application loads imports it. Both halves are checked here - the import
 * graph of src/main.tsx, and a fresh production build - so that one import of
 * the preview from the application turns this red.
 *
 * A component test rather than a release one: `test:release` is a reviewed
 * script that scripts/verify-release.mjs pins word for word.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import ts from 'typescript'
import { afterAll, describe, expect, it } from 'vitest'

const ROOT = path.resolve(__dirname, '../..')
const SRC = path.join(ROOT, 'src')
const ENTRY = path.join(SRC, 'main.tsx')

// Never reachable from the application: the dev pages (the preview, its
// interception and its demo data among them) and the vitest-only MSW handlers.
const FORBIDDEN_DIRS = ['src/dev/', 'src/mocks/']

// Strings only the preview's code carries (src/dev/preview/interception.ts).
const FORBIDDEN_IN_BUNDLES = ['stoa.design-preview.v1', 'api.design-preview.invalid', '__stoaPreview']

const EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '/index.ts', '/index.tsx', '/index.js']

function resolveSpecifier(specifier: string, fromFile: string): string | null {
  let base: string
  if (specifier.startsWith('@/')) base = path.join(SRC, specifier.slice(2))
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(fromFile), specifier)
  else return null // a package
  for (const extension of EXTENSIONS) {
    const candidate = `${base}${extension}`
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  throw new Error(`${path.relative(ROOT, fromFile)} imports ${specifier}, which does not resolve`)
}

/** Every module specifier a file names: static imports, re-exports, and import() with a literal. */
function specifiersOf(file: string): string[] {
  const source = readFileSync(file, 'utf8')
  const kind = file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const syntax = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind)
  const found: string[] = []
  const visit = (node: ts.Node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      found.push(node.moduleSpecifier.text)
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const [argument] = node.arguments
      if (argument && ts.isStringLiteralLike(argument)) found.push(argument.text)
      else throw new Error(`${path.relative(ROOT, file)} has an import() this walk cannot follow`)
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
    for (const specifier of specifiersOf(file)) {
      const resolved = resolveSpecifier(specifier, file)
      if (resolved && !seen.has(resolved)) pending.push(resolved)
    }
  }
  return [...seen].map((file) => path.relative(ROOT, file).split(path.sep).join('/'))
}

describe('the design preview stays out of the application', () => {
  it('has nothing under src/dev or src/mocks in the import graph of src/main.tsx', () => {
    const graph = importGraph(ENTRY)
    expect(graph.filter((file) => FORBIDDEN_DIRS.some((dir) => file.startsWith(dir)))).toEqual([])
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

      const carrying = texts.flatMap(({ name, text }) =>
        FORBIDDEN_IN_BUNDLES.filter((marker) => text.includes(marker)).map((marker) => `${name}: ${marker}`),
      )
      expect(carrying).toEqual([])
    }, 120_000)
  })
})
