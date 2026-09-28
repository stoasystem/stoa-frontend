/**
 * Where Ask opens and how it closes (#49; #12 point 6; #13 point 1):
 *
 * - from the planet, typing in the docked composer opens a 420 panel on a
 *   desktop, with the page area narrowed beside it and still usable, or a 72%
 *   sheet on a phone, over a dimmed planet that cannot be used;
 * - `/ask` and `/ask/:id` opened directly are the same panel on a desktop and
 *   a full-screen sheet on a phone;
 * - the phone sheet keeps the keyboard inside it; Esc closes Ask either way and
 *   the focus goes back to the docked composer; dragging the sheet down closes it.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import { useSignOut } from '@/hooks/auth/useSignOut'
import { AppLayout } from '@/layouts/AppLayout'
import i18n from '@/i18n'
import { ApiError } from '@/services/api/httpClient'
import { ASK_STORAGE_KEY, readPersistedAsk, resetAsk, useAskStore } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import { createConversation, getConversations } from '@/services/chat/chatApi'
import { getGenerationProgress, streamConversationMessage } from '@/services/chat/chatStreamApi'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/services/auth/authApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/auth/authApi')>()),
  logout: vi.fn(async () => ({ kind: 'ok' })),
}))
// The bell's own data is not what this is about.
vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled' }),
}))
vi.mock('@/services/chat/chatApi', () => ({
  getConversations: vi.fn(async () => ({
    items: [
      { id: 'c1', title: 'Linear equations', subject: 'math', grade: '8', updatedAt: '2026-09-20T10:00:00.000Z' },
    ],
  })),
  getConversation: vi.fn(async (id: string) => ({
    id,
    title: 'Linear equations',
    subject: 'math',
    grade: '8',
    updatedAt: '2026-09-20T10:00:00.000Z',
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

function emulateWidth(width: number, { reducedMotion = false } = {}) {
  window.matchMedia = ((query: string) => {
    const min = query.match(/min-width:\s*(\d+)px/)
    return {
      matches: query.includes('prefers-reduced-motion') ? reducedMotion : !min || width >= Number(min[1]),
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

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

function Planet() {
  return <button type="button">Rotate the planet</button>
}

function SignOut() {
  const { signOut } = useSignOut()
  return (
    <button type="button" onClick={() => void signOut()}>
      Sign out
    </button>
  )
}

/** A planet page (`direct` unset) or `/ask/:id`, at `width`, optionally inside the app shell. */
function show({
  width,
  direct,
  shell = false,
  reducedMotion = false,
}: {
  width: number
  direct?: string | null
  shell?: boolean
  reducedMotion?: boolean
}) {
  emulateWidth(width, { reducedMotion })
  const host = (
    <AskHost route={direct === undefined ? undefined : { conversationId: direct }}>
      <Planet />
    </AskHost>
  )
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const at = direct === undefined ? '/planet/math' : direct === null ? '/ask' : `/ask/${direct}`
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[at]}>
          <Routes>
            <Route
              path="*"
              element={
                <>
                  {shell ? <AppLayout bleed>{host}</AppLayout> : host}
                  <Where />
                  <SignOut />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const page = () => document.querySelector<HTMLElement>('[data-ask-page]')!
const surface = () => document.querySelector<HTMLElement>('[data-ask-surface]')
const dockedField = () => within(document.querySelector<HTMLElement>('[data-ask-docked]')!).getByRole('textbox')

const originalMatchMedia = window.matchMedia

beforeEach(async () => {
  await i18n.changeLanguage('en')
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  resetAsk()
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe('Ask from the planet', () => {
  it('is docked below the planet until the student types', () => {
    show({ width: 1280 })

    expect(surface()).toBeNull()
    expect(dockedField()).toHaveAccessibleName('Your question')
  })

  it('opens a 420 panel on a desktop, and the planet beside it stays usable', async () => {
    show({ width: 1280 })

    await userEvent.type(dockedField(), 'W')

    const panel = screen.getByRole('complementary', { name: 'Ask' })
    expect(panel).toHaveAttribute('data-ask-surface', 'panel')
    expect(panel.style.width).toBe('420px')
    // The page area is what is left beside the panel, so the planet re-centres there.
    expect(page().style.right).toBe('420px')
    expect(page()).not.toHaveAttribute('inert')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('[data-ask-backdrop]')).toBeNull()
    // What was typed carries on in Ask's own composer.
    const field = within(panel).getByRole('textbox', { name: 'Your question' })
    expect(field).toHaveValue('W')
    expect(field).toHaveFocus()
    await userEvent.type(field, 'hy?')
    expect(field).toHaveValue('Why?')
  })

  it('rises as a 72% sheet on a phone, over a dimmed planet that cannot be used', async () => {
    show({ width: 375 })

    await userEvent.type(dockedField(), 'W')

    const sheet = screen.getByRole('dialog', { name: 'Ask' })
    expect(sheet).toHaveAttribute('aria-modal', 'true')
    expect(sheet.style.height).toBe('72%')
    expect(page()).toHaveAttribute('inert')
    expect(document.querySelector('[data-ask-backdrop]')).not.toBeNull()
  })

  it('shows the conversation list when none is open, and a back arrow once one is', async () => {
    show({ width: 1280 })
    await userEvent.type(dockedField(), 'W')
    const panel = screen.getByRole('complementary', { name: 'Ask' })

    await userEvent.click(await within(panel).findByRole('button', { name: /Linear equations/ }))

    expect(surface()).toHaveAttribute('data-ask-conversation', 'c1')
    await userEvent.click(within(panel).getByRole('button', { name: 'All conversations' }))
    expect(surface()).toHaveAttribute('data-ask-conversation', '')
    expect(await within(panel).findByRole('navigation', { name: 'Conversations' })).toBeInTheDocument()
  })

  it('comes back open on the same conversation after a reload', () => {
    useAskStore.getState().select('u-1', 'c1')
    const stored = sessionStorage.getItem(ASK_STORAGE_KEY)
    expect(JSON.parse(stored ?? '{}')).toMatchObject({ ownerId: 'u-1', open: true, conversationId: 'c1' })
    // A reload: memory is gone, the tab's storage is not.
    resetAsk()
    sessionStorage.setItem(ASK_STORAGE_KEY, stored ?? '')
    useAskStore.setState(readPersistedAsk())

    show({ width: 1280 })

    expect(surface()).toHaveAttribute('data-ask-conversation', 'c1')
  })

  it('does not reopen another account’s Ask in the same tab', () => {
    useAskStore.setState({ ownerId: 'someone-else', open: true, conversationId: 'c9' })

    show({ width: 1280 })

    expect(surface()).toBeNull()
  })
})

describe('Ask opened directly at /ask or /ask/:id', () => {
  it('is a full-screen sheet on a phone, which is the page rather than a modal over it', () => {
    show({ width: 375, direct: 'c1' })

    const sheet = screen.getByRole('region', { name: 'Ask' })
    expect(sheet.style.height).toBe('100%')
    expect(sheet).toHaveAttribute('data-ask-conversation', 'c1')
    expect(sheet).not.toHaveAttribute('aria-modal')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('[data-ask-backdrop]')).toBeNull()
  })

  it('is the panel over the planet on a desktop', () => {
    show({ width: 1280, direct: null })

    expect(screen.getByRole('complementary', { name: 'Ask' }).style.width).toBe('420px')
    expect(page().style.right).toBe('420px')
  })

  it('goes to the conversation’s own address when one is chosen, and to / when closed', async () => {
    show({ width: 1280, direct: null })

    await userEvent.click(await screen.findByRole('button', { name: /Linear equations/ }))
    expect(screen.getByTestId('where')).toHaveTextContent('/ask/c1')

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/$/)
  })
})

