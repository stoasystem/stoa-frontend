import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'


const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const browserSourceRoot = path.join(repoRoot, 'src')

async function collectBrowserSourceFiles(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectBrowserSourceFiles(entryPath))
    } else if (/\.(?:js|jsx|mjs|ts|tsx)$/u.test(entry.name)) {
      files.push(entryPath)
    }
  }
  return files
}

test('browser source contains no EmailJS or VITE_CONTACT provider policy', async () => {
  const files = await collectBrowserSourceFiles(browserSourceRoot)
  const violations = []
  for (const file of files) {
    const source = await readFile(file, 'utf8')
    if (/emailjs/i.test(source)) violations.push(`${path.relative(repoRoot, file)}:emailjs`)
    if (/VITE_CONTACT_/i.test(source)) violations.push(`${path.relative(repoRoot, file)}:VITE_CONTACT`)
  }

  assert.deepEqual(violations, [])
})
