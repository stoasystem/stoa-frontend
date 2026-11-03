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
import { AskServerProvider } from '@/features/ask/server/askServer'
import i18n from '@/i18n'
import { resetAsk, useAskStore } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'

/** The server behind Ask, in memory (#571): c1 and c2 listed, c9 not, and teachers online. */
let server: FakeAskServer

const summary = (id: string, title: string) => ({
  id,
  title,
  subject: 'math',
  grade: '8',
  updatedAt: '2026-10-20T10:00:00.000Z',
})

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
          <AskServerProvider value={server}>
            <Routes>
              <Route path="/ask/:conversationId?" element={<DirectAsk />} />
              <Route path="*" element={<AskHost />} />
            </Routes>
          </AskServerProvider>
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
  server = createFakeAskServer()
  server.seed({
    conversations: [
      { ...summary('c1', 'Linear equations'), messages: [] },
      { ...summary('c2', 'Fractions'), messages: [] },
      { ...summary('c9', 'Linear equations'), messages: [] },
    ],
    list: [summary('c1', 'Linear equations'), summary('c2', 'Fractions')],
    newConversationIds: ['c-new'],
  })
  // The first question goes out with the conversation, and Ask then watches
  // its generation. Running for ever, that watch outlived the file and, ending
  // after jsdom was gone, threw "window is not defined" (PR #537's CI run
  // 41083798606); finished, it ends within the test that asked. The fake ends
  // the first question's command on its own.
})

afterEach(async () => {
  // A conversation started here is watched until its answer is done; let that
  // watch end inside the file, before jsdom goes.
  if (server.conversations.createConversation.mock.calls.length > 0) {
    await vi.waitFor(() => expect(server.stream.getGenerationProgress).toHaveBeenCalled(), { timeout: 3000 })
    await act(async () => {})
  }
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
    const read = server.holdNext('getConversation')
    show()
    await panel().findByRole('button', { name: /Fractions/ })

    await press(row('c2'))

    expect(panel().getByRole('heading', { level: 2, name: 'Fractions' })).toHaveFocus()
    expect(panel().getByText('Mathematics')).toBeInTheDocument()

    await act(async () => read())
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
    server.seed({ list: [] })
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
    show()
    const field = panel().getByRole('textbox', { name: 'Your question' })

    await userEvent.type(field, 'What is a prime?{Enter}')

    await vi.waitFor(() => expect(surface()).toHaveAttribute('data-ask-conversation', 'c-new'))
    expect(field).toHaveFocus()
  })

  it('says the conversation is being started in a region that was there before it', async () => {
    const finish = server.holdNext('createConversation')
    show()
    const region = document.querySelector<HTMLElement>('[data-ask-starting]')
    expect(region).toHaveAttribute('role', 'status')
    expect(region).toBeEmptyDOMElement()

    await userEvent.type(panel().getByRole('textbox', { name: 'Your question' }), 'What is a prime?{Enter}')

    expect(document.querySelector('[data-ask-starting]')).toBe(region)
    expect(region).toHaveTextContent('Starting the conversation…')
    await act(async () => finish())
  })
})
