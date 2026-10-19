/*
 * #281: the locale files carried about 500 keys nothing read (practice alone
 * 342), left behind by pages that were deleted, and some in the wrong address
 * form. A key nobody reads is a sentence nobody checks. They were deleted in
 * all four languages; this keeps new ones from piling up, and pins how
 * scripts/i18n-key-usage.mjs decides a key is read.
 */
import { describe, expect, it } from 'vitest'
import { collectUses, isUsed, unusedKeys } from '../../scripts/i18n-key-usage.mjs'

const used = (source: string, ns: string, key: string) => isUsed(ns, key, collectUses([['src/x/A.tsx', source]]))

describe('which keys count as read', () => {
  it('reads a key from t(), with or without its namespace', () => {
    expect(used("t('summary.title')", 'parent', 'summary.title')).toBe(true)
    expect(used("t('parent:summary.title')", 'parent', 'summary.title')).toBe(true)
    expect(used("t('parent:summary.title')", 'chat', 'summary.title')).toBe(false)
    expect(used("t('summary.title')", 'parent', 'summary.subtitle')).toBe(false)
  })

  it('reads a key handed over as data: i18nKey, labelKey, a map', () => {
    expect(used('<Trans i18nKey="legal.body" />', 'legal', 'legal.body')).toBe(true)
    expect(used("const nav = { labelKey: 'navigation.overview' }", 'common', 'navigation.overview')).toBe(true)
    expect(used("const P = { high: 'common:status.priority.high' }", 'common', 'status.priority.high')).toBe(true)
  })

  it('keeps plural and context forms of a read key', () => {
    expect(used("t('review.streak', { count })", 'practice', 'review.streak_one')).toBe(true)
    expect(used("t('review.streak', { count })", 'practice', 'review.streak_many')).toBe(true)
    expect(used("t('status.loadFailed', { context })", 'common', 'status.loadFailed_formal')).toBe(true)
  })

  it('keeps everything under a key that is read whole', () => {
    expect(used("t('onboarding.items', { returnObjects: true })", 'common', 'onboarding.items.first')).toBe(true)
    // A bare one-word literal is everywhere in code; it does not keep a subtree.
    expect(used("const tab = 'profile'", 'practice', 'profile.title')).toBe(false)
    expect(used("t('practice:profile', { returnObjects: true })", 'practice', 'profile.title')).toBe(true)
  })

  it('keeps the whole prefix of a template key, and keys built from a prefix', () => {
    expect(used('t(`status.${value}`)', 'common', 'status.open')).toBe(true)
    expect(used('t(`teacher:toasts.${kind}`)', 'teacher', 'toasts.saved')).toBe(true)
    expect(used('t(`teacher:toasts.${kind}`)', 'teacher', 'other.saved')).toBe(false)
    expect(used("t('status.' + value)", 'common', 'status.open')).toBe(true)
    expect(used('t(`${group}.label`)', 'admin', 'codes.label')).toBe(true)
  })

  it('keeps keys named by code parked in a comment', () => {
    expect(used("// <Row title={t('monthlyReport')} />", 'parent', 'monthlyReport')).toBe(true)
    expect(used("/* { label: t('reports.weekly') } */", 'parent', 'reports.weekly')).toBe(true)
  })
})

describe('the locale files', () => {
  it('carry no key nothing in src/ reads, apart from frozen billing', () => {
    // billing: Card 007 froze the paid pages; #257 is their unfreeze list, and
    // their copy stays as it is until then.
    const { billing, ...rest } = unusedKeys('.')
    expect(rest).toEqual({})
    expect(billing?.length ?? 0).toBeLessThanOrEqual(8)
  })
})
