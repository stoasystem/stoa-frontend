import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// The Phase 476 sandbox evidence chain digests three sources to record that a
// real Stripe sandbox checkout was once driven through a browser. Two of them
// live here; the third and the collector live in `stoa-backend`, and so does
// every reference to them.
//
// That is why they went missing: removing the end-to-end suite took the
// acceptance spec with it, this repository was searched for references and had
// none, and twenty-seven backend tests went red on a file this repository had
// deleted. Payments are frozen so nothing runs either file - which is exactly
// how they can be deleted again without anyone here noticing.

const SOURCES = [
  'tests/e2e/billing-paid-access.spec.ts',
  'scripts/stripe-sandbox-preflight.mjs',
]

test('the sandbox evidence sources this repository owns are still here', () => {
  const missing = SOURCES.filter((relative) => !existsSync(path.join(ROOT, relative)))

  assert.deepEqual(
    missing,
    [],
    'stoa-backend digests these by path; deleting one breaks its evidence chain ' +
      'and its test suite, and nothing in this repository refers to them',
  )
})

test('they carry content, not just a name', () => {
  // Negative control: an empty file exists too, and would digest to something
  // that no longer describes what was verified.
  for (const relative of SOURCES) {
    const text = readFileSync(path.join(ROOT, relative), 'utf8')
    assert.ok(text.length > 500, `${relative} is too short to be the source it stands for`)
  }
})
