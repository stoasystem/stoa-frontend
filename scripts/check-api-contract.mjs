#!/usr/bin/env node
// Fail when the web app calls an endpoint the backend does not expose.
//
// Every page can render, every unit test can pass, and the journey can still be
// broken because the service layer calls a path that was never implemented or
// has since been deleted. This compares each httpClient call against the
// backend's generated route inventory.
//
// Usage:
//   node scripts/check-api-contract.mjs
//   node scripts/check-api-contract.mjs --inventory ../stoa-backend/docs/security/route-authorization-inventory.json

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

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
    return full.endsWith('.ts') || full.endsWith('.tsx') ? [full] : []
  })
}

// `/students/${id}/summary` and `/students/{student_id}/summary` must compare equal.
// A template literal holding a ternary ends the string match early, leaving an
// unterminated `${`; everything from there on is not part of the path.
function normalise(path) {
  const openIndex = path.indexOf('${')
  const truncated =
    openIndex !== -1 && !path.slice(openIndex).includes('}') ? path.slice(0, openIndex) : path
  const normalised = truncated
    .split('?')[0]
    .replace(/\$\{[^}]*\}/g, '{}')
    .replace(/\{[^}]*\}/g, '{}')
    .replace(/\/+$/, '')
  return normalised || '/'
}

function loadBackendRoutes(inventoryPath) {
  const routes = new Map()
  for (const route of JSON.parse(readFileSync(inventoryPath, 'utf8'))) {
    const key = normalise(route.path)
    if (!routes.has(key)) routes.set(key, new Set())
    routes.get(key).add(route.method.toUpperCase())
  }
  return routes
}

function collectCalls() {
  const pattern = /httpClient\.(get|post|patch|put|delete)\s*(?:<[^>]*>)?\s*\(\s*[`'"]([^`'"]+)[`'"]/g
  const calls = []
  for (const file of walk(SERVICE_ROOT)) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(pattern)) {
      calls.push({ method: match[1].toUpperCase(), path: match[2], file: relative('.', file) })
    }
  }
  return calls
}

const { inventory } = parseArgs()
let backend
try {
  backend = loadBackendRoutes(inventory)
} catch (error) {
  console.error(`Cannot read the backend route inventory at ${inventory}`)
  console.error('Check out stoa-backend alongside this repository, or pass --inventory.')
  console.error(String(error.message ?? error))
  process.exit(2)
}

// A call can interpolate a value the backend spells out as separate routes, as in
// `drafts/${id}/${action}` against `/accept`, `/reject` and `/archive`. Such a
// segment matches a literal one so those calls are not reported as missing.
function matchesBackendRoute(callPath, method) {
  const callSegments = callPath.split('/')
  for (const [backendPath, methods] of backend) {
    if (!methods.has(method)) continue
    const backendSegments = backendPath.split('/')
    if (backendSegments.length !== callSegments.length) continue
    const compatible = callSegments.every(
      (segment, index) =>
        segment === backendSegments[index] || segment === '{}' || backendSegments[index] === '{}',
    )
    if (compatible) return true
  }
  return false
}

const calls = collectCalls()
const missing = new Map()
for (const call of calls) {
  if (matchesBackendRoute(normalise(call.path), call.method)) continue
  if (!missing.has(call.file)) missing.set(call.file, [])
  missing.get(call.file).push(`${call.method} ${call.path}`)
}

console.log(`checked ${calls.length} service calls against ${backend.size} backend paths`)

if (missing.size === 0) {
  console.log('every call maps to a backend route')
  process.exit(0)
}

const count = [...missing.values()].reduce((total, list) => total + list.length, 0)
console.error(`\n${count} call(s) in ${missing.size} file(s) have no backend route:\n`)
for (const [file, list] of [...missing].sort()) {
  console.error(`  ${file}`)
  for (const call of [...new Set(list)].sort()) console.error(`      ${call}`)
}
process.exit(1)
