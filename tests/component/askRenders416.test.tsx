/**
 * #416: Ask drew every message of the open conversation again on renders that
 * changed none of them -- each key typed in its composer, each frame of the
 * phone sheet dragged, each key of an answer typed in the exercise beside it --
 * and typeset every formula again with them: 25-40 ms a key on a phone, in a
 * conversation with many formulas. A message is drawn again when it changes,
 * and a formula is typeset once for its text.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import katex from 'katex'
import { useState, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { AskHost } from '@/features/ask/AskHost'
import { useAskController } from '@/features/ask/useAskController'
import { StageWithAsk } from '@/features/chapter/StageAsk'
import i18n from '@/i18n'
import { ApiError } from '@/services/api/httpClient'
import { getConversation } from '@/services/chat/chatApi'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import { resetAsk, useAskStore } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { ChatMessage } from '@/types/chat'

/** How often a formula's text was drawn: a message draws its text once each time it is drawn. */
const drawn = vi.hoisted(() => ({ count: 0 }))

vi.mock('@/components/ui/MathRenderer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui/MathRenderer')>()
  const { createElement } = await import('react')
  return {
    ...actual,
    MathRenderer: (props: Parameters<typeof actual.MathRenderer>[0]) => {
      drawn.count += 1
      return createElement(actual.MathRenderer, props)
    },
  }
})
vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/services/chat/chatApi', () => ({
  getConversations: vi.fn(async () => ({ items: [] })),
  getConversation: vi.fn(),
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

function message(id: string, role: ChatMessage['role'], content: string): ChatMessage {
  return { id, conversationId: 'c1', role, content, createdAt: '2026-10-20T10:00:00.000Z', status: 'completed' }
}

const MESSAGES = [
  message('s1', 'student', 'Warum ist $\\sin 30^\\circ = 0{,}5$?'),
  message('a1', 'assistant', 'Im Dreieck gilt $\\sin 30^\\circ = \\frac{1}{2}$, also $$\\frac{1}{2} = 0{,}5$$'),
  message('t1', 'teacher', 'Genau, wie bei $a^2 + b^2 = c^2$.'),
]

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

function show(node: ReactNode, width: number) {
  emulateWidth(width)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/planet/math']}>{node}</MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return client
}

const surface = () => document.querySelector<HTMLElement>('[data-ask-surface]')!
const typeset = vi.spyOn(katex, 'renderToString')

/**
 * The conversation on screen with all it reads in: every formula typeset, the
 * teachers' presence and the request for a teacher under the answer. What
 * comes after that changes no message.
 */
async function settled() {
  const log = within(surface()).getByRole('log', { name: 'Messages' })
  await waitFor(() => expect(log.querySelectorAll('.katex').length).toBe(4))
  await within(surface()).findByRole('button', { name: /Ask a teacher/ })
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
  drawn.count = 0
  typeset.mockClear()
}

const originalMatchMedia = window.matchMedia

beforeAll(async () => {
  // Warmed, so the first formula does not wait for the module past waitFor's second.
  await import('@/components/ui/katexLoader')
})

