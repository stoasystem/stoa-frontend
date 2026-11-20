/**
 * The common mistakes under an Ask answer (#683, stoa-backend#444): a section
 * of its own when the answer names any, typeset like the steps; nothing at all
 * when the list is empty, when an answer from before it has no key, and on a
 * follow-up. A mistake with no error-cause category reads like one with it,
 * because the category is not shown. The section comes with the rest of the
 * sections once the answer is whole: it is not there while the answer is
 * written, and it is not drawn again when the conversation is read back.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskAnswerSections, hasSections } from '@/features/ask/AskAnswerSections'
import { AskHost } from '@/features/ask/AskHost'
import { AskServerProvider } from '@/features/ask/server/askServer'
import i18n from '@/i18n'
import { resetAsk } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { ChatMessage, ChatStreamEvent, Conversation, StructuredAnswer } from '@/types/chat'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'

let server: FakeAskServer

const MISTAKES: StructuredAnswer['commonMistakes'] = [
  { text: 'Adding the denominators too: $\\frac{1}{3} + \\frac{1}{4}$ is not $\\frac{2}{7}$.', errorCause: 'structural' },
  { text: 'Changing the denominator without changing the numerator.', errorCause: null },
]

const SECTIONS: StructuredAnswer = {
  kind: 'answer',
  steps: ['Rewrite both over 12.', 'Add the numerators.'],
  answer: '$\\frac{7}{12}$',
  hints: ['Which number do 3 and 4 both go into?'],
  similarExercises: ['Add $\\frac{1}{2}$ and $\\frac{1}{5}$.'],
  knowledgePoints: [{ name: 'Fractions', unitId: null }],
  suggestTeacher: false,
  quickReplies: [],
  commonMistakes: MISTAKES,
}

/** The same answer as stored before stoa-backend#444: no `commonMistakes` key at all. */
function withoutTheKey(): StructuredAnswer {
  const rest: StructuredAnswer = { ...SECTIONS }
  delete rest.commonMistakes
  return rest
}

function message(id: string, role: ChatMessage['role'], content: string, extra: Partial<ChatMessage> = {}): ChatMessage {
  return { id, conversationId: 'c1', role, content, createdAt: '2026-11-20T10:00:00.000Z', status: 'completed', ...extra }
}

function answer(id: string, structured: StructuredAnswer | null, content = '1. Rewrite both over 12.\n2. Add the numerators.') {
  return message(id, 'assistant', content, { structured })
}

function conversation(messages: ChatMessage[]): Conversation {
  return { id: 'c1', title: 'Fractions', subject: 'math', grade: '6', updatedAt: '2026-11-20T10:00:00.000Z', messages }
}

function readBack(messages: ChatMessage[]) {
  server.seed({ conversations: [conversation(messages)] })
}

function openAsk() {
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
  return within(screen.getByRole('dialog', { name: 'Ask' }))
}

function thread(ask: ReturnType<typeof openAsk>) {
  return within(ask.getByRole('log', { name: 'Messages' }))
}

function sectionsOnly(structured: StructuredAnswer) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AskAnswerSections messageId="a1" structured={structured} />
    </I18nextProvider>,
  )
}

