/**
 * #457: what a parent has on screen stays when a read behind it fails.
 *
 * - The dashboard's account row: a language switch or a reconnect reads the
 *   account again, and when that failed, "Ready · 2 linked children" became
 *   "Account operations are unavailable".
 * - A child's learning signals on the child summary: a read that failed with
 *   signals on hand hid them behind "unavailable right now".
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { LearningProfileSignals } from '@/components/learning/LearningProfileSignals'
import i18n from '@/i18n'
import deParent from '@/i18n/locales/de/parent.json'
import enParent from '@/i18n/locales/en/parent.json'
import enPractice from '@/i18n/locales/en/practice.json'
import { ParentDashboardPage } from '@/pages/parent/ParentDashboardPage'
import { ApiError } from '@/services/api/httpClient'
import { getParentAccountOperations, getParentChildren } from '@/services/parent/parentApi'
import type { LearningProfile } from '@/types/learningProfile'
import type { ParentAccountOperations } from '@/types/parentAccountOperations'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/services/parent/parentApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/parent/parentApi')>('@/services/parent/parentApi')
  return { ...actual, getParentChildren: vi.fn(), getParentAccountOperations: vi.fn() }
})

const mockedChildren = vi.mocked(getParentChildren)
const mockedAccount = vi.mocked(getParentAccountOperations)

const upstream = () => new ApiError('upstream', { status: 503 })

const ACCOUNT = {
  parentId: 'parent-1',
  parent: { userId: 'parent-1', name: 'Rita Vogt', email: 'rita@example.ch' },
  billing: {},
  children: [
    { studentId: 'child-1', binding: { status: 'active' } },
    { studentId: 'child-2', binding: { status: 'active' } },
  ],
  usage: [],
  supportState: { state: 'ready', blockers: [], warnings: [] },
} as unknown as ParentAccountOperations

function openDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/parent']}>
          <ParentDashboardPage />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return client
}

const accountState = () => document.querySelector('[data-account-state]')

beforeEach(async () => {
  await i18n.changeLanguage('en')
  mockedChildren.mockReset()
  mockedAccount.mockReset()
  mockedChildren.mockResolvedValue({ items: [] } as never)
})

afterAll(async () => {
  await i18n.changeLanguage('en')
})

describe('the account row read again (#457)', () => {
  it('keeps the account’s state when it cannot be read again, and says so beside it', async () => {
    mockedAccount.mockResolvedValueOnce(ACCOUNT).mockRejectedValue(upstream())
    const client = openDashboard()
    await waitFor(() => expect(accountState()).toHaveAttribute('data-account-state', 'ready'))

    // What AppProviders does when the reader changes language.
    await act(async () => {
      await client.invalidateQueries()
    })
    await waitFor(() => expect(mockedAccount).toHaveBeenCalledTimes(2))

    expect(await screen.findByRole('alert')).toHaveTextContent(enParent.overview.accountRefreshFailed)
    expect(accountState()).toHaveAttribute('data-account-state', 'ready')
    expect(accountState()).toHaveTextContent('Ready · 2 linked children')
    expect(screen.queryByText(enParent.accountOps.loadFailed)).toBeNull()
  })

  it('says it in the reader’s language', async () => {
    await i18n.changeLanguage('de')
    mockedAccount.mockResolvedValueOnce(ACCOUNT).mockRejectedValue(upstream())
    const client = openDashboard()
    await waitFor(() => expect(accountState()).toHaveAttribute('data-account-state', 'ready'))

    await act(async () => {
      await client.invalidateQueries()
    })

    expect(await screen.findByRole('alert')).toHaveTextContent(deParent.overview.accountRefreshFailed)
  })

  it('still says the account could not be read when it never was', async () => {
    mockedAccount.mockRejectedValue(upstream())
    openDashboard()

    await waitFor(() => expect(accountState()).toHaveAttribute('data-account-state', 'failed'))
    expect(screen.getByRole('alert')).toHaveTextContent(enParent.accountOps.loadFailed)
    expect(screen.queryByText(enParent.overview.accountRefreshFailed)).toBeNull()
  })
})

describe('a child’s learning signals read again (#457)', () => {
  const PROFILE: LearningProfile = {
    studentId: 'child-1',
    subjects: [{ id: 'math', labelKey: 'subjects.math', rolloutState: 'active' }],
    subjectActivity: [
      {
        subject: 'math',
        label: 'Mathematics',
        rolloutState: 'active',
        questionCount: 14,
        aiResolvedCount: 12,
        teacherEscalationCount: 2,
        feedbackAverage: null,
      },
    ],
    weakTopics: [],
    strengthTopics: [],
    updatedAt: '2026-10-20T10:00:00Z',
  }

  function signals(props: { profile?: LearningProfile; isError: boolean }) {
    render(
      <I18nextProvider i18n={i18n}>
        <LearningProfileSignals title="Subject profile" description="" isLoading={false} {...props} />
      </I18nextProvider>,
    )
  }

  it('keeps the signals on hand and says they could not be refreshed', () => {
    signals({ profile: PROFILE, isError: true })

    expect(screen.getByRole('alert')).toHaveTextContent(enPractice.profile.signalsRefreshFailed)
    expect(screen.getByText('14')).toBeInTheDocument()
    expect(screen.getAllByText(enPractice.profile.questionsAsked).length).toBeGreaterThan(0)
    expect(screen.queryByText(enPractice.profile.signalsUnavailable)).toBeNull()
  })

  it('still says they are unavailable when they were never read', () => {
    signals({ isError: true })

    expect(screen.getByRole('alert')).toHaveTextContent(enPractice.profile.signalsUnavailable)
    expect(screen.queryByText(enPractice.profile.questionsAsked)).toBeNull()
  })
})
