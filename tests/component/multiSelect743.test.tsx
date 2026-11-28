/**
 * #743: a `multi_select` exercise (stoa-backend#593) is answered with a set of
 * options -- in a list of checkboxes, or by its hotspots in the question's
 * figure (`data-choice="B"` is the second option). The list and the figure
 * read one answer; it goes to the backend as the picked options' numbers.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/practice/practiceApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/practice/practiceApi')>()),
  getDueReview: vi.fn(),
  getReviewSummary: vi.fn(),
  submitChallengeAnswer: vi.fn(),
}))

import { ReviewSession } from '@/components/practice/ReviewSession'
import { practiceLessonReducer, initialPracticeLessonState } from '@/components/practice/practiceLessonReducer'
import { demoAnswerInvalid, checkDemoAnswer, demoLessons } from '@/dev/demo/data/chapter'
import { AnswerInput, figureChoices, toggleOption, type AnswerValue } from '@/features/chapter/answerControls'
import { ExerciseFigure } from '@/features/chapter/ExerciseFigure'
import { cleanFigure } from '@/features/chapter/figure'
import { useLessonRun } from '@/features/chapter/useLessonRun'
import i18n from '@/i18n'
import { getDueReview, submitChallengeAnswer } from '@/services/practice/practiceApi'
import type { PracticeLesson } from '@/types/practice'

const SVG = 'http://www.w3.org/2000/svg'

/** stoa-backend#593's hotspot sample: five marked points, A and D inside the circle. */
const dot = (letter: string, x: number, y: number) =>
  `<g data-choice="${letter}"><circle cx="${x}" cy="${y}" r="3" fill="currentColor"/><text x="${x + 4}" y="${y - 3}" font-size="8">${letter}</text></g>`
const POINTS = `<svg xmlns="${SVG}" viewBox="0 0 120 100"><circle cx="60" cy="50" r="35" fill="none" stroke="currentColor"/>${dot('A', 50, 40)}${dot('B', 104, 18)}${dot('C', 18, 86)}${dot('D', 72, 66)}${dot('E', 108, 82)}</svg>`

