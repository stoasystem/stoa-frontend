/**
 * The review tab is where a question comes back, so it has to be answerable
 * there and it must not show the answer before the student commits to one.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/practice/practiceApi', () => ({
  getDueReview: vi.fn(),
  getReviewSummary: vi.fn(),
  submitChallengeAnswer: vi.fn(),
}))

import {
  getDueReview,
  submitChallengeAnswer,
} from '@/services/practice/practiceApi'
import { ReviewSession } from '@/components/practice/ReviewSession'

const mockedDue = vi.mocked(getDueReview)
const mockedAnswer = vi.mocked(submitChallengeAnswer)

function card(overrides = {}) {
  return {
    challengeId: 'brueche-l1-c1',
    lessonId: 'brueche-l1',
    subjectId: 'mathematics',
    topicId: 'brueche',
    prompt: 'Was ist 1/2 + 1/4?',
    options: ['3/4', '2/6', '1/6'],
    type: 'multiple_choice',
    dueAt: '2026-03-02T09:00:00+00:00',
    lapses: 1,
    reps: 2,
    ...overrides,
  }
}

function renderSession() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  return render(<ReviewSession />, { wrapper: Wrapper })
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('a question that has come back', () => {
  it('can be answered without leaving the review', async () => {
    mockedDue.mockResolvedValue({
      items: [card()],
      dueCount: 1,
      generatedAt: '2026-03-02T09:00:00+00:00',
    })
    mockedAnswer.mockResolvedValue({
      challengeId: 'brueche-l1-c1',
      correct: true,
      feedback: 'Richtig! Gut gemacht.',
      attemptsRemaining: 2,
    })
    const user = userEvent.setup()
    renderSession()

    await screen.findByText('Was ist 1/2 + 1/4?')
    await user.click(screen.getByRole('button', { name: '3/4' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))

    await waitFor(() => expect(screen.getByText('Richtig! Gut gemacht.')).toBeInTheDocument())
    expect(mockedAnswer).toHaveBeenCalledWith('brueche-l1-c1', { answer: '3/4' })
  })

  it('does not reveal the answer before one is chosen', async () => {
    mockedDue.mockResolvedValue({
      items: [card()],
      dueCount: 1,
      generatedAt: '2026-03-02T09:00:00+00:00',
    })
    renderSession()

    await screen.findByText('Was ist 1/2 + 1/4?')

    // Every option is offered on equal terms; nothing marks the right one.
    for (const option of ['3/4', '2/6', '1/6']) {
      expect(screen.getByRole('button', { name: option })).toBeEnabled()
    }
    expect(screen.queryByText(/correct answer/i)).not.toBeInTheDocument()
  })

  it('offers another go at one that was missed', async () => {
    mockedDue.mockResolvedValue({
      items: [card()],
      dueCount: 1,
      generatedAt: '2026-03-02T09:00:00+00:00',
    })
    mockedAnswer.mockResolvedValue({
      challengeId: 'brueche-l1-c1',
      correct: false,
      feedback: 'Leider falsch.',
      attemptsRemaining: 1,
    })
    const user = userEvent.setup()
    renderSession()

    await screen.findByText('Was ist 1/2 + 1/4?')
    await user.click(screen.getByRole('button', { name: '2/6' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))

    await waitFor(() => expect(screen.getByText('Leider falsch.')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /try it again/i })).toBeInTheDocument()
  })

  it('keeps the explanation back until the student has found the answer', async () => {
    // The explanation states the answer, so showing it beside "try again"
    // would hand over the retry.
    mockedDue.mockResolvedValue({
      items: [card()],
      dueCount: 1,
      generatedAt: '',
    })
    mockedAnswer.mockResolvedValue({
      challengeId: 'brueche-l1-c1',
      correct: false,
      feedback: 'Leider falsch.',
      explanation: '1/2 + 1/4 = 3/4.',
      attemptsRemaining: 1,
    })
    const user = userEvent.setup()
    renderSession()

    await screen.findByText('Was ist 1/2 + 1/4?')
    await user.click(screen.getByRole('button', { name: '2/6' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))

    await waitFor(() => expect(screen.getByText('Leider falsch.')).toBeInTheDocument())
    expect(screen.queryByText('1/2 + 1/4 = 3/4.')).not.toBeInTheDocument()
  })

  it('says so plainly when nothing is waiting', async () => {
    mockedDue.mockResolvedValue({ items: [], dueCount: 0, generatedAt: '' })
    renderSession()

    expect(await screen.findByText(/nothing to review right now/i)).toBeInTheDocument()
  })

  it('shows how often a question has caught the student out', async () => {
    mockedDue.mockResolvedValue({
      items: [card({ lapses: 3 })],
      dueCount: 1,
      generatedAt: '',
    })
    renderSession()

    expect(await screen.findByText('missed 3 times')).toBeInTheDocument()
  })
})
