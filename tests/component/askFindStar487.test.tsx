/**
 * Finding a star from Ask (#487, CONTEXT.md「找星」).
 *
 * An answer that recognised the star the student wants to go to carries it
 * (`targetUnit`, stoa-backend#124), streamed (`message_done`) and read back
 * (`GET /conversations/{id}`) alike. Under that answer sits one card; pressed,
 * Ask closes and the map flies to the star -- in whichever galaxy it is --
 * and opens its card. An answer without a star shows nothing more.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import { StarMapRoute } from '@/features/starmap/StarMapRoute'
import { DemoStarMapSource } from '@/dev/demo/sky/source'
import i18n from '@/i18n'
import { ApiError } from '@/services/api/httpClient'
import { resetAsk, useAskStore } from '@/store/askStore'
import { useAuthStore } from '@/store/authStore'
import type { ChatMessage, ChatStreamEvent, TargetUnit } from '@/types/chat'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn(), rotateAnalyticsSession: vi.fn() }))
vi.mock('@/services/chat/commandMessageIds', () => ({
  commandMessageIds: vi.fn(async (c: string, k: string) => ({ studentMessageId: `s:${c}:${k}`, assistantMessageId: `a:${c}:${k}` })),
}))
vi.mock('@/services/chat/chatApi', () => ({ getConversations: vi.fn(async () => ({ items: [] })), getConversation: vi.fn(), createConversation: vi.fn() }))
vi.mock('@/services/chat/chatStreamApi', () => ({ streamConversationMessage: vi.fn(), getGenerationProgress: vi.fn() }))
vi.mock('@/services/teacherHelp/teacherHelpApi', () => ({
  getTeacherAvailability: vi.fn(async () => ({ online: false, availableTeachers: 0 })),
  getTeacherHelpRequest: vi.fn(async () => {
    throw new ApiError('x', { status: 404 })
  }),
  createTeacherHelpRequest: vi.fn(),
}))
vi.mock('@/services/student/studentApi', () => ({ getStudentProfile: vi.fn(async () => ({ grade: '8', primarySubjects: ['math'] })) }))
vi.mock('@/services/learning/memoryApi', () => ({ getMyMemorySummary: vi.fn(async () => ({ recommendations: [], weakTopics: [] })) }))

import { getConversation } from '@/services/chat/chatApi'
import { getGenerationProgress, streamConversationMessage } from '@/services/chat/chatStreamApi'

/** The demo sky's physics star (another galaxy than maths, where the map opens) and a maths one. */
const REFRACTION = { unitId: 'demo-refraction', name: 'Refraction', path: '/map/physics/optics/demo-refraction' }
const NUMBERS = { unitId: 'numbers-5', name: 'Numbers 5' }

const cardLabel = () => i18n.t('chat:ask.target.label')
const cards = () => screen.queryAllByRole('region', { name: cardLabel() })

function message(id: string, role: ChatMessage['role'], content: string, targetUnit: TargetUnit | null = null): ChatMessage {
  return { id, conversationId: 'c-1', role, content, createdAt: '2026-10-29T09:00:00Z', status: role === 'student' ? 'sent' : 'completed', targetUnit }
}

function readBack(messages: ChatMessage[]) {
  vi.mocked(getConversation).mockResolvedValue({
    id: 'c-1',
    title: 'Light',
    subject: 'physics',
    grade: '8',
    updatedAt: '2026-10-29T09:00:00Z',
    messages,
  } as never)
}

