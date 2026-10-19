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

// ß, capital ẞ, and either written as a JSON escape.
const ESZETT = /[ßẞ]|\\u00df|\\u1e9e/i

const files = readdirSync(dir).filter((name) => name.endsWith('.json')).sort()
const hits = []
for (const name of files) {
  readFileSync(join(dir, name), 'utf8')
    .split('\n')
    .forEach((line, index) => {
      if (ESZETT.test(line)) hits.push(`${join(dir, name)}:${index + 1}: ${line.trim()}`)
    })
}

if (files.length === 0) {
  // A guard that read nothing has checked nothing.
  console.error(`No .json locale files in ${dir}.`)
  process.exitCode = 1
} else if (hits.length > 0) {
  console.error(`${hits.length} line(s) use ß; Swiss German writes ss:`)
  for (const hit of hits) console.error(`  ${hit}`)
  process.exitCode = 1
} else {
  console.log(`No ß in ${files.length} files in ${dir}.`)
}
