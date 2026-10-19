/**
 * Every plural key has the forms its language needs, in every namespace
 * (#315).
 *
 * i18next picks the form with `Intl.PluralRules`. French and Italian have a
 * third category, `many` (1 000 000 in French, a million in Italian), and when
 * `key_many` is missing i18next does not fall back to `key_other`: it goes to
 * the fallback language, so a French page shows the English sentence (without
 * a fallback language, the raw key). Until #315 all 40 plural keys stopped at
 * `_one` / `_other`, and the key-parity test made it impossible to add `_many`
 * to French and Italian alone.
 *
 * The forms a language needs are read from `Intl.PluralRules` itself, not
 * listed here, so the check follows the same rules i18next does. `_zero` is
 * i18next's optional special case for 0 and is allowed anywhere.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import i18n, { resources } from '@/i18n'
import { namespaces } from '@/i18n/namespaces'

const LOCALES_DIR = path.resolve(__dirname, '../../src/i18n/locales')
const LANGUAGES = ['de', 'en', 'fr', 'it'] as const
const PLURAL = /^(.*)_(zero|one|two|few|many|other)$/
const OPTIONAL = new Set(['zero'])

function leafKeys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return [prefix]
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key),
  )
}

/** base key → the plural forms it has. */
function pluralFamilies(keys: string[]): Map<string, Set<string>> {
  const families = new Map<string, Set<string>>()
  for (const key of keys) {
    const match = PLURAL.exec(key)
    if (!match) continue
    const forms = families.get(match[1]) ?? new Set<string>()
    forms.add(match[2])
    families.set(match[1], forms)
  }
  return families
}

/** What is wrong with each family, as readable lines; empty when all is well. */
function pluralProblems(lang: string, keys: string[]): string[] {
  const needed = new Intl.PluralRules(lang).resolvedOptions().pluralCategories as string[]
  const problems: string[] = []
  for (const [base, forms] of pluralFamilies(keys)) {
    const missing = needed.filter((form) => !forms.has(form))
    const extra = [...forms].filter((form) => !needed.includes(form) && !OPTIONAL.has(form))
    if (missing.length) problems.push(`${base}: missing _${missing.join(', _')}`)
    if (extra.length) problems.push(`${base}: _${extra.join(', _')} is not a ${lang} plural form`)
  }
  return problems
}

const NAMESPACES = readdirSync(path.join(LOCALES_DIR, 'en')).filter((name) => name.endsWith('.json'))
const keysOf = (lang: string, file: string) =>
  leafKeys(JSON.parse(readFileSync(path.join(LOCALES_DIR, lang, file), 'utf8')))

describe('the rule itself', () => {
  it('reads the forms each language needs from Intl.PluralRules', () => {
    expect(pluralProblems('fr', ['x_one', 'x_other'])).toEqual(['x: missing _many'])
    expect(pluralProblems('it', ['x_one', 'x_many', 'x_other'])).toEqual([])
    expect(pluralProblems('de', ['x_one', 'x_many', 'x_other'])).toEqual(['x: _many is not a de plural form'])
    expect(pluralProblems('en', ['x_other'])).toEqual(['x: missing _one'])
    expect(pluralProblems('en', ['x_zero', 'x_one', 'x_other', 'plain'])).toEqual([])
  })

  it('falls back to English in French without _many, never to _other', () => {
    i18n.addResourceBundle('en', 'probe315', { x_one: 'one', x_other: '{{count}} others' })
    i18n.addResourceBundle('fr', 'probe315', { x_one: 'un', x_other: '{{count}} autres' })
    try {
      expect(i18n.t('probe315:x', { lng: 'fr', count: 1_000_000 })).toBe('1000000 others')
      i18n.addResourceBundle('fr', 'probe315', { x_many: '{{count}} de plus' }, true, true)
      expect(i18n.t('probe315:x', { lng: 'fr', count: 1_000_000 })).toBe('1000000 de plus')
    } finally {
      i18n.removeResourceBundle('en', 'probe315')
      i18n.removeResourceBundle('fr', 'probe315')
    }
  })
})

describe('every plural key in the bundles', () => {
  it('has at least one plural family to check', () => {
    expect(NAMESPACES.flatMap((ns) => [...pluralFamilies(keysOf('en', ns)).keys()]).length).toBeGreaterThan(0)
  })

  for (const lang of LANGUAGES) {
    for (const ns of NAMESPACES) {
      it(`${lang}/${ns} has the plural forms ${lang} needs`, () => {
        expect(pluralProblems(lang, keysOf(lang, ns))).toEqual([])
      })
    }
  }

  // With English out of the way, a count in the `many` category still finds a
  // sentence in the language's own bundle.
  it.each([
    ['fr', 1_000_000],
    ['it', 1_000_000],
  ] as const)('%s: a count of %d reads its own sentence for every plural key', (lang, count) => {
    const own = i18n.createInstance()
    void own.init({ resources, lng: lang, fallbackLng: false, ns: namespaces, initAsync: false })
    const unresolved = NAMESPACES.flatMap((file) => {
      const ns = file.replace(/\.json$/, '')
      return [...pluralFamilies(keysOf(lang, file)).keys()]
        .filter((base) => own.t(`${ns}:${base}`, { lng: lang, count }) === base)
        .map((base) => `${ns}:${base}`)
    })
    expect(unresolved).toEqual([])
  })
})
