/*
 * The first screen carries no library that only a later page needs (#415).
 *
 * vite.config.ts names a chunk for each group of packages it keeps together
 * on purpose (React, the router and state, i18n, the UI kit, HTTP) and puts
 * every other installed package in one more, `vendor`. The first screen needs
 * `vendor` (TanStack Query's core is there), so whatever else lands in it
 * loads for every visitor as well: zod did, about 16 kB gzip that only the
 * sign-in form used, in a signed-in student's first screen too.
 *
 * This builds the application with a report of what the first screen imports
 * (fixtures/firstScreen.vite.config.ts) and holds that no first-screen chunk
 * other than the named groups carries a package module the first screen never
 * imports. What goes into a named group is decided in vite.config.ts, so the
 * groups are left out here.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/** One chunk of the build, as the fixture reports it. */
type FirstScreenChunk = {
  name: string
  fileName: string
  /** Loaded before the first render. */
  firstScreen: boolean
  /** Installed packages' modules in the chunk that the first screen never imports, as `package/path`. */
  notImported: string[]
}

const ROOT = path.resolve(__dirname, '../..')
const NAMED_GROUPS = ['vendor-react', 'vendor-router-state', 'vendor-i18n', 'vendor-aws', 'vendor-ui', 'vendor-http']

describe('the first screen of a production build', () => {
  const scratch = mkdtempSync(path.join(os.tmpdir(), 'stoa-first-screen-'))
  let report: FirstScreenChunk[] = []
  afterAll(() => rmSync(scratch, { recursive: true, force: true }))

  beforeAll(() => {
    const reportFile = path.join(scratch, 'report.json')
    execFileSync(
      process.execPath,
      [
        'scripts/vite.mjs',
        'build',
        '--config',
        'tests/component/fixtures/firstScreen.vite.config.mjs',
        '--outDir',
        path.join(scratch, 'dist'),
        '--emptyOutDir',
        '--logLevel',
        'error',
      ],
      { cwd: ROOT, stdio: 'pipe', env: { ...process.env, FIRST_SCREEN_REPORT: reportFile } },
    )
    report = JSON.parse(readFileSync(reportFile, 'utf8')) as FirstScreenChunk[]
  }, 120_000)

  const chunk = (name: string) => report.find((candidate) => candidate.name === name)

  it('is told apart from what loads later', () => {
    // The catch-all and React load first; the entry page and KaTeX on demand.
    expect(chunk('vendor')?.firstScreen).toBe(true)
    expect(chunk('vendor-react')?.firstScreen).toBe(true)
    expect(chunk('EntryPage')?.firstScreen).toBe(false)
    expect(chunk('katexLoader')?.firstScreen).toBe(false)
    // The report does see a package the first screen never imports.
    expect(chunk('katexLoader')?.notImported.some((module) => module.startsWith('katex/'))).toBe(true)
  })

  it('carries no package module it never imports outside the named groups', () => {
    const carried = report
      .filter((candidate) => candidate.firstScreen && !NAMED_GROUPS.includes(candidate.name))
      .filter((candidate) => candidate.notImported.length > 0)
      .map(({ name, notImported }) => ({ chunk: name, notImported }))
    expect(carried).toEqual([])
  })
})
