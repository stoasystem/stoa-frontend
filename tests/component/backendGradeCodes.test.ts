/**
 * Every year group the backend stores has a name on a parent's or a teacher's
 * screen.
 *
 * A student's own screens name the year from `choices.grade`; the parent and
 * teacher screens get only the stored code and name it from
 * `common:grades.*` (#641). When the backend added upper secondary
 * (`grade_secondary_ii`, stoa-backend#419) those screens printed the raw code
 * until the client learned it. This list is copied from
 * `learning_profile_service.GRADE_LEVEL_CODES` in stoa-backend, in its order:
 * a new code there belongs here, in the label map and in all four locales.
 */
import type { TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import deCommon from '@/i18n/locales/de/common.json'
import enCommon from '@/i18n/locales/en/common.json'
import frCommon from '@/i18n/locales/fr/common.json'
import itCommon from '@/i18n/locales/it/common.json'
import { DEMO_GRADE_CODES } from '@/dev/demo/data/student'
import { getGradeLabel } from '@/lib/displayLabels'

const BACKEND_GRADE_CODES = [
  'grade_1_primary',
  'grade_2_primary',
  'grade_3_primary',
  'grade_4_primary',
  'grade_5_primary',
  'grade_6_primary',
  'grade_7_secondary',
  'grade_8_secondary',
  'grade_9_secondary',
  'grade_secondary_i',
  'grade_secondary_ii',
]

describe('the year groups the backend stores', () => {
  it.each([
    ['de', deCommon],
    ['en', enCommon],
    ['fr', frCommon],
    ['it', itCommon],
  ])('are each named in %s, and not by their code', (lang, common) => {
    const t = i18n.getFixedT(lang) as TFunction
    const grades = common.grades as Record<string, string>
    for (const code of BACKEND_GRADE_CODES) {
      expect(grades[code], `${lang} common:grades.${code}`).toBeTruthy()
      expect(getGradeLabel(code, t)).toBe(grades[code])
    }
  })

  it('name upper secondary as the backend names it', () => {
    expect(getGradeLabel('grade_secondary_ii', i18n.getFixedT('de') as TFunction)).toBe(
      'Sekundarstufe II (Gymnasium, Mittelschule)',
    )
    expect(getGradeLabel('grade_secondary_ii', i18n.getFixedT('en') as TFunction)).toBe('Upper secondary (Gymnasium)')
    expect(getGradeLabel('grade_secondary_ii', i18n.getFixedT('fr') as TFunction)).toBe(
      'Secondaire II (gymnase, collège, lycée)',
    )
    expect(getGradeLabel('grade_secondary_ii', i18n.getFixedT('it') as TFunction)).toBe(
      'Scuola media superiore (liceo)',
    )
  })

  it('are the ones the demo backend offers, in the same order', () => {
    expect(DEMO_GRADE_CODES).toEqual(BACKEND_GRADE_CODES)
  })
})