beforeAll(async () => {
  await i18n.changeLanguage('en')
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('the figure keeps its hotspots and nothing more (#743)', () => {
  it('lets data-choice through with an option letter, A to L, and drops every other value', () => {
    const figure = cleanFigure(
      `<svg xmlns="${SVG}" viewBox="0 0 10 10"><g data-choice="A"/><g data-choice="L"/><g data-choice="M"/><g data-choice="AB"/><g data-choice="a"/><g data-choice="javascript:alert(1)"/><g data-other="A"/></svg>`,
      'p-',
    )!
    const values = Array.from(figure.svg.querySelectorAll('g')).map((node) => node.getAttribute('data-choice'))
    expect(values).toEqual(['A', 'L', null, null, null, null, null])
    expect(figure.svg.querySelector('[data-other]')).toBeNull()
  })
})

function Harness({ options = ['A', 'B', 'C', 'D', 'E'], figure = POINTS, disabled = false }: { options?: string[]; figure?: string; disabled?: boolean }) {
  const [value, setValue] = useState<AnswerValue>([])
  const challenge = { challengeId: 'ms-593-q02', type: 'multi_select', options }
  const answering = { challenge, value, onChange: setValue, disabled }
  return (
    <I18nextProvider i18n={i18n}>
      <p id="prompt">Which marked points lie inside the circle?</p>
      <ExerciseFigure svg={figure} labelledBy="prompt" question choices={figureChoices(answering)} />
      <AnswerInput {...answering} />
      <output data-answer>{JSON.stringify(value)}</output>
    </I18nextProvider>
  )
}

const answer = () => JSON.parse(document.querySelector('[data-answer]')!.textContent!) as unknown
const figureOf = () => document.querySelector<HTMLElement>('[data-exercise-figure]')!
const listOf = () => screen.getByRole('group', { name: 'Choose every answer that fits' })

describe('a set of options in the list', () => {
  it('is a checkbox per option, picked and put back, sent as the numbers in order', async () => {
    const user = userEvent.setup()
    render(<Harness options={['2', '9', '11', '15', '17']} figure="" />)
    const boxes = within(listOf()).getAllByRole('checkbox')
    expect(boxes.map((box) => box.getAttribute('aria-labelledby') && box.closest('label')!.textContent)).toEqual(['A2', 'B9', 'C11', 'D15', 'E17'])
    await user.click(within(listOf()).getByRole('checkbox', { name: '17' }))
    await user.click(within(listOf()).getByRole('checkbox', { name: '2' }))
    await user.click(within(listOf()).getByRole('checkbox', { name: '11' }))
    expect(answer()).toEqual([0, 2, 4])
    await user.click(within(listOf()).getByRole('checkbox', { name: '11' }))
    expect(answer()).toEqual([0, 4])
    // Picked by keyboard, too.
    within(listOf()).getByRole('checkbox', { name: '9' }).focus()
    await user.keyboard(' ')
    expect(answer()).toEqual([0, 1, 4])
  })

  it('says several may be picked, never how many', () => {
    render(<Harness options={['2', '9', '11']} figure="" />)
    expect(listOf()).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/\b(two|three|2 answers)\b/i)
  })

  it('keeps a set apart from an order', () => {
    expect(toggleOption([], 3)).toEqual([3])
    expect(toggleOption([3], 0)).toEqual([0, 3])
    expect(toggleOption([0, 3], 3)).toEqual([0])
    // An ordering's pieces are not option numbers.
    expect(toggleOption(['a', 'b'], 1)).toEqual([1])
  })
})

describe('hotspots in the figure (#743)', () => {
  it('makes each hotspot a checkbox named by its option, inside a group named by the question', () => {
    render(<Harness />)
    const figure = figureOf()
    expect(figure).toHaveAttribute('role', 'group')
    expect(figure).toHaveAttribute('aria-labelledby', 'prompt')
    const spots = within(figure).getAllByRole('checkbox')
    expect(spots.map((spot) => spot.getAttribute('aria-label'))).toEqual(['A', 'B', 'C', 'D', 'E'])
    for (const spot of spots) {
      expect(spot).toHaveAttribute('aria-checked', 'false')
      expect(spot).toHaveAttribute('tabindex', '0')
    }
  })

  it('picks in the figure and in the list as one answer, either way round', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const figure = figureOf()
    await user.click(within(figure).getByRole('checkbox', { name: 'D' }))
    expect(answer()).toEqual([3])
    expect(within(listOf()).getByRole('checkbox', { name: 'D' })).toBeChecked()

    await user.click(within(listOf()).getByRole('checkbox', { name: 'A' }))
    expect(answer()).toEqual([0, 3])
    expect(within(figure).getByRole('checkbox', { name: 'A' })).toHaveAttribute('aria-checked', 'true')
    expect(within(figure).getByRole('checkbox', { name: 'A' })).toHaveAttribute('data-hotspot', 'picked')

    // A tap on the drawing inside the hotspot (its dot, its letter) is a tap on it.
    await user.click(within(figure).getByRole('checkbox', { name: 'D' }).querySelector('text')!)
    expect(answer()).toEqual([0])
    expect(within(listOf()).getByRole('checkbox', { name: 'D' })).not.toBeChecked()
  })

  it('is reached with Tab and picked with Space or Enter', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.tab()
    expect(document.activeElement).toHaveAttribute('aria-label', 'A')
    await user.keyboard(' ')
    await user.tab()
    await user.tab()
    await user.tab()
    expect(document.activeElement).toHaveAttribute('aria-label', 'D')
    await user.keyboard('{Enter}')
    expect(answer()).toEqual([0, 3])
    // Then on into the list.
    await user.tab()
    await user.tab()
    expect(document.activeElement).toBe(within(listOf()).getByRole('checkbox', { name: 'A' }))
  })

  it('puts a target behind each hotspot, out of the reading', () => {
    render(<Harness />)
    const targets = figureOf().querySelectorAll('rect[data-choice-hit]')
    expect(Array.from(targets).map((target) => target.getAttribute('data-choice-hit'))).toEqual(['A', 'B', 'C', 'D', 'E'])
    for (const target of targets) {
      expect(target).toHaveAttribute('aria-hidden', 'true')
      expect(target.nextElementSibling).toHaveAttribute('data-choice', target.getAttribute('data-choice-hit'))
    }
  })

  it('leaves a letter past the last option as drawing', () => {
    render(<Harness options={['A', 'B', 'C']} />)
    const spots = within(figureOf()).getAllByRole('checkbox')
    expect(spots.map((spot) => spot.getAttribute('aria-label'))).toEqual(['A', 'B', 'C'])
    expect(figureOf().querySelector('[data-choice="D"]')).not.toHaveAttribute('role')
  })

  it('picks nothing once the answer is locked', async () => {
    const user = userEvent.setup()
    render(<Harness disabled />)
    const spot = within(figureOf()).getByRole('checkbox', { name: 'B' })
    expect(spot).toHaveAttribute('aria-disabled', 'true')
    expect(spot).toHaveAttribute('tabindex', '-1')
    await user.click(spot)
    expect(answer()).toEqual([])
  })

  it('is only a drawing for any other kind of exercise', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ExerciseFigure
          svg={POINTS}
          choices={figureChoices({ challenge: { challengeId: 'x', type: 'multiple_choice', options: ['A', 'B'] }, value: '', onChange: () => {}, disabled: false })}
        />
      </I18nextProvider>,
    )
    expect(figureOf()).toHaveAttribute('aria-hidden', 'true')
    expect(figureOf().querySelector('[role="checkbox"]')).toBeNull()
    expect(figureOf().querySelector('[data-choice-hit]')).toBeNull()
  })
})

