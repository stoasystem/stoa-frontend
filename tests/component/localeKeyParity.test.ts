/**
 * Every phrase the app ships exists in all four languages.
 *
 * `check:untranslated` looks for English sentences hard-coded in a handful of
 * source directories; it never opens a locale file, so a key added to `en` and
 * forgotten in `de` passes it, passes `tsc`, and reaches production as an
 * English sentence in the middle of a German page. Until now the only thing
 * standing there was somebody remembering to write a four-language assertion
 * for their own feature.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const LOCALES_DIR = path.resolve(__dirname, '../../src/i18n/locales')
const TRANSLATIONS = ['de', 'fr', 'it'] as const

function leafKeys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix]
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key),
  )
}

function keysOf(locale: string, file: string): string[] {
  const contents = readFileSync(path.join(LOCALES_DIR, locale, file), 'utf8')
  return leafKeys(JSON.parse(contents)).sort()
}

const NAMESPACES = readdirSync(path.join(LOCALES_DIR, 'en')).filter((name) =>
  name.endsWith('.json'),
)

describe('the four locale bundles carry the same keys', () => {
  it('ships a namespace file per language', () => {
    expect(NAMESPACES.length).toBeGreaterThan(0)
    for (const locale of TRANSLATIONS) {
      expect(readdirSync(path.join(LOCALES_DIR, locale)).filter((n) => n.endsWith('.json')).sort()).toEqual(
        [...NAMESPACES].sort(),
      )
    }
  })

  for (const namespace of NAMESPACES) {
    for (const locale of TRANSLATIONS) {
      it(`${locale}/${namespace} has exactly the keys en/${namespace} has`, () => {
        expect(keysOf(locale, namespace)).toEqual(keysOf('en', namespace))
      })
    }
  }
})
