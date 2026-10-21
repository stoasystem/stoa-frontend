/**
 * #410 (part 1): a teacher hears what went wrong.
 *
 * A status change that failed printed its line without a role, and focus went
 * to the request card, so a screen reader read the card out and the teacher
 * took the change for done. A request, the request list or the profile that
 * could not be read said so without a role either.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import de from '@/i18n/locales/de/teacher.json'
import { TeacherDashboardPage } from '@/pages/teacher/TeacherDashboardPage'
import { TeacherHelpRequestDetailPage } from '@/pages/teacher/TeacherHelpRequestDetailPage'
import { TeacherProfilePage } from '@/pages/teacher/TeacherProfilePage'
import { ApiError } from '@/services/api/httpClient'
import * as teacherApi from '@/services/teacher/teacherApi'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/teacher/teacherApi', async (orig) => ({
  ...(await orig<typeof import('@/services/teacher/teacherApi')>()),
  getTeacherHelpRequestDetail: vi.fn(),
  getTeacherHelpRequests: vi.fn(),
  getTeacherStats: vi.fn(() => new Promise(() => {})),
  getTeacherProfile: vi.fn(),
  updateTeacherHelpRequestStatus: vi.fn(),
  addTeacherHelpRequestNote: vi.fn(),
  getTeacherAssistanceSummary: vi.fn(() => new Promise(() => {})),
}))
vi.mock('@/hooks/practice/useCurriculumCatalogQuery', () => ({
  useCurriculumCatalogQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

function detail(status: TeacherHelpStatus) {
  return {
    requestId: 'r1', conversationId: 'c1', student: { id: 's1', name: 'Lea', grade: '8' },
    subject: 'mathematics', status, messages: [], notes: [],
  } as never
}

function renderAt(path: string, element: ReactNode, route = path) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <Routes><Route path={route} element={element} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const renderDetail = () => renderAt('/teacher/requests/r1', <TeacherHelpRequestDetailPage />, '/teacher/requests/:requestId')

/** Presses "Prüfung starten" and lets the change fail with `error`. */
async function failStatusChange(error: unknown) {
  vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('pending'))
  let refuse: (reason: unknown) => void = () => {}
  vi.mocked(teacherApi.updateTeacherHelpRequestStatus).mockReturnValue(
    new Promise((_, reject) => { refuse = reject }) as never,
  )
  renderDetail()
  await userEvent.click(await screen.findByRole('button', { name: de.markInProgress }))
  // The pressed button is disabled while the change is out: focus is lost.
  expect(screen.getByRole('button', { name: de.markInProgress })).toBeDisabled()
  await act(async () => refuse(error))
}

beforeEach(async () => {
  vi.clearAllMocks()
  sessionStorage.clear()
  await i18n.changeLanguage('de')
})

describe('a status change that fails', () => {
  it('says so as an alert, and focus goes to that alert, not to the request', async () => {
    await failStatusChange(new ApiError('boom', { status: 500 }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(de.detail.updateFailed)
    await waitFor(() => expect(alert).toHaveFocus())
    expect(document.activeElement).not.toHaveTextContent('Lea')
  })

  it('takes focus to the alert too when the request had moved on', async () => {
    await failStatusChange(new ApiError('changed', { status: 409, code: 'help_request_changed' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(de.detail.changedElsewhere)
    await waitFor(() => expect(alert).toHaveFocus())
  })

  it('still puts focus on the request once a change goes through', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockResolvedValue(detail('pending'))
    let finish: (value: unknown) => void = () => {}
    vi.mocked(teacherApi.updateTeacherHelpRequestStatus).mockReturnValue(
      new Promise((resolve) => { finish = resolve }) as never,
    )
    renderDetail()
    await userEvent.click(await screen.findByRole('button', { name: de.markInProgress }))
    await act(async () => finish({ requestId: 'r1', status: 'in_progress' }))

    await waitFor(() => expect(document.activeElement).toHaveAttribute('tabindex', '-1'))
    expect(document.activeElement).toHaveTextContent('Lea')
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('a read that fails', () => {
  it('is an alert on the request page', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequestDetail).mockRejectedValue(new ApiError('gone', { status: 404 }))
    renderDetail()
    expect(await screen.findByRole('alert')).toHaveTextContent(de.detail.loadFailed)
  })

  it('is an alert on the dashboard', async () => {
    vi.mocked(teacherApi.getTeacherHelpRequests).mockRejectedValue(new ApiError('boom', { status: 500 }))
    renderAt('/teacher', <TeacherDashboardPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent(de.loadRequestsFailed)
  })

  it('is an alert on the profile', async () => {
    vi.mocked(teacherApi.getTeacherProfile).mockRejectedValue(new ApiError('boom', { status: 500 }))
    renderAt('/teacher/profile', <TeacherProfilePage />)
    expect(await screen.findByRole('alert')).toHaveTextContent(de.profile.loadFailed)
  })
})
