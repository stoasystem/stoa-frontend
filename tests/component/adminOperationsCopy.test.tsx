/**
 * The parent support console and the curriculum editor, read in German.
 *
 * Both pages shipped every label, empty state and error in English (#162).
 * This renders each one in German against mocked data and checks that the
 * German copy is what a reader sees, and the English it replaced is not.
 */
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import deAdmin from '@/i18n/locales/de/admin.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import { AdminAccountOperationsPage } from '@/pages/admin/AdminAccountOperationsPage'
import { AdminCurriculumPage } from '@/pages/admin/AdminCurriculumPage'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')
  return { ...actual, useQueryClient: () => ({ invalidateQueries: vi.fn() }) }
})
vi.mock('@/components/parent/VerificationRecoveryEvidence', () => ({
  VerificationRecoveryEvidence: () => null,
}))

const idleMutation = { mutate: vi.fn(), isPending: false, error: null, data: undefined }

vi.mock('@/hooks/admin/useAdminAccounts', () => ({
  useAdminAccountsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useAssignParentLinkMutation: () => idleMutation,
}))
vi.mock('@/hooks/admin/useAdminAccountOperationsQuery', () => ({
  useAdminParentAccountOperationsQuery: () => ({
    isLoading: false,
    isError: false,
    error: null,
    data: {
      parentId: 'parent-1',
      supportState: { state: 'ready', blockers: [], warnings: [] },
      parent: { name: 'Rita Vogt', email: 'rita@example.ch', verification: { emailVerificationStatus: 'verified' } },
      billing: { status: 'active', mode: 'provider', subscriptionTier: 'family', cancelAtPeriodEnd: false, events: [] },
      children: [
        {
          studentId: 'student-1',
          profile: { name: 'Nina Vogt', email: 'nina@example.ch' },
          binding: { status: 'active' },
          usage: { consumed: 3, limit: 10 },
        },
      ],
      usage: [],
    },
  }),
}))
vi.mock('@/hooks/admin/useAdminBillingOperation', () => ({
  useAdminBillingOperation: () => ({
    query: {
      isLoading: false,
      isError: false,
      error: null,
      data: {
        checkoutRef: 'chk_public_1',
        parentId: 'parent-1',
        targetPlan: 'family',
        beneficiaryIds: ['student-1'],
        commandLifecycle: {
          state: 'completed',
          providerEffectStatus: 'applied',
          createdAt: '2026-10-01T08:00:00Z',
          updatedAt: '2026-10-01T08:05:00Z',
        },
        factLifecycle: [],
        grantVersion: {},
        allowanceVersion: {},
        providerUsageEvidence: [],
        paymentReminder: null,
        reconciliation: {
          lifecycleState: 'active',
          safeAction: 'none',
          failureCode: '',
          lastRecheckedAt: '2026-10-01T08:05:00Z',
          reconciliationLeaseGeneration: 1,
        },
      },
    },
    recheck: idleMutation,
  }),
}))

const idleQuery = { data: undefined, error: null, isLoading: false, isFetching: false, refetch: vi.fn() }
vi.mock('@/hooks/admin/useCurriculumOperationsQuery', () => ({
  useCurriculumWorklistQuery: () => ({
    ...idleQuery,
    data: {
      items: [{ publicLessonId: 'lesson-linear-ops', versionId: 'v-1', state: 'draft', updatedAt: null, updatedBy: null }],
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

function expectGermanNotEnglish(german: string, english: string) {
  expect(german).not.toBe(english)
  expect(screen.getAllByText(german, { exact: false }).length).toBeGreaterThan(0)
  expect(screen.queryByText(english, { exact: false })).toBeNull()
}

describe('the parent support console in German', () => {
  it('shows the lookup, the support state, the facts and the billing recovery in German', () => {
    render(
      <MemoryRouter initialEntries={['/admin/account-operations?parentId=parent-1&checkoutRef=chk_public_1']}>
        <AdminAccountOperationsPage />
      </MemoryRouter>,
    )
    const de = deAdmin.accountOperations
    const en = enAdmin.accountOperations
    expectGermanNotEnglish(de.title, en.title)
    expectGermanNotEnglish(de.lookup.checkoutRef, en.lookup.checkoutRef)
    expectGermanNotEnglish(de.support.ready, en.support.ready)
    expectGermanNotEnglish(de.facts.linkedChildren_one, en.facts.linkedChildren_one)
    expectGermanNotEnglish(de.children.title, en.children.title)
    expectGermanNotEnglish('3/10 genutzt', '3/10 used')
    expectGermanNotEnglish(de.billing.noEvents, en.billing.noEvents)
    expectGermanNotEnglish(de.recovery.title, en.recovery.title)
    expectGermanNotEnglish(de.recovery.active, en.recovery.active)
    expectGermanNotEnglish(de.recovery.facts.empty, en.recovery.facts.empty)
    expectGermanNotEnglish(de.usage.empty, en.usage.empty)
  })
})

describe('the curriculum editor in German', () => {
  it('shows the header, the tabs and the worklist in German', () => {
    render(
      <MemoryRouter>
        <AdminCurriculumPage />
      </MemoryRouter>,
    )
    const de = deAdmin.curriculum
    const en = enAdmin.curriculum
    expectGermanNotEnglish(de.title, en.title)
    expectGermanNotEnglish(de.refresh, en.refresh)
    expectGermanNotEnglish(de.tabs.worklist, en.tabs.worklist)
    expectGermanNotEnglish(de.capabilities.description, en.capabilities.description)
    expectGermanNotEnglish('Aktualisiert unbekannt von unbekannt', 'Updated unknown by unknown')
    expect(screen.getByRole('button', { name: de.worklist.open })).toBeTruthy()
    expect(screen.queryByRole('button', { name: en.worklist.open })).toBeNull()
  })
})
