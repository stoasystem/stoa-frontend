/**
 * The help page and the getting-started guide describe today's product
 * (#341): the student area is the star map plus Ask, parents have their own
 * area, teachers work through Requests; there is no "Chat" and no generic
 * "dashboard" any more. Each place is named by the label the app shows for it,
 * so a renamed tab shows up here.
 *
 * The guide's student section speaks du / tu; `addressForms315.test.tsx`
 * declares that group and checks it.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const LOCALES_DIR = path.resolve(__dirname, '../../src/i18n/locales')
const LANGS = ['de', 'en', 'fr', 'it'] as const

type Bundle = Record<string, unknown>
const bundleOf = (lang: string, ns: string): Bundle =>
  JSON.parse(readFileSync(path.join(LOCALES_DIR, lang, `${ns}.json`), 'utf8')) as Bundle

function leaves(value: unknown, prefix = ''): [string, string][] {
  if (typeof value === 'string') return [[prefix, value]]
  if (Array.isArray(value)) return value.flatMap((item, index) => leaves(item, `${prefix}.${index}`))
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([key, item]) => leaves(item, prefix ? `${prefix}.${key}` : key))
  return []
}

const at = (bundle: unknown, key: string): unknown =>
  key.split('.').reduce<unknown>((value, segment) => (value as Record<string, unknown>)?.[segment], bundle)
const text = (bundle: unknown, key: string): string => {
  const value = at(bundle, key)
  if (typeof value !== 'string') throw new Error(`${key} is not a string`)
  return value
}
const lower = (value: string) => value.toLocaleLowerCase()

describe.each(LANGS)('%s support copy', (lang) => {
  const support = bundleOf(lang, 'support')
  const common = bundleOf(lang, 'common')
  const parentArea = text(bundleOf(lang, 'parent'), 'dashboardTitle')

  it('says neither "Chat" nor "dashboard", except the parent area by its own name', () => {
    const stale = leaves(support)
      .filter(([, line]) => {
        // English calls the parent area "Parent dashboard" on screen.
        const rest = lower(line).split(lower(parentArea)).join('')
        return /(?<!\p{L})chat(?!\p{L})|dashboard|tableau de bord/iu.test(rest)
      })
      .map(([key, line]) => `${key}: ${line}`)
    expect(stale).toEqual([])
  })

  it('names Ask, the parent area and Requests as the app labels them', () => {
    const faq = lower((at(support, 'sections.faq.items') as string[]).join(' '))
    const ask = [text(common, 'navigation.chat'), text(common, 'navigation.short.chat')].map(lower)
    expect(ask.some((label) => faq.includes(label))).toBe(true)
    expect(faq).toContain(lower(parentArea))
    expect(faq).toContain(lower(text(common, 'navigation.requests')))
  })

  it('labels the signed-out button after the guide it opens', () => {
    expect(lower(text(support, 'viewOnboarding'))).toContain(lower(text(support, 'onboarding.eyebrow')))
  })
})
