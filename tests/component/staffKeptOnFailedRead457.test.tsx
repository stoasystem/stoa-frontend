/**
 * #457: what staff have on screen stays when a read behind it fails.
 *
 * - The curriculum coverage on a teacher's request (CurriculumRolloutPanel):
 *   a catalog read again and failed hid the catalog behind "unavailable".
 * - The SLA figures on the admin system page: a stats read again and failed
 *   replaced figures already read with "unavailable". #262 hid invented
 *   zeros; figures that were read are not invented.
 * - The curriculum worklist: Refresh, or the read after a write (#404), that
 *   failed took the whole list off the page under the alert.
 * - A teacher application's statement: read again and failed, it was
 *   replaced by "could not be loaded".
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminTeacherSlaCard } from '@/components/admin/AdminTeacherSlaCard'
import { CurriculumRolloutPanel } from '@/components/practice/CurriculumRolloutPanel'
import i18n from '@/i18n'
import deAdmin from '@/i18n/locales/de/admin.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import enPractice from '@/i18n/locales/en/practice.json'
import { AdminCurriculumPage } from '@/pages/admin/AdminCurriculumPage'
import { AdminTeacherApplicationsPage } from '@/pages/admin/AdminTeacherApplicationsPage'
import type { AdminTeacherSlaStats } from '@/services/admin/adminApi'
import { getCurriculumWorklist } from '@/services/admin/curriculumApi'
import { ApiError } from '@/services/api/httpClient'
import type { CurriculumCatalog } from '@/types/practice'

const state = vi.hoisted(() => ({
  applications: [] as Array<Record<string, unknown>>,
  detail: { data: undefined as unknown, isPending: false, isError: false, error: null as unknown },
}))

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/admin/curriculumApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/admin/curriculumApi')>('@/services/admin/curriculumApi')
  return { ...actual, getCurriculumWorklist: vi.fn() }
})
vi.mock('@/hooks/teacher/useTeacherApplication', () => ({
  useTeacherApplicationsQuery: (reviewState: string) => ({
    isSuccess: true,
    isError: false,
    data: {
      reviewState,
      items: state.applications.filter((row) => row.reviewState === reviewState),
      count: state.applications.filter((row) => row.reviewState === reviewState).length,
    },
  }),
  useTeacherApplicationDetailQuery: () => state.detail,
  useReviewTeacherApplicationMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useReissueTeacherInvitationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

const worklist = vi.mocked(getCurriculumWorklist)

const upstream = () => new ApiError('upstream', { status: 503 })

function show(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  worklist.mockReset()
  state.applications = []
  state.detail = { data: undefined, isPending: false, isError: false, error: null }
})

afterAll(async () => {
  await i18n.changeLanguage('en')
})

describe('the curriculum coverage on a teacher’s request (#457)', () => {
  const CATALOG: CurriculumCatalog = {
    subjects: [
      {
        id: 'math',
        name: 'Mathematik',
        description: '',
        gradeLevels: [],
        language: 'de',
        rolloutState: 'active',
        order: 1,
      },
    ],
    topics: [],
    units: [],
    lessons: [],
    rolloutSubjects: ['math'],
    includePreview: false,
    source: 'practice_backfill',
  }

  it('keeps the catalog it has and says it could not be refreshed', () => {
    show(<CurriculumRolloutPanel catalog={CATALOG} isLoading={false} isError />)

    expect(screen.getByRole('alert')).toHaveTextContent(enPractice.curriculumRollout.refreshFailed)
    expect(screen.getByText(enPractice.curriculumRollout.heading)).toBeInTheDocument()
    expect(screen.getByText('Mathematik')).toBeInTheDocument()
    expect(screen.queryByText(enPractice.curriculumRollout.error)).toBeNull()
  })

  it('still says the coverage is unavailable when no catalog was read, as an alert', () => {
    show(<CurriculumRolloutPanel isLoading={false} isError />)

    expect(screen.getByRole('alert')).toHaveTextContent(enPractice.curriculumRollout.error)
    expect(screen.queryByText(enPractice.curriculumRollout.heading)).toBeNull()
  })
})

describe('the SLA figures on the system page (#457)', () => {
  const STATS = {
    tracked_questions: 4,
    first_reply: { count: 2, average_seconds: 600, max_seconds: 900 },
    targets: { first_reply_seconds: 1800 },
    buckets: { within_target: 2, at_risk: 1, breached: 1, unknown: 0 },
  } as unknown as AdminTeacherSlaStats

  it('keeps the figures read before when the stats cannot be read again', () => {
    show(<AdminTeacherSlaCard stats={STATS} isError />)

    expect(screen.getByRole('alert')).toHaveTextContent(enAdmin.sla.refreshFailed)
    expect(screen.getByText(enAdmin.sla.tracked)).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.queryByText(enAdmin.sla.unavailable)).toBeNull()
  })

  it('still shows no figures when none were read (#262)', () => {
    const { container } = show(<AdminTeacherSlaCard isError />)

    expect(screen.getByRole('alert')).toHaveTextContent(enAdmin.sla.unavailable)
    expect(screen.getAllByText(enAdmin.sla.unavailable)).toHaveLength(1)
    expect(container.textContent).not.toMatch(/\d/)
  })
})

describe('the curriculum worklist read again (#457)', () => {
  const ITEMS = [
    { publicLessonId: 'lesson-1', versionId: 'v4', state: 'draft', updatedAt: '2026-10-18T10:00:00Z', updatedBy: 'admin-1' },
    { publicLessonId: 'lesson-1', versionId: 'v2', state: 'published', updatedAt: '2026-10-17T12:00:00Z', updatedBy: 'admin-1' },
  ]

  it('keeps the worklist under the alert when Refresh cannot read it again', async () => {
    worklist.mockResolvedValueOnce({ items: ITEMS, count: ITEMS.length }).mockRejectedValue(upstream())
    const user = userEvent.setup()
    show(<AdminCurriculumPage />)
    await waitFor(() => expect(screen.getAllByRole('button', { name: enAdmin.curriculum.worklist.open })).toHaveLength(2))

    await user.click(screen.getByRole('button', { name: enAdmin.curriculum.refresh }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(worklist).toHaveBeenCalledTimes(2)
    expect(screen.getAllByRole('button', { name: enAdmin.curriculum.worklist.open })).toHaveLength(2)
  })

  it('still shows no list when it was never read', async () => {
    worklist.mockRejectedValue(upstream())
    show(<AdminCurriculumPage />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: enAdmin.curriculum.worklist.open })).toBeNull()
    expect(screen.queryByText(enAdmin.curriculum.worklist.empty)).toBeNull()
  })
})

describe('a teacher application’s statement read again (#457)', () => {
  const pending = {
    applicationId: 'app-1',
    version: 2,
    reviewState: 'pending_review',
    fullName: 'Lea Muster',
    verifiedEmail: 'lea@example.ch',
    subjects: ['math'],
  }

  it('keeps the statement it has and says it could not be refreshed', async () => {
    state.applications = [pending]
    state.detail = {
      data: { ...pending, statement: 'I have taught maths for ten years.' },
      isPending: false,
      isError: true,
      error: upstream(),
    }
    const user = userEvent.setup()
    show(<AdminTeacherApplicationsPage />)

    await user.click(screen.getByRole('button', { name: /Lea Muster/ }))

    expect(screen.getByText('I have taught maths for ten years.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(enAdmin.teacherApplications.statementRefreshFailed)
    expect(screen.queryByText(enAdmin.teacherApplications.statementFailed)).toBeNull()
  })

  it('still says the statement could not be loaded when it never was', async () => {
    // In German, so the error's own English is not what is shown (#262).
    await i18n.changeLanguage('de')
    state.applications = [pending]
    state.detail = { data: undefined, isPending: false, isError: true, error: new Error('boom') }
    const user = userEvent.setup()
    show(<AdminTeacherApplicationsPage />)

    await user.click(screen.getByRole('button', { name: /Lea Muster/ }))

    expect(screen.getByText(deAdmin.teacherApplications.statementFailed)).toBeInTheDocument()
    expect(screen.queryByText(deAdmin.teacherApplications.statementRefreshFailed)).toBeNull()
  })
})
