import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ChatPage } from '@/pages/chat/ChatPage'

const conversation = {
  id: 'conv-1',
  subject: 'math',
  grade: 'Grade 6',
  title: 'Brüche',
  createdAt: '2026-09-26T10:00:00Z',
  updatedAt: '2026-09-26T10:01:00Z',
  messageCount: 2,
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en', language: 'en' },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}))

vi.mock('@/hooks/student/useStudentProfileQuery', () => ({
  useStudentProfileQuery: () => ({ data: { grade: 'Grade 6', primarySubjects: [] }, isLoading: false }),
}))
vi.mock('@/hooks/chat/useConversationsQuery', () => ({
  useConversationsQuery: () => ({ data: { items: [conversation] }, isLoading: false }),
}))
vi.mock('@/hooks/chat/useConversationQuery', () => ({
  useConversationQuery: (id: string | null) => ({
    data: id
      ? {
          ...conversation,
          messages: [
            { id: 'm-1', role: 'user', content: 'Wie addiere ich Brüche?', createdAt: '2026-09-26T10:00:00Z' },
            { id: 'm-2', role: 'assistant', content: 'Zuerst den Nenner angleichen.', createdAt: '2026-09-26T10:01:00Z' },
          ],
        }
      : undefined,
    isLoading: false,
  }),
}))
vi.mock('@/hooks/chat/useCreateConversationMutation', () => ({
  useCreateConversationMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
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
  useTeacherHelpMutation: () => ({
    isPending: false,
    mutate: (_payload: unknown, options: { onSuccess: (request: unknown) => void }) =>
      options.onSuccess({ id: 'help-1', conversationId: 'conv-1', status: 'pending' }),
  }),
}))
vi.mock('@/hooks/chat/useTeacherHelpStatusQuery', () => ({
  useTeacherHelpStatusQuery: () => ({ data: undefined }),
}))

function Location() {
  return <p data-testid="location">{useLocation().pathname}</p>
}

// stoasystem/stoa-backend#29 (card 031): card 020 withdrew the classroom, and
// this was the one way left into it - a student whose teacher had joined was
// offered "start video classroom", which led to /classroom/..., a 404.
describe('teacher support in a conversation', () => {
  it('offers no way into the withdrawn video classroom once a teacher has joined', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/chat']}>
          <Routes>
            <Route path="*" element={<><ChatPage /><Location /></>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await userEvent.click(screen.getAllByRole('button', { name: /Brüche/ })[0])
    await userEvent.click(await screen.findByRole('button', { name: 'teacher.cta' }))
    await userEvent.click(await screen.findByRole('button', { name: 'tutorEscalation.confirmJoined' }))

    expect(await screen.findByText('tutorEscalation.joinedTitle')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /startClassroom|preparingLobby/ })).not.toBeInTheDocument()
    expect(document.querySelector('a[href^="/classroom"]')).toBeNull()
    expect(screen.getByTestId('location')).not.toHaveTextContent('/classroom')
  })
})
