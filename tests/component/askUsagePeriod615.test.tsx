/**
 * Ask once the student's usage period has ended (#615), driven through the
 * real Ask panel with the server behind it in memory (#571).
 *
 * `GET /students/me/entitlement` says where the period stands. Expired, or
 * none ever set (the backend counts that as ended): the composer and "Ask a
 * teacher" are greyed, and beside them it says that asking and asking a
 * teacher are paused while history and practice are not, then how to renew --
 * "ask a parent" when a parent's period covers the student, "contact STOA:
 * <address>" when their own does. The conversations stay readable.
 *
 * A question or a request for a teacher refused `403 usage_period_ended`
 * (stoa-backend#344: the period ended while Ask was open) says the same, is
 * not "the explanation could not be prepared", not the day's or the week's
 * limit, not "not in your plan", and has the entitlement read again.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import { AskServerProvider } from '@/features/ask/server/askServer'
import { StageWithAsk } from '@/features/chapter/StageAsk'
import i18n from '@/i18n'
import { apiErrorFromBody } from '@/services/api/httpClient'
import { resetAsk } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { ChatMessage, Conversation } from '@/types/chat'
import type { StudentUsagePeriod } from '@/types/student'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'

let server: FakeAskServer

/** As the backend will send it (stoa-backend#344): the usual refusal body, under `detail`. */
const periodEnded = () =>
  apiErrorFromBody(
    { detail: { code: 'usage_period_ended', message: 'Your usage period has ended.', correlationId: 'corr-615' } },
    { status: 403, fallback: 'refused' },
  )

const PAUSED = {
  de: 'Deine Nutzungsdauer ist abgelaufen: Fragen stellen und eine Lehrperson fragen sind pausiert. Verlauf und Üben gehen wie gewohnt weiter.',
  en: 'Your usage period has ended: asking questions and asking a teacher are paused. Your history and practice work as usual.',
  fr: 'Ta période d’utilisation est terminée : poser des questions et demander à un enseignant sont en pause. L’historique et les exercices restent disponibles.',
  it: 'Il tuo periodo di utilizzo è terminato: fare domande e chiedere a un docente sono in pausa. La cronologia e gli esercizi restano disponibili.',
} as const
type Language = keyof typeof PAUSED
const languages = Object.keys(PAUSED) as Language[]

const ASK_PARENT = {
  de: 'Bitte deine Eltern, sie zu verlängern.',
  en: 'Ask a parent to renew it.',
  fr: 'Demande à un parent de la renouveler.',
  it: 'Chiedi a un genitore di rinnovarlo.',
} as const

const CONTACT_STOA = {
  de: 'Zum Verlängern schreib STOA: info@stoaedu.ch',
  en: 'To renew it, contact STOA: info@stoaedu.ch',
  fr: 'Pour la renouveler, écris à STOA : info@stoaedu.ch',
  it: 'Per rinnovarlo, scrivi a STOA: info@stoaedu.ch',
} as const

const GENERAL_FAILURE = 'The explanation could not be prepared right now. Please try again or ask a teacher.'

const ACTIVE: StudentUsagePeriod = { endsAt: '2027-06-30', state: 'active', daysLeft: 233, paidBy: 'self' }
const EXPIRED_PARENT: StudentUsagePeriod = { endsAt: '2026-11-08', state: 'expired', daysLeft: 0, paidBy: 'parent' }
const EXPIRED_SELF: StudentUsagePeriod = { endsAt: '2026-11-08', state: 'expired', daysLeft: 0, paidBy: 'self' }
const NONE: StudentUsagePeriod = { endsAt: null, state: 'none', daysLeft: null, paidBy: null }

function periodIs(usagePeriod: StudentUsagePeriod) {
  server.entitlement = { ...server.entitlement, usagePeriod }
}

function message(id: string, role: ChatMessage['role'], content: string): ChatMessage {
  return { id, conversationId: 'c1', role, content, createdAt: '2026-11-08T10:00:00.000Z', status: 'completed' }
}

