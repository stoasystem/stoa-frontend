/*
 * #281: check:untranslated parses the source instead of matching lines. The
 * line scan skipped any line holding `to=`, `className` or `aria-`, could not
 * see JSX text across lines or in lowercase, never read toasts, and never
 * looked in src/hooks, src/lib or src/services. Each case below is one of those
 * blind spots, planted and found; and each code shape it must leave alone.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { scanSource } from '../../scripts/check-untranslated.mjs'

const ROOT = path.resolve(__dirname, '../..')

const texts = (source: string, file = 'src/pages/x/Page.tsx') => scanSource(file, source).map((finding) => finding.text)
const kinds = (source: string, file = 'src/pages/x/Page.tsx') => scanSource(file, source).map((finding) => finding.kind)

describe('what the scan counts', () => {
  it('finds JSX text, on one line, across lines and in lowercase', () => {
    const source = `export const A = () => (
      <section>
        <h2>Weekly report</h2>
        <p>
          Your child practised
          three times this week
        </p>
        <span>or</span>
      </section>
    )`
    expect(texts(source)).toEqual(['Weekly report', 'Your child practised three times this week', 'or'])
    expect(new Set(kinds(source))).toEqual(new Set(['jsx-text']))
  })

  it('finds text on the lines the old scan skipped whole', () => {
    // #255: `<Link to={…}>Weekly report</Link>` passed because of `to=`.
    const source = `export const A = () => (
      <>
        <Link to={reportPath} className="link">Weekly report</Link>
        <span className="sr-only">Loading...</span>
        <a href="/x" key="k" data-x="y">Open history</a>
      </>
    )`
    expect(texts(source)).toEqual(['Weekly report', 'Loading...', 'Open history'])
  })

  it('finds the attributes a reader sees or a screen reader speaks', () => {
    const source = `export const A = () => (
      <>
        <button aria-label="Close panel" title="Close" />
        <input placeholder="Search topics" />
        <img alt="Student avatar" src="/a.png" />
        <Field label={busy ? 'Saving' : t('common:save')} />
      </>
    )`
    expect(texts(source)).toEqual(['Close panel', 'Close', 'Search topics', 'Student avatar', 'Saving'])
    expect(new Set(kinds(source))).toEqual(new Set(['jsx-attr']))
  })

  it('finds strings a {…} puts on the screen, and template text', () => {
    const source = 'export const A = () => <p>{done ? `Saved ${count} cards` : "Not saved yet"}</p>'
    expect(texts(source)).toEqual(['Saved cards', 'Not saved yet'])
    expect(kinds(source)).toEqual(['jsx-expr', 'jsx-expr'])
  })

  it('finds toast messages and their descriptions, in hooks too', () => {
    const source = `export function useSave() {
      return () => {
        toast.success('Profile saved')
        toast.error('Failed', { description: 'Try again later' })
        toast('Copied')
      }
    }`
    expect(texts(source, 'src/hooks/student/useSave.ts')).toEqual(['Profile saved', 'Failed', 'Try again later', 'Copied'])
  })

  it('finds copy handed over in objects and returned from helpers', () => {
    const source = `
      export const steps = [{ title: 'Contact details', icon: 'mail' }]
      export function label(status: string) {
        return status === 'open' ? 'Waiting for a teacher' : 'Closed'
      }`
    expect(texts(source, 'src/lib/labels.ts')).toEqual(['Contact details', 'Waiting for a teacher'])
    expect(kinds(source, 'src/lib/labels.ts')).toEqual(['text-prop', 'literal'])
  })

  it('counts Chinese copy wherever it sits', () => {
    expect(texts('export const A = () => <p>付款已确认</p>')).toEqual(['付款已确认'])
  })
})

describe('what the scan leaves alone', () => {
  it('ignores everything inside a translation call', () => {
    const source = `export const A = () => (
      <>
        <h2>{t('parent:summary.weeklyReportLink')}</h2>
        <button aria-label={t('common:actions.close', { defaultValue: 'Close panel' })} />
        <p>{i18n.t('errors:generic')}</p>
      </>
    )
    toast.success(t('teacher:toasts.saved'))`
    expect(texts(source)).toEqual([])
  })

  it('ignores code: imports, ids, classes, comparisons, case labels, types and keys', () => {
    const source = `import { Thing } from 'Some Module Name'
      type Mode = 'Read only' | 'Edit mode'
      const map: Record<string, string> = { 'Teacher replied': 'replyQuestion' }
      export const A = ({ mode }: { mode: Mode }) => {
        if (mode === 'Read only') return null
        switch (mode) { case 'Edit mode': break }
        return (
          <div className="flex items-center gap-2" data-testid="Main panel" id="main" role="region">
            <Route path="/parent/reports" />
            <input placeholder="math" name="Subject name" />
          </div>
        )
      }`
    expect(texts(source)).toEqual([])
  })

  it('ignores thrown and logged English, and maps keyed by language', () => {
    const source = `
      class SignedOutError extends Error { constructor() { super('Signed out before this finished') } }
      export function f() {
        console.warn('Backend logout not confirmed')
        if (!ok) throw new Error('The session could not be renewed right now.')
        return { de: 'Die Anwendung startet nicht.', en: 'The application cannot start.' }
      }`
    expect(texts(source, 'src/lib/f.ts')).toEqual([])
  })

  it('ignores brand names, emails, punctuation and numbers', () => {
    const source = `export const A = () => (
      <>
        <p>STOA</p>
        <p>info@stoaedu.ch</p>
        <p> · </p>
        <p>42 %</p>
        <title>{\`\${t('privacy.title')} | STOA\`}</title>
      </>
    )`
    expect(texts(source)).toEqual([])
  })

  it('honours an untranslated-ok marker only when it gives a reason', () => {
    const marked = `
      // untranslated-ok: the backend's sentence, matched to pick a translation.
      const KNOWN = [{ title: 'Teacher replied' }]
      export const A = () => (
        // untranslated-ok: shown in English on purpose
        <p>Weekly report</p>
      )`
    expect(texts(marked, 'src/lib/k.tsx')).toEqual([])
    const bare = `
      // untranslated-ok
      const KNOWN = [{ title: 'Teacher replied' }]`
    expect(texts(bare, 'src/lib/k.ts')).toEqual(['Teacher replied'])
  })
})

describe('the ratchet', () => {
  let planted: string | undefined
  afterEach(() => {
    if (planted) rmSync(planted, { recursive: true, force: true })
    planted = undefined
  })

  const plant = (files: Record<string, string>) => {
    planted = mkdtempSync(path.join(os.tmpdir(), 'untranslated-'))
    for (const [file, source] of Object.entries(files)) {
      mkdirSync(path.dirname(path.join(planted, file)), { recursive: true })
      writeFileSync(path.join(planted, file), source)
    }
    return planted
  }
  const run = (root: string, baseline: number) =>
    spawnSync(process.execPath, ['scripts/check-untranslated.mjs', root], {
      cwd: ROOT,
      encoding: 'utf8',
      env: { ...process.env, UNTRANSLATED_BASELINE: String(baseline) },
    })

  const screen = 'export const A = () => <><h2>Weekly report</h2><p>Open history</p></>\n'

  it('fails above the baseline and names the file and line', () => {
    const root = plant({ 'src/pages/parent/Report.tsx': screen })
    const result = run(root, 1)
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('src/pages/parent/Report.tsx:1 [jsx-text]')
    expect(result.stdout).toContain('1 more than the baseline')
  })

  it('passes at or under the baseline', () => {
    const root = plant({ 'src/pages/parent/Report.tsx': screen })
    expect(run(root, 2).status).toBe(0)
    expect(run(root, 3).stdout).toContain('1 fewer than the baseline')
  })

  it('does not read tests, dev tools or the frozen billing pages', () => {
    const root = plant({
      'src/pages/parent/Report.test.tsx': screen,
      'src/pages/parent/__tests__/Report.tsx': screen,
      'src/dev/Gallery.tsx': screen,
      'src/pages/billing/FrozenPlanPage.tsx': screen,
      'src/i18n/locales/en/x.ts': screen,
    })
    const result = run(root, 0)
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('every sentence in the screens comes from a translation')
  })

  it('fails when there is no src/ to read', () => {
    planted = mkdtempSync(path.join(os.tmpdir(), 'untranslated-'))
    expect(run(planted, 100).status).toBe(1)
  })

  it('holds the repository at its baseline', () => {
    const result = spawnSync(process.execPath, ['scripts/check-untranslated.mjs'], { cwd: ROOT, encoding: 'utf8' })
    expect(result.status, result.stdout).toBe(0)
  })
})
