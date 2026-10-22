/**
 * #457: what a student has on screen stays when a read behind it fails.
 *
 * - The year group on the Me page is read again after a save. When that read
 *   failed, the form gave way to "can't be loaded right now", right after the
 *   student had saved. Kept, it must show the grade just saved, not go back to
 *   the one before beside "Saved".
 * - Ask's list of conversations is read again as the open conversation moves
 *   (#405, #452) and on a language switch. When that read failed, the list
 *   gave way to "could not be loaded".
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import { GradeGroup } from '@/features/account/GradeGroup'
import i18n from '@/i18n'
import enChat from '@/i18n/locales/en/chat.json'
import enCommon from '@/i18n/locales/en/common.json'
import { ApiError } from '@/services/api/httpClient'
import { getConversations, getConversation } from '@/services/chat/chatApi'
import { getGenerationProgress } from '@/services/chat/chatStreamApi'
import { getStudentProfile, updateStudentProfile } from '@/services/student/studentApi'
import { getTeacherAvailability, getTeacherHelpRequest } from '@/services/teacherHelp/teacherHelpApi'
import { getMyMemorySummary } from '@/services/learning/memoryApi'
import { resetAsk, useAskStore } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { StudentProfile } from '@/types/student'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/services/chat/chatApi', () => ({
  getConversations: vi.fn(),
  getConversation: vi.fn(),
  createConversation: vi.fn(),
}))
vi.mock('@/services/chat/chatStreamApi', () => ({
  streamConversationMessage: vi.fn(),
  getGenerationProgress: vi.fn(),
}))
vi.mock('@/services/teacherHelp/teacherHelpApi', () => ({
  getTeacherAvailability: vi.fn(),
  getTeacherHelpRequest: vi.fn(),
  createTeacherHelpRequest: vi.fn(),
}))
vi.mock('@/services/student/studentApi', () => ({
  getStudentProfile: vi.fn(),
  updateStudentProfile: vi.fn(),
}))
vi.mock('@/services/learning/memoryApi', () => ({
  getMyMemorySummary: vi.fn(),
}))

const upstream = () => new ApiError('upstream', { status: 503 })

function profile(grade: string): StudentProfile {
  return {
    id: 'u-1',
    userId: 'u-1',
    name: 'Lina Meier',
    email: 'lina@example.com',
    grade,
    primarySubjects: ['math'],
    preferredAnswerLanguage: 'de',
    guardianStatus: 'not_linked',
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-01T09:00:00Z',
  }
}

function summary(id: string, title: string) {
  return { id, title, subject: 'math', grade: '8', updatedAt: '2026-10-20T10:00:00.000Z' }
}

function open(ui: ReactNode, path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="*" element={ui} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return client
}

/** What AppProviders does when the reader changes language. */
async function readEverythingAgain(client: QueryClient) {
  await act(async () => {
    await client.invalidateQueries()
  })
}

const originalMatchMedia = window.matchMedia

beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.mocked(getStudentProfile).mockReset()
  vi.mocked(updateStudentProfile).mockReset()
  vi.mocked(getConversations).mockReset()
  vi.mocked(getConversation).mockReset()
  vi.mocked(getTeacherAvailability).mockResolvedValue({ online: true, availableTeachers: 2 })
  vi.mocked(getTeacherHelpRequest).mockRejectedValue(new ApiError('never escalated', { status: 404 }))
  vi.mocked(getMyMemorySummary).mockResolvedValue({ recommendations: [], weakTopics: [] } as never)
  vi.mocked(getGenerationProgress).mockResolvedValue({
    conversationId: 'c1',
    steps: [],
    updatedAt: '2026-10-20T10:00:00.000Z',
  } as never)
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  sessionStorage.clear()
})

afterAll(async () => {
  await i18n.changeLanguage('en')
})

