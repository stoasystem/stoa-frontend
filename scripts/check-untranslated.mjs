#!/usr/bin/env node
/**
 * Find sentences a student would read that were never translated.
 *
 * The review screens shipped in English to a German-speaking country because
 * nothing was watching. This looks for English prose rendered directly in the
 * screens a signed-in student sees, rather than trusting a sweep by eye.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOTS = [
  'src/pages/chat',
  'src/pages/learn',
  'src/pages/practice',
  'src/pages/question-bank',
  'src/pages/learning-history',
  'src/pages/profile',
  'src/components/chat',
  'src/components/practice',
  'src/components/question-bank',
  'src/components/dashboard',
]

// Words that are the same in the languages we ship, or are not prose.
const ALLOW = /^(STOA|OK|Email|E-Mail|PDF|AI|KaTeX|ID|URL|CHF)$/i

function walk(dir) {
  const out = []
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) out.push(...walk(path))
    else if (path.endsWith('.tsx')) out.push(path)
  }
  return out
}

const findings = []
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const source = readFileSync(file, 'utf8')
    const lines = source.split('\n')
    lines.forEach((line, index) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return
      if (/(className|import |from '|aria-|data-|key=|href=|to=)/.test(line)) return

      // Prose between tags, or a prose-looking string prop.
      const between = line.match(/>\s*([A-Z][a-z]+(?: [a-z]{2,}){2,}[^<>{}]*)</)
      const prop = line.match(/\b(?:title|description|label|placeholder|message|emptyMessage)="([A-Z][a-z]+(?: [a-z]{2,}){2,}[^"]*)"/)
      const found = between?.[1] ?? prop?.[1]
      if (!found || ALLOW.test(found.trim())) return
      findings.push({ file, line: index + 1, text: found.trim().slice(0, 68) })
    })
  }
}

if (findings.length === 0) {
  console.log('every sentence in the student screens comes from a translation')
  process.exit(0)
}

console.log(`${findings.length} untranslated sentence(s) in the student screens:\n`)
for (const { file, line, text } of findings) {
  console.log(`  ${file}:${line}\n    ${text}`)
}
process.exit(1)