/** A conversation with an answer, so "Ask a teacher" has one to sit under. */
function conversation(): Conversation {
  return {
    id: 'c1',
    title: 'Linear equations',
    subject: 'math',
    grade: '8',
    updatedAt: '2026-11-08T10:00:00.000Z',
    messages: [message('s1', 'student', 'Why both sides?'), message('a1', 'assistant', 'To keep the equation balanced.')],
  }
}

/** Ask closed: the planet's docked composer, or the practice stage's on a phone. */
function openDocked(where: 'planet' | 'stage') {
  window.matchMedia = ((query: string) => ({
    matches: false,
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
        <MemoryRouter initialEntries={['/']}>
          <AskServerProvider value={server}>
            {where === 'planet' ? (
              <AskHost>
                <p>the map</p>
              </AskHost>
            ) : (
              <StageWithAsk practice={{ context: { unitId: 'u', lessonId: 'l', challengeId: 'ch-1' } }}>
                <p>exercise</p>
              </StageWithAsk>
            )}
          </AskServerProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return screen.getByRole('textbox', { name: i18n.t('chat:ask.composerLabel') })
}

function openAsk(conversationId: string | null = 'c1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[conversationId ? `/ask/${conversationId}` : '/ask']}>
          <AskServerProvider value={server}>
            <AskHost route={{ conversationId }} />
          </AskServerProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return within(screen.getByRole('complementary', { name: i18n.t('chat:ask.title') }))
}

type Ask = ReturnType<typeof openAsk>

const thread = (panel: Ask) => within(panel.getByRole('log', { name: i18n.t('chat:ask.thread.label') }))
const composer = (panel: Ask) => panel.getByRole('textbox', { name: i18n.t('chat:ask.composerLabel') })
const teacherButton = (panel: Ask) => panel.getByRole('button', { name: i18n.t('chat:ask.help.request') })
const sendAgain = (panel: Ask) => panel.queryByRole('button', { name: i18n.t('chat:ask.thread.sendAgain') })
const notice = (panel: Ask) => panel.queryByText((_, element) => element?.hasAttribute('data-usage-period-paused') ?? false)

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

/** The conversation is on screen, with its answer. */
async function opened(panel: Ask) {
  await thread(panel).findByText('To keep the equation balanced.')
}

async function send(panel: Ask, question: string) {
  await userEvent.type(composer(panel), `${question}{Enter}`)
  await advance(1100)
}

const originalMatchMedia = window.matchMedia

beforeEach(async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date('2026-11-09T10:00:00Z'))
  await i18n.changeLanguage('en')
  window.matchMedia = ((query: string) => ({
    matches: true,
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
  server.seed({ conversations: [conversation()] })
  server.availability = {
    online: true,
    availableTeachers: 2,
    teacherSupport: { canRequest: true, remainingCases: 5, weeklyCases: 6, blockedReason: null, resetsAt: null },
  }
  periodIs(ACTIVE)
})

afterEach(async () => {
  vi.useRealTimers()
  vi.clearAllMocks()
  sessionStorage.clear()
  window.matchMedia = originalMatchMedia
  await i18n.changeLanguage('en')
})

describe('a period still running', () => {
  it('leaves the composer and "Ask a teacher" as they are, and says nothing of the period', async () => {
    const panel = openAsk()
    await opened(panel)
    await waitFor(() => expect(server.student.getStudentEntitlement).toHaveBeenCalled())

    expect(composer(panel)).toBeEnabled()
    expect(teacherButton(panel)).toBeEnabled()
    expect(notice(panel)).not.toBeInTheDocument()

    await send(panel, 'And the other side?')
    await waitFor(() => expect(server.stream.streamConversationMessage).toHaveBeenCalledTimes(1))
  })

  it('is not paused on a guess while the entitlement cannot be read', async () => {
    server.refuseNextWith(new TypeError('Failed to fetch'), 'getStudentEntitlement')
    const panel = openAsk()
    await opened(panel)
    await waitFor(() => expect(server.student.getStudentEntitlement).toHaveBeenCalled())

    expect(composer(panel)).toBeEnabled()
    expect(teacherButton(panel)).toBeEnabled()
    expect(notice(panel)).not.toBeInTheDocument()
  })
})

describe('a period that has ended', () => {
  it.each(languages)('greys the composer and "Ask a teacher", and says why and to ask a parent (%s)', async (language) => {
    await i18n.changeLanguage(language)
    periodIs(EXPIRED_PARENT)
    const panel = openAsk()
    await opened(panel)

    const said = await waitFor(() => {
      const found = notice(panel)
      expect(found).toBeInTheDocument()
      return found as HTMLElement
    })
    expect(said).toHaveTextContent(`${PAUSED[language]} ${ASK_PARENT[language]}`)
    expect(composer(panel)).toBeDisabled()
    expect(composer(panel)).toHaveAccessibleDescription(expect.stringContaining(PAUSED[language]))
    expect(teacherButton(panel)).toBeDisabled()
    expect(teacherButton(panel)).toHaveAccessibleDescription(i18n.t('chat:ask.help.usagePeriodPaused'))
    // The conversation stays readable.
    expect(thread(panel).getByText('Why both sides?')).toBeInTheDocument()
  })

  it.each(languages)('tells a student who pays for themselves to contact STOA, the address a link (%s)', async (language) => {
    await i18n.changeLanguage(language)
    periodIs(EXPIRED_SELF)
    const panel = openAsk()
    await opened(panel)

    const said = await waitFor(() => {
      const found = notice(panel)
      expect(found).toBeInTheDocument()
      return found as HTMLElement
    })
    expect(said).toHaveTextContent(`${PAUSED[language]} ${CONTACT_STOA[language]}`)
    expect(within(said).getByRole('link', { name: 'info@stoaedu.ch' })).toHaveAttribute('href', 'mailto:info@stoaedu.ch')
  })

  it('pauses the same way with no period ever set, and sends nothing', async () => {
    periodIs(NONE)
    const panel = openAsk(null)

    await waitFor(() => expect(composer(panel)).toBeDisabled())
    expect(notice(panel)).toHaveTextContent(`${PAUSED.en} ${CONTACT_STOA.en}`)
    // The questions offered on the empty list are greyed too.
    const offered = panel.getAllByRole('button').filter((button) => button.closest('[data-ask-empty]'))
    expect(offered.length).toBeGreaterThan(0)
    for (const question of offered) expect(question).toBeDisabled()
    expect(server.conversations.createConversation).not.toHaveBeenCalled()
  })

  it.each(['planet', 'stage'] as const)('greys the docked composer on the %s too, and says why', async (where) => {
    periodIs(EXPIRED_PARENT)
    const docked = openDocked(where)

    await waitFor(() => expect(docked).toBeDisabled())
    expect(docked).toHaveAccessibleDescription(`${PAUSED.en} ${ASK_PARENT.en}`)
  })

  it.each(['planet', 'stage'] as const)('leaves the docked composer on the %s alone while the period runs', async (where) => {
    const docked = openDocked(where)

    await waitFor(() => expect(server.student.getStudentEntitlement).toHaveBeenCalled())
    expect(docked).toBeEnabled()
    expect(screen.queryByText(PAUSED.en)).not.toBeInTheDocument()
  })

  it('writes German the Swiss way', () => {
    for (const key of ['usagePeriod.paused', 'usagePeriod.renewal.parent', 'usagePeriod.renewal.contact']) {
      expect(i18n.getResource('de', 'common', key)).not.toMatch(/ß/)
    }
    expect(i18n.getResource('de', 'chat', 'ask.help.usagePeriodPaused')).not.toMatch(/ß/)
  })
})

describe('refused usage_period_ended while Ask was open', () => {
  it('says the period ended on the message, offers no "Send again", and reads the period again', async () => {
    const panel = openAsk()
    await opened(panel)
    await waitFor(() => expect(server.student.getStudentEntitlement).toHaveBeenCalledTimes(1))
    // The period ends while the page is open; the server says so on the next message.
    periodIs(EXPIRED_PARENT)
    server.refuseNextWith(periodEnded())

    await send(panel, 'And the other side?')

    expect(await thread(panel).findByText(PAUSED.en)).toBeInTheDocument()
    expect(panel.queryByText(GENERAL_FAILURE)).not.toBeInTheDocument()
    expect(panel.queryByText(i18n.t('chat:ask.thread.dailyLimit'))).not.toBeInTheDocument()
    expect(panel.queryByText(i18n.t('chat:ask.thread.weeklyAllowance'))).not.toBeInTheDocument()
    expect(sendAgain(panel)).not.toBeInTheDocument()
    await waitFor(() => expect(server.student.getStudentEntitlement).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(composer(panel)).toBeDisabled())
    expect(notice(panel)).toHaveTextContent(`${PAUSED.en} ${ASK_PARENT.en}`)
  })

  it('says the same for a first question from the list', async () => {
    const panel = openAsk(null)
    await waitFor(() => expect(server.student.getStudentEntitlement).toHaveBeenCalledTimes(1))
    periodIs(EXPIRED_SELF)
    server.refuseNextWith(periodEnded(), 'createConversation')

    await send(panel, 'Why both sides?')

    expect(await panel.findByRole('alert')).toHaveTextContent(PAUSED.en)
    expect(panel.queryByText(i18n.t('chat:ask.thread.startFailed'))).not.toBeInTheDocument()
    await waitFor(() => expect(server.student.getStudentEntitlement).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(composer(panel)).toBeDisabled())
  })

  it('says the same when asking a teacher, not "not in your plan", and reads the period again', async () => {
    const panel = openAsk()
    await opened(panel)
    await waitFor(() => expect(server.student.getStudentEntitlement).toHaveBeenCalledTimes(1))
    periodIs(EXPIRED_PARENT)
    server.refuseNextWith(periodEnded(), 'createTeacherHelpRequest')

    await userEvent.click(teacherButton(panel))

    await waitFor(() => expect(teacherButton(panel)).toBeDisabled())
    expect(teacherButton(panel)).toHaveAccessibleDescription(i18n.t('chat:ask.help.usagePeriodPaused'))
    expect(panel.queryByText(i18n.t('chat:teacher.errors.planDenied'))).not.toBeInTheDocument()
    // Said once, beside the greyed button, not again as an error under it.
    expect(panel.getAllByText(i18n.t('chat:ask.help.usagePeriodPaused'))).toHaveLength(1)
    await waitFor(() => expect(server.student.getStudentEntitlement).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(composer(panel)).toBeDisabled())
    expect(server.teacherHelp.createTeacherHelpRequest).toHaveBeenCalledTimes(1)
  })

  it('greys at once even before the period is read again', async () => {
    const panel = openAsk()
    await opened(panel)
    await waitFor(() => expect(server.student.getStudentEntitlement).toHaveBeenCalledTimes(1))
    periodIs(EXPIRED_PARENT)
    const letGo = server.holdNext('getStudentEntitlement')
    server.refuseNextWith(periodEnded())

    await send(panel, 'And the other side?')

    await waitFor(() => expect(composer(panel)).toBeDisabled())
    expect(notice(panel)).toHaveTextContent(`${PAUSED.en} ${CONTACT_STOA.en}`)
    letGo()
    // What the server says once read stands: a parent's period.
    await waitFor(() => expect(notice(panel)).toHaveTextContent(`${PAUSED.en} ${ASK_PARENT.en}`))
  })
})
