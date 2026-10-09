/**
 * #69: the frontend says `teacher`, never `tutor`.
 *
 * The backend settled this in T-472-03: its routers, models and payload
 * fields are `teacher`, and `tutor` is refused there. The frontend kept the
 * old word in its types, and a reader of `note.tutor.name` against a payload
 * carrying `teacher` took the teacher's page down in production.
 *
 * This is the same gate on this side. Any `tutor` anywhere under `src` --
 * identifier, path literal, translation key, copy, file name -- fails, unless
 * the file is registered below with the exact number of occurrences it keeps
 * and a marker proving the ones it keeps are the ones meant. A list that only
 * shrinks: adding to it, or raising a count, is an edit somebody has to make
 * on purpose.
 *
 * Two things it cannot see. It reads one word, so French `tuteur` and Italian
 * `tutore` for a *legal guardian* read alike to it (hence the entries below),
 * and French copy that says `tuteur` for a teacher is invisible to it
 * altogether. And it stops at `src`: `tests/` and `docs/` are not scanned.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = path.resolve(__dirname, '../../src')

/** Written in halves so this file is not itself an occurrence. */
const LEGACY_TERM = 'tu' + 'tor'
const LEGACY = new RegExp(LEGACY_TERM, 'gi')
/** The same word without `g`, so `test` carries no state between calls. */
const LEGACY_ONCE = new RegExp(LEGACY_TERM, 'i')

type Kept = {
  /** Exactly how many occurrences the file keeps. */
  count: number
  /** Why they stay. */
  why: string
  /** Must match the file: the kept occurrences are these, not others. */
  marker: RegExp
}

const KEPT: Record<string, Kept> = {
  // #69 point 1: the addresses went out in emails and sit in bookmarks, so
  // they forward instead of ending on a 404.
  'app/router/routeManifest.ts': {
    count: 1,
    why: 'the prefix the legacy redirect forwards from',
    marker: new RegExp(`LEGACY_TEACHER_HOME = '/${LEGACY_TERM}'`),
  },
  // The plan identity the backend migrated away from. The literal has to stay
  // for the type test to be able to say it is refused.
  'types/billing.contract.test-d.ts': {
    count: 2,
    why: 'a retired backend plan identity, asserted not to type-check',
    marker: new RegExp(`${LEGACY_TERM}_supported`),
  },
  // A kind of business an organisation can be, not a person's role. Nothing
  // produces or reads the value: it is a member of two unions and never
  // crosses the wire.
  'types/organization.ts': {
    count: 1,
    why: 'the organisation type standing for a tutoring centre',
    marker: new RegExp(`'${LEGACY_TERM}ing_center'`),
  },
  'types/partnership.ts': {
    count: 1,
    why: 'the same organisation type, narrowed for the partnership form',
    marker: new RegExp(`'${LEGACY_TERM}ing_center'`),
  },
  // Italian for a legal guardian, not a teacher.
  'i18n/locales/it/practice.json': {
    count: 2,
    why: 'Italian "tutore" = legal guardian, in the parent-link copy',
    marker: new RegExp(`genitore o ${LEGACY_TERM}e`, 'i'),
  },
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return filesUnder(full)
    return /\.(tsx?|css|json|md)$/.test(entry.name) ? [full] : []
  })
}

const relativeNames = (full: string) => path.relative(SRC, full).split(path.sep).join('/')

const sourceFiles = filesUnder(SRC)

function occurrences(full: string): number {
  return (readFileSync(full, 'utf8').match(LEGACY) ?? []).length
}

describe(`#69: no ${LEGACY_TERM} under src`, () => {
  it('names no file or folder with the legacy term', () => {
    const named = sourceFiles.map(relativeNames).filter((name) => LEGACY_ONCE.test(name))
    expect(named).toEqual([])
  })

  it('leaves the legacy term only in the registered files', () => {
    const found = sourceFiles
      .filter((full) => occurrences(full) > 0)
      .map(relativeNames)
      .sort()
    expect(found).toEqual(Object.keys(KEPT).sort())
  })

  it.each(Object.entries(KEPT))('keeps exactly what %s registers', (name, kept) => {
    const full = path.join(SRC, name)
    const source = readFileSync(full, 'utf8')
    expect(source).toMatch(kept.marker)
    expect(occurrences(full)).toBe(kept.count)
  })

  it('can fail: it counts the word wherever it stands', () => {
    // Negative control. Both checks above are counts, so the counting itself
    // has to be able to come out non-zero, in a name and in a body.
    expect((`a ${LEGACY_TERM} b ${LEGACY_TERM.toUpperCase()} c`.match(LEGACY) ?? []).length).toBe(2)
    expect(LEGACY_ONCE.test(`pages/${LEGACY_TERM}/Page.tsx`)).toBe(true)
    expect(LEGACY_ONCE.test('pages/teacher/Page.tsx')).toBe(false)
  })
})
