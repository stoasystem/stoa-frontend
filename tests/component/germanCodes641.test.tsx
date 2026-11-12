/**
 * Codes and English that reached German screens (#641).
 *
 * The production walk-through of 2026-11-10 found six places on German pages
 * that printed English or an internal code: the usage cards' English
 * `explanation`, the verification policy `legacy_or_verified`, a year group
 * as "Grade 6" or `grade_6_primary`, the parent-link relationship opening as
 * `child`, and the curriculum worklist naming its author by account id.
 */
import { render, screen } from '@testing-library/react'
import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import deCommon from '@/i18n/locales/de/common.json'
import enCommon from '@/i18n/locales/en/common.json'
import frCommon from '@/i18n/locales/fr/common.json'
import itCommon from '@/i18n/locales/it/common.json'
import deParent from '@/i18n/locales/de/parent.json'
import enParent from '@/i18n/locales/en/parent.json'
import frParent from '@/i18n/locales/fr/parent.json'
import itParent from '@/i18n/locales/it/parent.json'
import { getAccountStateLabel, getUsageExplanation } from '@/components/parent/accountOperationsView'
import { getGradeLabel, getGradeLabelOrNotSet } from '@/lib/displayLabels'
import { AdminAccountOperationsPage } from '@/pages/admin/AdminAccountOperationsPage'
import { AdminCurriculumPage } from '@/pages/admin/AdminCurriculumPage'

const AUTHOR_ID = '79d7cf6b-e1ee-4a6e-9a51-0c3d2f1b7e11'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')
  return { ...actual, useQueryClient: () => ({ invalidateQueries: vi.fn() }) }
})

const idleMutation = { mutate: vi.fn(), isPending: false, error: null, data: undefined }

vi.mock('@/hooks/admin/useAdminAccounts', () => ({
  useAdminAccountsQuery: (filters: { role?: string }) => ({
    data: {
      items:
        filters.role === 'admin'
          ? [{ userId: '79d7cf6b-e1ee-4a6e-9a51-0c3d2f1b7e11', name: 'Clara Admin', email: 'clara@example.ch', role: 'admin' }]
          : [],
    },
    isLoading: false,
    isError: false,
  }),
  useAssignParentLinkMutation: () => idleMutation,
  useRevokeParentLinkMutation: () => idleMutation,
}))
vi.mock('@/hooks/admin/useAdminAccountOperationsQuery', () => ({
  useAdminParentAccountOperationsQuery: () => ({
    isLoading: false,
    isError: false,
    error: null,
    data: {
      parentId: 'parent-1',
      supportState: { state: 'ready', blockers: [], warnings: [] },
      parent: {
        name: 'Rita Vogt',
        email: 'rita@example.ch',
        verification: { emailVerificationStatus: 'verified', emailVerificationPolicy: 'legacy_or_verified' },
      },
      billing: { status: 'active', mode: 'provider', subscriptionTier: 'family', cancelAtPeriodEnd: false, events: [] },
      children: [],
      usage: [
        {
          studentId: 'student-1',
          quotaPeriod: '2026-11-10',
          action: 'question_submission',
          consumed: 0,
          limit: 10,
          remaining: 10,
          supportAction: 'none',
          explanationCode: 'no_usage',
          explanationParams: {},
          explanation: 'No usage was recorded for this action and quota period.',
        },
      ],
    },
  }),
}))
vi.mock('@/hooks/admin/useAdminBillingOperation', () => ({
  useAdminBillingOperation: () => ({ query: { isLoading: false, isError: false, error: null, data: undefined }, recheck: idleMutation }),
}))

const idleQuery = { data: undefined, error: null, isLoading: false, isFetching: false, refetch: vi.fn() }
vi.mock('@/hooks/admin/useCurriculumOperationsQuery', () => ({
  useCurriculumWorklistQuery: () => ({
    ...idleQuery,
    data: {
      items: [
        { publicLessonId: 'lesson-a', versionId: 'v-1', state: 'draft', updatedAt: null, updatedBy: '79d7cf6b-e1ee-4a6e-9a51-0c3d2f1b7e11' },
        { publicLessonId: 'lesson-b', versionId: 'v-2', state: 'draft', updatedAt: null, updatedBy: 'someone-who-left' },
      ],
    },
  }),
  useCurriculumPreviewQuery: () => idleQuery,
  useCurriculumValidationQuery: () => idleQuery,
  useCurriculumAuditQuery: () => idleQuery,
  useCurriculumDiffQuery: () => idleQuery,
  useCurriculumMigrationEvidenceQuery: () => idleQuery,
  usePatchCurriculumDraftMutation: () => idleMutation,
  useSubmitCurriculumReviewMutation: () => idleMutation,
  useApproveCurriculumVersionMutation: () => idleMutation,
  useRequestCurriculumChangesMutation: () => idleMutation,
  usePublishCurriculumVersionMutation: () => idleMutation,
  useDryRunCurriculumMigrationMutation: () => idleMutation,
  useApplyCurriculumMigrationMutation: () => idleMutation,
}))

