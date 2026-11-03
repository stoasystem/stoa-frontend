/**
 * Finding a star from Ask (#487, CONTEXT.md「找星」).
 *
 * An answer that recognised the star the student wants to go to carries it
 * (`targetUnit`, stoa-backend#124), streamed (`message_done`) and read back
 * (`GET /conversations/{id}`) alike. Under that answer sits one card; followed,
 * Ask closes and the map flies to the star -- in whichever galaxy it is, a
 * dimmed one included, lit or not -- and opens its card, which takes the
 * focus. An answer without a star, a failed answer, and a star the sky does
 * not hold (or a sky that could not be read) show nothing more.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useRef, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import { StarMapRoute } from '@/features/starmap/StarMapRoute'
import { subjectOfNebula, type Star } from '@/features/starmap/model/starMap'
import { emptyStarMap, StarMapSourceContext, type StarMapSource } from '@/features/starmap/starMapSource'
import { pathForTarget } from '@/features/starmap/view/layers'
import { DemoStarMapSource, readDemoStarMap } from '@/dev/demo/sky/source'
import i18n from '@/i18n'
import { ApiError } from '@/services/api/httpClient'
import { askFor, resetAsk, useAskStore } from '@/store/askStore'
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

/** The demo sky as the map route reads it (1000 stars, the route's default). */
const sky = () =>
  readDemoStarMap({ subjectId: 'math', size: 1000, t: i18n.getFixedT('en', 'starmap'), language: 'en', relations: false, longNames: false })
const pathOf = (star: Star) => pathForTarget(subjectOfNebula(sky(), star.nebulaId), { layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId })
/** A star of the galaxy the student does not take: chemistry, drawn dimmed. */
const dimmedStar = () => sky().stars.find((star) => subjectOfNebula(sky(), star.nebulaId) === 'chemistry')!
/** A lit star of another galaxy than maths, where the map opens. */
const litStar = () => sky().stars.find((star) => star.state === 'lit' && subjectOfNebula(sky(), star.nebulaId) === 'physics')!

/** The demo sky's physics star (another galaxy than maths, where the map opens) and a maths one. */
const REFRACTION = { unitId: 'demo-refraction', name: 'Refraction', path: '/map/physics/optics/demo-refraction' }
const NUMBERS = { unitId: 'numbers-5', name: 'Numbers 5' }

const cards = () => screen.queryAllByRole('region').filter((region) => region.hasAttribute('data-ask-target'))
const showLink = (card: HTMLElement) => within(card).getByRole('link', { name: i18n.t('chat:ask.target.show') })

function message(id: string, role: ChatMessage['role'], content: string, targetUnit: TargetUnit | null = null, status?: ChatMessage['status']): ChatMessage {
  return { id, conversationId: 'c-1', role, content, createdAt: '2026-10-29T09:00:00Z', status: status ?? (role === 'student' ? 'sent' : 'completed'), targetUnit }
}

function conversationWith(messages: ChatMessage[]) {
  return { id: 'c-1', title: 'Light', subject: 'physics', grade: '8', updatedAt: '2026-10-29T09:00:00Z', messages }
}

function readBack(messages: ChatMessage[]) {
  vi.mocked(getConversation).mockResolvedValue(conversationWith(messages) as never)
}

/** A question about a star, answered with it. */
const answered = (unitId: string) => [
  message('m1', 'student', 'I want to practise it'),
  message('m2', 'assistant', 'It is on your star map.', { unitId }),
]

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

