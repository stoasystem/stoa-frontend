#!/usr/bin/env node
/**
 * Which locale keys does the app still read? (#281)
 *
 * The 2026-10-18 audit estimated about 400 keys nobody reads, some of them in
 * the wrong address form, and a key nobody reads is a sentence nobody will
 * ever check. This answers the question from the source, conservatively: a
 * key counts as read when anything in `src/` could name it.
 *
 *   - Every string literal that looks like a key is a use, wherever it sits:
 *     `t('a.b')`, `i18nKey="a.b"`, `labelKey: 'a.b'`, a key in a map handed to
 *     a helper. With `ns:` it names that namespace; without, every namespace.
 *   - A used key keeps everything under it (`returnObjects`, `t('a')` reading
 *     an object) and its plural and context forms (`a_one`, `a_formal_other`).
 *   - A template with a substitution keeps the whole prefix before it:
 *     t(`status.${value}`) keeps every `status.*`, and t(`${ns}:x.label`)
 *     keeps every key ending in `.label`. A literal ending in `.` is a prefix
 *     too ('status.' + value).
 *   - `$t(…)` nesting inside the locale files is a use, and so is `t('…')` in
 *     code parked in a comment.
 *
 * Tests do not count as readers: a key only a test names is not on a screen.
 *
 * `node scripts/i18n-key-usage.mjs` prints the unused keys per namespace;
 * `--json` prints them as JSON.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const LOCALES = 'src/i18n/locales'
export const LANGUAGES = ['de', 'en', 'fr', 'it']

const SKIP = [/(^|\/)__tests__\//, /\.(test|spec)\.tsx?$/, /\.test-d\.ts$/, /^src\/i18n\//]

// Suffixes i18next adds for plurals and for `context`.
const FORM_SUFFIX = /^(_[a-z]+)+$/

const looksLikeKey = (text) => /^([A-Za-z][\w-]*:)?[A-Za-z][\w-]*(\.[\w-]+)*\.?$/.test(text)

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) out.push(...walk(path))
    else out.push(path)
  }
  return out
}

/** `{ a: { b: 'x' } }` -> { 'a.b': 'x' } */
export function flatten(node, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, path, out)
    else out[path] = value
  }
  return out
}

export function readLocales(root = '.') {
  const bundles = {}
  for (const language of LANGUAGES) {
    bundles[language] = {}
    for (const file of readdirSync(join(root, LOCALES, language))) {
      if (!file.endsWith('.json')) continue
      bundles[language][file.slice(0, -5)] = JSON.parse(readFileSync(join(root, LOCALES, language, file), 'utf8'))
    }
  }
  return bundles
}

/**
 * Every way the source can name a key. `exact` and `prefixes` are
 * `{ ns | '*': Set }`; `suffixes` is a Set of key endings (from templates
 * whose dynamic part comes first).
 */
