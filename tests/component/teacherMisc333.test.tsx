/**
 * #333: two loose ends on the teacher side.
 *
 * T5 - the learning automation console asks for a student id, and a teacher
 *      sees no student id anywhere. The help request linked to the console
 *      with its student filled in, until the console was hidden from
 *      teachers (#703): the link is gone, and the console still reads
 *      `?studentId=` on the routes that keep it.
 * T7 - the "Assigned" filter was always empty (the teacher list carries the
 *      stored status, which is never "assigned"), and an empty filter said
 *      "No teacher support requests are available", as if there were none.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { LearningAutomationConsolePage } from '@/pages/learning/LearningAutomationConsolePage'
import { TeacherDashboardPage } from '@/pages/teacher/TeacherDashboardPage'
import { TeacherHelpRequestDetailPage } from '@/pages/teacher/TeacherHelpRequestDetailPage'
import { getStudentAssignments } from '@/services/learning/learningOperationsApi'
import * as teacherApi from '@/services/teacher/teacherApi'
import type { TeacherHelpRequestSummary } from '@/types/teacher'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/teacher/teacherApi', async (orig) => ({
  ...(await orig<typeof import('@/services/teacher/teacherApi')>()),
  getTeacherStats: vi.fn(),
  getTeacherHelpRequests: vi.fn(),
  getTeacherHelpRequestDetail: vi.fn(),
}))
vi.mock('@/services/learning/learningOperationsApi', async (orig) => ({
  ...(await orig<typeof import('@/services/learning/learningOperationsApi')>()),
  getStudentAssignments: vi.fn(),
}))
vi.mock('@/hooks/practice/useCurriculumCatalogQuery', () => ({
  useCurriculumCatalogQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

function Where() {
  const location = useLocation()
  return <output data-testid="where">{location.pathname + location.search}</output>
}

function renderAt(path: string, routes: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>{routes}</Routes>
          <Where />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

function summary(requestId: string, status: TeacherHelpStatus): TeacherHelpRequestSummary {
  return {
    requestId,
    conversationId: `c-${requestId}`,
    studentName: `Student ${requestId}`,
    subject: 'mathematics',
    grade: '8',
    status,
    createdAt: '2026-10-20T08:00:00Z',
  }
}

beforeEach(async () => {
  vi.clearAllMocks()
  vi.mocked(teacherApi.getTeacherStats).mockResolvedValue({
    pendingRequests: 0,
    resolvedToday: 0,
    averageResponseTimeMinutes: 0,
  })
  vi.mocked(getStudentAssignments).mockResolvedValue({ items: [], count: 0 })
  await i18n.changeLanguage('en')
})

afterAll(async () => {
  await i18n.changeLanguage('en')
})

describe('T5: from a help request to the automation console', () => {
  it('no longer links the request to the console: it is hidden from teachers (#703)', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue({
      requestId: 'r1', conversationId: 'c1', student: { id: 'stu/42', name: 'Lea', grade: '8' },
      subject: 'mathematics', status: 'in_progress', messages: [], notes: [],
    } as never)
    renderAt('/teacher/requests/r1', <Route path="/teacher/requests/:requestId" element={<TeacherHelpRequestDetailPage />} />)

    // The request has loaded (its student is on screen) before the absence is read.
    expect((await screen.findAllByText(/Lea/)).length).toBeGreaterThan(0)
    for (const link of screen.queryAllByRole('link')) {
      expect(link.getAttribute('href') ?? '').not.toContain('learning-automation')
    }
    expect(screen.queryByRole('link', { name: /learning automation/i })).not.toBeInTheDocument()
  })

  it('starts the console on the student named in the address', async () => {
    renderAt('/admin/learning-automation?studentId=stu%2F42', <Route path="/admin/learning-automation" element={<LearningAutomationConsolePage />} />)

    expect(await screen.findByLabelText('Student id')).toHaveValue('stu/42')
    // The history is read for that student at once, not after the field is left.
    await waitFor(() => expect(getStudentAssignments).toHaveBeenCalledWith('stu/42', true))
  })

  it('still opens empty without a student in the link', async () => {
    renderAt('/admin/learning-automation', <Route path="/admin/learning-automation" element={<LearningAutomationConsolePage />} />)
    expect(await screen.findByLabelText('Student id')).toHaveValue('')
    expect(getStudentAssignments).not.toHaveBeenCalled()
  })

  it('has the filter copy in all four languages, and no longer the link copy', () => {
    for (const lng of ['en', 'de', 'fr', 'it']) {
      expect(i18n.getResource(lng, 'teacher', 'detail.openAutomation')).toBeUndefined()
      expect(i18n.getResource(lng, 'teacher', 'requests.emptyFiltered')).toContain('{{status}}')
    }
  })
})

describe('T7: the request filters', () => {
  const renderBoard = () => renderAt('/teacher', <Route path="/teacher" element={<TeacherDashboardPage />} />)

  it('offers no "Assigned" filter', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequests).mockResolvedValue({ items: [summary('r1', 'pending')] })
    renderBoard()
    const filters = await screen.findByRole('group', { name: 'Filter requests' })
    expect(within(filters).queryByRole('button', { name: 'Assigned' })).toBeNull()
    expect(within(filters).getAllByRole('button').map((button) => button.textContent)).toEqual([
      'All',
      'Pending',
      'In progress',
      'Resolved',
    ])
  })

  it('says a filtered list is empty because of the filter', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequests).mockResolvedValue({ items: [summary('r1', 'pending')] })
    renderBoard()
    const filters = await screen.findByRole('group', { name: 'Filter requests' })
    fireEvent.click(within(filters).getByRole('button', { name: 'Resolved' }))

    expect(await screen.findByText('No requests with the status “Resolved”.')).toBeInTheDocument()
    expect(screen.queryByText('No teacher support requests are available.')).toBeNull()
  })

  it('keeps the plain empty message when there are no requests at all', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequests).mockResolvedValue({ items: [] })
    renderBoard()
    expect(await screen.findByText('No teacher support requests are available.')).toBeInTheDocument()
  })
})
