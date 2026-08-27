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
  'src/components/learning',
  'src/components/common',
]

// Anything a screen puts words into.
const TEXT_PROPS =
  'title|description|label|placeholder|message|emptyMessage|eyebrow|subtitle|heading|cta|actionLabel|emptyTitle|caption|hint|tooltip'

// Words that are the same in the languages we ship, or are not prose.
// Words that read the same in the languages we ship, or are not prose.
const ALLOW =
  /^(STOA|OK|Email|E-Mail|PDF|AI|KaTeX|ID|URL|CHF|Mathematics|Physics|German|English|Deutsch|Total|Status|Info|Chat|Quiz|Start|Stop)$/i

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
    else if (path.endsWith('.tsx') || path.endsWith('.ts')) out.push(path)
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

      // One capitalised word is enough: a button reading "Start" is English
      // too, and the previous two-word rule is what let this through twice.
      const WORD = "[A-Z][A-Za-z'\u2019&.,?!-]*(?:[ ][A-Za-z'\u2019&.,?!-]+)*"
      const between = line.match(new RegExp(`>\\s*(${WORD})\\s*<`))
      const propMatch = line.match(new RegExp(`\\b(?:${TEXT_PROPS})="(${WORD})"`))
      // Prose in a quoted literal, which is where ternaries hide it.
      const literal = line.match(
        /['"]([A-Z][a-z]+(?:['\u2019]?[a-z]+)?(?: [A-Za-z'\u2019&][A-Za-z'\u2019&.,?!-]*){1,}[.?!]?)['"]/,
      )

      const found = between?.[1] ?? propMatch?.[1] ?? literal?.[1]
      if (!found || ALLOW.test(found.trim())) return
      findings.push({ file, line: index + 1, text: found.trim().slice(0, 68) })
    })
  }
}

// A count that may only fall. The screens carry more English than one pass
// can translate, and a check that fails on all of it would simply be turned
// off; this lets the number be worked down without ever growing back.
const BASELINE = Number(process.env.UNTRANSLATED_BASELINE ?? readBaseline())

function readBaseline() {
  try {
    return JSON.parse(readFileSync('scripts/untranslated-baseline.json', 'utf8')).count
  } catch {
    return 0
  }
}

if (findings.length === 0) {
  console.log('every sentence in the student screens comes from a translation')
  process.exit(0)
}

console.log(`${findings.length} untranslated sentence(s) in the student screens (baseline ${BASELINE}):\n`)
for (const { file, line, text } of findings) {
  console.log(`  ${file}:${line}\n    ${text}`)
}

if (findings.length > BASELINE) {
  console.log(`\nthis is ${findings.length - BASELINE} more than the baseline; translate them or lower the baseline deliberately`)
  process.exit(1)
}
if (findings.length < BASELINE) {
  console.log(`\n${BASELINE - findings.length} fewer than the baseline; update scripts/untranslated-baseline.json to hold the ground`)
}
process.exit(0)