describe('the keyboard', () => {
  it('keeps Tab inside the phone sheet, both ways round', async () => {
    show({ width: 375 })
    await userEvent.type(dockedField(), 'W')
    const sheet = screen.getByRole('dialog', { name: 'Ask' })
    const inside = () => sheet.contains(document.activeElement)

    for (let press = 0; press < 12; press += 1) {
      await userEvent.tab()
      expect(inside()).toBe(true)
    }
    for (let press = 0; press < 12; press += 1) {
      await userEvent.tab({ shift: true })
      expect(inside()).toBe(true)
    }
    // Never onto the planet behind the dim.
    expect(screen.getByRole('button', { name: 'Rotate the planet', hidden: true })).not.toHaveFocus()
  })

  it('closes the phone sheet on Esc and gives the focus back to the docked composer', async () => {
    show({ width: 375 })
    await userEvent.type(dockedField(), 'W')

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(page()).not.toHaveAttribute('inert')
    expect(dockedField()).toHaveFocus()
  })

  it('closes the desktop panel on Esc, and does not trap Tab there', async () => {
    show({ width: 1280 })
    await userEvent.type(dockedField(), 'W')
    expect(screen.getByRole('complementary', { name: 'Ask' })).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')

    expect(surface()).toBeNull()
    expect(page().style.right).toBe('0px')
    expect(dockedField()).toHaveFocus()
  })
})

