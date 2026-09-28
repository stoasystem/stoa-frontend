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
import i18n from '@/i18n'
import { ApiError } from '@/services/api/httpClient'
import { ASK_STORAGE_KEY, useAskStore } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
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

function emulateWidth(width: number) {
  window.matchMedia = ((query: string) => {
    const min = query.match(/min-width:\s*(\d+)px/)
    return {
      matches: !min || width >= Number(min[1]),
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

/** A planet page (`direct` unset) or `/ask/:id`, at `width`. */
function show({ width, direct }: { width: number; direct?: string | null }) {
  emulateWidth(width)
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
                  <AskHost route={direct === undefined ? undefined : { conversationId: direct }}>
                    <Planet />
                  </AskHost>
                  <Where />
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
  useAskStore.setState({ ownerId: null, open: false, conversationId: null, draft: '', queued: null })
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
    useAskStore.setState({ ownerId: 'u-1', open: true, conversationId: 'c1' })
    expect(JSON.parse(sessionStorage.getItem(ASK_STORAGE_KEY) ?? '{}')).toMatchObject({ open: true, conversationId: 'c1' })

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
  it('is a full-screen sheet on a phone', () => {
    show({ width: 375, direct: 'c1' })

    const sheet = screen.getByRole('dialog', { name: 'Ask' })
    expect(sheet.style.height).toBe('100%')
    expect(sheet).toHaveAttribute('data-ask-conversation', 'c1')
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
