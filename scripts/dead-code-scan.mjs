#!/usr/bin/env node
/**
 * List the front-end code nothing uses, by two methods that do not share a
 * failure mode, and refuse to answer when either method cannot see.
 *
 * Dead-code verdicts in this project were drawn from a shell `grep` that
 * returned nothing for a file it had silently skipped: a raw NUL byte in
 * `src/pages/chat/ChatPage.tsx` made the file binary to file(1), the agent
 * shell's `grep` (a ugrep wrapper run with -I) skipped it with exit 0, and BSD
 * grep printed "Binary file matches" instead of its lines. Its imports were
 * invisible, so live modules looked dead (fixed in 8208d9b). This script calls
 * no shell tool to read or search source. It reads every tracked file with
 * `fs`, where a stray byte changes nothing, and judges each module twice:
 *
 *   graph  - parse every JS/TS file with the TypeScript compiler, resolve each
 *            import / re-export / import() / vi.mock / import.meta.glob /
 *            new URL(..., import.meta.url) / path string to a tracked file,
 *            and walk the graph from the page `index.html` loads.
 *   tokens - count the files outside this one in which the module's name
 *            appears as a whole word, the way `command grep -rlw` does.
 *
 * Something is reported dead only when both methods say so. Where they
 * disagree it is listed as disputed, with the evidence, for a person to judge.
 *
 * Every run also checks itself, and exits 1 if a check fails:
 *   - no tracked text file holds a byte file(1) would call binary;
 *   - negative control: `src/components/chat/ChatInput.tsx` (imported by
 *     ChatPage.tsx) must not be judged dead;
 *   - positive control: a probe module added in memory, imported by nothing
 *     and named nowhere, must be judged dead by both methods;
 *   - `*.test-d.ts` type-contract files (checked by `tsc -b`, imported by
 *     nobody on purpose) must never be reported.
 * `--self-test` runs the same scan over a small generated repository whose
 * answers are known, including a file with a raw NUL byte in it.
 *
 * What it cannot see: an import() whose argument is not a literal (listed as
 * a blind spot when found), a module named only in another repository (the
 * backend digests tests/e2e/billing-paid-access.spec.ts), a directory that is
 * read with readdirSync, and a member reached through a computed key. A
 * verdict here is one of the independent paths the deletion rule in
 * stoa-docs asks for, not the only one.
 *
 * Usage:
 *   node scripts/dead-code-scan.mjs                 full report
 *   node scripts/dead-code-scan.mjs --json          the same, as JSON
 *   node scripts/dead-code-scan.mjs --check <path>... [--check-file <list>]
 *                                                   one verdict per candidate
 *   node scripts/dead-code-scan.mjs --self-test     prove the scanner on a fixture
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const CODE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']
const RESOLVE_EXTENSIONS = [...CODE_EXTENSIONS, '.d.ts', '.json', '.css']
// Files whose words can keep a module alive. Prose (docs, .planning, *.md) cannot.
const REFERENCE_EXTENSIONS = new Set([...CODE_EXTENSIONS, '.json', '.css', '.html', '.yml', '.yaml', '.py'])
// Files that must be text; a byte file(1) calls binary in one of these is the
// fault that hid ChatPage.tsx from grep.
const TEXT_EXTENSIONS = new Set([...REFERENCE_EXTENSIONS, '.md', '.txt', '.svg', '.sh', '.toml', '.env', '.example', '.gitignore'])
const IGNORED_PREFIXES = ['node_modules/', 'dist/', '.git/', '.claude/']
// Checked for binary bytes, but a mention in them keeps nothing alive.
const PROSE_PREFIXES = ['.planning/', 'docs/']
const DEFAULT_OPTIONS = {
  candidatePrefixes: ['src/'],
  testPrefixes: ['tests/'],
  alias: { '@/': 'src/' },
  exempt: [/\.test-d\.ts$/, /\.d\.ts$/],
  negativeControls: [{ file: 'src/components/chat/ChatInput.tsx', importer: 'src/pages/chat/ChatPage.tsx' }],
  exemptionControls: ['src/types/billing.contract.test-d.ts'],
  probe: true,
  // This file names the controls above; it must not count as their importer.
  notReferences: ['scripts/dead-code-scan.mjs'],
}

// Bytes outside file(1)'s text table: NUL, the C0 controls other than
// BEL..CR and ESC, and DEL. Bytes >= 0x80 are left to the UTF-8 check.
function firstBinaryByte(buffer) {
  for (let i = 0; i < buffer.length; i += 1) {
    const b = buffer[i]
    if (b <= 0x06 || (b >= 0x0e && b <= 0x1a) || (b >= 0x1c && b <= 0x1f) || b === 0x7f) return i
  }
  return -1
}

function extensionOf(file) {
  const base = path.posix.basename(file)
  if (base.endsWith('.d.ts')) return '.d.ts'
  const dot = base.lastIndexOf('.')
  return dot <= 0 ? base : base.slice(dot)
}

function isCode(file) {
  return CODE_EXTENSIONS.includes(path.posix.extname(file))
}

function lineOf(text, index) {
  let line = 1
  for (let i = 0; i < index && i < text.length; i += 1) if (text.charCodeAt(i) === 10) line += 1
  return line
}

/** Tracked files plus new, not-ignored ones; `git` lists them, nothing searches them. */
function listFiles(root) {
  let raw
  try {
    raw = execFileSync('git', ['-C', root, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
      encoding: 'buffer',
      maxBuffer: 64 * 1024 * 1024,
    })
  } catch {
    raw = null
  }
  const names = raw
    ? raw.toString('utf8').split('\0').filter(Boolean)
    : walk(root, '')
  return [...new Set(names)]
    .filter((file) => !IGNORED_PREFIXES.some((prefix) => file.startsWith(prefix)))
    .filter((file) => existsSync(path.join(root, file)) && statSync(path.join(root, file)).isFile())
    .sort()
}

