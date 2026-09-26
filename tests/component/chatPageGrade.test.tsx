import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ChatPage } from '@/pages/chat/ChatPage'

const state = vi.hoisted(() => ({
  createConversation: vi.fn(),
  profile: { grade: '' as string | null, primarySubjects: [] as string[] },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en', language: 'en' },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}))

vi.mock('@/hooks/student/useStudentProfileQuery', () => ({
  useStudentProfileQuery: () => ({ data: state.profile, isLoading: false }),
}))
vi.mock('@/hooks/chat/useConversationsQuery', () => ({
  useConversationsQuery: () => ({ data: { items: [] }, isLoading: false }),
}))
vi.mock('@/hooks/chat/useConversationQuery', () => ({
  useConversationQuery: () => ({ data: undefined, isLoading: false }),
}))
vi.mock('@/hooks/chat/useCreateConversationMutation', () => ({
  useCreateConversationMutation: () => ({
    mutate: state.createConversation,
    isPending: false,
    isError: false,
  }),
}))
vi.mock('@/hooks/chat/useStreamingChat', () => ({
  useStreamingChat: () => ({
    localMessages: [],
    isStreaming: false,
    sendStreamingMessage: vi.fn(),
    stopStreaming: vi.fn(),
    retryMessage: vi.fn(),
  }),
  mergeWithServerMessages: (messages: unknown[]) => messages,
}))
vi.mock('@/hooks/chat/useTeacherHelpMutation', () => ({
  useTeacherHelpMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/chat/useTeacherHelpStatusQuery', () => ({
  useTeacherHelpStatusQuery: () => ({ data: undefined }),
}))
vi.mock('@/features/live-classroom/hooks/useInstantVideoHelp', () => ({
  useInstantVideoHelp: () => ({ mutate: vi.fn(), isPending: false }),
}))

async function startConversation() {
  render(
    <MemoryRouter initialEntries={['/chat']}>
      <ChatPage />
    </MemoryRouter>,
  )
  await userEvent.type(screen.getByLabelText('newConversationLabel'), 'Was ist eine Ableitung?')
  await userEvent.click(screen.getByRole('button', { name: 'startConversation' }))
  expect(state.createConversation).toHaveBeenCalledOnce()
  return state.createConversation.mock.calls[0][0] as { subject: string; grade: string }
}

// stoasystem/stoa-backend#50: the backend owns what an unknown grade means, so
// the page sends none rather than inventing one.
describe('the grade a new conversation is opened with', () => {
  beforeEach(() => {
    state.createConversation.mockReset()
    sessionStorage.clear()
  })

  it.each(['', '   ', null])('is sent empty when the profile has none (%j)', async (grade) => {
    state.profile = { grade, primarySubjects: [] }
    const payload = await startConversation()
    expect(payload.grade).toBe('')
    expect(screen.getByText('gradeMissingHint')).toBeInTheDocument()
  })

  it('is the profile grade when there is one', async () => {
    state.profile = { grade: 'Grade 6', primarySubjects: [] }
    const payload = await startConversation()
    expect(payload.grade).toBe('Grade 6')
    expect(screen.queryByText('gradeMissingHint')).not.toBeInTheDocument()
  })
})
