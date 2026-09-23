import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import deCommon from '@/i18n/locales/de/common.json'
import enCommon from '@/i18n/locales/en/common.json'
import frCommon from '@/i18n/locales/fr/common.json'
import itCommon from '@/i18n/locales/it/common.json'
import deParent from '@/i18n/locales/de/parent.json'
import enParent from '@/i18n/locales/en/parent.json'
import frParent from '@/i18n/locales/fr/parent.json'
import itParent from '@/i18n/locales/it/parent.json'

const COMMON = { de: deCommon, en: enCommon, fr: frCommon, it: itCommon }
const PARENT = { de: deParent, en: enParent, fr: frParent, it: itParent }

// `RoleBadge` looks a role up as `roles.<role>`, and the role it is handed is
// the backend's canonical one. The map was written with `tutor`, the backend
// says `teacher`, and so a signed-in teacher's own header read `roles.teacher`
// on every screen, in all four languages.
const CANONICAL_ROLES = ['student', 'parent', 'teacher', 'admin'] as const

describe('every role the backend can name has a phrase', () => {
  it.each(Object.entries(COMMON))('%s names all four', (_lang, bundle) => {
    const roles = (bundle as unknown as { roles: Record<string, string> }).roles

    const missing = CANONICAL_ROLES.filter((role) => typeof roles[role] !== 'string')

    expect(missing).toEqual([])
  })

  it('would notice a role added to the backend and not to the map', () => {
    // Negative control: the check above is a lookup, so it has to be able to fail.
    const roles = (enCommon as unknown as { roles: Record<string, string> }).roles

    expect(roles['a_role_nobody_translated']).toBeUndefined()
  })
})

describe('the parent value card is translated, not written in English', () => {
  it.each(Object.entries(PARENT))('%s carries the three phrases', (_lang, bundle) => {
    const card = (bundle as unknown as { valueCard?: Record<string, string> }).valueCard

    expect(typeof card?.title).toBe('string')
    expect(typeof card?.body1).toBe('string')
    expect(typeof card?.body2).toBe('string')
  })

  it('keeps the sentences out of the component', () => {
    // The card used to hold its own English. A default in the source is how a
    // German dashboard ends up with an English block in the middle of it.
    const source = readFileSync(
      path.resolve(__dirname, '../../src/components/parent/ParentValueCard.tsx'),
      'utf8',
    )

    expect(source).not.toContain('Why this matters')
    expect(source).not.toContain('STOA helps parents')
    expect(source).toContain("t('valueCard.title')")
  })
})
