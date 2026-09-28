import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppLayout } from '@/layouts/AppLayout'
import { getDefaultRouteForRole } from '@/lib/authRoutes'
import { ChatPage } from '@/pages/chat/ChatPage'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'
import { mswServer } from '../mswServer'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en', language: 'en', changeLanguage: vi.fn() },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}))

// The layout must reach the one shared sign-out, not a copy of it; what that
// hook does is covered by useSignOut.test.tsx and logout.test.tsx.
const { signOut } = vi.hoisted(() => ({ signOut: vi.fn(async () => {}) }))
vi.mock('@/hooks/auth/useSignOut', () => ({
  useSignOut: () => ({ signOut, isSigningOut: false }),
}))

// The student lands on /chat, which renders no AppLayout of its own.
const conversation = {
  id: 'conv-1',
  subject: 'math',
  grade: 'Grade 6',
  title: 'Brüche',
  createdAt: '2026-09-26T10:00:00Z',
  updatedAt: '2026-09-26T10:01:00Z',
  messageCount: 1,
}
const chat = vi.hoisted(() => ({ conversations: [] as unknown[], listFailed: false }))
vi.mock('@/hooks/chat/useConversationsQuery', () => ({
  useConversationsQuery: () =>
    chat.listFailed
      ? { data: undefined, isLoading: false, isError: true }
      : { data: { items: chat.conversations }, isLoading: false, isError: false },
}))
vi.mock('@/hooks/chat/useConversationQuery', () => ({
  useConversationQuery: (id: string | null) => ({
    data: id
      ? { ...conversation, messages: [{ id: 'm-1', role: 'user', content: 'Wie addiere ich Brüche?', createdAt: '2026-09-26T10:00:00Z' }] }
      : undefined,
    isLoading: false,
  }),
}))
vi.mock('@/hooks/student/useStudentProfileQuery', () => ({
  useStudentProfileQuery: () => ({ data: { grade: 'Grade 6', primarySubjects: [] }, isLoading: false }),
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
  useTeacherHelpMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/chat/useTeacherHelpStatusQuery', () => ({
  useTeacherHelpStatusQuery: () => ({ data: undefined }),
}))

// jsdom applies no stylesheet, so "visible at 375px" is read off the Tailwind
// classes on the button and every ancestor, with Tailwind's default min-width
// breakpoints (src/index.css does not override them). A display or visibility
// utility behind any other variant is refused rather than guessed at.
const BREAKPOINTS: Record<string, number> = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 }
const SHOWN = new Set([
  'block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid',
  'contents', 'table', 'flow-root', 'list-item', 'not-sr-only',
])
const HIDDEN = new Set(['hidden', 'sr-only'])

function shownByOwnClassesAt(element: Element, width: number): boolean {
  const channels = { display: { shown: true, from: -1 }, visibility: { shown: true, from: -1 } }
  for (const cls of Array.from(element.classList)) {
    const parts = cls.split(':')
    const utility = parts[parts.length - 1]
    const channel =
      SHOWN.has(utility) || HIDDEN.has(utility)
        ? channels.display
        : utility === 'invisible' || utility === 'visible'
          ? channels.visibility
          : null
    if (!channel) continue
    if (parts.length > 2 || (parts.length === 2 && !(parts[0] in BREAKPOINTS))) {
      throw new Error(`the width model does not know "${cls}"; extend it before trusting this test`)
    }
    const from = parts.length === 2 ? BREAKPOINTS[parts[0]] : 0
    if (from > width || from < channel.from) continue
    channel.from = from
    channel.shown = !(HIDDEN.has(utility) || utility === 'invisible')
  }
  return channels.display.shown && channels.visibility.shown
}

function shownAt(element: Element, width: number): boolean {
  for (let node: Element | null = element; node; node = node.parentElement) {
    if (!shownByOwnClassesAt(node, width)) return false
  }
  return true
}

function signOutButtonsShownAt(width: number) {
  return screen
    .getAllByRole('button', { name: 'actions.logOut' })
    .filter((button) => shownAt(button, width) && !button.hasAttribute('disabled'))
}

const originalMatchMedia = window.matchMedia

