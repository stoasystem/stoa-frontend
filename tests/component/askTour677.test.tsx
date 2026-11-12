/**
 * Ask's first-time tour (#677): the first time Ask opens for a student new to
 * Ask, Murmi points at the microphone, the + and -- once the first answer is
 * there -- "Ask a teacher", one at a time, with "Next" and "Skip".
 *
 * - Only for a student new to Ask, read from the server: no conversation
 *   before this open. The one a "Find my own star" example starts as Ask
 *   opens still counts as first.
 * - Its order; a step whose control is not there is passed over (no
 *   microphone on this device, "Ask a teacher" not open to this student).
 * - The teacher's step waits for the first answer.
 * - Not a modal: no focus taken; typing ends the composer's steps; Skip and
 *   Escape end it, leaving Ask open; it does not come back in this tab.
 * - It does not stack with the practice stage's tip (#586), which points at
 *   adding a photo too: the tour wins, and the tip does not make the photo
 *   point again in this tab.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import { askTourProgress } from '@/features/ask/askGuide'
import { AskServerProvider } from '@/features/ask/server/askServer'
import { StageWithAsk } from '@/features/chapter/StageAsk'
import i18n from '@/i18n'
import { resetAsk, useAskStore } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { ChatMessage, ConversationSummary } from '@/types/chat'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'

const OWNER = 'u-1'
const EXAMPLE = "We're doing sine and cosine at school"
let server: FakeAskServer

const LINES = {
  mic: 'Rather talk than type? The microphone shows you how to dictate your question.',
  addCamera: 'With + you can send me a photo or a file of your problem, or take one with the camera.',
  teacher: 'Want a real teacher to look at it? Tap “Ask a teacher” under my answer.',
}

function emulate({ wide = true, reducedMotion = false } = {}) {
  window.matchMedia = ((query: string) => ({
    matches: /reduce/.test(query) ? reducedMotion : wide,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as never
}

/** A device whose dictation STOA can explain: the microphone is there. */
function withMicrophone(on: boolean) {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: on ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' : 'Mozilla/5.0 (X11; Linux x86_64) jsdom',
    configurable: true,
  })
}

function mount(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrap = (inner: ReactNode) => (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <AskServerProvider value={server}>{inner}</AskServerProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>
  )
  return render(wrap(node))
}

function summary(id: string): ConversationSummary {
  return { id, title: id, subject: 'math', grade: '8', updatedAt: '2026-11-06T10:00:00Z' }
}

/** The conversation a question starts comes back answered, under its question. */
function answeredOnCreate() {
  const create = server.conversations.createConversation.getMockImplementation()!
  server.conversations.createConversation.mockImplementation(async (payload) => {
    const made = await create(payload)
    const messages: ChatMessage[] = [
      { id: 'q-1', conversationId: made.id, role: 'student', content: payload.initialMessage ?? '', createdAt: '2026-11-12T10:00:00Z', status: 'sent' },
      { id: 'a-1', conversationId: made.id, role: 'assistant', content: 'Sine and cosine come from the unit circle.', createdAt: '2026-11-12T10:00:05Z', status: 'completed' },
    ]
    server.seed({ conversations: [{ ...made, messages }] })
    return made
  })
}

const bubble = () => document.querySelector<HTMLElement>('[data-ask-tour-bubble]')
const status = () => document.querySelector('[data-ask-tour-status]')!.textContent

/** On the map: "Find my own star", then an example, which opens Ask and goes out at once. */
async function askExample() {
  const view = mount(<AskHost subjectId="math"><p>sky</p></AskHost>)
  act(() => useAskStore.getState().offerExamples(OWNER, [EXAMPLE]))
  await userEvent.click(screen.getByRole('button', { name: EXAMPLE }))
  const ask = await screen.findByRole('dialog', { name: 'Ask' })
  return { view, ask }
}

/** On the map, opened on the list with nothing typed. */
async function openAsk() {
  const view = mount(<AskHost subjectId="math"><p>sky</p></AskHost>)
  act(() => useAskStore.getState().openWithDraft(OWNER, ''))
  const ask = await screen.findByRole('dialog', { name: 'Ask' })
  return { view, ask }
}

beforeEach(async () => {
  vi.clearAllMocks()
  sessionStorage.clear()
  await i18n.changeLanguage('en')
  emulate()
  withMicrophone(true)
  useAuthStore.setState({
    user: { id: OWNER, name: 'L', email: 'l@x', role: 'student' } as CurrentUser,
    accessToken: 't',
    isAuthenticated: true,
  })
  resetAsk()
  server = createFakeAskServer()
  server.availability = { online: false, availableTeachers: 0 }
})

