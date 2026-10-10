/**
 * The review tab is where a question comes back, so it has to be answerable
 * there and it must not show the answer before the student commits to one.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Translated through the real English files, so these assert what a student
// reads rather than the key that produced it. Both namespaces the screen uses:
// the answer controls take their labels from the practice stage's own
// `chapter` file, so that a question reads the same in review as in its lesson.
vi.mock('react-i18next', async () => {
  const files: Record<string, Record<string, unknown>> = {
    practice: (await import('@/i18n/locales/en/practice.json')).default as Record<string, unknown>,
    chapter: (await import('@/i18n/locales/en/chapter.json')).default as Record<string, unknown>,
  }

  function lookup(namespace: string, key: string): string {
    const value = key
      .split('.')
      .reduce<unknown>(
        (node, part) => (node as Record<string, unknown>)?.[part],
        files[namespace] ?? {},
      )
    return typeof value === 'string' ? value : key
  }

  return {
    useTranslation: (namespace = 'practice') => ({
      t: (key: string, options?: Record<string, unknown>) => {
        const count = options?.count
        const plural =
          typeof count === 'number'
            ? lookup(namespace, `${key}_${count === 1 ? 'one' : 'other'}`)
            : key
        const template =
          typeof count === 'number' && !plural.startsWith(key) ? plural : lookup(namespace, key)
        return Object.entries(options ?? {}).reduce(
          (text, [name, value]) => text.split(`{{${name}}}`).join(String(value)),
          template,
        )
      },
      i18n: { language: 'en' },
    }),
  }
})

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
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
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

  it('gives a typed question somewhere to type', async () => {
    // It had none: review drew options and nothing else, so a question whose
    // answer is written out had only a Check button under it and could never
    // leave the list (card 124).
    mockedDue.mockResolvedValue({
      items: [
        card({
          prompt: 'Kürze den Bruch 12/18 so weit wie möglich.',
          options: [],
          type: 'text_input',
        }),
      ],
      dueCount: 1,
      generatedAt: '',
    })
    mockedAnswer.mockResolvedValue({
      challengeId: 'brueche-l1-c1',
      correct: true,
      feedback: 'Richtig! Gut gemacht.',
      explanation: '12/18 = 2/3.',
      attemptsRemaining: 2,
    })
    const user = userEvent.setup()
    renderSession()

    // The question has to be on screen before anything under it is asserted:
    // the cards arrive from `GET /practice/review/due`.
    await screen.findByText('Kürze den Bruch 12/18 so weit wie möglich.')
    const field = screen.getByLabelText('Your answer')
    await user.type(field, '2/3')
    await user.click(screen.getByRole('button', { name: 'Check answer' }))

    await waitFor(() => expect(screen.getByText('Richtig! Gut gemacht.')).toBeInTheDocument())
    expect(mockedAnswer).toHaveBeenCalledWith('brueche-l1-c1', { answer: '2/3' })
    // Right, so the working is shown.
    expect(screen.getByText('12/18 = 2/3.')).toBeInTheDocument()
  })

  it('holds the explanation back when a typed answer is wrong, and offers another go', async () => {
    mockedDue.mockResolvedValue({
      items: [card({ options: [], type: 'text_input' })],
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
    await user.type(screen.getByLabelText('Your answer'), '1/6')
    await user.click(screen.getByRole('button', { name: 'Check answer' }))

    await waitFor(() => expect(screen.getByText('Leider falsch.')).toBeInTheDocument())
    expect(screen.queryByText('1/2 + 1/4 = 3/4.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    // The second go starts from an empty field, not from what was wrong.
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(screen.getByLabelText('Your answer')).toHaveValue('')
  })

  it('will not let a question be checked until it has been answered', async () => {
    mockedDue.mockResolvedValue({
      items: [card({ options: [], type: 'text_input' })],
      dueCount: 1,
      generatedAt: '',
    })
    const user = userEvent.setup()
    renderSession()

    await screen.findByText('Was ist 1/2 + 1/4?')
    const check = screen.getByRole('button', { name: 'Check answer' })
    expect(check).toBeDisabled()

    // Spaces are not an answer.
    await user.type(screen.getByLabelText('Your answer'), '   ')
    expect(check).toBeDisabled()

    await user.type(screen.getByLabelText('Your answer'), '2/3')
    expect(check).toBeEnabled()
  })

  it('writes an explanation in a box big enough for one', async () => {
    mockedDue.mockResolvedValue({
      items: [card({ options: [], type: 'explanation' })],
      dueCount: 1,
      generatedAt: '',
    })
    renderSession()

    await screen.findByText('Was ist 1/2 + 1/4?')
    expect(screen.getByLabelText('Your answer').tagName).toBe('TEXTAREA')
  })

  it('sends an order as the list it is, in the order it was tapped', async () => {
    mockedDue.mockResolvedValue({
      items: [card({ options: ['1/6', '2/6', '3/4'], type: 'ordering' })],
      dueCount: 1,
      generatedAt: '',
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
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '2/6' }))
    await user.click(screen.getByRole('button', { name: '1/6' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))

    await waitFor(() => expect(screen.getByText('Richtig! Gut gemacht.')).toBeInTheDocument())
    expect(mockedAnswer).toHaveBeenCalledWith('brueche-l1-c1', { answer: ['2/6', '1/6'] })
  })

  it('says so rather than offer a dead button when a question has nothing to pick from', async () => {
    mockedDue.mockResolvedValue({
      items: [card({ options: [], type: 'multiple_choice' })],
      dueCount: 1,
      generatedAt: '',
    })
    renderSession()

    await screen.findByText('Was ist 1/2 + 1/4?')
    expect(
      screen.getByText('This question cannot be answered here. Open it in its lesson.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Check answer' })).not.toBeInTheDocument()
  })

  it('leaves no kind of question without a way to answer it', async () => {
    // Over the whole set of kinds rather than the one that was reported: the
    // bug was a branch that handled `multiple_choice` and silently drew
    // nothing for the rest. A kind neither screen has heard of is typed, which
    // is what the backend falls back to as well.
    const kinds = [
      { type: 'multiple_choice', options: ['3/4', '2/6'] },
      { type: 'text_input', options: [] },
      { type: 'explanation', options: [] },
      { type: 'ordering', options: ['3/4', '2/6'] },
      { type: 'a_kind_invented_after_this_test', options: [] },
    ]
    const user = userEvent.setup()

    // One kind per render, so a control belonging to a neighbouring question
    // can never stand in for a missing one.
    for (const kind of kinds) {
      mockedDue.mockResolvedValue({
        items: [card(kind)],
        dueCount: 1,
        generatedAt: '',
      })
      renderSession()
      await screen.findByText('Was ist 1/2 + 1/4?')

      const check = screen.getByRole('button', { name: 'Check answer' })
      // Nothing is checkable before it is answered …
      expect(check, kind.type).toBeDisabled()

      // … and every kind offers something that makes it checkable.
      const field = screen.queryByLabelText('Your answer')
      if (field) {
        await user.type(field, '2/3')
      } else {
        await user.click(screen.getByRole('button', { name: '2/6' }))
      }
      expect(check, kind.type).toBeEnabled()
      cleanup()
    }
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