beforeEach(async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  await i18n.changeLanguage('en')
  window.matchMedia = ((query: string) => ({
    matches: !/min-width:\s*(\d+)px/.test(query) || 1280 >= Number(query.match(/min-width:\s*(\d+)px/)?.[1]),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  resetAsk()
  server = createFakeAskServer()
})

const originalMatchMedia = window.matchMedia
afterEach(async () => {
  vi.useRealTimers()
  vi.clearAllMocks()
  sessionStorage.clear()
  window.matchMedia = originalMatchMedia
  await i18n.changeLanguage('en')
})

describe('an answer that names common mistakes', () => {
  it('typesets their LaTeX as the steps are typeset', async () => {
    sectionsOnly(SECTIONS)
    const first = () => document.querySelector('[data-common-mistake="0"]')
    await waitFor(() => expect(first()?.querySelector('.katex')).not.toBeNull())
    expect(first()?.textContent).not.toContain('$')
    expect(first()?.textContent).toContain('Adding the denominators too:')
  })

  it('shows them in a section of their own under the answer', async () => {
    readBack([message('s1', 'student', 'What is 1/3 + 1/4?'), answer('a1', SECTIONS)])
    const ask = openAsk()

    const list = await thread(ask).findByRole('list', { name: 'Common mistakes' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Adding the denominators too:')
    expect(items[1]).toHaveTextContent('Changing the denominator without changing the numerator.')
    expect(thread(ask).getByText('Common mistakes', { selector: 'p' })).toBeInTheDocument()

    // Under the answer, before the hints: a section apart from the steps and the hints.
    const order = [...document.querySelectorAll('[data-answer-section]')].map((node) => node.getAttribute('data-answer-section'))
    expect(order).toEqual(['steps', 'answer', 'commonMistakes', 'hints', 'similarExercises', 'knowledgePoints'])
    expect(list.closest('[data-answer-section="steps"], [data-answer-section="hints"]')).toBeNull()
  })

  it('treats a mistake without a category like one with it, and names no category', () => {
    sectionsOnly(SECTIONS)
    const items = within(screen.getByRole('list', { name: 'Common mistakes' })).getAllByRole('listitem')
    expect(items[0]).toHaveAttribute('data-error-cause', 'structural')
    expect(items[1]).not.toHaveAttribute('data-error-cause')
    expect(items[1]).toHaveTextContent('Changing the denominator')
    expect(document.body.textContent).not.toMatch(/structural|deviation|application|metacognitive|null/i)
  })

  it('titles the section in all four languages', async () => {
    const titles = { de: 'Häufige Fehler', en: 'Common mistakes', fr: 'Erreurs fréquentes', it: 'Errori comuni' }
    for (const [language, title] of Object.entries(titles)) {
      await i18n.changeLanguage(language)
      const { unmount } = sectionsOnly(SECTIONS)
      expect(screen.getByRole('list', { name: title })).toBeInTheDocument()
      expect(document.body.textContent).not.toMatch(/ask\.answer\./)
      unmount()
    }
  })
})

describe('an answer without common mistakes', () => {
  it('shows no section when the list is empty', async () => {
    readBack([answer('a1', { ...SECTIONS, commonMistakes: [] })])
    const ask = openAsk()

    expect(await thread(ask).findByRole('list', { name: 'Steps' })).toBeInTheDocument()
    expect(thread(ask).queryByRole('list', { name: 'Common mistakes' })).not.toBeInTheDocument()
    expect(thread(ask).queryByText('Common mistakes')).not.toBeInTheDocument()
    expect(document.querySelector('[data-answer-section="commonMistakes"]')).toBeNull()
  })

  it('shows no section on an answer stored before them, which has no key', async () => {
    readBack([answer('a1', withoutTheKey())])
    const ask = openAsk()

    expect(await thread(ask).findByRole('list', { name: 'Steps' })).toBeInTheDocument()
    expect(document.querySelector('[data-answer-section="commonMistakes"]')).toBeNull()
  })

  it('shows no section on a follow-up, whatever it carries', async () => {
    readBack([
      answer('a1', withoutTheKey()),
      message('s2', 'student', 'Why 12?'),
      answer('a2', { kind: 'followUp', answer: 'Because 3 and 4 both go into 12.', commonMistakes: MISTAKES }, 'Because 3 and 4 both go into 12.'),
    ])
    const ask = openAsk()

    expect(await thread(ask).findByText('Because 3 and 4 both go into 12.')).toBeInTheDocument()
    expect(document.querySelector('[data-answer-section="commonMistakes"]')).toBeNull()
    expect(thread(ask).queryByText(/Adding the denominators/)).not.toBeInTheDocument()
  })

  it('leaves an entry without words out, and the section with it when nothing is left', () => {
    sectionsOnly({ ...SECTIONS, commonMistakes: [{ text: '  ', errorCause: null }] })
    expect(document.querySelector('[data-answer-section="commonMistakes"]')).toBeNull()
  })

  it('lays out an answer in sections on its mistakes alone, as on any other section', () => {
    expect(hasSections({ kind: 'answer', commonMistakes: MISTAKES })).toBe(true)
    expect(hasSections({ kind: 'answer', commonMistakes: [] })).toBe(false)
    expect(hasSections({ kind: 'followUp', commonMistakes: MISTAKES })).toBe(false)
  })
})

describe('an answer just written', () => {
  it('shows the mistakes only once the answer is whole, and keeps the same section when it is read back', async () => {
    readBack([])
    let finish!: () => void
    const finished = new Promise<void>((resolve) => {
      finish = resolve
    })
    const written: ChatStreamEvent[] = [
      { type: 'message_start', messageId: 'a-new', role: 'assistant', createdAt: new Date().toISOString() },
      { type: 'message_delta', messageId: 'a-new', delta: '1. Rewrite both over 12.' },
    ]
    const done: ChatStreamEvent = { type: 'message_done', messageId: 'a-new', status: 'completed', structured: SECTIONS }
    server.answerWith({ events: written, until: finished, after: [done] })
    const ask = openAsk()
    await ask.findByText('Fractions')
    const releaseReadBack = server.holdNext('getConversation')
    readBack([message('student:c1:x', 'student', 'What is 1/3 + 1/4?'), answer('a-new', SECTIONS)])

    await userEvent.type(ask.getByRole('textbox', { name: 'Your question' }), 'What is 1/3 + 1/4?{Enter}')
    expect(await thread(ask).findByText('1. Rewrite both over 12.')).toBeInTheDocument()
    // While it is written: the text, and no section yet to appear and vanish.
    expect(document.querySelector('[data-answer-section="commonMistakes"]')).toBeNull()

    await act(async () => finish())
    const section = await thread(ask).findByRole('list', { name: 'Common mistakes' })
    // It arrives together with the steps, in the same render.
    expect(thread(ask).getByRole('list', { name: 'Steps' })).toBeInTheDocument()
    const first = within(section).getAllByRole('listitem')[0]

    await act(async () => releaseReadBack())
    await waitFor(() => expect(server.conversations.getConversation.mock.calls.length).toBe(2))
    const again = await thread(ask).findByRole('list', { name: 'Common mistakes' })
    // Not torn down and drawn again: the same node, so nothing flickers.
    expect(again).toBe(section)
    expect(within(again).getAllByRole('listitem')[0]).toBe(first)
  })
})