describe('sending a set (stoa-backend#593)', () => {
  it('sends the lesson answer as the option numbers', async () => {
    const lesson: PracticeLesson = {
      id: 'ms-lesson',
      unitId: 'u',
      subjectId: 'math',
      gradeLevel: '6',
      topicId: 't',
      title: 'Samples',
      topic: 'Primes',
      difficulty: 'practice',
      status: 'available',
      estimatedMinutes: 5,
      challenges: [
        {
          challengeId: 'ms-593-q01',
          lessonId: 'ms-lesson',
          unitId: 'u',
          subjectId: 'math',
          gradeLevel: '6',
          topicId: 't',
          topic: 'Primes',
          type: 'multi_select',
          prompt: 'Which of these numbers are prime?',
          options: ['2', '9', '11', '15', '17'],
          hintAvailable: false,
          correctAnswer: '2; 11; 17',
        },
      ],
    }
    vi.mocked(submitChallengeAnswer).mockResolvedValue({
      challengeId: 'ms-593-q01',
      correct: false,
      feedback: 'Not quite.',
      attemptsRemaining: 2,
      correctOptions: [0, 2, 4],
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
    const { result } = renderHook(() => useLessonRun(lesson), { wrapper })
    expect(result.current.answered).toBe(false)
    act(() => result.current.setAnswer([0, 2]))
    expect(result.current.answered).toBe(true)
    act(() => result.current.check())
    await waitFor(() => expect(result.current.feedback).toMatchObject({ correct: false }))
    expect(submitChallengeAnswer).toHaveBeenCalledWith('ms-593-q01', { answer: [0, 2] })
    // The set checked stays with its verdict; Try again empties it.
    expect(result.current.answer).toEqual([0, 2])
    act(() => result.current.retry())
    expect(result.current.answer).toEqual([])
  })

  it('drops a verdict for a set that was changed since it was sent', () => {
    const sent = practiceLessonReducer({ ...initialPracticeLessonState, answer: [0, 3] }, { type: 'answer', answer: [0] })
    const after = practiceLessonReducer(sent, {
      type: 'feedback',
      answer: [0, 3],
      feedback: { challengeId: 'x', correct: true, feedback: 'Right.', attemptsRemaining: 0 },
    })
    expect(after.feedback).toBeUndefined()
  })
})

describe('a set that comes back for review', () => {
  it('is answered in the figure and the list, and shows the set it was checked with', async () => {
    const user = userEvent.setup()
    vi.mocked(getDueReview).mockResolvedValue({
      items: [
        {
          challengeId: 'ms-593-q02',
          lessonId: 'ms-lesson',
          subjectId: 'math',
          topicId: 't',
          prompt: 'Which marked points lie inside the circle?',
          figure: POINTS,
          options: ['A', 'B', 'C', 'D', 'E'],
          type: 'multi_select',
          dueAt: '2026-11-28T09:00:00+00:00',
          lapses: 0,
          reps: 1,
        },
      ],
      dueCount: 1,
      generatedAt: '2026-11-28T09:00:00+00:00',
    })
    vi.mocked(submitChallengeAnswer).mockResolvedValue({
      challengeId: 'ms-593-q02',
      correct: false,
      feedback: 'Not quite.',
      attemptsRemaining: 2,
      correctOptions: [0, 3],
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <ReviewSession />
        </QueryClientProvider>
      </I18nextProvider>,
    )
    await screen.findByText('Which marked points lie inside the circle?')
    const figure = figureOf()
    await user.click(within(figure).getByRole('checkbox', { name: 'B' }))
    await user.click(within(listOf()).getByRole('checkbox', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await waitFor(() => expect(submitChallengeAnswer).toHaveBeenCalledWith('ms-593-q02', { answer: [0, 1] }))

    // Still picked, now marked wrong, in both places; the right set is not shown.
    await screen.findByRole('button', { name: 'Try again' })
    expect(within(listOf()).getByRole('checkbox', { name: 'A' })).toBeChecked()
    expect(within(listOf()).getByRole('checkbox', { name: 'B' })).toBeChecked()
    expect(within(figure).getByRole('checkbox', { name: 'B' })).toHaveAttribute('data-hotspot', 'wrong')
    expect(within(figure).getByRole('checkbox', { name: 'D' })).toHaveAttribute('aria-checked', 'false')

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(within(figure).getByRole('checkbox', { name: 'B' })).toHaveAttribute('aria-checked', 'false')
    expect(within(listOf()).getByRole('checkbox', { name: 'A' })).not.toBeChecked()
  })
})

describe('the demo backend judges a set as the backend does', () => {
  const samples = demoLessons('en')
    .flatMap((lesson) => lesson.challenges)
    .filter((challenge) => challenge.type === 'multi_select')

  it('has both samples of stoa-backend#593, one with hotspots', () => {
    expect(samples).toHaveLength(2)
    expect(samples.filter((sample) => sample.figure?.includes('data-choice='))).toHaveLength(1)
  })

  it('takes the right set in any order, and nothing missing, extra or wrong', () => {
    const [hotspots, primes] = samples
    expect(checkDemoAnswer(hotspots.challengeId, [3, 0])).toMatchObject({ correct: true, correctOptions: [0, 3] })
    expect(checkDemoAnswer(hotspots.challengeId, [0])?.correct).toBe(false)
    expect(checkDemoAnswer(hotspots.challengeId, [0, 3, 4])?.correct).toBe(false)
    expect(checkDemoAnswer(primes.challengeId, [0, 2, 4])?.correct).toBe(true)
    expect(checkDemoAnswer(primes.challengeId, [0, 1, 4])?.correct).toBe(false)
  })

  it('refuses what cannot be a set: empty, repeated, out of range, not whole numbers', () => {
    const [hotspots] = samples
    for (const bad of [[], [0, 0], [5], [-1], ['0'], [0.5], 'A', null]) expect(demoAnswerInvalid(hotspots.challengeId, bad)).toBe(true)
    expect(demoAnswerInvalid(hotspots.challengeId, [4, 0])).toBe(false)
  })
})