beforeEach(async () => {
  await i18n.changeLanguage('de')
})
afterEach(async () => {
  await i18n.changeLanguage('en')
})

const t = ((...args: Parameters<TFunction>) => i18n.t(...args)) as TFunction

describe('the codes are named in all four languages', () => {
  it.each([
    ['de', deCommon, deParent],
    ['en', enCommon, enParent],
    ['fr', frCommon, frParent],
    ['it', itCommon, itParent],
  ])('%s has every year group, policy and explanation', (_lang, common, parent) => {
    expect(Object.keys(common.grades)).toEqual(Object.keys(enCommon.grades))
    expect(Object.keys(parent.accountOps.usageExplanations)).toEqual(Object.keys(enParent.accountOps.usageExplanations))
    expect(parent.accountOps.states.legacy_or_verified).toBeTruthy()
  })
})

describe('a year group', () => {
  it('reads the stored code and the two old spellings in German', () => {
    expect(getGradeLabel('grade_6_primary', t)).toBe('6. Primarklasse')
    expect(getGradeLabel('Grade 6', t)).toBe('6. Primarklasse')
    expect(getGradeLabel('  Sek1 ', t)).toBe('Sekundarstufe I (Schuljahr nicht angegeben)')
  })

  it('keeps other old text as typed, and says when none was given', () => {
    expect(getGradeLabel('14', t)).toBe('14')
    expect(getGradeLabel('', t)).toBeNull()
    expect(getGradeLabel(null, t)).toBeNull()
    expect(getGradeLabelOrNotSet(undefined, t)).toBe('Klasse nicht angegeben')
  })
})

describe('the usage explanation', () => {
  it('translates the code with its numbers, never the English sentence', () => {
    expect(getUsageExplanation({ explanationCode: 'no_usage', explanation: 'No usage was recorded.' }, t)).toBe(
      'Für diese Aktion und diesen Kontingentzeitraum wurde keine Nutzung erfasst.',
    )
    expect(
      getUsageExplanation({ explanationCode: 'count_mismatch', explanationParams: { counter: 4, ledger: 3 } }, t),
    ).toBe('Der Zählerstand 4 und die Protokollsumme 3 stimmen nicht überein.')
    expect(
      getUsageExplanation({ explanationCode: 'counter_over_limit', explanationParams: { counter: 12, limit: 'unknown' } }, t),
    ).toContain('über dem Kontingent unbekannt')
  })

  it('reads an unknown code, or a sentence without one, as a German phrase', () => {
    const unknown = 'Zum Abgleich dieses Zeitraums liegt keine Erklärung vor.'
    expect(getUsageExplanation({ explanationCode: 'brand_new', explanation: 'Something new.' }, t)).toBe(unknown)
    expect(getUsageExplanation({ explanation: 'Something old.' }, t)).toBe(unknown)
    expect(getUsageExplanation({}, t)).toBeNull()
  })
})

describe('the verification policy', () => {
  it('names legacy_or_verified in German', () => {
    expect(getAccountStateLabel('legacy_or_verified', t)).toBe('Älteres Konto oder bereits bestätigt')
  })
})

describe('the parent support console in German', () => {
  it('shows the usage explanation, the policy and the relationship in German', () => {
    render(
      <MemoryRouter initialEntries={['/admin/account-operations?parentId=parent-1']}>
        <AdminAccountOperationsPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('Für diese Aktion und diesen Kontingentzeitraum wurde keine Nutzung erfasst.')).toBeTruthy()
    expect(screen.queryByText(/No usage was recorded/)).toBeNull()
    expect(screen.getByText('Älteres Konto oder bereits bestätigt')).toBeTruthy()
    expect(screen.queryByText(/Legacy or verified/i)).toBeNull()

    const relationship = screen.getByLabelText(/^Beziehung/) as HTMLInputElement
    expect(relationship.value).toBe('')
    expect(relationship.placeholder).toBe('Kind')
  })
})

describe('the curriculum worklist in German', () => {
  it('names the author, and never prints an account id', () => {
    render(
      <MemoryRouter>
        <AdminCurriculumPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/von Clara Admin/)).toBeTruthy()
    expect(screen.queryByText(new RegExp(AUTHOR_ID))).toBeNull()
    expect(screen.queryByText(/someone-who-left/)).toBeNull()
  })
})
