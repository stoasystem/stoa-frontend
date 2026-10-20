#!/usr/bin/env node
// Fail when the web app calls an endpoint the backend does not expose.
//
// Every page can render, every unit test can pass, and the journey can still be
// broken because the service layer calls a path that was never implemented or
// has since been deleted. This compares each httpClient and fetch call in the
// services against the backend's generated route inventory. A call it cannot
// read, or a count of calls too small to mean anything, fails too (#345).
//
// Usage:
//   node scripts/check-api-contract.mjs
//   node scripts/check-api-contract.mjs --inventory ../stoa-backend/docs/security/route-authorization-inventory.json

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import {
  MIN_CHECKED_CALLS,
  collectCalls,
  findMissing,
  loadBackendRoutes,
} from './api-contract.mjs'

const DEFAULT_INVENTORY = '../stoa-backend/docs/security/route-authorization-inventory.json'
const SERVICE_ROOT = 'src/services'

function parseArgs() {
  const args = process.argv.slice(2)
  const index = args.indexOf('--inventory')
  return { inventory: index === -1 ? DEFAULT_INVENTORY : args[index + 1] }
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return walk(full)
    if (/\.test\.tsx?$/.test(full)) return []
    return full.endsWith('.ts') || full.endsWith('.tsx') ? [full] : []
  })
}

const { inventory } = parseArgs()
let backend
try {
  backend = loadBackendRoutes(JSON.parse(readFileSync(inventory, 'utf8')))
} catch (error) {
  console.error(`Cannot read the backend route inventory at ${inventory}`)
  console.error('Check out stoa-backend alongside this repository, or pass --inventory.')
  console.error(String(error.message ?? error))
  process.exit(2)
}

const sources = walk(SERVICE_ROOT).map((file) => ({
  file: relative('.', file),
  source: readFileSync(file, 'utf8'),
}))
const { calls, unparsed } = collectCalls(sources)

console.log(`checked ${calls.length} service calls against ${backend.size} backend paths`)

let failed = false

if (unparsed.length > 0) {
  failed = true
  console.error(`\n${unparsed.length} request(s) whose path or method this check cannot read:\n`)
  for (const call of unparsed) console.error(`  ${call.file}:${call.line}  ${call.text}`)
  console.error(
    '\nWrite the path as apiPath`...`, a string, or a `const NAME = \'/path\'` in src/services,' +
      " give a fetch its options inline with `method: 'POST'` (or none for GET)," +
      ' or teach scripts/api-contract.mjs the new form.',
  )
}

if (calls.length < MIN_CHECKED_CALLS) {
  failed = true
  console.error(
    `\nonly ${calls.length} call(s) found, expected at least ${MIN_CHECKED_CALLS}: the reader no longer` +
      ' recognises how the services are written, so a pass here would mean nothing.',
  )
}

const { missing, staleGaps } = findMissing(backend, calls)
if (staleGaps.length > 0) {
  failed = true
  console.error('\nknown gap(s) in scripts/api-contract.mjs that no longer apply; remove them:\n')
  for (const gap of staleGaps) console.error(`  ${gap.file}  ${gap.call}`)
}
if (missing.size > 0) {
  failed = true
  const count = [...missing.values()].reduce((total, list) => total + list.length, 0)
  console.error(`\n${count} call(s) in ${missing.size} file(s) have no backend route:\n`)
  for (const [file, list] of [...missing].sort()) {
    console.error(`  ${file}`)
    for (const call of [...new Set(list)].sort()) console.error(`      ${call}`)
  }
}

if (failed) process.exit(1)
console.log('every call maps to a backend route')
