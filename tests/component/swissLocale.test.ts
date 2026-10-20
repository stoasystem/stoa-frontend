/*
 * #280: every reader is in Switzerland, so all four UI languages format the
 * Swiss way, the German copy writes ss instead of ß, and student- and
 * parent-facing copy says what a feature is instead of "Rollout" or
 * "Learning Assistant".
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { TFunction } from 'i18next'
import { afterEach, describe, expect, it } from 'vitest'
import { formatFeedback } from '@/components/learning/LearningProfileSignals'
import i18n from '@/i18n'
import { formattingLocale, type SupportedLanguage } from '@/i18n/languages'
import { formatDateTime, formatTimeOfDay } from '@/lib/formatDateTime'

const ROOT = path.resolve(__dirname, '../..')
const LOCALES = path.join(ROOT, 'src/i18n/locales')

// The language this tab shows, not the stored key another tab may have
// written (#403). The resources are bundled, so the switch is synchronous.
function readAs(language: SupportedLanguage) {
  void i18n.changeLanguage(language)
}

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('formattingLocale', () => {
  it('maps every UI language to its Swiss locale', () => {
    expect(formattingLocale('de')).toBe('de-CH')
    expect(formattingLocale('fr')).toBe('fr-CH')
    expect(formattingLocale('it')).toBe('it-CH')
    expect(formattingLocale('en')).toBe('en-CH')
  })

  it('reads a regional code by its language', () => {
    expect(formattingLocale('de-DE')).toBe('de-CH')
    expect(formattingLocale('en-US')).toBe('en-CH')
  })

  it('falls back to the language the app is read in', () => {
    readAs('fr')
    expect(formattingLocale()).toBe('fr-CH')
    expect(formattingLocale(undefined)).toBe('fr-CH')
    expect(formattingLocale('es')).toBe('fr-CH')
  })
})

describe('Swiss formatting in each language', () => {
  it('groups thousands with an apostrophe', () => {
    const format = (language: SupportedLanguage) => new Intl.NumberFormat(formattingLocale(language)).format(12345.5)
    expect(format('de')).toBe("12'345.5")
    expect(format('en')).toBe("12'345.5")
    expect(format('it')).toBe("12'345.5")
    expect(format('fr')).toBe("12'345,5")
  })

  it('writes francs the Swiss way', () => {
    const format = (language: SupportedLanguage) =>
      new Intl.NumberFormat(formattingLocale(language), { style: 'currency', currency: 'CHF' }).format(1234.5)
    // A no-break space keeps CHF on the line of its amount.
    expect(format('de')).toBe("CHF\u00a01'234.50")
    expect(format('en')).toBe("CHF\u00a01'234.50")
  })

  it('shows English dates day first on a 24-hour clock', () => {
    // A local date, so the assertion holds in any time zone.
    const afternoon = new Date(2026, 9, 18, 14, 5)
    readAs('en')
    expect(formatDateTime(afternoon)).toBe('18 Oct 2026, 14:05')
    expect(formatTimeOfDay(afternoon)).toBe('14:05')
    readAs('de')
    expect(formatDateTime(afternoon)).toBe('18.10.2026, 14:05')
    readAs('fr')
    expect(formatDateTime(afternoon)).toBe('18 oct. 2026, 14:05')
    readAs('it')
    expect(formatDateTime(afternoon)).toBe('18 ott 2026, 14:05')
  })
})

describe('a feedback score', () => {
  const t = ((key: string) => key) as unknown as TFunction

  it('uses the decimal separator of the language', () => {
    readAs('de')
    expect(formatFeedback(4.5, t)).toBe('4.5/5')
    readAs('fr')
    expect(formatFeedback(4.5, t)).toBe('4,5/5')
    expect(formatFeedback(4, t)).toBe('4,0/5')
  })

  it('says there is no score when there is none', () => {
    expect(formatFeedback(null, t)).toBe('practice:profile.noScore')
  })
})

describe('the ß guard', () => {
  const run = (dir?: string) =>
    spawnSync(process.execPath, ['scripts/check-german-eszett.mjs', ...(dir ? [dir] : [])], { cwd: ROOT, encoding: 'utf8' })
  let planted: string | undefined

  afterEach(() => {
    if (planted) rmSync(planted, { recursive: true, force: true })
    planted = undefined
  })

  it('passes on the German locale files', () => {
    const result = run()
    expect(result.stderr).toBe('')
    expect(result.status).toBe(0)
  })

  it('fails on a planted ß and names the line', () => {
    planted = mkdtempSync(path.join(os.tmpdir(), 'eszett-'))
    writeFileSync(path.join(planted, 'clean.json'), '{\n  "close": "Schliessen"\n}\n')
    writeFileSync(path.join(planted, 'planted.json'), '{\n  "a": "ok",\n  "b": "zu groß"\n}\n')
    const result = run(planted)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(`${path.join(planted, 'planted.json')}:3:`)
    expect(result.stderr).not.toContain('clean.json')
  })

  it('also catches a capital ẞ and an escaped ß', () => {
    planted = mkdtempSync(path.join(os.tmpdir(), 'eszett-'))
    writeFileSync(path.join(planted, 'capital.json'), '{ "a": "GROẞ" }\n')
    writeFileSync(path.join(planted, 'escaped.json'), '{ "a": "Stra\\u00dfe" }\n')
    const result = run(planted)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('capital.json:1:')
    expect(result.stderr).toContain('escaped.json:1:')
  })

  it('fails when there is nothing to read', () => {
    planted = mkdtempSync(path.join(os.tmpdir(), 'eszett-'))
    expect(run(planted).status).toBe(1)
  })
})

describe('plain words instead of anglicisms', () => {
  // Every translated string in a language, flattened.
  const values = (language: string) =>
    readdirSync(path.join(LOCALES, language))
      .filter((name) => name.endsWith('.json'))
      .flatMap((name) => {
        const walk = (node: unknown): string[] =>
          typeof node === 'string' ? [node] : node && typeof node === 'object' ? Object.values(node).flatMap(walk) : []
        return walk(JSON.parse(readFileSync(path.join(LOCALES, language, name), 'utf8')))
      })

  it.each(['de', 'fr', 'it'])('%s copy says neither Rollout nor Learning Assistant', (language) => {
    const offending = values(language).filter((value) => /rollout|learning assistant/i.test(value))
    expect(offending).toEqual([])
  })

  it('names the curriculum panel in plain German', () => {
    const practice = JSON.parse(readFileSync(path.join(LOCALES, 'de/practice.json'), 'utf8'))
    expect(practice.curriculumRollout.title).toBe('Fächer und Lehrplan')
    expect(practice.curriculumRollout.heading).toBe('Verfügbar: Mathematik, Physik, Deutsch und Englisch')
    expect(practice.curriculumRollout.rolloutSubjects).toBe('Verfügbare Fächer')
  })

  // The three uploads keys that named the assistant «Fragen» were read by no
  // screen and went with the other unused keys in #281; the check above still
  // keeps "Learning Assistant" out of every bundle.

  it('keeps the noun Upload', () => {
    expect(values('de').some((value) => /\bUpload\b/.test(value))).toBe(true)
  })
})