afterEach(() => {
  cleanup()
  withMicrophone(false)
})

describe('who it is for', () => {
  it('is not shown to a student who has asked something before', async () => {
    server.seed({ list: [summary('mine')] })
    await openAsk()
    await waitFor(() => expect(server.conversations.getConversations).toHaveBeenCalled())
    await act(async () => {})
    expect(bubble()).toBeNull()
    expect(askTourProgress(OWNER)).toBeNull()
  })

  it('is shown to a student new to Ask, pointing at the microphone first, read out and taking no focus', async () => {
    const { ask } = await openAsk()
    await waitFor(() => expect(bubble()).not.toBeNull())
    expect(bubble()!.dataset.askTourBubble).toBe('mic')
    expect(ask.contains(bubble())).toBe(true)
    expect(within(bubble()!).getByText(LINES.mic)).toBeTruthy()
    expect(status()).toBe(LINES.mic)
    // The microphone is ringed; the composer keeps the focus and stays usable.
    expect(ask.querySelector('[data-ask-tour="mic"] [data-composer-mic]')).not.toBeNull()
    expect(bubble()!.contains(document.activeElement)).toBe(false)
    expect(document.activeElement?.hasAttribute('data-composer-field')).toBe(true)
  })

  it('counts the conversation a "Find my own star" example starts on this open as the first', async () => {
    server.seed({ newConversationIds: ['found-1'] })
    await askExample()
    await waitFor(() => expect(server.conversations.createConversation).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(bubble()?.dataset.askTourBubble).toBe('mic'))
  })
})

describe('its order', () => {
  it('goes microphone, +, then "Ask a teacher" once the first answer is there', async () => {
    server.seed({ newConversationIds: ['found-1'] })
    answeredOnCreate()
    const releaseRead = server.holdNext('getConversation')
    await askExample()

    await waitFor(() => expect(bubble()?.dataset.askTourBubble).toBe('mic'))
    await userEvent.click(within(bubble()!).getByRole('button', { name: 'Next' }))
    expect(bubble()!.dataset.askTourBubble).toBe('add')
    // Here the camera is offered too (a touch screen), and the line says so.
    expect(within(bubble()!).getByText(LINES.addCamera)).toBeTruthy()
    expect(status()).toBe(LINES.addCamera)
    await userEvent.click(within(bubble()!).getByRole('button', { name: 'Next' }))

    // No answer yet, so no "Ask a teacher": Murmi waits.
    expect(bubble()).toBeNull()
    expect(askTourProgress(OWNER)).toBe('teacher')

    releaseRead()
    await waitFor(() => expect(bubble()?.dataset.askTourBubble).toBe('teacher'))
    expect(within(bubble()!).getByText(LINES.teacher)).toBeTruthy()
    expect(document.querySelector('[data-ask-tour="teacher"] [data-help-action] button')).not.toBeNull()
    // The last step: "Got it", nothing to skip.
    expect(within(bubble()!).queryByRole('button', { name: 'Skip' })).toBeNull()
    await userEvent.click(within(bubble()!).getByRole('button', { name: 'Got it' }))
    expect(bubble()).toBeNull()
    expect(askTourProgress(OWNER)).toBe('done')
  })

  it('passes over the microphone where the device has none', async () => {
    withMicrophone(false)
    await openAsk()
    await waitFor(() => expect(bubble()?.dataset.askTourBubble).toBe('add'))
    expect(document.querySelector('[data-composer-mic]')).toBeNull()
  })

  it('passes over "Ask a teacher" when it is not open to this student, and ends', async () => {
    server.availability = {
      online: false,
      availableTeachers: 0,
      teacherSupport: { canRequest: false, remainingCases: 0, weeklyCases: 0, blockedReason: 'teacher_support_not_included' },
    }
    server.seed({ newConversationIds: ['found-1'] })
    answeredOnCreate()
    await askExample()
    await waitFor(() => expect(bubble()?.dataset.askTourBubble).toBe('mic'))
    await userEvent.click(within(bubble()!).getByRole('button', { name: 'Next' }))
    await userEvent.click(within(bubble()!).getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(document.querySelector('[data-help-action][data-help-blocked]')).not.toBeNull())
    await waitFor(() => expect(askTourProgress(OWNER)).toBe('done'))
    expect(bubble()).toBeNull()
  })
})

