/**
 * #416: a help request's detail page read the whole curriculum catalog with
 * its previews (`/practice/curriculum/catalog?includePreview=true`) before the
 * request had said its subject, then again for that subject. The catalog is
 * read once, when the request is in.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import de from '@/i18n/locales/de/practice.json'
import { TeacherHelpRequestDetailPage } from '@/pages/teacher/TeacherHelpRequestDetailPage'
import { getCurriculumCatalog } from '@/services/practice/practiceApi'
import { getTeacherHelpRequestDetail } from '@/services/teacher/teacherApi'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/teacher/teacherApi', async (orig) => ({
  ...(await orig<typeof import('@/services/teacher/teacherApi')>()),
  getTeacherHelpRequestDetail: vi.fn(),
  getTeacherAssistanceSummary: vi.fn(() => new Promise(() => {})),
}))
vi.mock('@/services/practice/practiceApi', async (orig) => ({
  ...(await orig<typeof import('@/services/practice/practiceApi')>()),
  getCurriculumCatalog: vi.fn(() => new Promise(() => {})),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

function detail(subject: string) {
  return {
    requestId: 'r1', conversationId: 'c1', student: { id: 's1', name: 'Lea', grade: '8' },
    subject, status: 'pending', messages: [], notes: [],
  } as never
}

/** The page, with the request handed over only when `arrive` is called. */
function openDetail(request: unknown) {
  let arrive = () => {}
  vi.mocked(getTeacherHelpRequestDetail).mockImplementation(
    () => new Promise((resolve) => {
      arrive = () => resolve(request as never)
    }),
  )
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/teacher/requests/r1']}>
          <Routes><Route path="/teacher/requests/:requestId" element={<TeacherHelpRequestDetailPage />} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return () => arrive()
}

beforeEach(async () => {
  vi.clearAllMocks()
  await i18n.changeLanguage('de')
})

describe('the curriculum beside a help request (#416)', () => {
  it('is read once, for the request’s subject, once the request is in', async () => {
    const arrive = openDetail(detail('mathematics'))
    await waitFor(() => expect(getTeacherHelpRequestDetail).toHaveBeenCalled())
    expect(getCurriculumCatalog).not.toHaveBeenCalled()

    arrive()

    expect(await screen.findByText(de.curriculumRollout.teacherTitle)).toBeInTheDocument()
    // Waiting for it from the start, not shown empty first.
    expect(screen.getByText(de.curriculumRollout.loading)).toBeInTheDocument()
    await waitFor(() => expect(getCurriculumCatalog).toHaveBeenCalled())
    expect(getCurriculumCatalog).toHaveBeenCalledTimes(1)
    expect(getCurriculumCatalog).toHaveBeenCalledWith({ subjectId: 'math', gradeLevel: undefined, includePreview: true })
  })

  it('is read once, whole, for a request whose subject is blank', async () => {
    const arrive = openDetail(detail(''))
    await waitFor(() => expect(getTeacherHelpRequestDetail).toHaveBeenCalled())
    expect(getCurriculumCatalog).not.toHaveBeenCalled()

    arrive()

    expect(await screen.findByText(de.curriculumRollout.teacherTitle)).toBeInTheDocument()
    expect(screen.getByText(de.curriculumRollout.loading)).toBeInTheDocument()
    await waitFor(() => expect(getCurriculumCatalog).toHaveBeenCalledTimes(1))
    expect(getCurriculumCatalog).toHaveBeenCalledWith({ subjectId: undefined, gradeLevel: undefined, includePreview: true })
  })
})