// Since #18 the shell has one sign-out, in the avatar menu, and chooses its
// phone or desktop bar with matchMedia; so the width is emulated there too.
function emulateWidth(width: number) {
  window.matchMedia = ((query: string) => {
    const min = query.match(/min-width:\s*(\d+)px/)
    const max = query.match(/max-width:\s*(\d+)px/)
    const matches = (!min || width >= Number(min[1])) && (!max || width <= Number(max[1]))
    return {
      matches,
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

function accountTriggersShownAt(width: number) {
  return screen
    .getAllByRole('button', { name: 'accountMenu.open' })
    .filter((button) => shownAt(button, width) && !button.hasAttribute('disabled'))
}

function signOutItemsShownAt(width: number) {
  return screen
    .queryAllByRole('menuitem', { name: 'actions.logOut' })
    .filter((item) => shownAt(item, width) && item.getAttribute('aria-disabled') !== 'true')
}

/** Opens the avatar menu the way a person would, and returns its sign-out. */
async function openAccountMenuAt(width: number) {
  const triggers = accountTriggersShownAt(width)
  expect(triggers, `no account menu to open at ${width}px`).toHaveLength(1)
  await userEvent.click(triggers[0])
  const items = signOutItemsShownAt(width)
  expect(items, `no sign-out in the account menu at ${width}px`).toHaveLength(1)
  return items[0]
}

function renderSignedIn(role: UserRole, path: string, page: ReactNode) {
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Ada Lovelace', email: 'ada@example.com', role } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>{page}</MemoryRouter>
    </QueryClientProvider>,
  )
}

function renderShellAs(role: UserRole, width: number) {
  emulateWidth(width)
  renderSignedIn(
    role,
    getDefaultRouteForRole(role),
    <AppLayout>
      <p>page</p>
    </AppLayout>,
  )
}

type ChatState = 'no conversation yet' | 'the conversation list' | 'an open conversation' | 'a list that failed to load'

async function renderChatShowing(state: ChatState) {
  chat.listFailed = state === 'a list that failed to load'
  chat.conversations = state === 'no conversation yet' ? [] : [conversation]
  renderSignedIn('student', '/chat', <ChatPage />)
  if (state === 'an open conversation') {
    await userEvent.click(screen.getAllByRole('button', { name: /Brüche/ })[0])
    expect(await screen.findByText('Wie addiere ich Brüche?')).toBeInTheDocument()
  }
}

const CHAT_STATES: ChatState[] = [
  'no conversation yet',
  'the conversation list',
  'an open conversation',
  'a list that failed to load',
]

const ROLES: UserRole[] = ['student', 'parent', 'teacher', 'admin']

// Below 640px both sign-out buttons used to be hidden, the sidebar's below
// `md` and the top bar's below `sm`, so a phone could not sign out at all
// (stoasystem/stoa-frontend#2). Since #18 the shell's only sign-out is in the
// avatar menu; this still holds that it can be reached, and used, at each width.
describe('signing out on a narrow screen', () => {
  beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => {
    mswServer.resetHandlers()
    window.matchMedia = originalMatchMedia
  })
  afterAll(() => mswServer.close())
  beforeEach(() => {
    // Nothing on these screens needs data to lay out; every other call is refused.
    mswServer.use(http.all('https://api.test/*', () => HttpResponse.json({}, { status: 404 })))
    signOut.mockClear()
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  })

  describe.each([375, 632])('at %ipx', (width) => {
    it.each(ROLES)('offers a %s a visible sign-out that uses the shared sign-out', async (role) => {
      renderShellAs(role, width)

      const signOutItem = await openAccountMenuAt(width)
      await userEvent.click(signOutItem)
      expect(signOut).toHaveBeenCalledOnce()
    })
  })

  // The chat has no app shell, and before #20 no sign-out at any width; with
  // no conversation, or a list that failed, it had no header either.
  describe.each([375, 632, 1280])('on /chat at %ipx', (width) => {
    it.each(CHAT_STATES)('offers a student showing %s a visible sign-out', async (state) => {
      await renderChatShowing(state)

      const shown = signOutButtonsShownAt(width)
      expect(shown, `no sign-out on /chat (${state}) at ${width}px`).toHaveLength(1)

      await userEvent.click(shown[0])
      expect(signOut).toHaveBeenCalledOnce()
    })
  })

  // Since #18 the desktop has the same single sign-out as the phone: behind the
  // avatar, with no second copy in a sidebar or loose in the bar.
  it.each(ROLES)('gives a %s exactly one sign-out at 1280px, behind the avatar', async (role) => {
    renderShellAs(role, 1280)

    expect(screen.queryAllByRole('button', { name: 'actions.logOut' })).toHaveLength(0)
    const signOutItem = await openAccountMenuAt(1280)
    await userEvent.click(signOutItem)
    expect(signOut).toHaveBeenCalledOnce()
  })
})
