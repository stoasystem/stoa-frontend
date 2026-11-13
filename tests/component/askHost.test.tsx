/**
 * Where Ask opens and how it closes (#49; #12 point 6; #13 point 1; #660):
 *
 * - from the planet, typing in the docked composer raises Ask from the
 *   composer on a desktop -- centred, as wide as the composer, over a dimmed
 *   planet that cannot be used (#660) -- or a 72% sheet on a phone, over a
 *   dimmed planet too;
 * - `/ask` and `/ask/:id` opened directly rise the same way on a desktop, and
 *   are a full-screen sheet on a phone;
 * - a star followed from Ask on a desktop moves it into the 420 panel beside
 *   the map, where it stays as the student asks on, until its expand button
 *   raises it again or it is closed (#660);
 * - risen and the phone sheet keep the keyboard inside them; Esc closes Ask
 *   either way and the focus goes back to the docked composer; dragging the
 *   sheet down closes it.
 */
import { readFileSync } from 'node:fs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import { AskServerProvider } from '@/features/ask/server/askServer'
import { useSignOut } from '@/hooks/auth/useSignOut'
import { AppLayout } from '@/layouts/AppLayout'
import i18n from '@/i18n'
import { ApiError } from '@/services/api/httpClient'
import { ASK_STORAGE_KEY, readPersistedAsk, resetAsk, useAskStore } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'

vi.mock('@/services/auth/authApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/auth/authApi')>()),
  logout: vi.fn(async () => ({ kind: 'ok' })),
}))
// The bell's own data is not what this is about.
vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useUnreadNotificationCountQuery: () => ({ data: 0 }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled' }),
}))

