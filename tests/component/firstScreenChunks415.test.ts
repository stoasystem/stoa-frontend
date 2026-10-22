/*
 * The first screen carries no library that only a later page needs (#415,
 * #456).
 *
 * vite.config.ts names a chunk for each group of packages it keeps together
 * on purpose (React, the router and state, i18n, the UI kit, HTTP) and puts
 * every other installed package in one more, `vendor`. The first screen needs
 * every one of them, so whatever else lands in one loads for every visitor as
 * well: zod did in `vendor`, about 16 kB gzip that only the sign-in form used,
 * in a signed-in student's first screen too (#415); Radix's tabs and label in
 * the UI kit's, and zustand's `persist` in the router and state's, about
 * 1.7 kB gzip that only later pages use (#456).
 *
 * This builds the application with a report of what the first screen imports
 * (fixtures/firstScreen.vite.config.mjs) and holds that no first-screen chunk,
 * named group or not, carries a package module the first screen never imports,
 * but for the one vite.config.ts keeps there on purpose.
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
// Radix's dialog, with what is nested under it: the star map, a student's
// home, opens one, and loads with the first screen while the account is read
// (#415). Moved out, it cost each student more than it saved anyone (#456).
const CARRIED_ON_PURPOSE = '@radix-ui/react-dialog/'

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

  it('carries no package module it never imports, in a named group or not', () => {
    const carried = report
      .filter((candidate) => candidate.firstScreen)
      .map(({ name, notImported }) => ({
        chunk: name,
        notImported: notImported.filter((module) => !module.startsWith(CARRIED_ON_PURPOSE)),
      }))
      .filter((candidate) => candidate.notImported.length > 0)
    expect(carried).toEqual([])
  })

  it("keeps the star map's dialog with the UI kit", () => {
    expect(chunk('vendor-ui')?.notImported).toContain('@radix-ui/react-dialog/dist/index.mjs')
  })

  // What the named groups used to carry, now with the pages that use it.
  it.each([
    '@radix-ui/react-tabs/dist/index.mjs',
    '@radix-ui/react-label/dist/index.mjs',
    // The top-level copy, react-label's; the menu's are nested under it.
    '@radix-ui/react-primitive/dist/index.mjs',
    'zustand/esm/middleware.mjs',
  ])('loads %s with a later page', (module) => {
    const holders = report.filter((candidate) => candidate.notImported.includes(module))
    expect(holders.map(({ name, firstScreen }) => ({ name, firstScreen }))).toEqual([
      { name: expect.not.stringMatching(/^vendor/), firstScreen: false },
    ])
  })
})
