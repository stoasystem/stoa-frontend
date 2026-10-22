/**
 * #408: Ask puts the list of conversations and one conversation in each
 * other's place, and the row or the back arrow that was pressed goes with
 * them. The keyboard goes to the conversation's title on the way in, and back
 * to the row it left on the way out -- else the list, else the title. Where it
 * was not lost, it stays: a question sent from the list keeps the cursor in
 * the composer. The line that says a conversation is being started is a
 * region that is there before it, so what it says is read.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import i18n from '@/i18n'
import { ApiError } from '@/services/api/httpClient'
import { createConversation, getConversation, getConversations } from '@/services/chat/chatApi'
import { getGenerationProgress } from '@/services/chat/chatStreamApi'
import { resetAsk, useAskStore } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/services/chat/chatApi', () => ({
  getConversations: vi.fn(),
  getConversation: vi.fn(async (id: string) => ({
    id,
    title: id === 'c2' ? 'Fractions' : 'Linear equations',
    subject: 'math',
    grade: '8',
    updatedAt: '2026-10-20T10:00:00.000Z',
    messages: [],
  })),
  createConversation: vi.fn(),
}))
vi.mock('@/services/chat/chatStreamApi', () => ({
  streamConversationMessage: vi.fn(),
  getGenerationProgress: vi.fn(),
}))
vi.mock('@/services/teacherHelp/teacherHelpApi', () => ({
  getTeacherAvailability: vi.fn(async () => ({ online: true, availableTeachers: 2 })),
  getTeacherHelpRequest: vi.fn(async () => {
    throw new ApiError('never escalated', { status: 404 })
  }),
  createTeacherHelpRequest: vi.fn(),
}))
vi.mock('@/services/student/studentApi', () => ({
  getStudentProfile: vi.fn(async () => ({ grade: '8', primarySubjects: ['math'] })),
}))
vi.mock('@/services/learning/memoryApi', () => ({
  getMyMemorySummary: vi.fn(async () => ({ recommendations: [], weakTopics: [] })),
}))

const summary = (id: string, title: string) => ({
  id,
  title,
  subject: 'math',
  grade: '8',
  updatedAt: '2026-10-20T10:00:00.000Z',
})

const created = (id: string) => ({ ...summary(id, 'What is a prime?'), messages: [] })

function emulateWidth(width: number) {
  window.matchMedia = ((query: string) => {
    const min = query.match(/min-width:\s*(\d+)px/)
    return {
      matches: !query.includes('prefers-reduced-motion') && (!min || width >= Number(min[1])),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }
  }) as typeof window.matchMedia
}

function DirectAsk() {
  const { conversationId } = useParams()
  return <AskHost route={{ conversationId: conversationId ?? null }} />
}

/** Ask from the planet, opened on `conversationId` (`null`: the list), or at `/ask` with `direct`. */
function show({ width = 1280, conversationId = null, direct = false }: { width?: number; conversationId?: string | null; direct?: boolean } = {}) {
  emulateWidth(width)
  if (!direct) useAskStore.getState().select('u-1', conversationId)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[direct ? '/ask' : '/planet/math']}>
          <Routes>
            <Route path="/ask/:conversationId?" element={<DirectAsk />} />
            <Route path="*" element={<AskHost />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

/** The desktop panel or the phone sheet. */
const surface = () => document.querySelector<HTMLElement>('[data-ask-surface]')!
const panel = () => within(surface())
const row = (id: string) => document.querySelector<HTMLElement>(`[data-conversation-id="${id}"]`)!

/** Pressed from the keyboard: focused, then Enter. */
async function press(control: HTMLElement) {
  control.focus()
  await userEvent.keyboard('{Enter}')
}

const originalMatchMedia = window.matchMedia

beforeEach(async () => {
  await i18n.changeLanguage('en')
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  resetAsk()
  vi.mocked(getConversations).mockResolvedValue({
    items: [summary('c1', 'Linear equations'), summary('c2', 'Fractions')],
  })
  vi.mocked(getGenerationProgress).mockResolvedValue({
    conversationId: 'c-new',
    steps: [],
    updatedAt: new Date().toISOString(),
    status: 'ai_running',
  })
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe.each([
  ['the desktop panel', 1280],
  ['the phone sheet', 375],
])('the keyboard between the list and a conversation, in %s', (_, width) => {
  it('goes to the conversation’s title when one is opened from the list', async () => {
    show({ width })
    await panel().findByRole('button', { name: /Fractions/ })

    await press(row('c2'))

    expect(surface()).toHaveAttribute('data-ask-conversation', 'c2')
    expect(await panel().findByRole('heading', { level: 2, name: 'Fractions' })).toHaveFocus()
  })

  it('goes back to the row it left', async () => {
    show({ width })
    await panel().findByRole('button', { name: /Fractions/ })
    await press(row('c2'))
    await panel().findByRole('heading', { level: 2, name: 'Fractions' })

    await press(panel().getByRole('button', { name: 'All conversations' }))

    expect(surface()).toHaveAttribute('data-ask-conversation', '')
    expect(row('c2')).toHaveFocus()
  })
})

describe('the title the keyboard lands on, before the conversation is read (#452)', () => {
  it('names the conversation as the list does, not “Ask”', async () => {
    let read: (value: ReturnType<typeof created>) => void = () => {}
    vi.mocked(getConversation).mockImplementationOnce(() => new Promise((resolve) => (read = resolve)))
    show()
    await panel().findByRole('button', { name: /Fractions/ })

    await press(row('c2'))

    expect(panel().getByRole('heading', { level: 2, name: 'Fractions' })).toHaveFocus()
    expect(panel().getByText('Mathematics')).toBeInTheDocument()

    await act(async () => read({ ...summary('c2', 'Fractions'), messages: [] }))
    expect(panel().getByRole('heading', { level: 2, name: 'Fractions' })).toHaveFocus()
  })
})

describe('the way back to a list without that row', () => {
  it('goes to the list when the conversation left is not in it', async () => {
    show({ conversationId: 'c9' })
    await panel().findByRole('heading', { level: 2, name: 'Linear equations' })

    await press(panel().getByRole('button', { name: 'All conversations' }))

    expect(panel().getByRole('navigation', { name: 'Conversations' })).toHaveFocus()
  })

  it('goes to the title when there is no list to go back to', async () => {
    vi.mocked(getConversations).mockResolvedValue({ items: [] })
    show({ conversationId: 'c9' })
    await panel().findByRole('heading', { level: 2, name: 'Linear equations' })

    await press(panel().getByRole('button', { name: 'All conversations' }))

    expect(panel().getByRole('heading', { level: 2, name: 'Ask' })).toHaveFocus()
  })
})

describe('Ask at /ask', () => {
  it('moves the keyboard the same way when the address says which conversation is open', async () => {
    show({ direct: true })
    await panel().findByRole('button', { name: /Fractions/ })

    await press(row('c2'))
    expect(await panel().findByRole('heading', { level: 2, name: 'Fractions' })).toHaveFocus()

    await press(panel().getByRole('button', { name: 'All conversations' }))
    expect(row('c2')).toHaveFocus()
  })
})

describe('a question sent from the list', () => {
  it('leaves the cursor in the composer when its conversation opens', async () => {
    vi.mocked(createConversation).mockResolvedValue(created('c-new'))
    show()
    const field = panel().getByRole('textbox', { name: 'Your question' })

    await userEvent.type(field, 'What is a prime?{Enter}')

    await vi.waitFor(() => expect(surface()).toHaveAttribute('data-ask-conversation', 'c-new'))
    expect(field).toHaveFocus()
  })

  it('says the conversation is being started in a region that was there before it', async () => {
    let finish: (value: ReturnType<typeof created>) => void = () => {}
    vi.mocked(createConversation).mockImplementation(() => new Promise((resolve) => (finish = resolve)))
    show()
    const region = document.querySelector<HTMLElement>('[data-ask-starting]')
    expect(region).toHaveAttribute('role', 'status')
    expect(region).toBeEmptyDOMElement()

    await userEvent.type(panel().getByRole('textbox', { name: 'Your question' }), 'What is a prime?{Enter}')

    expect(document.querySelector('[data-ask-starting]')).toBe(region)
    expect(region).toHaveTextContent('Starting the conversation…')
    await act(async () => finish(created('c-new')))
  })
})
