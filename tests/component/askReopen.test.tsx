/**
 * Getting Ask back after it was closed (#125).
 *
 * Closing the panel left the docked composer -- a new question could still be
 * asked -- but the conversation just read had no entry anywhere on the page.
 * The way back is a button on the right edge, and it goes back to the
 * conversation that was open, not to an empty new one.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import { ASK_REOPEN } from '@/features/ask/askLayout'
import { AskServerProvider } from '@/features/ask/server/askServer'
import i18n from '@/i18n'
import { resetAsk } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'

const UPDATED = '2026-10-11T10:00:00.000Z'
const summary = (id: string, title: string, updatedAt = UPDATED) => ({ id, title, subject: 'math', grade: '8', updatedAt })

/** The server behind Ask, in memory (#571): two conversations listed, and no teacher online. */
let server: FakeAskServer

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

function planet(width = 1280) {
  emulateWidth(width)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/planet/math']}>
          <AskServerProvider value={server}>
            <AskHost>
              <button type="button">Rotate the planet</button>
            </AskHost>
          </AskServerProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const reopen = () => document.querySelector<HTMLElement>('[data-ask-reopen]')
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
  // c2 never escalated, as c1: the fake's own default.
  server = createFakeAskServer()
  server.availability = { online: false, availableTeachers: 0 }
  server.seed({
    conversations: [
      { ...summary('c1', 'Linear equations'), messages: [] },
      { ...summary('c2', 'Fractions'), messages: [] },
    ],
    list: [summary('c1', 'Linear equations'), summary('c2', 'Fractions', '2026-10-10T10:00:00.000Z')],
  })
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe('the way back into Ask', () => {
  it('is on the page while Ask is closed, and gone while it is open', async () => {
    planet()
    expect(reopen()).not.toBeNull()

    await userEvent.type(dockedField(), 'W')
    expect(surface()).not.toBeNull()
    // The negative: with the panel on screen there is nothing to call back.
    expect(reopen()).toBeNull()
  })

  it('opens the conversation that was being read, not a new empty one', async () => {
    planet()
    await userEvent.type(dockedField(), 'W')
    await userEvent.click(await screen.findByRole('button', { name: /Fractions/ }))
    expect(surface()).toHaveAttribute('data-ask-conversation', 'c2')

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(surface()).toBeNull()

    const back = reopen()!
    expect(back).toHaveAttribute('data-ask-reopen', 'conversation')
    expect(back).toHaveAccessibleName('Back to your conversation')
    await userEvent.click(back)

    expect(surface()).toHaveAttribute('data-ask-conversation', 'c2')
    expect(await screen.findByRole('heading', { name: 'Fractions' })).toBeInTheDocument()
  })

  it('opens the list, and says so, when no conversation was open', async () => {
    planet()
    const back = reopen()!
    expect(back).toHaveAttribute('data-ask-reopen', 'list')
    expect(back).toHaveAccessibleName('Open Ask')

    await userEvent.click(back)
    expect(surface()).toHaveAttribute('data-ask-conversation', '')
  })

  it('keeps clear of the controls the pages already put in the corners', () => {
    planet()
    const back = reopen()!
    // The right edge's middle: the zoom pair, the legend, the "?" and the
    // docked composer all live along the bottom, and the role switcher used for
    // testing is `fixed left-2 top-1/2` on the other side.
    expect(back).toHaveStyle({ right: `${ASK_REOPEN.inset}px`, width: '44px', height: '44px' })
    expect(back.className).toContain('top-1/2')
    expect(back.className).toContain('-translate-y-1/2')
    expect(back.className).not.toContain('bottom-')
  })
})
