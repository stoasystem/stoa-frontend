#!/usr/bin/env node
/**
 * Fail when a German locale file uses ß (#280).
 *
 * Every reader is in Switzerland, and Swiss German writes ss: "schliessen",
 * "gross", "gemäss". The German copy had drifted into ten ß from other
 * spellings; this keeps the next one out.
 *
 * Usage: node scripts/check-german-eszett.mjs [locale dir]
 * The directory defaults to src/i18n/locales/de; the test points it elsewhere.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2] ?? 'src/i18n/locales/de'

const hits = []
for (const name of readdirSync(dir).sort()) {
  if (!name.endsWith('.json')) continue
  readFileSync(join(dir, name), 'utf8')
    .split('\n')
    .forEach((line, index) => {
      if (line.includes('ß')) hits.push(`${join(dir, name)}:${index + 1}: ${line.trim()}`)
    })
}

if (hits.length > 0) {
  console.error(`${hits.length} line(s) use ß; Swiss German writes ss:`)
  for (const hit of hits) console.error(`  ${hit}`)
  process.exitCode = 1
} else {
  console.log(`No ß in ${dir}.`)
}