export function collectUses(files) {
  const exact = { '*': new Set() }
  const prefixes = { '*': new Set() }
  const suffixes = new Set()
  const add = (table, raw) => {
    const [ns, key] = raw.includes(':') ? raw.split(':', 2) : ['*', raw]
    ;(table[ns] ??= new Set()).add(key)
  }

  for (const [fileName, source] of files) {
    // Code parked in a comment until its route or its feature comes back (the
    // monthly report link, the frozen billing cards) keeps its keys: deleting
    // them would make putting the code back a translation job.
    for (const comment of source.match(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g) ?? [])
      for (const match of comment.matchAll(/\b(?:t|i18nKey|labelKey|titleKey)\s*[(=:]\s*\{?\s*['"`]([\w.:-]+)/g)) add(exact, match[1])
    const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, fileName.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
    const visit = (node) => {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        const text = node.text.trim()
        if (looksLikeKey(text)) add(text.endsWith('.') ? prefixes : exact, text.replace(/\.$/, '') + (text.endsWith('.') ? '.' : ''))
      } else if (ts.isTemplateExpression(node)) {
        const head = node.head.text
        if (head && looksLikeKey(head.replace(/[.:]$/, '') || 'x')) {
          // `ns:a.b.${x}` -> prefix `a.b.` in ns; `ns:${x}` -> the whole namespace.
          add(prefixes, head)
        } else if (!head) {
          // `${x}.label` / `${ns}:a.b`: keep what ends the same way.
          const tail = node.templateSpans.at(-1).literal.text
          const rest = tail.includes(':') ? tail.split(':').at(-1) : tail
          if (rest && /^[\w.-]+$/.test(rest)) suffixes.add(rest.startsWith('.') ? rest : `.${rest}`)
          if (rest && /^[\w.-]+$/.test(rest) && !rest.startsWith('.')) add(exact, rest)
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
  }
  return { exact, prefixes, suffixes }
}

/** Is `key` in `ns` read, given the uses? */
export function isUsed(ns, key, { exact, prefixes, suffixes }) {
  const sets = (table) => [table['*'], table[ns]].filter(Boolean)
  // The key, or anything above it (an object read whole).
  const parts = key.split('.')
  for (let i = parts.length; i >= 1; i -= 1) {
    const candidate = parts.slice(0, i).join('.')
    // A bare one-word literal ('profile', 'title') is everywhere in code; it
    // names a whole subtree only when it says which namespace.
    const above = i < parts.length
    const tables = above && !candidate.includes('.') ? [exact[ns]].filter(Boolean) : sets(exact)
    if (tables.some((set) => set.has(candidate))) return true
    // Plural and context forms of a used key: `a.b_one`, `a.b_formal_other`.
    const base = candidate.replace(/(_[a-z]+)+$/, '')
    if (base !== candidate && FORM_SUFFIX.test(candidate.slice(base.length)) && sets(exact).some((set) => set.has(base)))
      return true
  }
  for (const set of sets(prefixes)) {
    for (const prefix of set) {
      if (prefix === '' || prefix === `${ns}:`) return true
      const bare = prefix.includes(':') ? prefix.split(':')[1] : prefix
      if (bare === '' || key.startsWith(bare)) return true
    }
  }
  const base = key.replace(/(_[a-z]+)+$/, '')
  for (const suffix of suffixes) if (key.endsWith(suffix) || base.endsWith(suffix)) return true
  return false
}

export function sourceFiles(root = '.') {
  return walk(join(root, 'src'))
    .map((path) => path.slice(root === '.' ? 0 : root.length + 1).split('\\').join('/'))
    .filter((path) => /\.(ts|tsx)$/.test(path) && !SKIP.some((pattern) => pattern.test(path)))
    .map((path) => [path, readFileSync(join(root, path), 'utf8')])
}

/** `$t(ns:key)` inside locale values. */
function nestedUses(bundles) {
  const out = []
  for (const namespaces of Object.values(bundles))
    for (const [ns, bundle] of Object.entries(namespaces))
      for (const value of Object.values(flatten(bundle)))
        if (typeof value === 'string') for (const match of value.matchAll(/\$t\(([\w.:-]+)/g)) out.push(match[1].includes(':') ? match[1] : `${ns}:${match[1]}`)
  return out
}

/** Unused keys, per namespace, judged on the English bundle (all four share keys). */
export function unusedKeys(root = '.') {
  const bundles = readLocales(root)
  const uses = collectUses(sourceFiles(root))
  for (const raw of nestedUses(bundles)) {
    const [ns, key] = raw.split(':', 2)
    ;(uses.exact[ns] ??= new Set()).add(key)
  }
  const unused = {}
  const keys = new Set()
  for (const language of LANGUAGES)
    for (const [ns, bundle] of Object.entries(bundles[language])) for (const key of Object.keys(flatten(bundle))) keys.add(`${ns}:${key}`)
  for (const id of [...keys].sort()) {
    const [ns, key] = id.split(':', 2)
    if (!isUsed(ns, key, uses)) (unused[ns] ??= []).push(key)
  }
  return unused
}

function main() {
  const unused = unusedKeys('.')
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(unused, null, 2))
    return
  }
  let total = 0
  for (const [ns, keys] of Object.entries(unused)) {
    total += keys.length
    console.log(`${ns} (${keys.length})`)
    for (const key of keys) console.log(`  ${key}`)
  }
  console.log(`\n${total} key(s) nothing in src/ names`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