function walk(root, relative) {
  const out = []
  for (const entry of readdirSync(path.join(root, relative), { withFileTypes: true })) {
    const child = relative ? `${relative}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      if (!IGNORED_PREFIXES.includes(`${child}/`)) out.push(...walk(root, child))
    } else if (entry.isFile()) out.push(child)
  }
  return out
}

// ---------------------------------------------------------------- parsing --

function scriptKindOf(file) {
  const ext = path.posix.extname(file)
  if (ext === '.tsx') return ts.ScriptKind.TSX
  if (ext === '.jsx') return ts.ScriptKind.JSX
  if (ext === '.js' || ext === '.mjs' || ext === '.cjs') return ts.ScriptKind.JS
  return ts.ScriptKind.TS
}

function literalText(node) {
  if (node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))) return node.text
  return null
}

function hasModifier(node, kind) {
  return Boolean(ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((m) => m.kind === kind))
}

function bindingNames(name, out = []) {
  if (ts.isIdentifier(name)) out.push(name)
  else for (const element of name.elements) if (!ts.isOmittedExpression(element)) bindingNames(element.name, out)
  return out
}

function unwrapExpression(node) {
  let current = node
  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isParenthesizedExpression(current) ||
      ts.isTypeAssertionExpression(current))
  ) current = current.expression
  return current
}

/**
 * Everything one file says about other files and about its own exports.
 * edges:   { spec, kind, line, names: Map<imported, local> | null (= all), namespace, reexports }
 * exports: Map<exportedName, { line, local, declNodes: Node[], members }>
 */
function parseCode(file, text) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, scriptKindOf(file))
  const edges = []
  const exportsMap = new Map()
  const blindSpots = []
  const identifiers = []
  const strings = []
  const line = (node) => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1

  const addExport = (name, node, local, declNodes, members = null) => {
    if (!exportsMap.has(name)) exportsMap.set(name, { line: line(node), local, declNodes: [], members })
    exportsMap.get(name).declNodes.push(...declNodes)
  }

  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) {
      const spec = literalText(statement.moduleSpecifier)
      if (spec === null) continue
      const names = new Map()
      let namespace = null
      const clause = statement.importClause
      if (clause?.name) names.set('default', clause.name.text)
      if (clause?.namedBindings) {
        if (ts.isNamespaceImport(clause.namedBindings)) namespace = clause.namedBindings.name.text
        else for (const el of clause.namedBindings.elements) names.set((el.propertyName ?? el.name).text, el.name.text)
      }
      edges.push({ spec, kind: 'import', line: line(statement), names, namespace })
    } else if (ts.isExportDeclaration(statement)) {
      const spec = literalText(statement.moduleSpecifier)
      if (spec !== null) {
        // export * from / export * as ns from / export { a as b } from
        const clause = statement.exportClause
        const reexports = new Map()
        let star = false
        if (!clause) star = true
        else if (ts.isNamespaceExport(clause)) reexports.set('*', clause.name.text)
        else for (const el of clause.elements) reexports.set((el.propertyName ?? el.name).text, el.name.text)
        edges.push({ spec, kind: 'reexport', line: line(statement), names: null, star, reexports })
      } else if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const el of statement.exportClause.elements) {
          addExport(el.name.text, el, (el.propertyName ?? el.name).text, [])
        }
      }
    } else if (ts.isExportAssignment(statement)) {
      addExport('default', statement, null, [])
    } else if (ts.isImportEqualsDeclaration(statement) && ts.isExternalModuleReference(statement.moduleReference)) {
      const spec = literalText(statement.moduleReference.expression)
      if (spec !== null) edges.push({ spec, kind: 'import', line: line(statement), names: null })
    } else if (hasModifier(statement, ts.SyntaxKind.ExportKeyword)) {
      const isDefault = hasModifier(statement, ts.SyntaxKind.DefaultKeyword)
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          const initializer = unwrapExpression(declaration.initializer)
          for (const id of bindingNames(declaration.name)) {
            const members =
              ts.isIdentifier(declaration.name) && initializer && ts.isObjectLiteralExpression(initializer)
                ? objectMembers(initializer, line)
                : null
            addExport(id.text, id, id.text, [id], members)
          }
        }
      } else if (statement.name && ts.isIdentifier(statement.name)) {
        addExport(isDefault ? 'default' : statement.name.text, statement.name, statement.name.text, [statement.name])
      } else if (isDefault) {
        addExport('default', statement, null, [])
      }
    }
  }

  const visit = (node) => {
    if (ts.isIdentifier(node)) identifiers.push(node)
    else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) strings.push(node)
    if (ts.isCallExpression(node)) {
      const callee = node.expression
      const first = node.arguments[0]
      if (callee.kind === ts.SyntaxKind.ImportKeyword) {
        const spec = literalText(first)
        if (spec !== null) edges.push({ spec, kind: 'dynamic', line: line(node), names: null })
        else blindSpots.push({ file, line: line(node), what: `import(${first ? first.getText(source) : ''})` })
      } else if (ts.isIdentifier(callee) && callee.text === 'require') {
        const spec = literalText(first)
        if (spec !== null) edges.push({ spec, kind: 'dynamic', line: line(node), names: null })
      } else if (ts.isPropertyAccessExpression(callee)) {
        const owner = callee.expression.getText(source)
        const method = callee.name.text
        if ((owner === 'vi' || owner === 'jest') && /^(mock|doMock|unmock|importActual|importMock|requireActual)$/.test(method)) {
          const spec = literalText(first)
          if (spec !== null) edges.push({ spec, kind: 'mock', line: line(node), names: null })
        } else if (owner === 'import.meta' && method === 'glob') {
          const patterns = first && ts.isArrayLiteralExpression(first) ? first.elements.map(literalText) : [literalText(first)]
          for (const pattern of patterns) {
            if (pattern === null) blindSpots.push({ file, line: line(node), what: 'import.meta.glob(<non-literal>)' })
            else edges.push({ spec: pattern, kind: 'glob', line: line(node), names: null })
          }
        }
      }
    } else if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'URL') {
      const [first, second] = node.arguments ?? []
      const spec = literalText(first)
      if (spec !== null && second && second.getText(source) === 'import.meta.url') {
        edges.push({ spec, kind: 'url', line: line(node), names: null })
      }
    } else if (ts.isImportTypeNode(node)) {
      const arg = node.argument
      const spec = ts.isLiteralTypeNode(arg) ? literalText(arg.literal) : null
      if (spec !== null) {
        let qualifier = node.qualifier
        while (qualifier && ts.isQualifiedName(qualifier)) qualifier = qualifier.left
        const names = qualifier ? new Map([[qualifier.text, qualifier.text]]) : null
        edges.push({ spec, kind: 'import', line: line(node), names })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)

  return { edges, exports: exportsMap, blindSpots, identifiers, strings, source }
}

function objectMembers(object, line) {
  const members = new Map()
  for (const property of object.properties) {
    if (
      !(ts.isPropertyAssignment(property) ||
        ts.isShorthandPropertyAssignment(property) ||
        ts.isMethodDeclaration(property) ||
        ts.isGetAccessorDeclaration(property))
    ) continue
    const name = property.name
    const text = ts.isIdentifier(name) ? name.text : literalText(name)
    if (text !== null && !members.has(text)) members.set(text, { line: line(property), node: name })
  }
  return members
}

function parseHtml(text) {
  const edges = []
  for (const match of text.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
    edges.push({ spec: match[1], kind: 'html', line: lineOf(text, match.index), names: null })
  }
  return edges
}

function parseCss(text) {
  const edges = []
  for (const match of text.matchAll(/@import\s+(?:url\()?\s*["']([^"']+)["']/g)) {
    edges.push({ spec: match[1], kind: 'css', line: lineOf(text, match.index), names: null })
  }
  for (const match of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    edges.push({ spec: match[1], kind: 'css', line: lineOf(text, match.index), names: null })
  }
  return edges
}

// ------------------------------------------------------------- resolution --

function globToRegExp(pattern) {
  let out = ''
  for (let i = 0; i < pattern.length; i += 1) {
    const c = pattern[i]
    if (c === '*' && pattern[i + 1] === '*') {
      out += '.*'
      i += 1
      if (pattern[i + 1] === '/') i += 1
    } else if (c === '*') out += '[^/]*'
    else if (c === '?') out += '[^/]'
    else if (c === '{') {
      const end = pattern.indexOf('}', i)
      out += `(?:${pattern.slice(i + 1, end).split(',').map((s) => s.replace(/[.+^$()|[\]\\]/g, '\\$&')).join('|')})`
      i = end
    } else out += c.replace(/[.+^$()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${out}$`)
}