function wide() {
  window.matchMedia = ((query: string) => ({
    matches: !/reduce/.test(query),
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as never
}

/** Ask opened at `/ask/:id` over the planet, as AskPage has it; the map's routes beside it. */
function AskRoute() {
  const { conversationId } = useParams()
  return (
    <AskHost route={{ conversationId: conversationId ?? null }}>
      <StarMapRoute />
    </AskHost>
  )
}

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

function mount(at = '/ask/c-1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const map = (
    <AskHost>
      <StarMapRoute />
    </AskHost>
  )
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <DemoStarMapSource>
          <MemoryRouter initialEntries={[at]}>
            <Routes>
              <Route path="/ask/:conversationId" element={<AskRoute />} />
              <Route path="/map/:subjectId" element={map} />
              <Route path="/map/:subjectId/:topicId" element={map} />
              <Route path="/map/:subjectId/:topicId/:unitId" element={map} />
            </Routes>
            <Where />
          </MemoryRouter>
        </DemoStarMapSource>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

beforeAll(async () => {
  // The demo sky is laid out on first read; cold, that is more than findBy's second.
  await import('@/dev/demo/sky/source')
}, 30_000)

beforeEach(async () => {
  await i18n.changeLanguage('en')
  wide()
  // jsdom has no 2D canvas; the map draws nothing but keeps its DOM.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  useAuthStore.setState({ user: { id: 'student-a', role: 'student' } as never })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  resetAsk()
  sessionStorage.clear()
  localStorage.clear()
  useAuthStore.setState({ user: null })
})

describe('the card under an answer that found a star (#487)', () => {
  it('shows one card when the conversation is read back', async () => {
    readBack([
      message('m1', 'student', 'I want to practise refraction'),
      message('m2', 'assistant', 'Refraction is in your physics galaxy.', { unitId: REFRACTION.unitId }),
    ])
    mount()

    await screen.findByText('Refraction is in your physics galaxy.')
    await waitFor(() => expect(cards()).toHaveLength(1))
    const card = cards()[0]
    expect(within(card).getByText(REFRACTION.name)).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: i18n.t('chat:ask.target.show') })).toBeInTheDocument()
  })

  it('shows none under an answer without a star', async () => {
    readBack([
      message('m1', 'student', 'What is refraction?'),
      message('m2', 'assistant', 'Light changes direction.', null),
    ])
    mount()

    await screen.findByText('Light changes direction.')
    expect(cards()).toHaveLength(0)
  })

  it('shows one card as soon as a streamed answer ends with a star', async () => {
    readBack([])
    // The answer streams, and the stream ends with the star; the request is
    // held open, so the thread shows the streamed copy, not one read back.
    vi.mocked(streamConversationMessage).mockImplementation(({ onEvent }) => {
      const events: ChatStreamEvent[] = [
        { type: 'message_start', messageId: 'a-1', role: 'assistant', createdAt: '2026-10-29T09:00:00Z' },
        { type: 'message_delta', messageId: 'a-1', delta: 'Off to Numbers 5.' },
        { type: 'message_done', messageId: 'a-1', status: 'completed', targetUnit: { unitId: NUMBERS.unitId } },
      ]
      for (const event of events) onEvent(event)
      return new Promise(() => {})
    })
    vi.mocked(getGenerationProgress).mockReturnValue(new Promise(() => {}))
    mount()

    const field = await screen.findByRole('textbox', { name: i18n.t('chat:ask.composerLabel') })
    await userEvent.type(field, 'I want to practise numbers 5{Enter}')

    await waitFor(() => expect(streamConversationMessage).toHaveBeenCalled())
    await within(await screen.findByRole('log')).findByText('Off to Numbers 5.')
    await waitFor(() => expect(cards()).toHaveLength(1))
    expect(within(cards()[0]).getByText(NUMBERS.name)).toBeInTheDocument()
  })

  it.each([
    ['opened on the map', '/map/math'],
    ['opened at /ask/c-1', '/ask/c-1'],
  ])('closes Ask (%s) and flies to the star in another galaxy, its card open', async (_, at) => {
    readBack([
      message('m1', 'student', 'I want to practise refraction'),
      message('m2', 'assistant', 'Refraction is in your physics galaxy.', { unitId: REFRACTION.unitId }),
    ])
    // On the map, Ask is open over it on the conversation, as the docked composer leaves it.
    if (at.startsWith('/map')) useAskStore.getState().select('student-a', 'c-1')
    mount(at)
    await waitFor(() => expect(cards()).toHaveLength(1))
    expect(document.querySelector('[data-ask-surface]')).not.toBeNull()

    await act(async () => {
      await userEvent.click(within(cards()[0]).getByRole('button', { name: i18n.t('chat:ask.target.show') }))
    })

    // The star's own route, under its own galaxy: the map flies there and opens its card.
    expect(screen.getByTestId('where')).toHaveTextContent(REFRACTION.path)
    expect(await screen.findByRole('article', { name: REFRACTION.name }, { timeout: 5_000 })).toBeInTheDocument()
    expect(document.querySelector('[data-ask-surface]')).toBeNull()
  })
})