function mount(at = '/ask/c-1', source: (app: ReactNode) => ReactNode = (app) => <DemoStarMapSource>{app}</DemoStarMapSource>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const map = (
    <AskHost>
      <StarMapRoute />
    </AskHost>
  )
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        {source(
          <MemoryRouter initialEntries={[at]}>
            <Routes>
              <Route path="/ask/:conversationId" element={<AskRoute />} />
              <Route path="/map/:subjectId" element={map} />
              <Route path="/map/:subjectId/:topicId" element={map} />
              <Route path="/map/:subjectId/:topicId/:unitId" element={map} />
            </Routes>
            <Where />
          </MemoryRouter>,
        )}
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

/** Follow the one card's link; the map's route moves to the star. */
async function follow() {
  await waitFor(() => expect(cards()).toHaveLength(1))
  await act(async () => {
    await userEvent.click(showLink(cards()[0]))
  })
}

/** The star's card, open on the map and holding the focus. */
async function expectStarCardFocused(name: string) {
  await screen.findByRole('article', { name }, { timeout: 5_000 })
  // The card may be swapped as the stage takes its size: whichever one is there holds the focus.
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('article', { name })))
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
  it('shows one card when the conversation is read back, named by its star', async () => {
    readBack(answered(REFRACTION.unitId))
    mount()

    await screen.findByText('It is on your star map.')
    await waitFor(() => expect(cards()).toHaveLength(1))
    const card = cards()[0]
    // Two cards in one thread are told apart by their star, by name and by link.
    expect(card).toHaveAccessibleName(i18n.t('chat:ask.target.label', { name: REFRACTION.name }))
    expect(within(card).getByText(REFRACTION.name)).toBeInTheDocument()
    expect(showLink(card)).toHaveAccessibleDescription(REFRACTION.name)
    expect(showLink(card)).toHaveAttribute('href', REFRACTION.path)
  })

  it('shows none under an answer without a star', async () => {
    readBack([message('m1', 'student', 'What is refraction?'), message('m2', 'assistant', 'Light changes direction.', null)])
    mount()

    await screen.findByText('Light changes direction.')
    expect(cards()).toHaveLength(0)
  })

  it('shows none under an answer that failed', async () => {
    readBack([
      message('m1', 'student', 'I want to practise refraction'),
      message('m2', 'assistant', 'The answer could not be written.', { unitId: REFRACTION.unitId }, 'failed'),
    ])
    mount()

    await screen.findByText('The answer could not be written.')
    expect(cards()).toHaveLength(0)
  })

  it('shows none for a star the sky does not hold', async () => {
    readBack(answered('not-a-star-of-this-sky'))
    mount()

    await screen.findByText('It is on your star map.')
    expect(cards()).toHaveLength(0)
  })

  it('shows none while the sky could not be read: there is nowhere to fly yet', async () => {
    readBack(answered(REFRACTION.unitId))
    const unread: StarMapSource = { read: ({ subjectId }) => emptyStarMap(subjectId), demo: false, status: 'error' }
    mount('/ask/c-1', (app) => <StarMapSourceContext.Provider value={unread}>{app}</StarMapSourceContext.Provider>)

    await screen.findByText('It is on your star map.')
    expect(cards()).toHaveLength(0)
  })

  it('shows a card for a star in a galaxy the student does not take, and flies there', async () => {
    const star = dimmedStar()
    readBack(answered(star.unitId))
    mount()

    await follow()
    expect(screen.getByTestId('where')).toHaveTextContent(pathOf(star))
    expect(pathOf(star)).toMatch(/^\/map\/chemistry\//)
    await expectStarCardFocused(star.name)
  })

  it('shows a card for a star already lit, and flies there', async () => {
    const star = litStar()
    readBack(answered(star.unitId))
    mount()

    await follow()
    expect(screen.getByTestId('where')).toHaveTextContent(pathOf(star))
    await expectStarCardFocused(star.name)
  })

  it('shows one card as soon as a streamed answer ends with a star, and still one once it is read back', async () => {
    readBack([])
    // The answer streams and ends with the star. The conversation is read back
    // only once the test says so: first the streamed copy, then the server's.
    let finish!: () => void
    vi.mocked(streamConversationMessage).mockImplementation(({ onEvent }) => {
      const events: ChatStreamEvent[] = [
        { type: 'message_start', messageId: 'a-1', role: 'assistant', createdAt: '2026-10-29T09:00:00Z' },
        { type: 'message_delta', messageId: 'a-1', delta: 'Off to Numbers 5.' },
        { type: 'message_done', messageId: 'a-1', status: 'completed', targetUnit: { unitId: NUMBERS.unitId } },
      ]
      for (const event of events) onEvent(event)
      return new Promise((resolve) => (finish = () => resolve('streamed')))
    })
    vi.mocked(getGenerationProgress).mockReturnValue(new Promise(() => {}))
    mount()

    const field = await screen.findByRole('textbox', { name: i18n.t('chat:ask.composerLabel') })
    await userEvent.type(field, 'I want to practise numbers 5{Enter}')

    await waitFor(() => expect(streamConversationMessage).toHaveBeenCalled())
    const log = await screen.findByRole('log')
    await within(log).findByText('Off to Numbers 5.')
    await waitFor(() => expect(cards()).toHaveLength(1))
    expect(within(cards()[0]).getByText(NUMBERS.name)).toBeInTheDocument()

    // Read back: the server holds the same answer under the same id.
    const reads = vi.mocked(getConversation).mock.calls.length
    const studentId = vi.mocked(streamConversationMessage).mock.calls[0][0].payload.idempotencyKey
    readBack([
      message(`s:c-1:${studentId}`, 'student', 'I want to practise numbers 5'),
      message('a-1', 'assistant', 'Off to Numbers 5.', { unitId: NUMBERS.unitId }),
    ])
    await act(async () => finish())
    await waitFor(() => expect(vi.mocked(getConversation).mock.calls.length).toBeGreaterThan(reads))
    await waitFor(() => expect(within(log).getAllByText('Off to Numbers 5.')).toHaveLength(1))
    expect(cards()).toHaveLength(1)
  })

  it.each([
    ['opened on the map', '/map/math'],
    ['opened at /ask/c-1', '/ask/c-1'],
  ])('closes Ask (%s) and flies to the star in another galaxy, its card open and focused', async (_, at) => {
    readBack(answered(REFRACTION.unitId))
    // On the map, Ask is open over it on the conversation, as the docked composer leaves it.
    if (at.startsWith('/map')) useAskStore.getState().select('student-a', 'c-1')
    mount(at)
    await waitFor(() => expect(cards()).toHaveLength(1))
    expect(document.querySelector('[data-ask-surface]')).not.toBeNull()

    await follow()

    // The star's own route, under its own galaxy: the map flies there and opens its card.
    expect(screen.getByTestId('where')).toHaveTextContent(REFRACTION.path)
    await expectStarCardFocused(REFRACTION.name)
    expect(document.querySelector('[data-ask-surface]')).toBeNull()
  })

  it('Ask, closed by a way out that took the focus, leaves the focus there', async () => {
    readBack(answered(REFRACTION.unitId))
    // Whatever Ask's closing sent the student to -- here a button standing in
    // for a star's card -- takes the focus as Ask closes, in the same commit.
    function TakesFocusOnClose() {
      const open = useAskStore((state) => askFor(state, 'student-a').open)
      const button = useRef<HTMLButtonElement>(null)
      useEffect(() => {
        if (!open) button.current?.focus()
      }, [open])
      return <button ref={button} type="button">Where Ask sent me</button>
    }
    useAskStore.getState().select('student-a', 'c-1')
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/map/math']}>
          <AskHost>
            <TakesFocusOnClose />
          </AskHost>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    await screen.findByText('It is on your star map.')

    await act(async () => useAskStore.getState().close())

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Where Ask sent me' }))
  })
})