/** The server behind Ask, in memory (#571): c1 listed, with no messages yet, and teachers online. */
let server: FakeAskServer

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
          <AskServerProvider value={server}>
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
          </AskServerProvider>
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
  // Never escalated: the fake's own default.
  server = createFakeAskServer()
  const c1 = { id: 'c1', title: 'Linear equations', subject: 'math', grade: '8', updatedAt: '2026-09-20T10:00:00.000Z' }
  server.seed({ conversations: [{ ...c1, messages: [] }], list: [c1] })
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

  it('rises from the docked composer on a desktop, centred and as wide as it, over a dimmed planet (#660)', async () => {
    show({ width: 1280 })

    await userEvent.type(dockedField(), 'W')

    const risen = screen.getByRole('dialog', { name: 'Ask' })
    expect(risen).toHaveAttribute('aria-modal', 'true')
    expect(risen).toHaveAttribute('data-ask-surface', 'rise')
    expect(risen).toHaveAttribute('data-ask-motion', 'rise')
    // The composer's width and line: 640 at most, centred, its bottom where the composer stood.
    expect(risen.style.maxWidth).toBe('640px')
    expect(risen.style.marginLeft).toBe('auto')
    expect(risen.style.marginRight).toBe('auto')
    expect(risen.style.bottom).toBe('22px')
    expect(risen.style.top).toBe('24px')
    // Over the planet, not beside it: the page keeps its width, dimmed and out of reach.
    expect(page().style.right).toBe('0px')
    expect(page()).toHaveAttribute('inert')
    expect(document.querySelector('[data-ask-backdrop]')).not.toBeNull()
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    // No way to the side from here: only a star followed from Ask puts it there.
    expect(within(risen).queryByRole('button', { name: 'Show bigger' })).toBeNull()
    // What was typed carries on in Ask's own composer.
    const field = within(risen).getByRole('textbox', { name: 'Your question' })
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
    const panel = screen.getByRole('dialog', { name: 'Ask' })

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

describe('Ask says how to dictate, behind a microphone (#515, #553)', () => {
  const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
  const dictation = () => document.querySelector('[data-composer-dictation]')

  beforeEach(() => {
    Object.defineProperty(window.navigator, 'userAgent', { value: WINDOWS, configurable: true })
  })
  afterEach(() => {
    Reflect.deleteProperty(window.navigator, 'userAgent')
  })

  it('in the docked composer below the planet', async () => {
    show({ width: 1280 })
    const form = dockedField().closest('form')!
    await userEvent.click(within(form as HTMLElement).getByRole('button', { name: 'Ask by voice' }))
    expect(dictation()).toHaveAttribute('data-composer-dictation', 'windows')
    expect(dictation()!.closest('form')).toBe(form)
  })

  it("in Ask's own composer, with no line over it any more", async () => {
    show({ width: 1280, direct: null })
    const panel = screen.getByRole('dialog', { name: 'Ask' })
    const field = within(panel).getByRole('textbox', { name: 'Your question' })
    await userEvent.click(field)
    expect(dictation()).toBeNull()
    await userEvent.click(within(panel).getByRole('button', { name: 'Ask by voice' }))
    expect(dictation()).toHaveAttribute('data-composer-dictation', 'windows')
    expect(dictation()!.closest('form')).toBe(field.closest('form'))
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

  it('rises over the planet on a desktop, as it does from the docked composer (#660)', () => {
    show({ width: 1280, direct: 'c1' })

    const risen = screen.getByRole('dialog', { name: 'Ask' })
    expect(risen).toHaveAttribute('data-ask-surface', 'rise')
    expect(risen).toHaveAttribute('data-ask-conversation', 'c1')
    expect(risen.style.maxWidth).toBe('640px')
    expect(page().style.right).toBe('0px')
    expect(page()).toHaveAttribute('inert')
  })

  it('rises over the planet even when the planet’s Ask was left beside the map (#660)', () => {
    useAskStore.getState().moveBeside('u-1', 'c1')
    show({ width: 1280, direct: null })

    expect(screen.getByRole('dialog', { name: 'Ask' })).toHaveAttribute('data-ask-surface', 'rise')
    expect(screen.queryByRole('button', { name: 'Show bigger' })).toBeNull()
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

  it('closes risen Ask on Esc and gives the focus back to the docked composer (#660)', async () => {
    show({ width: 1280 })
    await userEvent.type(dockedField(), 'W')
    expect(screen.getByRole('dialog', { name: 'Ask' })).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')

    expect(surface()).toBeNull()
    expect(page()).not.toHaveAttribute('inert')
    expect(dockedField()).toHaveFocus()
  })

  it('closes risen Ask on a tap on the dim, the focus back in the docked composer (#660)', async () => {
    show({ width: 1280 })
    await userEvent.type(dockedField(), 'W')

    await userEvent.click(document.querySelector<HTMLElement>('[data-ask-backdrop]')!)

    expect(surface()).toBeNull()
    expect(document.querySelector('[data-ask-backdrop]')).toBeNull()
    expect(dockedField()).toHaveFocus()
  })

  it('keeps Tab inside risen Ask, never onto the planet behind the dim (#660)', async () => {
    show({ width: 1280 })
    await userEvent.type(dockedField(), 'W')
    const risen = screen.getByRole('dialog', { name: 'Ask' })

    for (let press = 0; press < 12; press += 1) {
      await userEvent.tab()
      expect(risen.contains(document.activeElement)).toBe(true)
    }
    expect(screen.getByRole('button', { name: 'Rotate the planet', hidden: true })).not.toHaveFocus()
  })

  it('closes the panel beside the map on Esc, and does not trap Tab there (#660)', async () => {
    show({ width: 1280 })
    await userEvent.type(dockedField(), 'W')
    act(() => useAskStore.getState().moveBeside('u-1', null))
    expect(screen.getByRole('complementary', { name: 'Ask' })).toBeInTheDocument()

    within(surface()!).getByRole('textbox', { name: 'Your question' }).focus()
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
  beforeEach(() => {
    // Nothing listed; the conversation made is c-new, its first question still being answered.
    server.seed({
      list: [],
      newConversationIds: ['c-new'],
      generations: [{ conversationId: 'c-new', idempotencyKey: 'initial-c-new', status: 'ai_running' }],
    })
  })

  it('goes out with the conversation, and its answer is waited for rather than sent again', async () => {
    show({ width: 1280 })
    await userEvent.type(dockedField(), 'What is a prime?')
    const panel = within(surface()!)

    await userEvent.type(panel.getByRole('textbox', { name: 'Your question' }), '{Enter}')

    expect(server.conversations.createConversation).toHaveBeenCalledTimes(1)
    expect(server.conversations.createConversation.mock.calls[0][0]).toMatchObject({ subject: 'math', initialMessage: 'What is a prime?' })
    expect(await panel.findByText('What is a prime?', { selector: 'div' })).toBeInTheDocument()
    expect(JSON.parse(sessionStorage.getItem('stoa_pending_chat_message:c-new') ?? '{}')).toMatchObject({
      idempotencyKey: 'initial-c-new',
      content: 'What is a prime?',
    })
    await vi.waitFor(() => expect(server.stream.getGenerationProgress).toHaveBeenCalled(), { timeout: 3000 })
    expect(server.stream.getGenerationProgress.mock.calls[0][2]).toBe('initial-c-new')
    expect(server.stream.streamConversationMessage).not.toHaveBeenCalled()
  })

  it('starts one conversation when sent twice in the same moment', async () => {
    show({ width: 1280 })
    await userEvent.type(dockedField(), 'What is a prime?')
    const field = within(surface()!).getByRole('textbox', { name: 'Your question' })

    await act(async () => {
      fireEvent.keyDown(field, { key: 'Enter' })
      fireEvent.keyDown(field, { key: 'Enter' })
    })

    await vi.waitFor(() => expect(server.conversations.createConversation).toHaveBeenCalled())
    expect(server.conversations.createConversation).toHaveBeenCalledTimes(1)
  })

  it('is not sent later when Ask is closed before the conversation exists', async () => {
    const finish = server.holdNext('createConversation')
    show({ width: 1280 })
    await userEvent.type(dockedField(), 'What is a prime?')
    await userEvent.type(within(surface()!).getByRole('textbox', { name: 'Your question' }), '{Enter}')

    await userEvent.click(within(surface()!).getByRole('button', { name: 'Close' }))
    await act(async () => finish())

    // It went out once, with the conversation; the answer waits for when it is opened.
    expect(server.stream.streamConversationMessage).not.toHaveBeenCalled()
    expect(surface()).toBeNull()
    // And it is not left in the composer to be sent a second time.
    expect(dockedField()).toHaveValue('')
    expect(JSON.parse(sessionStorage.getItem('stoa_pending_chat_message:c-new') ?? '{}')).toMatchObject({
      idempotencyKey: 'initial-c-new',
    })
  })
})

describe('a new conversation that cannot be made', () => {
  it('gives the question back to the composer', async () => {
    server.seed({ list: [] })
    server.refuseNextWith(new ApiError('busy', { status: 503 }), 'createConversation')
    show({ width: 1280 })
    await userEvent.type(dockedField(), 'What is a prime?')
    const field = within(surface()!).getByRole('textbox', { name: 'Your question' })

    await userEvent.type(field, '{Enter}')

    await vi.waitFor(() => expect(field).toHaveValue('What is a prime?'))
    expect(server.conversations.createConversation).toHaveBeenCalledTimes(1)
  })
})

describe('Esc while an input method is composing', () => {
  it('belongs to the composition, not to the sheet', async () => {
    show({ width: 375 })
    await userEvent.type(dockedField(), 'W')
    const field = within(screen.getByRole('dialog', { name: 'Ask' })).getByRole('textbox', { name: 'Your question' })

    fireEvent.keyDown(field, { key: 'Escape', isComposing: true })
    expect(screen.getByRole('dialog', { name: 'Ask' })).toBeInTheDocument()
    fireEvent.keyDown(field, { key: 'Escape', keyCode: 229 })
    expect(screen.getByRole('dialog', { name: 'Ask' })).toBeInTheDocument()

    fireEvent.keyDown(field, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('beside the map, after a star was followed from Ask (#660)', () => {
  it('is the 420 panel on the right, with the planet usable beside it', async () => {
    show({ width: 1280 })
    await userEvent.type(dockedField(), 'W')

    act(() => useAskStore.getState().moveBeside('u-1', 'c1'))

    const panel = screen.getByRole('complementary', { name: 'Ask' })
    expect(panel).toHaveAttribute('data-ask-surface', 'panel')
    expect(panel).toHaveAttribute('data-ask-motion', 'panel')
    expect(panel).toHaveAttribute('data-ask-conversation', 'c1')
    expect(panel.style.width).toBe('420px')
    // The page area is what is left beside the panel, so the map re-centres there.
    expect(page().style.right).toBe('420px')
    expect(page()).not.toHaveAttribute('inert')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('[data-ask-backdrop]')).toBeNull()
    // The same element moved, so what was typed is still there.
    expect(within(panel).getByRole('textbox', { name: 'Your question' })).toHaveValue('W')
  })

  it('stays beside the map as the student asks on', async () => {
    useAskStore.getState().moveBeside('u-1', 'c1')
    show({ width: 1280 })
    const panel = screen.getByRole('complementary', { name: 'Ask' })

    await userEvent.type(within(panel).getByRole('textbox', { name: 'Your question' }), 'And then?{Enter}')

    await vi.waitFor(() => expect(server.stream.streamConversationMessage).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('complementary', { name: 'Ask' })).toBe(panel)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('rises over the map again from its expand button, the cursor in the composer', async () => {
    useAskStore.getState().moveBeside('u-1', 'c1')
    show({ width: 1280 })

    await userEvent.click(within(screen.getByRole('complementary', { name: 'Ask' })).getByRole('button', { name: 'Show bigger' }))

    const risen = screen.getByRole('dialog', { name: 'Ask' })
    expect(risen).toHaveAttribute('data-ask-surface', 'rise')
    expect(risen).toHaveAttribute('data-ask-conversation', 'c1')
    expect(page().style.right).toBe('0px')
    expect(page()).toHaveAttribute('inert')
    expect(within(risen).getByRole('textbox', { name: 'Your question' })).toHaveFocus()
  })

  it('rises from the docked composer again once Ask was closed', async () => {
    useAskStore.getState().moveBeside('u-1', 'c1')
    show({ width: 1280 })

    await userEvent.click(within(screen.getByRole('complementary', { name: 'Ask' })).getByRole('button', { name: 'Close' }))
    await userEvent.type(dockedField(), 'W')

    expect(screen.getByRole('dialog', { name: 'Ask' })).toHaveAttribute('data-ask-surface', 'rise')
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('leaves the phone sheet as it is', () => {
    useAskStore.getState().moveBeside('u-1', 'c1')
    show({ width: 375 })

    const sheet = screen.getByRole('dialog', { name: 'Ask' })
    expect(sheet).toHaveAttribute('data-ask-surface', 'sheet')
    expect(sheet.style.height).toBe('72%')
    expect(screen.queryByRole('button', { name: 'Show bigger' })).toBeNull()
  })
})

describe('the rise from the docked composer, in motion (#660)', () => {
  const css = readFileSync('src/index.css', 'utf8')

  it('grows up from the composer and fades in', () => {
    expect(css).toMatch(/\[data-ask-motion="rise"\]\s*\{\s*animation: ask-rise-in /)
    expect(css).toMatch(/@keyframes ask-rise-in \{\s*from \{\s*opacity: 0;\s*clip-path: inset\(calc\(100% - 46px\)/)
  })

  it('is a crossfade under reduced motion, as the panel and the sheet are', () => {
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)', css.indexOf('ask-rise-in')))
    expect(reduced).toMatch(/^@media \(prefers-reduced-motion: reduce\) \{\s*\[data-ask-motion\] \{\s*animation: ask-fade-in /)
  })
})

describe('full screen (#676)', () => {
  const toggle = (within_: HTMLElement, name: 'Full screen' | 'Leave full screen') =>
    within(within_).getByRole('button', { name })

  it('fills the whole window from risen Ask on a desktop, and goes back to the risen size', async () => {
    show({ width: 1280, shell: true })
    await userEvent.type(dockedField(), 'W')
    const risen = screen.getByRole('dialog', { name: 'Ask' })

    await userEvent.click(toggle(risen, 'Full screen'))

    // The same dialog, over everything, the top bar too; its own sky still.
    expect(screen.getByRole('dialog', { name: 'Ask' })).toBe(risen)
    expect(risen).toHaveAttribute('data-ask-full-screen')
    expect(risen).toHaveClass('fixed')
    expect(risen.style.inset).toBe('0px')
    expect(Number(risen.style.zIndex)).toBeGreaterThan(30)
    expect(risen.style.maxWidth).toBe('')
    expect(risen).toHaveAttribute('data-surface', 'sky')
    // The button says what a press does now, and keeps the focus.
    const leave = toggle(risen, 'Leave full screen')
    expect(leave).toHaveFocus()
    expect(within(risen).getByRole('textbox', { name: 'Your question' })).toHaveValue('W')

    await userEvent.click(leave)

    expect(risen).not.toHaveAttribute('data-ask-full-screen')
    expect(risen).toHaveClass('absolute')
    expect(risen.style.maxWidth).toBe('640px')
    expect(risen.style.top).toBe('24px')
    expect(toggle(risen, 'Full screen')).toHaveFocus()
  })

  it('keeps what is read to a centred column in wide full screen only', async () => {
    show({ width: 1280 })
    await userEvent.type(dockedField(), 'W')
    const risen = screen.getByRole('dialog', { name: 'Ask' })
    await userEvent.click(await within(risen).findByRole('button', { name: /Linear equations/ }))
    const thread = within(risen).getByRole('log')
    const composer = risen.querySelector<HTMLElement>('[data-ask-composer-area]')!
    const header = risen.querySelector('header')!
    // Half of what is left beside a 760 column, never less than the gutter (jsdom writes the calc out).
    const column = (gutter: number) => new RegExp(`^max\\(${gutter}px, .*100% - 760px`)
    const sides = (element: HTMLElement) => [element.style.paddingLeft, element.style.paddingRight]
    // Risen: the panel's own gutters.
    expect(sides(thread)).toEqual(['18px', '18px'])
    expect(sides(composer)).toEqual(['14px', '14px'])
    expect(sides(header)).toEqual(['18px', '12px'])

    await userEvent.click(toggle(risen, 'Full screen'))

    // Full screen: the thread and the composer in one 760 column; the header's
    // title starts on its left edge, its buttons stay at the window's.
    expect(thread.style.paddingLeft).toMatch(column(18))
    expect(thread.style.paddingRight).toMatch(column(18))
    expect(composer.style.paddingLeft).toMatch(column(14))
    expect(composer.style.paddingRight).toMatch(column(14))
    expect(header.style.paddingLeft).toMatch(column(18))
    expect(header.style.paddingRight).toBe('12px')

    await userEvent.click(toggle(risen, 'Leave full screen'))

    expect(sides(thread)).toEqual(['18px', '18px'])
    expect(sides(composer)).toEqual(['14px', '14px'])
    expect(sides(header)).toEqual(['18px', '12px'])
  })

  it('keeps the list to the column too, and the panel beside the map to its gutters', async () => {
    show({ width: 1280 })
    await userEvent.type(dockedField(), 'W')
    const risen = screen.getByRole('dialog', { name: 'Ask' })
    const list = (await within(risen).findByRole('button', { name: /Linear equations/ })).closest<HTMLElement>('.overflow-y-auto')!
    expect(list.style.paddingLeft).toBe('8px')

    await userEvent.click(toggle(risen, 'Full screen'))
    expect(list.style.paddingLeft).toMatch(/^max\(8px, .*100% - 760px/)

    act(() => useAskStore.getState().moveBeside('u-1', 'c1'))
    const panel = screen.getByRole('complementary', { name: 'Ask' })
    expect(within(panel).getByRole('log').style.paddingLeft).toBe('18px')
  })

  it('leaves the phone sheet in full screen at its own padding, with no column', async () => {
    show({ width: 375 })
    await userEvent.type(dockedField(), 'W')
    const sheet = screen.getByRole('dialog', { name: 'Ask' })

    await userEvent.click(toggle(sheet, 'Full screen'))

    expect(sheet.querySelector<HTMLElement>('[data-ask-composer-area]')!.style.padding).toBe('0px 12px 34px')
  })

  it('takes the phone sheet to 100% and back to 72%', async () => {
    show({ width: 375 })
    await userEvent.type(dockedField(), 'W')
    const sheet = screen.getByRole('dialog', { name: 'Ask' })
    expect(sheet.style.height).toBe('72%')

    await userEvent.click(toggle(sheet, 'Full screen'))

    expect(sheet.style.height).toBe('100%')
    expect(sheet.style.borderRadius).toBe('0px')
    expect(sheet.style.transition).toContain('height')
    expect(toggle(sheet, 'Leave full screen')).toHaveFocus()

    await userEvent.click(toggle(sheet, 'Leave full screen'))

    expect(sheet.style.height).toBe('72%')
    expect(toggle(sheet, 'Full screen')).toHaveFocus()
  })

  it('eases nothing on the phone under reduced motion', async () => {
    show({ width: 375, reducedMotion: true })
    await userEvent.type(dockedField(), 'W')
    const sheet = screen.getByRole('dialog', { name: 'Ask' })

    await userEvent.click(toggle(sheet, 'Full screen'))

    expect(sheet.style.height).toBe('100%')
    expect(sheet.style.transition).toBe('none')
  })

  it('goes back to 72% on a drag down from full screen, and closes on a second', async () => {
    show({ width: 375 })
    await userEvent.type(dockedField(), 'W')
    const sheet = screen.getByRole('dialog', { name: 'Ask' })
    sheet.getBoundingClientRect = () => ({ height: 800 }) as DOMRect
    await userEvent.click(toggle(sheet, 'Full screen'))
    const handle = sheet.firstElementChild as HTMLElement
    async function drag() {
      act(() => {
        fireEvent.pointerDown(handle, { pointerId: 1, clientY: 100 })
        fireEvent.pointerMove(handle, { pointerId: 1, clientY: 400 })
      })
      await act(() => new Promise((resolve) => setTimeout(resolve, 300)))
      act(() => {
        fireEvent.pointerUp(handle, { pointerId: 1, clientY: 400 })
      })
    }

    await drag()

    expect(screen.getByRole('dialog', { name: 'Ask' })).toBe(sheet)
    expect(sheet.style.height).toBe('72%')

    await drag()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('ends when Ask closes, so the next open rises at the normal size', async () => {
    show({ width: 1280 })
    await userEvent.type(dockedField(), 'W')
    await userEvent.click(toggle(screen.getByRole('dialog', { name: 'Ask' }), 'Full screen'))

    // Esc closes Ask, full screen or not.
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.type(dockedField(), 'W')

    const risen = screen.getByRole('dialog', { name: 'Ask' })
    expect(risen).not.toHaveAttribute('data-ask-full-screen')
    expect(risen.style.maxWidth).toBe('640px')
    expect(toggle(risen, 'Full screen')).toBeInTheDocument()
  })

  it('ends when the phone sheet closes, so it opens at 72% again', async () => {
    show({ width: 375 })
    await userEvent.type(dockedField(), 'W')
    const sheet = screen.getByRole('dialog', { name: 'Ask' })
    await userEvent.click(toggle(sheet, 'Full screen'))

    await userEvent.click(within(sheet).getByRole('button', { name: 'Close' }))
    await userEvent.type(dockedField(), 'W')

    expect(screen.getByRole('dialog', { name: 'Ask' }).style.height).toBe('72%')
  })

  it('is not offered beside the map, where the expand button raises Ask', async () => {
    show({ width: 1280 })
    await userEvent.type(dockedField(), 'W')
    await userEvent.click(toggle(screen.getByRole('dialog', { name: 'Ask' }), 'Full screen'))

    act(() => useAskStore.getState().moveBeside('u-1', 'c1'))

    const panel = screen.getByRole('complementary', { name: 'Ask' })
    expect(panel).not.toHaveAttribute('data-ask-full-screen')
    expect(panel.style.width).toBe('420px')
    expect(within(panel).queryByRole('button', { name: /full screen/i })).toBeNull()
    expect(within(panel).getByRole('button', { name: 'Show bigger' })).toBeInTheDocument()

    // Raised again, at the normal size.
    await userEvent.click(within(panel).getByRole('button', { name: 'Show bigger' }))
    const risen = screen.getByRole('dialog', { name: 'Ask' })
    expect(risen).not.toHaveAttribute('data-ask-full-screen')
    expect(toggle(risen, 'Full screen')).toBeInTheDocument()
  })

  it('is offered at /ask on a desktop, not on a phone, where the sheet is already full screen', () => {
    show({ width: 1280, direct: null })
    expect(toggle(screen.getByRole('dialog', { name: 'Ask' }), 'Full screen')).toBeInTheDocument()
  })

  it('is not offered at /ask on a phone', () => {
    show({ width: 375, direct: null })
    expect(screen.queryByRole('button', { name: /full screen/i })).toBeNull()
  })

  it('is named in all four languages', () => {
    for (const language of ['de', 'en', 'fr', 'it']) {
      const chat = JSON.parse(readFileSync(`src/i18n/locales/${language}/chat.json`, 'utf8'))
      expect(chat.ask.fullScreen.enter, language).toBeTruthy()
      expect(chat.ask.fullScreen.leave, language).toBeTruthy()
    }
  })
})