/**
 * Asking a teacher beside the star map moved the whole page up by about
 * 280px, and the request's card out of sight (#636). The answer's words for
 * screen readers only ("Step N:", "(Step N)") are `sr-only`, placed
 * absolutely. The thread was not positioned, so they were held by the panel
 * around it instead, at their place in the unscrolled thread: below the
 * screen, past the star map's shell. The shell (`overflow: hidden`, never
 * meant to scroll) grew taller than the screen, and anything brought into
 * view in the thread -- a click by an assistive tool, a screen reader's
 * cursor, find in page -- scrolled the shell, and the page with it.
 *
 * jsdom lays nothing out, so this checks the cause: everything placed
 * absolutely in the thread is held by the thread or by something inside it,
 * and so scrolls with it. `tests/e2e-dist/askTeacherScroll.spec.ts` checks the
 * page itself in a browser.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import { AskServerProvider } from '@/features/ask/server/askServer'
import i18n from '@/i18n'
import { resetAsk } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { ChatMessage, StructuredAnswer } from '@/types/chat'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'

let server: FakeAskServer

const SECTIONS: StructuredAnswer = {
  kind: 'answer',
  steps: Array.from({ length: 8 }, (_, index) => `Step ${index + 1}: do the same to both sides.`),
  answer: 'x = 5',
  hints: [],
  similarExercises: [],
  knowledgePoints: [],
  suggestTeacher: true,
}

function message(id: string, role: ChatMessage['role'], content: string, extra: Partial<ChatMessage> = {}): ChatMessage {
  return { id, conversationId: 'c1', role, content, createdAt: '2026-11-10T10:00:00.000Z', status: 'completed', ...extra }
}

function openAsk(width: number) {
  window.matchMedia = ((query: string) => ({
    matches: !/min-width:\s*(\d+)px/.test(query) || width >= Number(query.match(/min-width:\s*(\d+)px/)?.[1]),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/ask/c1']}>
          <AskServerProvider value={server}>
            <AskHost route={{ conversationId: 'c1' }} />
          </AskServerProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const POSITIONED = /(^|\s)(relative|absolute|fixed|sticky)(\s|$)/

/** The element an absolutely placed one is held by: its nearest positioned ancestor, by class. */
function containingBlock(node: Element) {
  for (let at = node.parentElement; at; at = at.parentElement) {
    if (POSITIONED.test(at.className)) return at
  }
  return null
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
      {
        id: 'c1',
        title: 'Linear equations',
        subject: 'math',
        grade: '8',
        updatedAt: '2026-11-10T10:00:00.000Z',
        messages: [message('s1', 'student', 'Solve 3x + 5 = 20.'), message('a1', 'assistant', 'x = 5', { structured: SECTIONS })],
      },
    ],
  })
})

afterEach(() => {
  sessionStorage.clear()
  window.matchMedia = originalMatchMedia
})

describe.each([
  ['the panel beside the map', 1280],
  ['the sheet on a phone', 375],
])('in %s (#636)', (_, width) => {
  it('holds the words for screen readers inside the thread, before and after a teacher is asked', async () => {
    openAsk(width)
    const thread = await screen.findByRole('log', { name: 'Messages' })
    await within(thread).findByRole('list', { name: 'Steps' })

    const heldOutside = () =>
      Array.from(thread.querySelectorAll('.sr-only'))
        .filter((node) => {
          const block = containingBlock(node)
          return !block || !(block === thread || thread.contains(block))
        })
        .map((node) => node.textContent)

    expect(thread.querySelectorAll('.sr-only').length).toBeGreaterThan(0)
    expect(heldOutside()).toEqual([])

    await userEvent.click(within(thread).getByRole('button', { name: 'Ask a teacher' }))
    await screen.findByRole('region', { name: 'Teacher support' })
    expect(heldOutside()).toEqual([])
  })
})
