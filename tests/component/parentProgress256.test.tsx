/**
 * #256: the parent's child progress page and the reports page.
 *
 * 1. Nothing linked to /parent/children/:id/progress, and once there a parent
 *    read the raw assignment status ("assigned") and the backend's English
 *    error text.
 * 2. The reports page drew "0 Children" from an empty list while the children
 *    were still loading, and after they failed to load.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import deParent from '@/i18n/locales/de/parent.json'
import enParent from '@/i18n/locales/en/parent.json'
import frParent from '@/i18n/locales/fr/parent.json'
import itParent from '@/i18n/locales/it/parent.json'
import dePractice from '@/i18n/locales/de/practice.json'
import enPractice from '@/i18n/locales/en/practice.json'
import frPractice from '@/i18n/locales/fr/practice.json'
import itPractice from '@/i18n/locales/it/practice.json'
import { ParentChildProgressPage } from '@/pages/parent/ParentChildProgressPage'
import { ParentReportsPage } from '@/pages/parent/ParentReportsPage'
import { ApiError } from '@/services/api/httpClient'
import { useAuthStore } from '@/store/authStore'

const state = vi.hoisted(() => ({
  children: { isLoading: false, isError: false, data: undefined as unknown },
  progress: { isLoading: false, error: null as unknown, data: undefined as unknown },
}))

vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useAdminNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled' }),
}))
vi.mock('@/hooks/parent/useParentChildrenQuery', () => ({
  useParentChildrenQuery: () => state.children,
}))
vi.mock('@/hooks/learning/useLearningOperationsQueries', () => ({
  useParentChildProgressQuery: () => state.progress,
}))

const LANGUAGES = { en: [enParent, enPractice], de: [deParent, dePractice], fr: [frParent, frPractice], it: [itParent, itPractice] } as const
const initialLanguage = i18n.language

function wrap(path: string, page: ReactNode, pattern = path) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={pattern} element={page} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function assignment(status: string, id = `a-${status}`) {
  return {
    assignmentId: id,
    studentId: 'child-1',
    status,
    sourceType: 'curriculum_exercise',
    sourceId: 'ex-1',
    title: `Practice ${id}`,
    subject: 'math',
    topicIds: [],
  }
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  useAuthStore.setState({
    user: { id: 'p-1', name: 'Rita Vogt', email: 'rita@example.ch', role: 'parent' } as never,
    accessToken: 'token',
    isAuthenticated: true,
  })
  state.children = { isLoading: false, isError: false, data: undefined }
  state.progress = { isLoading: false, error: null, data: undefined }
})

afterEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

afterAll(async () => {
  await i18n.changeLanguage(initialLanguage)
})

describe('#256.1: the child progress page', () => {
  it('is reachable from each child on the reports page', () => {
    state.children = {
      isLoading: false,
      isError: false,
      data: { items: [{ id: 'child-1', name: 'Nina Vogt', grade: '5', subjects: [] }] },
    }
    wrap('/parent/reports', <ParentReportsPage />)

    const link = screen.getByRole('link', { name: new RegExp(enParent.reports.progressLink) })
    expect(link).toHaveAttribute('href', '/parent/children/child-1/progress')
  })

  for (const [language, [parent, practice]] of Object.entries(LANGUAGES)) {
    it(`names the assignment status in ${language}, and an unknown one as unavailable`, async () => {
      await i18n.changeLanguage(language)
      state.progress = {
        isLoading: false,
        error: null,
        data: {
          assignedPracticeCount: 1,
          completedPracticeCount: 1,
          weakAreas: [],
          assignments: [assignment('assigned'), assignment('queued_by_server')],
          completedAssignments: [assignment('completed')],
        },
      }
      wrap('/parent/children/child-1/progress', <ParentChildProgressPage />, '/parent/children/:childId/progress')

      expect(screen.getByText(practice.assignments.status.assigned)).toBeInTheDocument()
      expect(screen.getByText(practice.assignments.status.completed)).toBeInTheDocument()
      expect(screen.getByText(practice.assignments.status.unknown)).toBeInTheDocument()
      expect(screen.queryByText('assigned')).not.toBeInTheDocument()
      expect(screen.queryByText('queued_by_server')).not.toBeInTheDocument()
      expect(screen.getByText(parent.progress.activeAssignments)).toBeInTheDocument()
    })

    it(`says the load failed in ${language}, not the backend's text`, async () => {
      await i18n.changeLanguage(language)
      state.progress = {
        isLoading: false,
        error: new ApiError('Student is not linked to this parent', { status: 403 }),
        data: undefined,
      }
      wrap('/parent/children/child-1/progress', <ParentChildProgressPage />, '/parent/children/:childId/progress')

      const alert = screen.getByRole('alert')
      expect(within(alert).getByText(parent.progress.loadFailedMessage)).toBeInTheDocument()
      expect(screen.queryByText(/not linked to this parent/)).not.toBeInTheDocument()
    })
  }
})

describe('#256.2: the reports page child count', () => {
  const count = () => screen.queryByText(enParent.reports.children)

  it('is not shown while the children load', () => {
    state.children = { isLoading: true, isError: false, data: undefined }
    wrap('/parent/reports', <ParentReportsPage />)
    expect(count()).not.toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('is not shown after they fail to load', () => {
    state.children = { isLoading: false, isError: true, data: undefined }
    wrap('/parent/reports', <ParentReportsPage />)
    expect(screen.getByText(enParent.loadChildrenFailed)).toBeInTheDocument()
    expect(count()).not.toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('is shown once they have loaded, including a real zero', () => {
    state.children = { isLoading: false, isError: false, data: { items: [] } }
    wrap('/parent/reports', <ParentReportsPage />)
    expect(count()).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
