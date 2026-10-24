/**
 * #457: the lines that say content on screen could not be refreshed, in all
 * four languages. Students are addressed with du / tu, staff and parents
 * with Sie / vous where a line addresses anyone; Italian as its files do.
 */
import { describe, expect, it } from 'vitest'
import deAdmin from '@/i18n/locales/de/admin.json'
import deChat from '@/i18n/locales/de/chat.json'
import deCommon from '@/i18n/locales/de/common.json'
import deParent from '@/i18n/locales/de/parent.json'
import dePractice from '@/i18n/locales/de/practice.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import enChat from '@/i18n/locales/en/chat.json'
import enCommon from '@/i18n/locales/en/common.json'
import enParent from '@/i18n/locales/en/parent.json'
import enPractice from '@/i18n/locales/en/practice.json'
import frAdmin from '@/i18n/locales/fr/admin.json'
import frChat from '@/i18n/locales/fr/chat.json'
import frCommon from '@/i18n/locales/fr/common.json'
import frParent from '@/i18n/locales/fr/parent.json'
import frPractice from '@/i18n/locales/fr/practice.json'
import itAdmin from '@/i18n/locales/it/admin.json'
import itChat from '@/i18n/locales/it/chat.json'
import itCommon from '@/i18n/locales/it/common.json'
import itParent from '@/i18n/locales/it/parent.json'
import itPractice from '@/i18n/locales/it/practice.json'

const FILES = {
  admin: { en: enAdmin, de: deAdmin, fr: frAdmin, it: itAdmin },
  chat: { en: enChat, de: deChat, fr: frChat, it: itChat },
  common: { en: enCommon, de: deCommon, fr: frCommon, it: itCommon },
  parent: { en: enParent, de: deParent, fr: frParent, it: itParent },
  practice: { en: enPractice, de: dePractice, fr: frPractice, it: itPractice },
}

const KEYS: Array<[keyof typeof FILES, string]> = [
  ['practice', 'review.refreshFailed'],
  ['admin', 'accounts.refreshFailed'],
  ['admin', 'accounts.loadMoreFailed'],
  ['admin', 'accounts.teacherSupport.refreshFailed'],
  ['practice', 'curriculumRollout.refreshFailed'],
  ['common', 'me.grade.refreshFailed'],
  ['chat', 'ask.list.refreshFailed'],
  ['parent', 'overview.accountRefreshFailed'],
  ['admin', 'sla.refreshFailed'],
  ['practice', 'profile.signalsRefreshFailed'],
  ['admin', 'teacherApplications.statementRefreshFailed'],
]

function read(file: unknown, key: string) {
  const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], file)
  return typeof value === 'string' ? value : undefined
}

describe('the "could not be refreshed" lines (#457)', () => {
  it.each(KEYS)('%s:%s is in all four languages, each its own', (namespace, key) => {
    const english = read(FILES[namespace].en, key)
    expect(english).toBeTruthy()
    for (const language of ['de', 'fr', 'it'] as const) {
      const text = read(FILES[namespace][language], key)
      expect(text, `${language} ${namespace}:${key}`).toBeTruthy()
      expect(text).not.toBe(english)
    }
    expect(read(FILES[namespace].de, key)).not.toContain('ß')
  })

  it('addresses a student with du and tu, and an administrator with Sie and vous', () => {
    expect(dePractice.review.refreshFailed).toMatch(/\bDu\b/)
    expect(frPractice.review.refreshFailed).toMatch(/\bTu\b/)
    expect(deChat.ask.list.refreshFailed).toMatch(/^Deine\b/)
    expect(frChat.ask.list.refreshFailed).toMatch(/^Tes\b/)
    expect(deAdmin.accounts.loadMoreFailed).toMatch(/\bSie\b/)
    expect(frAdmin.accounts.loadMoreFailed).toMatch(/\bVeuillez\b/)
  })
})