describe('the year group read again (#457)', () => {
  const field = () => screen.getByRole('textbox', { name: enCommon.me.grade.label })

  it('keeps the form, with the grade just saved, when the read after the save fails', async () => {
    vi.mocked(getStudentProfile).mockResolvedValueOnce(profile('7')).mockRejectedValue(upstream())
    vi.mocked(updateStudentProfile).mockResolvedValue(profile('8'))
    const user = userEvent.setup()
    open(<GradeGroup />)
    await waitFor(() => expect(field()).toHaveValue('7'))

    await user.clear(field())
    await user.type(field(), '8')
    await user.click(screen.getByRole('button', { name: enCommon.me.grade.save }))
    await waitFor(() => expect(getStudentProfile).toHaveBeenCalledTimes(2))

    expect(await screen.findByRole('alert')).toHaveTextContent(enCommon.me.grade.refreshFailed)
    expect(screen.getByRole('status')).toHaveTextContent(enCommon.me.grade.saved)
    expect(field()).toHaveValue('8')
    // Nothing left to save: the grade on the page is the one saved.
    expect(screen.getByRole('button', { name: enCommon.me.grade.save })).toBeDisabled()
    expect(screen.queryByText(enCommon.me.grade.unavailable)).toBeNull()
  })

  it('keeps the form and what is being typed when a language switch cannot read the profile again', async () => {
    vi.mocked(getStudentProfile).mockResolvedValueOnce(profile('7')).mockRejectedValue(upstream())
    const user = userEvent.setup()
    const client = open(<GradeGroup />)
    await waitFor(() => expect(field()).toHaveValue('7'))
    await user.clear(field())
    await user.type(field(), '9')

    await readEverythingAgain(client)

    expect(await screen.findByRole('alert')).toHaveTextContent(enCommon.me.grade.refreshFailed)
    expect(field()).toHaveValue('9')
    expect(screen.getByRole('button', { name: enCommon.me.grade.save })).toBeEnabled()
  })

  it('still says the year group is unavailable when it was never read', async () => {
    vi.mocked(getStudentProfile).mockRejectedValue(upstream())
    open(<GradeGroup />)

    expect(await screen.findByText(enCommon.me.grade.unavailable)).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: enCommon.me.grade.label })).toBeNull()
    expect(screen.queryByText(enCommon.me.grade.refreshFailed)).toBeNull()
  })
})

describe('Ask’s list read again (#457)', () => {
  function emulateDesktop() {
    window.matchMedia = ((query: string) => ({
      matches: !query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia
  }

  function openAsk() {
    emulateDesktop()
    useAuthStore.setState({
      user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
      accessToken: 'token',
      isAuthenticated: true,
    })
    resetAsk()
    useAskStore.getState().select('u-1', null)
    return open(<AskHost />, '/planet/math')
  }

  const panel = () => within(document.querySelector<HTMLElement>('[data-ask-surface]')!)
  const LIST = { items: [summary('c1', 'Linear equations'), summary('c2', 'Fractions')] }

  it('keeps the conversations, says the list could not be refreshed, and reads it again on request', async () => {
    vi.mocked(getStudentProfile).mockResolvedValue(profile('8'))
    vi.mocked(getConversations)
      .mockResolvedValueOnce(LIST)
      .mockRejectedValueOnce(upstream())
      .mockResolvedValueOnce(LIST)
    const user = userEvent.setup()
    const client = openAsk()
    await panel().findByRole('button', { name: /Fractions/ })

    await readEverythingAgain(client)

    expect(await panel().findByRole('alert')).toHaveTextContent(enChat.ask.list.refreshFailed)
    expect(panel().getByRole('button', { name: /Linear equations/ })).toBeInTheDocument()
    expect(panel().getByRole('button', { name: /Fractions/ })).toBeInTheDocument()
    expect(panel().queryByText(enChat.ask.list.failed)).toBeNull()

    await user.click(panel().getByRole('button', { name: enChat.ask.list.retry }))
    await waitFor(() => expect(panel().queryByRole('alert')).toBeNull())
    expect(getConversations).toHaveBeenCalledTimes(3)
    expect(panel().getByRole('button', { name: /Fractions/ })).toBeInTheDocument()
  })

  it('still puts the failure and Try again in place of a list that was never read', async () => {
    vi.mocked(getStudentProfile).mockResolvedValue(profile('8'))
    vi.mocked(getConversations).mockRejectedValue(upstream())
    openAsk()

    expect(await panel().findByRole('alert')).toHaveTextContent(enChat.ask.list.failed)
    expect(panel().getAllByRole('alert')).toHaveLength(1)
    expect(panel().getByRole('button', { name: enChat.ask.list.retry })).toBeInTheDocument()
  })
})