function makeResolver(fileSet, options) {
  const tryFile = (candidate) => {
    const normal = path.posix.normalize(candidate)
    if (fileSet.has(normal)) return normal
    const withoutJs = normal.replace(/\.(m|c)?js$/, '')
    for (const ext of RESOLVE_EXTENSIONS) {
      if (fileSet.has(normal + ext)) return normal + ext
      if (withoutJs !== normal && fileSet.has(withoutJs + ext)) return withoutJs + ext
    }
    for (const ext of RESOLVE_EXTENSIONS) if (fileSet.has(`${normal}/index${ext}`)) return `${normal}/index${ext}`
    return null
  }
  const base = (from, spec) => {
    const clean = spec.replace(/[?#].*$/, '')
    for (const [prefix, target] of Object.entries(options.alias)) {
      if (clean.startsWith(prefix)) return target + clean.slice(prefix.length)
    }
    if (clean.startsWith('./') || clean.startsWith('../') || clean === '.' || clean === '..') {
      return path.posix.join(path.posix.dirname(from), clean)
    }
    if (clean.startsWith('/')) return clean.slice(1)
    return null
  }
  return {
    resolve(from, edge) {
      const target = base(from, edge.spec)
      if (target === null) return { external: true, files: [] }
      // new URL('../..', import.meta.url) names a directory, not a module.
      if (edge.kind === 'url' && /(^|\/)\.{0,2}\/?$/.test(edge.spec)) return { external: true, files: [] }
      if (edge.kind === 'glob') {
        const re = globToRegExp(path.posix.normalize(target))
        return { external: false, files: [...fileSet].filter((f) => re.test(f)) }
      }
      const hit = tryFile(target)
      return { external: false, files: hit ? [hit] : [] }
    },
  }
}

// ------------------------------------------------------------------- scan --

function scan(root, options = DEFAULT_OPTIONS, virtualFiles = new Map()) {
  const files = [...new Set([...listFiles(root), ...virtualFiles.keys()])].sort()
  const fileSet = new Set(files)
  const readText = (file) => (virtualFiles.has(file) ? Buffer.from(virtualFiles.get(file)) : readFileSync(path.join(root, file)))

  const binaryFiles = []
  const texts = new Map()
  for (const file of files) {
    const ext = extensionOf(file)
    const isText = TEXT_EXTENSIONS.has(ext) || TEXT_EXTENSIONS.has(path.posix.basename(file))
    if (!isText && !REFERENCE_EXTENSIONS.has(ext)) continue
    const buffer = readText(file)
    const at = firstBinaryByte(buffer)
    if (at >= 0) {
      binaryFiles.push({ file, offset: at, byte: `0x${buffer[at].toString(16).padStart(2, '0')}`, line: lineOf(buffer.toString('latin1'), at) })
    }
    const prose = PROSE_PREFIXES.some((prefix) => file.startsWith(prefix))
    if (REFERENCE_EXTENSIONS.has(ext) && !prose && !(options.notReferences ?? []).includes(file)) texts.set(file, buffer.toString('utf8'))
  }

  // Path 2: whole-word counts per file, the way `command grep -w` would see them.
  const wordCounts = new Map()
  const filesByWord = new Map()
  for (const [file, text] of texts) {
    const counts = new Map()
    for (const match of text.matchAll(/[A-Za-z0-9_]+/g)) counts.set(match[0], (counts.get(match[0]) ?? 0) + 1)
    wordCounts.set(file, counts)
    for (const word of counts.keys()) {
      if (!filesByWord.has(word)) filesByWord.set(word, new Set())
      filesByWord.get(word).add(file)
    }
  }
  // A name with a hyphen or dot (dropdown-menu.tsx) is not one word; look for it
  // the way `grep -w` does: bounded on both sides by a non-word character.
  const wordFiles = (word, except) => {
    if (/^[A-Za-z0-9_]+$/.test(word)) return [...(filesByWord.get(word) ?? [])].filter((f) => f !== except)
    const re = new RegExp(`(?<![A-Za-z0-9_])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9_])`)
    return [...texts.keys()].filter((f) => f !== except && re.test(texts.get(f)))
  }

  // Path 1: the import graph.
  const parsed = new Map()
  const edgesByFile = new Map()
  const blindSpots = []
  const unresolved = []
  const resolver = makeResolver(fileSet, options)
  for (const [file, text] of texts) {
    let edges = []
    if (isCode(file)) {
      const info = parseCode(file, text)
      parsed.set(file, info)
      edges = info.edges
      blindSpots.push(...info.blindSpots)
      // A string that names a tracked file (tests read sources as text).
      for (const node of info.strings) {
        const value = node.text
        if (!/\.[a-z]{2,4}$/.test(value) || !value.includes('/')) continue
        const direct = path.posix.normalize(value.replace(/^\.\//, ''))
        const relative = path.posix.normalize(path.posix.join(path.posix.dirname(file), value))
        const target = fileSet.has(direct) ? direct : fileSet.has(relative) ? relative : null
        if (target && target !== file) edges.push({ spec: target, kind: 'path', line: info.source.getLineAndCharacterOfPosition(node.getStart()).line + 1, names: null, resolved: [target] })
      }
    } else if (file.endsWith('.html')) edges = parseHtml(text)
    else if (file.endsWith('.css')) edges = parseCss(text)
    for (const edge of edges) {
      if (!edge.resolved) {
        const result = resolver.resolve(file, edge)
        edge.resolved = result.files
        if (!result.external && result.files.length === 0 && edge.kind !== 'glob' && edge.kind !== 'css') {
          unresolved.push({ file, line: edge.line, spec: edge.spec, kind: edge.kind })
        }
      }
    }
    edgesByFile.set(file, edges)
  }

  const inbound = new Map(files.map((f) => [f, []]))
  for (const [from, edges] of edgesByFile) {
    for (const edge of edges) for (const to of edge.resolved) if (to !== from) inbound.get(to).push({ from, edge })
  }

  const isTest = (file) => options.testPrefixes.some((prefix) => file.startsWith(prefix))
  const isExempt = (file) => options.exempt.some((re) => re.test(file))
  const isCandidate = (file) =>
    options.candidatePrefixes.some((prefix) => file.startsWith(prefix)) && !isExempt(file) && (isCode(file) || file.endsWith('.css'))

  // Production roots: whatever index.html loads.
  const htmlRoots = (edgesByFile.get('index.html') ?? []).flatMap((e) => e.resolved)
  const productionRoots = htmlRoots.length > 0 ? htmlRoots : ['src/main.tsx'].filter((f) => fileSet.has(f))
  const reachable = new Set()
  const stack = [...productionRoots]
  while (stack.length > 0) {
    const file = stack.pop()
    if (reachable.has(file)) continue
    reachable.add(file)
    for (const edge of edgesByFile.get(file) ?? []) {
      if (edge.kind === 'mock' || edge.kind === 'path') continue
      for (const to of edge.resolved) stack.push(to)
    }
  }

  const tokenOf = (file) => {
    let base = path.posix.basename(file).replace(/\.(d\.ts|test-d\.ts|[a-z]+)$/, '')
    if (base === 'index') base = path.posix.basename(path.posix.dirname(file))
    return base.replace(/\..*$/, '')
  }

  const modules = new Map()
  for (const file of files) {
    if (!isCandidate(file)) continue
    const refs = inbound.get(file)
    const importers = [...new Set(refs.map((r) => r.from))]
    const token = tokenOf(file)
    const tokenHits = wordFiles(token, file)
    let graph
    if (reachable.has(file)) graph = 'reachable'
    else if (importers.length === 0) graph = 'unreferenced'
    else if (importers.every(isTest)) graph = 'test-only'
    else graph = 'unreachable'
    let verdict
    if (graph === 'unreferenced') verdict = tokenHits.length === 0 ? 'dead' : 'disputed'
    else if (tokenHits.length === 0) verdict = 'disputed'
    else verdict = graph === 'reachable' ? 'live' : graph
    const text = texts.get(file) ?? ''
    modules.set(file, {
      file,
      graph,
      verdict,
      token,
      tokenHits,
      importers: refs.map((r) => ({ from: r.from, line: r.edge.line, kind: r.edge.kind })),
      lines: text.length === 0 ? 0 : text.split('\n').length - (text.endsWith('\n') ? 1 : 0),
    })
  }

  // ---- exports: which names of a module does anybody use?
  const usersCache = new Map()
  const exportUsers = (file, name, seen = new Set()) => {
    const key = `${file}\0${name}`
    if (usersCache.has(key)) return usersCache.get(key)
    if (seen.has(key)) return new Set()
    seen.add(key)
    const users = new Set()
    for (const { from, edge } of inbound.get(file) ?? []) {
      if (edge.kind === 'mock' || edge.kind === 'path' || edge.kind === 'css' || edge.kind === 'html') continue
      if (edge.kind === 'reexport') {
        if (edge.star && name !== 'default') for (const u of exportUsers(from, name, seen)) users.add(u)
        if (edge.reexports.has('*')) for (const u of exportUsers(from, edge.reexports.get('*'), seen)) users.add(u)
        if (edge.reexports.has(name)) for (const u of exportUsers(from, edge.reexports.get(name), seen)) users.add(u)
        continue
      }
      if (edge.names === null) {
        users.add(from)
        continue
      }
      if (edge.names.has(name)) users.add(from)
      if (edge.namespace) {
        const info = parsed.get(from)
        const uses = info.identifiers.filter((id) => id.text === edge.namespace)
        const escapes = uses.some((id) => {
          const parent = id.parent
          if (ts.isNamespaceImport(parent)) return false
          return !(ts.isPropertyAccessExpression(parent) && parent.expression === id) && !(ts.isQualifiedName(parent) && parent.left === id)
        })
        const named = uses.some((id) => {
          const parent = id.parent
          return (ts.isPropertyAccessExpression(parent) && parent.name.text === name) || (ts.isQualifiedName(parent) && parent.right.text === name)
        })
        if (escapes || named) users.add(from)
      }
    }
    usersCache.set(key, users)
    return users
  }

  const localUses = (info, local, declNodes) => {
    if (!local) return 0
    const skip = new Set(declNodes)
    return info.identifiers.filter((id) => {
      if (id.text !== local || skip.has(id)) return false
      const parent = id.parent
      return !(ts.isExportSpecifier(parent))
    }).length
  }

  const deadExports = []
  const testOnlyExports = []
  const deadMembers = []
  for (const [file, module] of modules) {
    const info = parsed.get(file)
    // A module nothing imports is reported whole; its exports would only repeat it.
    if (!info || module.graph === 'unreferenced') continue
    for (const [name, entry] of info.exports) {
      const users = [...exportUsers(file, name)].filter((u) => u !== file)
      const local = localUses(info, entry.local, entry.declNodes)
      const tokenName = name === 'default' ? null : name
      const ownCount = tokenName ? wordCounts.get(file)?.get(tokenName) ?? 0 : 0
      const tokenHits = tokenName ? wordFiles(tokenName, file) : []
      if (users.length === 0 && local === 0) {
        const record = { file, name, line: entry.line, tokenHits, selfCount: ownCount }
        if (tokenName && tokenHits.length === 0) deadExports.push({ ...record, verdict: 'dead' })
        else deadExports.push({ ...record, verdict: 'disputed' })
      } else if (users.length > 0 && users.every(isTest) && local === 0) {
        testOnlyExports.push({ file, name, line: entry.line, users })
      }
      if (entry.members && entry.members.size > 0 && (users.length > 0 || local > 0)) {
        deadMembers.push(...memberFindings(file, name, entry, [file, ...users], parsed, wordCounts, wordFiles))
      }
    }
  }

  return {
    root,
    files: files.length,
    parsedFiles: parsed.size,
    productionRoots,
    reachable: reachable.size,
    binaryFiles,
    blindSpots,
    unresolved,
    modules,
    deadExports,
    testOnlyExports,
    deadMembers,
    isExempt,
  }
}

function memberFindings(file, objectName, entry, userFiles, parsed, wordCounts, wordFiles) {
  const out = []
  // If the object itself is handed around whole (spread, passed, keyof), any
  // member may be reached by a computed key: say nothing about its members.
  for (const userFile of userFiles) {
    const info = parsed.get(userFile)
    if (!info) continue
    const escapes = info.identifiers.some((id) => {
      if (id.text !== objectName || entry.declNodes.includes(id)) return false
      const parent = id.parent
      if (ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent)) return false
      if (ts.isPropertyAccessExpression(parent) && parent.expression === id) return false
      if (ts.isElementAccessExpression(parent) && parent.expression === id && literalText(parent.argumentExpression) !== null) return false
      return true
    })
    if (escapes) return out
  }
  for (const [member, { line, node }] of entry.members) {
    let graphUses = 0
    for (const userFile of userFiles) {
      const info = parsed.get(userFile)
      if (!info) continue
      graphUses += info.identifiers.filter((id) => id.text === member && id !== node).length
      graphUses += info.strings.filter((s) => s.text === member && s !== node).length
    }
    const own = wordCounts.get(file)?.get(member) ?? 0
    const elsewhere = wordFiles(member, file)
    const tokenDead = own <= 1 && elsewhere.length === 0
    if (graphUses === 0) {
      out.push({ file, name: `${objectName}.${member}`, line, verdict: tokenDead ? 'dead' : 'disputed', tokenHits: elsewhere, selfCount: own })
    }
  }
  return out
}

// --------------------------------------------------------------- controls --

function runControls(result, options, probe) {
  const failures = []
  const notes = []
  for (const control of options.negativeControls) {
    const module = result.modules.get(control.file)
    if (!module) {
      failures.push(`negative control ${control.file} is gone; choose another module with a known importer`)
      continue
    }
    const seen = module.importers.find((i) => i.from === control.importer)
    if (module.verdict !== 'live' || !seen) {
      failures.push(`negative control ${control.file} came out ${module.verdict}${seen ? '' : `, and its importer ${control.importer} was not seen`}`)
    } else notes.push(`negative control: ${control.file} live, imported by ${seen.from}:${seen.line}`)
  }
  for (const file of options.exemptionControls) {
    if (!existsSync(path.join(result.root, file))) {
      notes.push(`exemption control: ${file} not present, skipped`)
      continue
    }
    if (result.modules.has(file) || !result.isExempt(file)) failures.push(`exemption control: ${file} was judged; *.test-d.ts must be exempt`)
    else notes.push(`exemption control: ${file} exempt, not reported`)
  }
  for (const [file] of result.modules) {
    if (result.isExempt(file)) failures.push(`exempt file ${file} was judged`)
  }
  if (probe) {
    const module = result.modules.get(probe.file)
    const exported = result.deadExports.some((e) => e.file === probe.file)
    if (!module || module.verdict !== 'dead') failures.push(`positive control: probe ${probe.file} came out ${module ? module.verdict : 'missing'}, expected dead`)
    else if (exported) failures.push('positive control: probe listed twice (as a dead module and as a dead export)')
    else notes.push(`positive control: in-memory probe ${probe.file} judged dead by both paths`)
  }
  if (result.binaryFiles.length > 0) {
    for (const b of result.binaryFiles) failures.push(`binary byte ${b.byte} in tracked text file ${b.file}:${b.line} (offset ${b.offset}); grep may skip this file silently`)
  } else notes.push('binary guard: no tracked text file holds a byte file(1) would call binary')
  return { failures, notes }
}

function makeProbe() {
  const stamp = `deadCodeScanProbe${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  return { file: `src/${stamp}.ts`, content: `export const ${stamp}Value = 1\n` }
}

function withoutProbe(result, probe) {
  if (!probe) return result
  result.modules.delete(probe.file)
  result.deadExports = result.deadExports.filter((e) => e.file !== probe.file)
  return result
}

// ----------------------------------------------------------------- output --

function summarise(result) {
  const by = (verdict) => [...result.modules.values()].filter((m) => m.verdict === verdict)
  return {
    dead: by('dead'),
    disputed: by('disputed'),
    testOnly: by('test-only'),
    unreachable: by('unreachable'),
    live: by('live'),
  }
}

function printReport(result, controls) {
  const s = summarise(result)
  const out = []
  const where = (m) => m.importers.slice(0, 3).map((i) => `${i.from}:${i.line}`).join(', ')
  out.push(`dead-code-scan: ${result.files} files, ${result.parsedFiles} parsed, ${result.reachable} reachable from ${result.productionRoots.join(', ')}`)
  out.push(`modules judged: ${result.modules.size}  live ${s.live.length} · dead ${s.dead.length} · test-only ${s.testOnly.length} · unreachable ${s.unreachable.length} · disputed ${s.disputed.length}`)
  out.push('', `== Dead modules: nothing imports them and no other file names them (${s.dead.length})`)
  for (const m of s.dead) out.push(`  ${m.file} (${m.lines} lines)`)
  out.push('', `== Disputed: the two paths disagree (${s.disputed.length})`)
  for (const m of s.disputed) {
    out.push(`  ${m.file}  graph=${m.graph}; "${m.token}" as a word in ${m.tokenHits.length} other file(s)${m.tokenHits.length ? `: ${m.tokenHits.slice(0, 3).join(', ')}` : ''}${m.importers.length ? `; imported by ${where(m)}` : ''}`)
  }
  out.push('', `== Kept alive only by tests (${s.testOnly.length})`)
  for (const m of s.testOnly) out.push(`  ${m.file} (${m.lines} lines) <- ${where(m)}`)
  out.push('', `== Imported, but not reachable from what index.html loads (${s.unreachable.length})`)
  for (const m of s.unreachable) out.push(`  ${m.file} (${m.lines} lines) <- ${where(m)}`)
  const deadExports = result.deadExports.filter((e) => e.verdict === 'dead')
  const disputedExports = result.deadExports.filter((e) => e.verdict === 'disputed')
  out.push('', `== Dead exports in modules that are otherwise used (${deadExports.length})`)
  for (const e of deadExports) out.push(`  ${e.file}:${e.line} ${e.name}`)
  out.push('', `== Unused exports whose name still appears elsewhere as a word (${disputedExports.length})`)
  for (const e of disputedExports) out.push(`  ${e.file}:${e.line} ${e.name}  (word in ${e.tokenHits.slice(0, 3).join(', ')}${e.tokenHits.length > 3 ? ', ...' : ''})`)
  out.push('', `== Exports used only by tests (${result.testOnlyExports.length})`)
  for (const e of result.testOnlyExports) out.push(`  ${e.file}:${e.line} ${e.name} <- ${e.users.slice(0, 2).join(', ')}`)
  const deadMembers = result.deadMembers.filter((e) => e.verdict === 'dead')
  const disputedMembers = result.deadMembers.filter((e) => e.verdict === 'disputed')
  out.push('', `== Dead members of exported object literals (${deadMembers.length})`)
  for (const e of deadMembers) out.push(`  ${e.file}:${e.line} ${e.name}`)
  out.push('', `== Unread members whose name still appears elsewhere as a word (${disputedMembers.length})`)
  for (const e of disputedMembers) out.push(`  ${e.file}:${e.line} ${e.name}  (word in ${e.tokenHits.slice(0, 3).join(', ') || 'this file only'})`)
  out.push('', `== Blind spots: edges this scan cannot follow (${result.blindSpots.length})`)
  for (const b of result.blindSpots) out.push(`  ${b.file}:${b.line} ${b.what}`)
  out.push('', `== Imports that resolve to no file (${result.unresolved.length})`)
  for (const u of result.unresolved) out.push(`  ${u.file}:${u.line} ${u.kind} ${u.spec}`)
  out.push('', '== Controls')
  for (const note of controls.notes) out.push(`  ok   ${note}`)
  for (const failure of controls.failures) out.push(`  FAIL ${failure}`)
  console.log(out.join('\n'))
}

function toJson(result, controls) {
  const s = summarise(result)
  const pick = (m) => ({ file: m.file, lines: m.lines, graph: m.graph, verdict: m.verdict, token: m.token, tokenHits: m.tokenHits, importers: m.importers })
  return {
    files: result.files,
    productionRoots: result.productionRoots,
    reachable: result.reachable,
    dead: s.dead.map(pick),
    disputed: s.disputed.map(pick),
    testOnly: s.testOnly.map(pick),
    unreachable: s.unreachable.map(pick),
    deadExports: result.deadExports,
    testOnlyExports: result.testOnlyExports,
    deadMembers: result.deadMembers,
    blindSpots: result.blindSpots,
    unresolved: result.unresolved,
    binaryFiles: result.binaryFiles,
    controls,
  }
}

function checkCandidates(result, candidates) {
  const lines = []
  for (const raw of candidates) {
    const file = raw.replace(/^\.\//, '').replace(/:\d+$/, '')
    const module = result.modules.get(file)
    if (!module) {
      if (result.isExempt(file)) lines.push(`EXEMPT       ${file}  (type-contract / declaration file, never judged)`)
      else if (!existsSync(path.join(result.root, file))) lines.push(`MISSING      ${file}`)
      else lines.push(`NOT-JUDGED   ${file}  (outside ${DEFAULT_OPTIONS.candidatePrefixes.join(', ')})`)
      continue
    }
    const evidence = module.importers.slice(0, 3).map((i) => `${i.from}:${i.line} (${i.kind})`).join(', ')
    const words = module.tokenHits.length ? `; "${module.token}" also in ${module.tokenHits.slice(0, 3).join(', ')}` : ''
    lines.push(`${module.verdict.toUpperCase().padEnd(12)} ${file}  ${evidence ? `<- ${evidence}` : 'no importer'}${words}`)
  }
  console.log(lines.join('\n'))
}

// -------------------------------------------------------------- self-test --

function selfTest() {
  const dir = mkdtempSync(path.join(tmpdir(), 'dead-code-scan-'))
  const write = (file, content) => {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    writeFileSync(path.join(dir, file), content)
  }
  try {
    write('index.html', '<script type="module" src="/src/main.tsx"></script>\n')
    write('src/main.tsx', [
      "import { used } from './lib/used'",
      "import { keys } from '@/lib/keys'",
      "import './pages/NulPage'",
      "import './styles.css'",
      "import * as ns from './lib/ns'",
      "const Lazy = () => import('./lazy/LazyPage')",
      'console.log(used(), keys.live(), ns.fromNamespace, Lazy)',
      '',
    ].join('\n'))
    write('src/styles.css', '@import "./theme.css";\n')
    write('src/theme.css', 'body {}\n')
    write('src/lib/used.ts', 'export function used() { return 1 }\nexport function unusedExport() { return 2 }\n')
    write('src/lib/ns.ts', 'export const fromNamespace = 1\nexport const notFromNamespace = 2\n')
    write('src/lib/keys.ts', "export const keys = {\n  live: () => ['a'],\n  deadMember: () => ['b'],\n}\n")
    // A raw NUL byte: file(1) calls this `data`, BSD grep skips it without a word.
    write('src/pages/NulPage.tsx', Buffer.concat([
      Buffer.from("import { OnlyNamedByNulFile } from '../components/OnlyNamedByNulFile'\nexport const sep = '"),
      Buffer.from([0x00]),
      Buffer.from("'\nconsole.log(OnlyNamedByNulFile)\n"),
    ]))
    write('src/components/OnlyNamedByNulFile.tsx', 'export function OnlyNamedByNulFile() { return null }\n')
    write('src/components/Orphan.tsx', 'export function Orphan() { return null }\n')
    write('src/components/TestKept.tsx', 'export function TestKept() { return null }\n')
    write('src/lazy/LazyPage.tsx', 'export default function LazyPage() { return null }\n')
    write('src/island/a.ts', "import { b } from './b'\nexport const a = b\n")
    write('src/island/b.ts', "import { a } from './a'\nexport const b = 1\nexport const c = () => a\n")
    write('src/types/contract.test-d.ts', 'export type Contract = { a: 1 }\n')
    write('tests/kept.test.ts', "import { TestKept } from '@/components/TestKept'\nconsole.log(TestKept)\n")
    try {
      execFileSync('git', ['init', '-q', dir])
    } catch {
      // Without git the scan walks the directory instead; the checks still hold.
    }

    const options = {
      ...DEFAULT_OPTIONS,
      negativeControls: [{ file: 'src/components/OnlyNamedByNulFile.tsx', importer: 'src/pages/NulPage.tsx' }],
      exemptionControls: ['src/types/contract.test-d.ts'],
    }
    const probe = makeProbe()
    const result = scan(dir, options, new Map([[probe.file, probe.content]]))
    const controls = runControls(result, options, probe)
    withoutProbe(result, probe)
    const verdict = (file) => result.modules.get(file)?.verdict
    const expectations = [
      ['orphan module is dead', verdict('src/components/Orphan.tsx') === 'dead'],
      ['module imported only from a NUL-byte file is live', verdict('src/components/OnlyNamedByNulFile.tsx') === 'live'],
      ['module imported only by a test is test-only', verdict('src/components/TestKept.tsx') === 'test-only'],
      ['lazy import() target is live', verdict('src/lazy/LazyPage.tsx') === 'live'],
      ['css reached through @import is live', verdict('src/theme.css') === 'live'],
      ['cycle nobody enters is unreachable', verdict('src/island/a.ts') === 'unreachable' && verdict('src/island/b.ts') === 'unreachable'],
      ['.test-d.ts is not judged', !result.modules.has('src/types/contract.test-d.ts')],
      ['unused export is dead', result.deadExports.some((e) => e.name === 'unusedExport' && e.verdict === 'dead')],
      ['used export is not reported', !result.deadExports.some((e) => e.name === 'used')],
      ['namespace member read is used', !result.deadExports.some((e) => e.name === 'fromNamespace')],
      ['namespace member never read is dead', result.deadExports.some((e) => e.name === 'notFromNamespace' && e.verdict === 'dead')],
      ['unread object member is dead', result.deadMembers.some((e) => e.name === 'keys.deadMember' && e.verdict === 'dead')],
      ['read object member is not reported', !result.deadMembers.some((e) => e.name === 'keys.live')],
      ['binary guard names the NUL file', result.binaryFiles.some((b) => b.file === 'src/pages/NulPage.tsx' && b.byte === '0x00')],
      ['negative control passes', !controls.failures.some((f) => f.startsWith('negative'))],
      ['positive control passes', !controls.failures.some((f) => f.startsWith('positive'))],
      ['exemption control passes', !controls.failures.some((f) => f.startsWith('exempt'))],
    ]
    let failed = 0
    for (const [name, ok] of expectations) {
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`)
      if (!ok) failed += 1
    }
    console.log(failed === 0 ? `self-test: ${expectations.length} checks passed` : `self-test: ${failed} of ${expectations.length} checks failed`)
    return failed === 0 ? 0 : 1
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// ------------------------------------------------------------------- main --

function main(argv) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('usage: node scripts/dead-code-scan.mjs [--json] [--check <path>...] [--check-file <list>] [--self-test]')
    return 0
  }
  if (argv.includes('--self-test')) return selfTest()

  const candidates = []
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--check') {
      while (argv[i + 1] && !argv[i + 1].startsWith('--')) candidates.push(argv[(i += 1)])
    } else if (argv[i] === '--check-file') {
      const list = readFileSync(argv[(i += 1)], 'utf8')
      candidates.push(...list.split('\n').map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean))
    } else if (argv[i] !== '--json') {
      console.error(`unknown argument: ${argv[i]}`)
      return 2
    }
  }

  const probe = DEFAULT_OPTIONS.probe ? makeProbe() : null
  const result = scan(root, DEFAULT_OPTIONS, probe ? new Map([[probe.file, probe.content]]) : new Map())
  const controls = runControls(result, DEFAULT_OPTIONS, probe)
  withoutProbe(result, probe)

  if (candidates.length > 0) checkCandidates(result, candidates)
  else if (argv.includes('--json')) console.log(JSON.stringify(toJson(result, controls), null, 2))
  else printReport(result, controls)

  if (controls.failures.length > 0) {
    console.error(`\ndead-code-scan: ${controls.failures.length} control(s) failed; the verdicts above cannot be trusted`)
    for (const failure of controls.failures) console.error(`  ${failure}`)
    return 1
  }
  return 0
}

process.exitCode = main(process.argv.slice(2))
