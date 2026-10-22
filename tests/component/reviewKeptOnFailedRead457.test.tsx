/**
 * #457: a review on screen stays when a read behind it fails.
 *
 * A language switch reads every query again (AppProviders' invalidateQueries),
 * and so does a reconnect. When that read failed, the whole session gave way
 * to "could not be loaded", and the verdicts, their feedback and the answers
 * typed but not yet checked went with it. Review answers still do not read
 * the list again (#264); that is not what is tested here.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ReviewSession } from '@/components/practice/ReviewSession'
import i18n from '@/i18n'
import enChapter from '@/i18n/locales/en/chapter.json'
import enPractice from '@/i18n/locales/en/practice.json'
import { ApiError } from '@/services/api/httpClient'
import { getDueReview, submitChallengeAnswer } from '@/services/practice/practiceApi'

vi.mock('@/services/practice/practiceApi', () => ({
  getDueReview: vi.fn(),
  getReviewSummary: vi.fn(),
  submitChallengeAnswer: vi.fn(),
}))

const mockedDue = vi.mocked(getDueReview)
const mockedAnswer = vi.mocked(submitChallengeAnswer)

const upstream = () => new ApiError('upstream', { status: 503 })

function card(challengeId: string, overrides = {}) {
  return {
    challengeId,
    lessonId: 'brueche-l1',
    subjectId: 'mathematics',
    topicId: 'brueche',
    prompt: 'Was ist 1/2 + 1/4?',
    options: ['3/4', '2/6', '1/6'],
    type: 'multiple_choice',
    dueAt: '2026-03-02T09:00:00+00:00',
    lapses: 0,
    reps: 2,
    ...overrides,
  }
}

const CHOICE = card('c-choice')
const TYPED = card('c-typed', { prompt: 'Wie viel ist 3 + 4?', options: [], type: 'text_input' })

function due(items: ReturnType<typeof card>[]) {
  return { items, dueCount: items.length, generatedAt: '2026-03-02T09:00:00+00:00' }
}

function open() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <ReviewSession />
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return client
}

/** What AppProviders does when the reader changes language. */
async function readEverythingAgain(client: QueryClient) {
  await act(async () => {
    await client.invalidateQueries()
  })
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  mockedDue.mockReset()
  mockedAnswer.mockReset()
})

afterAll(async () => {
  await i18n.changeLanguage('en')
})

describe('a review read again in the background (#457)', () => {
  it('keeps the cards, a verdict and a typed answer, and says the list could not be refreshed', async () => {
    mockedDue.mockResolvedValueOnce(due([CHOICE, TYPED])).mockRejectedValue(upstream())
    mockedAnswer.mockResolvedValue({
      challengeId: 'c-choice',
      correct: true,
      feedback: 'Richtig! Gut gemacht.',
      attemptsRemaining: 2,
    })
    const user = userEvent.setup()
    const client = open()

    await screen.findByText('Was ist 1/2 + 1/4?')
    const [choice, typed] = screen.getAllByRole('article')
    await user.click(within(choice).getByRole('radio', { name: '3/4' }))
    await user.click(within(choice).getByRole('button', { name: enChapter.stage.check }))
    await within(choice).findByText('Richtig! Gut gemacht.')
    await user.type(within(typed).getByRole('textbox'), '7')

    await readEverythingAgain(client)
    await waitFor(() => expect(mockedDue).toHaveBeenCalledTimes(2))

    expect(await screen.findByRole('alert')).toHaveTextContent(enPractice.review.refreshFailed)
    expect(screen.queryByText(enPractice.review.loadFailed)).toBeNull()
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(within(choice).getByText('Richtig! Gut gemacht.')).toBeInTheDocument()
    expect(within(typed).getByRole('textbox')).toHaveValue('7')
    expect(within(typed).getByRole('button', { name: enChapter.stage.check })).toBeEnabled()
  })

  it('offers no Try again beside the cards: a list read again would drop the ones answered', async () => {
    mockedDue.mockResolvedValueOnce(due([CHOICE])).mockRejectedValue(upstream())
    const client = open()
    await screen.findByText('Was ist 1/2 + 1/4?')

    await readEverythingAgain(client)

    await screen.findByRole('alert')
    expect(screen.queryByRole('button', { name: enPractice.tryAgain })).toBeNull()
  })

  it('still replaces a list that was never read with the failure and Try again', async () => {
    mockedDue.mockRejectedValueOnce(upstream()).mockResolvedValueOnce(due([CHOICE]))
    const user = userEvent.setup()
    open()

    expect(await screen.findByText(enPractice.review.loadFailed)).toBeInTheDocument()
    expect(screen.queryByText(enPractice.review.refreshFailed)).toBeNull()
    await user.click(screen.getByRole('button', { name: enPractice.tryAgain }))

    expect(await screen.findByText('Was ist 1/2 + 1/4?')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
