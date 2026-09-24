import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import deParent from '@/i18n/locales/de/parent.json'
import enParent from '@/i18n/locales/en/parent.json'
import frParent from '@/i18n/locales/fr/parent.json'
import itParent from '@/i18n/locales/it/parent.json'

// Card 007 again, on the family side. `billingHiddenFromFamilies` renders the
// student profile and reads the output; the parent screens need query doubles
// this does not have, so this judges them from the other end: which keys does a
// live page actually render, and does the phrase behind each one - in every
// language - say anything about money.
//
// It is what would have caught the page description that still read "Review
// billing, child access…" in English and "Prüfen Sie Abrechnung…" in German,
// after the billing cell above it had already been withdrawn.

import deChat from '@/i18n/locales/de/chat.json'
import enChat from '@/i18n/locales/en/chat.json'
import frChat from '@/i18n/locales/fr/chat.json'
import itChat from '@/i18n/locales/it/chat.json'

// Both namespaces, because a key is only as safe as the phrase behind it and
// the pages here draw on `parent` while the chat refusals draw on `chat`.
const BUNDLES = {
  de: { ...deParent, ...deChat },
  en: { ...enParent, ...enChat },
  fr: { ...frParent, ...frChat },
  it: { ...itParent, ...itChat },
}

// Every language this platform serves, so a German word cannot hide behind an
// English vocabulary. Two shapes, because one does not fit both jobs:
//
// Long and distinctive words match as a prefix, so German compounds are caught
// -- "Abrechnungsstatus" has to count.
const PAID_COMPOUNDABLE =
  /\b(billing|abrechnung|facturation|fatturazione|subscription|abonnement|abbonamento|checkout|stripe|paywall|zahlung|paiement|pagamento|invoice|rechnung|paywall)/i
// Short ones need both boundaries, or they eat ordinary words: `charge` is
// inside the French for "to load", which is how this check first reported three
// error messages as pricing copy.
const PAID_EXACT =
  /\b(refund|facture|fattura|price|prices|preis|preise|prix|prezzo|pricing|plan|plans|tarif|tarife|piano|purchase|charge|charges|coupon|discount|wallet|trial|tier|abo)\b/i

function namesAPrice(text: string): boolean {
  return PAID_COMPOUNDABLE.test(text) || PAID_EXACT.test(text)
}

const PAGES = [
  'src/pages/parent/ParentAccountOperationsPage.tsx',
  'src/pages/parent/ParentDashboardPage.tsx',
  'src/pages/parent/ChildReportPage.tsx',
]

// Not a page: a map from a refusal code to the phrase the student is shown. It
// told a student that teacher support "is not part of the current plan" and
// that "a parent can add it from the plan page" - a price, a plan, and a page
// that was withdrawn, on a live chat screen. It is reached from a page, so it
// is read the same way.
const COPY_MAPS = ['src/lib/teacherHelpErrors.ts']

/** Strip block and line comments, so a withdrawn key does not count. */
function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

/** Translation keys the page still renders. */
function renderedKeys(relative: string): string[] {
  const source = withoutComments(readFileSync(path.resolve(__dirname, '../..', relative), 'utf8'))
  const called = [...source.matchAll(/\bt\(\s*['"`]([A-Za-z][\w.]*)['"`]/g)].map((m) => m[1])
  // A map from a code to a key writes the key as a plain string, and the page
  // that reads the map shows whatever is behind it.
  const mapped = [...source.matchAll(/['"`]([a-z][\w]*(?:\.[\w]+){1,4})['"`]/g)].map((m) => m[1])
  return [...new Set([...called, ...mapped])]
}

function phrase(bundle: unknown, key: string): string | undefined {
  let node: unknown = bundle
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined
    node = (node as Record<string, unknown>)[part]
  }
  return typeof node === 'string' ? node : undefined
}

describe('card 007: nothing a family reads names what it would cost', () => {
  it.each([...PAGES, ...COPY_MAPS])('%s renders no paid phrase in any language', (relative) => {
    const offending: string[] = []
    for (const key of renderedKeys(relative)) {
      for (const [lang, bundle] of Object.entries(BUNDLES)) {
        const text = phrase(bundle, key)
        if (text && namesAPrice(text)) offending.push(`${lang}:${key} = ${text}`)
      }
    }

    expect(offending).toEqual([])
  })

  it('reads real keys, so an empty result means something', () => {
    // Negative control. Without it the check passes on a page whose keys the
    // reader failed to find at all.
    const keys = renderedKeys(PAGES[0])

    expect(keys.length).toBeGreaterThan(10)
    expect(keys).toContain('accountOps.title')
  })

  it('does not count a key that is only present as a comment', () => {
    // The billing cells are kept, commented out, exactly as card 007 keeps the
    // paid pages. A comment is not a rendering, and this says so.
    const raw = readFileSync(path.resolve(__dirname, '../..', PAGES[0]), 'utf8')

    expect(raw).toContain('accountOps.billing')
    expect(renderedKeys(PAGES[0])).not.toContain('accountOps.billing')
  })

  it('would notice a paid phrase put back behind a live key', () => {
    // Second negative control: the vocabulary has teeth in every language.
    const samples = [
      'Abrechnungsstatus',
      'Review billing',
      'Facturation',
      'Kinderzugang',
      // The one that made this check cry wolf: French for "cannot load".
      'Impossible de charger les enfants.',
    ]

    expect(samples.filter(namesAPrice)).toEqual([
      'Abrechnungsstatus',
      'Review billing',
      'Facturation',
    ])
  })
})