beforeEach(async () => {
  await i18n.changeLanguage('en')
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  resetAsk()
  vi.mocked(getConversation).mockResolvedValue({
    id: 'c1',
    title: 'Sinus',
    subject: 'math',
    grade: '8',
    updatedAt: '2026-10-20T10:00:00.000Z',
    messages: MESSAGES,
  })
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe('Ask leaves the messages alone (#416)', () => {
  it('does not draw them again, nor typeset their formulas, while the student types', async () => {
    useAskStore.getState().select('u-1', 'c1')
    show(<AskHost />, 1280)
    await settled()

    const field = within(surface()).getByRole('textbox', { name: 'Your question' })
    await userEvent.type(field, 'Und cos?')

    expect(field).toHaveValue('Und cos?')
    expect(drawn.count).toBe(0)
    expect(typeset).not.toHaveBeenCalled()
  })

  it('does not draw them again while the phone sheet is dragged', async () => {
    useAskStore.getState().select('u-1', 'c1')
    show(<AskHost />, 375)
    await settled()

    const sheet = screen.getByRole('dialog', { name: 'Ask' })
    const grabber = sheet.firstElementChild as HTMLElement
    act(() => {
      fireEvent.pointerDown(grabber, { pointerId: 1, clientY: 100 })
    })
    for (const y of [104, 110, 118, 130]) {
      act(() => {
        fireEvent.pointerMove(grabber, { pointerId: 1, clientY: y })
      })
    }

    expect(sheet.style.transform).toBe('translateY(30px)')
    expect(drawn.count).toBe(0)
    expect(typeset).not.toHaveBeenCalled()
  })

  it('does not draw them again while an answer is typed in the exercise beside Ask', async () => {
    useAskStore.getState().select('u-1', 'c1')
    function Lesson() {
      const [answer, setAnswer] = useState('')
      return (
        <StageWithAsk>
          <label>
            Answer
            <input value={answer} onChange={(event) => setAnswer(event.target.value)} />
          </label>
        </StageWithAsk>
      )
    }
    show(<Lesson />, 1280)
    await settled()

    await userEvent.type(screen.getByRole('textbox', { name: 'Answer' }), '0,5')

    expect(screen.getByRole('textbox', { name: 'Answer' })).toHaveValue('0,5')
    expect(drawn.count).toBe(0)
    expect(typeset).not.toHaveBeenCalled()
  })

  it('draws again the message that changed, and only that one', async () => {
    useAskStore.getState().select('u-1', 'c1')
    const client = show(<AskHost />, 1280)
    await settled()

    vi.mocked(getConversation).mockResolvedValue({
      id: 'c1',
      title: 'Sinus',
      subject: 'math',
      grade: '8',
      updatedAt: '2026-10-20T10:01:00.000Z',
      messages: [...MESSAGES.slice(0, 2), { ...MESSAGES[2], content: 'Genau, wie bei $a^2 + b^2 = c^2$ im Dreieck.' }],
    })
    await act(() => client.invalidateQueries({ queryKey: chatQueryKeys.conversation('c1'), exact: true }))

    await within(surface()).findByText(/im Dreieck/)
    expect(drawn.count).toBe(1)
    expect(typeset).toHaveBeenCalledTimes(1)
    expect(typeset).toHaveBeenCalledWith('a^2 + b^2 = c^2', expect.anything())
  })
})

describe('a formula is typeset once for its text (#416)', () => {
  function Around({ text }: { text: string }) {
    const [count, setCount] = useState(0)
    return (
      <>
        <button type="button" onClick={() => setCount(count + 1)}>
          Again {count}
        </button>
        <MathRenderer>{text}</MathRenderer>
      </>
    )
  }

  it('is not typeset again when the renderer is drawn again with the same text', async () => {
    const { container, rerender } = render(<Around text="Es gilt **$x^2 \ge 0$** und $$\sqrt{4} = 2$$" />)
    await waitFor(() => expect(container.querySelectorAll('.katex')).toHaveLength(2))
    typeset.mockClear()
    drawn.count = 0

    for (let press = 0; press < 3; press += 1) await userEvent.click(screen.getByRole('button', { name: /Again/ }))

    expect(drawn.count).toBe(3)
    expect(typeset).not.toHaveBeenCalled()
    expect(container.querySelectorAll('.katex')).toHaveLength(2)

    rerender(<Around text="Es gilt $y^2 \ge 0$" />)
    expect(typeset).toHaveBeenCalledTimes(1)
    expect(typeset).toHaveBeenCalledWith('y^2 \\ge 0', expect.anything())
  })
})

describe('the Ask controller (#416)', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>

  it('is the same object until something it holds changes', () => {
    const { result, rerender } = renderHook(() => useAskController(), { wrapper })
    const first = result.current

    rerender()
    expect(result.current).toBe(first)

    act(() => result.current.setDraft('x'))
    expect(result.current).not.toBe(first)
    expect(result.current.draft).toBe('x')
  })
})
