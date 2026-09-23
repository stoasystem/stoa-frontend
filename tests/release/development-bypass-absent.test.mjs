import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DIST = path.join(ROOT, 'dist')

// A served build proves which release it is before it mounts: the descriptor at
// `/served-release.json`, then the runtime config it names, by digest. A dev
// server has neither, and the descriptor's host rules refuse every environment
// on localhost, so `npm run dev` could not start the application at all.
//
// The way round it is a branch behind `import.meta.env.DEV`, which Vite replaces
// with the literal `false` when it builds, so the branch is not in the output.
// That is the whole safety argument, and an argument nobody checks is a comment.
// This reads the built bundles.

const FORBIDDEN = [
  // The dev-only entry point that registers a config nothing verified.
  'registerDevelopmentRuntimeConfig',
]

function builtSources() {
  if (!existsSync(DIST)) {
    execFileSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'ignore' })
  }
  const assets = path.join(DIST, 'assets')
  return readdirSync(assets)
    .filter((name) => name.endsWith('.js'))
    .map((name) => ({ name, text: readFileSync(path.join(assets, name), 'utf8') }))
}

test('no built bundle carries the development startup bypass', () => {
  const bundles = builtSources()
  assert.ok(bundles.length > 0, 'nothing was built, so this proves nothing')

  const carrying = []
  for (const { name, text } of bundles) {
    for (const marker of FORBIDDEN) {
      if (text.includes(marker)) carrying.push(`${name}: ${marker}`)
    }
  }

  assert.deepEqual(carrying, [])
})

test('the reader is looking at real bundles', () => {
  // Negative control: the check above passes trivially on an empty read, which
  // is exactly how it would look if `dist/assets` were renamed.
  const bundles = builtSources()

  assert.ok(bundles.length >= 3, `only ${bundles.length} bundles found`)
  assert.ok(
    bundles.some(({ text }) => text.includes('stoa.web.runtime-config.v1')),
    'the verified startup path is missing from the build, which is not what this test is about',
  )
})