describe('dragging the phone sheet', () => {
  /** A slow drag: a quick flick closes the sheet whatever its length. */
  async function dragGrabber(distance: number, sheetHeight: number) {
    const sheet = screen.getByRole('dialog', { name: 'Ask' })
    sheet.getBoundingClientRect = () => ({ height: sheetHeight }) as DOMRect
    const handle = sheet.firstElementChild as HTMLElement
    act(() => {
      fireEvent.pointerDown(handle, { pointerId: 1, clientY: 100 })
      fireEvent.pointerMove(handle, { pointerId: 1, clientY: 100 + distance })
    })
    expect(sheet.style.transform).toBe(`translateY(${distance}px)`)
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)))
    act(() => {
      fireEvent.pointerUp(handle, { pointerId: 1, clientY: 100 + distance })
    })
  }

  it('closes it past a quarter of its height', async () => {
    show({ width: 375 })
    await userEvent.type(dockedField(), 'W')

    await dragGrabber(200, 600)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('springs back from a short drag', async () => {
    show({ width: 375 })
    await userEvent.type(dockedField(), 'W')

    await dragGrabber(80, 600)

    expect(screen.getByRole('dialog', { name: 'Ask' }).style.transform).toBe('')
  })
})

describe('signing out', () => {
  it('leaves nothing of one student’s Ask for the next account on the tab', async () => {
    sessionStorage.setItem(
      'stoa_pending_chat_message:c-a',
      JSON.stringify({ idempotencyKey: 'k-a', content: 'A private question from Lina', askedAt: '2026-09-28T10:00:00.000Z' }),
    )
    show({ width: 1280 })
    await userEvent.type(dockedField(), 'Something Lina has not sent')
    expect(within(surface()!).getByRole('textbox', { name: 'Your question' })).toHaveValue('Something Lina has not sent')

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    act(() => {
      useAuthStore.setState({
        user: { id: 'u-b', name: 'Ben Keller', email: 'ben@example.com', role: 'student' } as CurrentUser,
        accessToken: 'token-b',
        isAuthenticated: true,
      })
    })

    expect(surface()).toBeNull()
    expect(dockedField()).toHaveValue('')
    expect(useAskStore.getState().draft).toBe('')
    // Ben opens Ask: his composer is empty too.
    await userEvent.type(dockedField(), 'B')
    expect(within(surface()!).getByRole('textbox', { name: 'Your question' })).toHaveValue('B')
    const stored = Object.keys(sessionStorage).map((key) => `${key}=${sessionStorage.getItem(key)}`).join('\n')
    expect(stored).not.toMatch(/Lina|u-1|c-a/)
  })
})

