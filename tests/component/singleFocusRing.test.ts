/**
 * One focus indicator per stop (#83). The ring is the base layer's 2 px
 * outline (src/styles/premium-theme.css); a `focus-visible:ring-*` box-shadow
 * on top of it drew a second, differently coloured ring (light `--ring` under
 * a star-gold outline on the sky). No source file may bring one back.
 *
 * What the rule bans is a second *ring*, not a second visual change (#102).
 * A focused field also warms its own border; that edge is already drawn, it
 * moves in place rather than adding a shape around the outline, and it reads
 * as "being edited" rather than as a focus stop. The case list below has said
 * so since #83 (`focus-visible:border-primary/45` is left alone); `kept border
 * colours` pins it, so dropping one is a decision, not a drift.
 *
 * The other half of the rule is that no stop may end up with *zero*
 * indicators: a source file that turns the base outline off is registered in
 * OUTLINE_OFF_SITES with what replaces it.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = path.resolve(__dirname, '../../src')

/** A ring utility behind a focus variant, any stack of variants before it. */
const FOCUS_RING = /(?<![\w-])(?:[\w-]+:)*(?:focus|focus-visible|focus-within):(?:[\w-]+:)*ring(?:-[^\s'"`]*)?(?![\w-])/g

/** The outline turned off, as a utility class or as a declaration. */
const OUTLINE_OFF = /(?<![\w-])(?:[\w-]+:)*outline-none(?![\w-])|outline:\s*none/g

const focusRings = (source: string) => source.match(FOCUS_RING) ?? []

const withoutComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '')

const outlinesOff = (source: string) => withoutComments(source).match(OUTLINE_OFF) ?? []

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    return /\.(tsx?|css)$/.test(entry.name) ? [full] : []
  })
}

const read = (relative: string) => readFileSync(path.join(SRC, relative), 'utf8')

describe('the focus-ring pattern', () => {
  it.each([
    ['focus-visible:ring-2'],
    ['focus-visible:ring-ring/45'],
    ['focus-visible:ring-offset-2'],
    ['focus-visible:ring-0'],
    ['focus:ring-2'],
    ['focus-within:ring-1'],
    ['md:focus-visible:ring-2'],
    ['focus-visible:ring-[hsl(var(--x)/0.2)]'],
  ])('catches %s', (token) => {
    expect(focusRings(`className="a ${token} b"`)).toEqual([token])
  })

  it.each([
    ['ring-2 ring-primary'],
    ['ring-offset-background'],
    ['focus-visible:outline-none'],
    ['focus-visible:border-primary/45'],
    ['focus-visible:border-on-sky'],
    ['focus-visible:border-destructive'],
    ['data-[state=active]:ring-1'],
  ])('leaves %s alone', (source) => {
    expect(focusRings(`className="${source}"`)).toEqual([])
  })
})

describe('no second focus ring in src (#83)', () => {
  it('finds no focus-variant ring utility in any source file', () => {
    const hits = sourceFiles(SRC).flatMap((file) =>
      focusRings(readFileSync(file, 'utf8')).map((token) => `${path.relative(SRC, file)}: ${token}`),
    )
    expect(hits).toEqual([])
  })
})

/** The fields whose border warms on focus, kept as a state and not a ring. */
const BORDER_ON_FOCUS: [string, string][] = [
  ['components/ui/input.tsx', 'focus-visible:border-primary/45'],
  ['components/ui/textarea.tsx', 'focus-visible:border-primary/45'],
  ['components/auth/StudentProfileStep.tsx', 'focus-visible:border-primary/45'],
  ['pages/profile/StudentProfilePage.tsx', 'focus-visible:border-primary/45'],
  ['components/auth/skyFields.ts', 'focus-visible:border-on-sky'],
]

describe('kept border colours (#102)', () => {
  it.each(BORDER_ON_FOCUS)('%s still warms its border with %s', (file, token) => {
    expect(read(file)).toContain(token)
  })

  it('leaves the base outline as the indicator under them', () => {
    const base = read('styles/premium-theme.css')
    expect(base).toMatch(/input:focus-visible/)
    expect(base).toMatch(/outline: var\(--focus-ring-width\) solid var\(--focus-ring\)/)
  })
})

/**
 * Every source file that turns the base outline off, and why no stop is left
 * bare: `moved` draws the indicator somewhere else and must still carry
 * `marker`; `programmatic` is focused by code, never by Tab.
 */
const OUTLINE_OFF_SITES: Record<string, { why: ('moved' | 'programmatic')[]; marker?: RegExp }> = {
  'index.css': {
    why: ['moved'],
    marker: /\[data-search-field\]:focus-within,[\s\S]*?outline: var\(--focus-ring-width\)/,
  },
  'features/starmap/starmap.css': {
    why: ['moved'],
    marker: /\.starmap-link:focus-visible \{[\s\S]*?outline: var\(--focus-ring-width/,
  },
  'components/base/SearchField.tsx': { why: ['moved'], marker: /data-search-field/ },
  'components/base/Composer.tsx': { why: ['moved'], marker: /data-composer-field/ },
  'components/base/IconButton.tsx': { why: ['moved'], marker: /group-focus-visible:outline-2/ },
  'components/shell/AccountMenu.tsx': {
    why: ['programmatic', 'moved'],
    marker: /group-focus-visible:outline-2/,
  },
  'components/common/LanguageSwitcher.tsx': { why: ['programmatic'] },
  // The exercise prompt, the quiz's "Not yet", the lesson-done heading and the
  // heading of a refused quiz: each is focused by code when it appears.
  'features/chapter/LessonStage.tsx': {
    why: ['programmatic', 'programmatic', 'programmatic', 'programmatic'],
  },
  'features/starmap/components/StarMapView.tsx': { why: ['programmatic'] },
}

describe('no stop without an indicator (#102)', () => {
  const found = new Map<string, string[]>(
    sourceFiles(SRC)
      .map((file) => [path.relative(SRC, file), outlinesOff(readFileSync(file, 'utf8'))] as const)
      .filter(([, hits]) => hits.length > 0),
  )

  it('registers every file that turns the outline off', () => {
    expect([...found.keys()].sort()).toEqual(Object.keys(OUTLINE_OFF_SITES).sort())
  })

  it.each(Object.entries(OUTLINE_OFF_SITES))('%s accounts for each of its sites', (file, entry) => {
    expect(found.get(file) ?? []).toHaveLength(entry.why.length)
    if (entry.why.includes('moved')) expect(read(file)).toMatch(entry.marker!)
  })
})
