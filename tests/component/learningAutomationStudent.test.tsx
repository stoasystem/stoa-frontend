/**
 * The automation console opened on a placeholder student, `student-1`, and
 * read its history at once, so every visit by a teacher or an administrator
 * began with a 404 and "Assignment history failed" (app-planet, 2026-10-10,
 * #162). It now waits for a student id, and says plainly when there is none.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Suspense } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { AppRoutes } from '@/app/router/AppRoutes'
import i18n from '@/i18n'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const historyReads: string[] = []

beforeAll(async () => {
  mswServer.listen({ onUnhandledRequest: 'bypass' })
  await import('@/pages/learning/LearningAutomationConsolePage')
})
beforeEach(async () => {
  historyReads.length = 0
  await i18n.changeLanguage('en')
  mswServer.use(
    http.get('https://api.test/adaptive/students/:studentId/assignments', ({ params }) => {
      historyReads.push(String(params.studentId))
      if (params.studentId === 'student_known') return HttpResponse.json({ items: [], count: 0 })
      return HttpResponse.json({ detail: 'not found' }, { status: 404 })
    }),
    http.get('https://api.test/notifications', () => HttpResponse.json({ items: [], count: 0 })),
  )
  useAuthStore.setState({
    user: { id: 't-1', name: 'Test Teacher', email: 'teacher@example.com', role: 'teacher' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
})
afterEach(() => {
  mswServer.resetHandlers()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterAll(() => mswServer.close())

function openConsole() {
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/teacher/learning-automation']}>
          <Suspense fallback={null}>
            <AppRoutes />
          </Suspense>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('the automation console and its student', () => {
  it('reads no history until a student is named, and says so', async () => {
    openConsole()

    expect(await screen.findByText('Enter a student id to see their assignment history.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Student id' })).toHaveValue('')
    expect(screen.queryByText('Assignment history failed')).toBeNull()
    expect(historyReads).toEqual([])
  })

  it('reads the history of the student named, once the field is left', async () => {
    const user = userEvent.setup()
    openConsole()

    await user.type(await screen.findByRole('textbox', { name: 'Student id' }), ' student_known ')
    expect(historyReads).toEqual([])
    await user.tab()

    await waitFor(() => expect(historyReads).toEqual(['student_known']))
    expect(await screen.findByText('No assignment history returned for this student.')).toBeInTheDocument()
  })

  it('says a student was not found rather than that the history failed', async () => {
    const user = userEvent.setup()
    openConsole()

    await user.type(await screen.findByRole('textbox', { name: 'Student id' }), 'student_unknown')
    await user.tab()

    expect(await screen.findByText('No student with this id, or not one you can see.')).toBeInTheDocument()
    expect(screen.queryByText('Assignment history failed')).toBeNull()
  })
})