describe('the phone sheet over the planet is modal', () => {
  it('dims the top bar with the planet and takes it out of reach', async () => {
    show({ width: 375, shell: true })
    const bar = document.querySelector<HTMLElement>('[data-top-bar]')!
    expect(bar).not.toHaveAttribute('inert')

    await userEvent.type(dockedField(), 'W')

    expect(bar).toHaveAttribute('inert')
    expect(bar.querySelector('[data-top-bar-dim]')).not.toBeNull()

    await userEvent.keyboard('{Escape}')
    expect(bar).not.toHaveAttribute('inert')
    expect(bar.querySelector('[data-top-bar-dim]')).toBeNull()
  })

  it('leaves the top bar alone for the full-screen sheet at /ask', () => {
    show({ width: 375, shell: true, direct: 'c1' })

    expect(document.querySelector('[data-top-bar]')).not.toHaveAttribute('inert')
  })

  it('answers Esc and Tab even when nothing inside it has the focus', async () => {
    show({ width: 375 })
    await userEvent.type(dockedField(), 'W')
    const sheet = screen.getByRole('dialog', { name: 'Ask' })

    act(() => (document.activeElement as HTMLElement | null)?.blur())
    expect(sheet.contains(document.activeElement)).toBe(false)
    await userEvent.tab()
    expect(sheet.contains(document.activeElement)).toBe(true)

    act(() => (document.activeElement as HTMLElement | null)?.blur())
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('typing with an input method', () => {
  it('opens Ask when the composition ends, not on its first keystroke', () => {
    show({ width: 1280 })
    const field = dockedField()

    fireEvent.compositionStart(field)
    fireEvent.change(field, { target: { value: 'ni' } })
    expect(surface()).toBeNull()

    fireEvent.change(field, { target: { value: '你' } })
    fireEvent.compositionEnd(field)

    expect(surface()).not.toBeNull()
    expect(within(surface()!).getByRole('textbox', { name: 'Your question' })).toHaveValue('你')
  })
})

describe('reduced motion', () => {
  it('lets the dragged sheet go back without the spring', async () => {
    show({ width: 375, reducedMotion: true })
    await userEvent.type(dockedField(), 'W')

    expect(screen.getByRole('dialog', { name: 'Ask' }).style.transition).toBe('none')
  })

  it('springs back with the sheet motion otherwise', async () => {
    show({ width: 375 })
    await userEvent.type(dockedField(), 'W')

    expect(screen.getByRole('dialog', { name: 'Ask' }).style.transition).toContain('transform')
  })
})

describe('the first question of a new conversation', () => {
  const created = (id: string) => ({
    id,
    title: 'What is a prime?',
    subject: 'math',
    grade: '8',
    updatedAt: '2026-09-28T10:00:00.000Z',
    messages: [],
  })

  beforeEach(() => {
    vi.mocked(getConversations).mockResolvedValue({ items: [] })
    vi.mocked(getGenerationProgress).mockResolvedValue({
      conversationId: 'c-new',
      steps: [],
      updatedAt: new Date().toISOString(),
      status: 'ai_running',
    })
  })

  it('goes out with the conversation, and its answer is waited for rather than sent again', async () => {
    vi.mocked(createConversation).mockResolvedValue(created('c-new'))
    show({ width: 1280 })
    await userEvent.type(dockedField(), 'What is a prime?')
    const panel = within(surface()!)

    await userEvent.type(panel.getByRole('textbox', { name: 'Your question' }), '{Enter}')

    expect(createConversation).toHaveBeenCalledTimes(1)
    expect(vi.mocked(createConversation).mock.calls[0][0]).toMatchObject({ subject: 'math', initialMessage: 'What is a prime?' })
    expect(await panel.findByText('What is a prime?', { selector: 'div' })).toBeInTheDocument()
    expect(JSON.parse(sessionStorage.getItem('stoa_pending_chat_message:c-new') ?? '{}')).toMatchObject({
      idempotencyKey: 'initial-c-new',
      content: 'What is a prime?',
    })
    await vi.waitFor(() => expect(getGenerationProgress).toHaveBeenCalled(), { timeout: 3000 })
    expect(vi.mocked(getGenerationProgress).mock.calls[0][2]).toBe('initial-c-new')
    expect(streamConversationMessage).not.toHaveBeenCalled()
  })

  it('starts one conversation when sent twice in the same moment', async () => {
    vi.mocked(createConversation).mockResolvedValue(created('c-new'))
    show({ width: 1280 })
    await userEvent.type(dockedField(), 'What is a prime?')
    const field = within(surface()!).getByRole('textbox', { name: 'Your question' })

    await act(async () => {
      fireEvent.keyDown(field, { key: 'Enter' })
      fireEvent.keyDown(field, { key: 'Enter' })
    })

    await vi.waitFor(() => expect(createConversation).toHaveBeenCalled())
    expect(createConversation).toHaveBeenCalledTimes(1)
  })

  it('is not sent later when Ask is closed before the conversation exists', async () => {
    let finish: (value: ReturnType<typeof created>) => void = () => {}
    vi.mocked(createConversation).mockImplementation(() => new Promise((resolve) => (finish = resolve)))
    show({ width: 1280 })
    await userEvent.type(dockedField(), 'What is a prime?')
    await userEvent.type(within(surface()!).getByRole('textbox', { name: 'Your question' }), '{Enter}')

    await userEvent.click(within(surface()!).getByRole('button', { name: 'Close' }))
    await act(async () => finish(created('c-new')))

    // It went out once, with the conversation; the answer waits for when it is opened.
    expect(streamConversationMessage).not.toHaveBeenCalled()
    expect(surface()).toBeNull()
    expect(JSON.parse(sessionStorage.getItem('stoa_pending_chat_message:c-new') ?? '{}')).toMatchObject({
      idempotencyKey: 'initial-c-new',
    })
  })
})