describe('getting out of its way', () => {
  it('ends the composer’s steps when the student types, and still points at "Ask a teacher" with the answer', async () => {
    server.seed({ newConversationIds: ['typed-1'] })
    answeredOnCreate()
    const { ask } = await openAsk()
    await waitFor(() => expect(bubble()?.dataset.askTourBubble).toBe('mic'))
    const field = within(ask).getByRole('textbox', { name: 'Your question' })
    await userEvent.type(field, 'What is sine?')
    expect(bubble()).toBeNull()
    expect(askTourProgress(OWNER)).toBe('teacher')
    await userEvent.type(field, '{Enter}')
    await waitFor(() => expect(bubble()?.dataset.askTourBubble).toBe('teacher'))
    // Typing again while it points there ends the tour.
    await userEvent.type(field, 'And cosine?')
    expect(bubble()).toBeNull()
    expect(askTourProgress(OWNER)).toBe('done')
  })

  it('ends on Skip, leaving Ask open, and does not come back in this tab', async () => {
    const first = await openAsk()
    await waitFor(() => expect(bubble()).not.toBeNull())
    await userEvent.click(within(bubble()!).getByRole('button', { name: 'Skip' }))
    expect(bubble()).toBeNull()
    expect(status()).toBe('')
    expect(screen.getByRole('dialog', { name: 'Ask' })).toBeTruthy()
    expect(askTourProgress(OWNER)).toBe('done')
    first.view.unmount()
    resetAsk()

    await openAsk()
    await waitFor(() => expect(server.conversations.getConversations).toHaveBeenCalledTimes(2))
    await act(async () => {})
    expect(bubble()).toBeNull()
  })

  it('ends on Escape wherever focus is, and only the tour: Ask closes on the next press', async () => {
    await askExample()
    await waitFor(() => expect(bubble()).not.toBeNull())
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(bubble()).toBeNull()
    expect(askTourProgress(OWNER)).toBe('done')
    expect(screen.getByRole('dialog', { name: 'Ask' })).toBeTruthy()
  })

  it('works on the phone sheet too', async () => {
    emulate({ wide: false })
    await askExample()
    const sheet = screen.getByRole('dialog', { name: 'Ask' })
    expect(sheet).toHaveAttribute('data-ask-surface', 'sheet')
    await waitFor(() => expect(bubble()).not.toBeNull())
    expect(sheet.contains(bubble())).toBe(true)
  })

  it('stays with Ask in full screen (#676)', async () => {
    await askExample()
    await waitFor(() => expect(bubble()).not.toBeNull())
    await userEvent.click(screen.getByRole('button', { name: i18n.t('chat:ask.fullScreen.enter') }))
    expect(screen.getByRole('dialog', { name: 'Ask' })).toHaveAttribute('data-ask-full-screen')
    expect(bubble()).not.toBeNull()
    expect(screen.getByRole('dialog', { name: 'Ask' }).contains(bubble())).toBe(true)
  })
})

const Stage = () => (
  <StageWithAsk practice={{ context: { unitId: 'u', lessonId: 'l', challengeId: 'ch-1' } }}>
    <p>exercise</p>
  </StageWithAsk>
)
const TIP = 'Stuck? Ask me here.'
const PHOTO = /take a photo of your working/

describe('with the practice stage’s tip (#586)', () => {
  it('wins beside the exercise: the tip waits, then comes without the photo point', async () => {
    withMicrophone(false)
    mount(<Stage />)
    await waitFor(() => expect(bubble()?.dataset.askTourBubble).toBe('add'))
    expect(screen.queryByRole('complementary', { name: TIP })).toBeNull()
    expect(document.querySelector('[data-stage-host][data-ask-guide]')).toBeNull()

    await userEvent.click(within(bubble()!).getByRole('button', { name: 'Next' }))
    const tip = await screen.findByRole('complementary', { name: TIP })
    expect(within(tip).queryByText(PHOTO)).toBeNull()
    expect(document.querySelector('[data-stage-ask-tip-status]')!.textContent).toBe(TIP)
    // Nothing highlighted again.
    expect(document.querySelector('[data-stage-host][data-ask-guide]')).toBeNull()
  })

  it('leaves the tip as it was on a phone until Ask is opened, and then takes over', async () => {
    emulate({ wide: false })
    mount(<Stage />)
    const tip = await screen.findByRole('complementary', { name: TIP })
    expect(within(tip).getByText(PHOTO)).toBeTruthy()
    expect(bubble()).toBeNull()

    await userEvent.type(document.querySelector<HTMLTextAreaElement>('[data-ask-docked] textarea')!, 'H')
    await screen.findByRole('dialog', { name: 'Ask' })
    // Opened by typing: nothing points while the student writes.
    expect(bubble()).toBeNull()
    expect(askTourProgress(OWNER)).toBe('mic')
    expect(screen.queryByRole('complementary', { name: TIP })).toBeNull()
  })
})
