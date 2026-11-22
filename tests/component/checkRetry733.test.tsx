/**
 * Checking again after "your answer could not be checked" (#733).
 *
 * The 503 itself is the backend's (stoa-backend#563); what went wrong here
 * was what the stage did with the press after it. Whether a check was on its
 * way was read from the last render, so two presses before the next one both
 * went out; the slower verdict then landed beside whatever was chosen by
 * then. In the full-bank run (stoa-backend#106, 11-21) that put "Noch nicht
 * ganz" beside B when it was D's verdict, and showed a right answer as wrong
 * for a moment.
 *
 * Now one answer is on its way at a time, it stays as it was sent until it
 * comes back, a failed check keeps it for the next press, and a verdict for
 * an answer no longer on screen is dropped.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { initialPracticeLessonState, practiceLessonReducer } from '@/components/practice/practiceLessonReducer'
import { useLessonRun } from '@/features/chapter/useLessonRun'
import { useStarQuizRun } from '@/features/chapter/useStarQuizRun'
import { ApiError } from '@/services/api/httpClient'
import {
  answerLessonQuiz,
  answerStarQuiz,
  startLessonQuiz,
  startStarQuiz,
  submitChallengeAnswer,
} from '@/services/practice/practiceApi'

vi.mock('@/services/practice/practiceApi', () => ({
  submitChallengeAnswer: vi.fn(),
  getPracticeHint: vi.fn(),
  completePracticeLesson: vi.fn(),
  startLessonQuiz: vi.fn(),
  answerLessonQuiz: vi.fn(),
  startStarQuiz: vi.fn(),
  answerStarQuiz: vi.fn(),
}))

const choice = { challengeId: 'mc', type: 'multiple_choice', prompt: 'Which?', options: ['A', 'B', 'C', 'D'], hintAvailable: false }
const typed = { challengeId: 'fill', type: 'text_input', prompt: '2 + 2 = ?', options: [], hintAvailable: false }

const lesson = {
  id: 'l1',
  unitId: 'u1',
  subjectId: 'math',
  topicId: 't',
  gradeLevel: '8',
  title: 'L',
  topic: 'T',
  challenges: [choice, typed],
} as never

const unavailable = () => new ApiError('Service Unavailable', { status: 503 })

/** A reply that waits until it is let go. */
function held<T>() {
  let release!: (value: T) => void
  const promise = new Promise<T>((resolve) => {
    release = resolve
  })
  return { promise, release }
}

const verdict = (challengeId: string, correct: boolean) => ({ challengeId, correct, feedback: correct ? 'Richtig' : 'Noch nicht ganz', attemptsRemaining: 2 })

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function run(options?: { testOut?: boolean }) {
  return renderHook(() => useLessonRun(lesson, options), { wrapper: wrapper() })
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('after "your answer could not be checked"', () => {
  it('keeps the chosen option, and the next press checks that one', async () => {
    vi.mocked(submitChallengeAnswer).mockRejectedValueOnce(unavailable()).mockResolvedValueOnce(verdict('mc', true) as never)
    const { result } = run()

    act(() => result.current.setAnswer('D'))
    act(() => result.current.check())
    await waitFor(() => expect(result.current.checkFailed).toBe(true))
    expect(result.current.answer).toBe('D')
    expect(result.current.feedback).toBeNull()
    expect(result.current.checking).toBe(false)

    // Pressed again straight away.
    act(() => result.current.check())
    await waitFor(() => expect(result.current.feedback?.correct).toBe(true))
    expect(result.current.answer).toBe('D')
    expect(vi.mocked(submitChallengeAnswer).mock.calls.map(([, payload]) => payload.answer)).toEqual(['D', 'D'])
  })

  it('keeps what was typed, and the next press checks that', async () => {
    vi.mocked(submitChallengeAnswer).mockRejectedValueOnce(unavailable()).mockResolvedValueOnce(verdict('fill', false) as never)
    const { result } = run()
    act(() => result.current.skip())
    expect(result.current.challenge?.challengeId).toBe('fill')

    act(() => result.current.setAnswer('5'))
    act(() => result.current.check())
    await waitFor(() => expect(result.current.checkFailed).toBe(true))
    expect(result.current.answer).toBe('5')

    act(() => result.current.check())
    await waitFor(() => expect(result.current.feedback?.correct).toBe(false))
    expect(result.current.answer).toBe('5')
    expect(vi.mocked(submitChallengeAnswer).mock.calls.map(([id, payload]) => [id, payload.answer])).toEqual([
      ['fill', '5'],
      ['fill', '5'],
    ])
  })
})

describe('one answer on its way at a time', () => {
  it('sends one request for two presses in a row', async () => {
    const reply = held<ReturnType<typeof verdict>>()
    vi.mocked(submitChallengeAnswer).mockReturnValueOnce(reply.promise as never)
    const { result } = run()

    act(() => result.current.setAnswer('D'))
    // Both before the next render, as a double click is.
    act(() => {
      result.current.check()
      result.current.check()
    })
    await waitFor(() => expect(submitChallengeAnswer).toHaveBeenCalled())

    await act(async () => reply.release(verdict('mc', false)))
    await waitFor(() => expect(result.current.feedback?.correct).toBe(false))
    expect(submitChallengeAnswer).toHaveBeenCalledTimes(1)
  })

  it('holds the answer as it was sent: another option chosen meanwhile is not taken, and the verdict is for the one sent', async () => {
    const reply = held<ReturnType<typeof verdict>>()
    vi.mocked(submitChallengeAnswer).mockReturnValueOnce(reply.promise as never)
    const { result } = run()

    act(() => result.current.setAnswer('D'))
    // The option is changed in the same moment as the press, before the stage locks it.
    act(() => {
      result.current.check()
      result.current.setAnswer('B')
    })
    expect(result.current.answer).toBe('D')

    await act(async () => reply.release(verdict('mc', false)))
    await waitFor(() => expect(result.current.feedback?.correct).toBe(false))
    // "Not quite" is drawn beside D, the answer it was given for.
    expect(result.current.answer).toBe('D')
  })

  it('does not skip away from an answer on its way', async () => {
    const reply = held<ReturnType<typeof verdict>>()
    vi.mocked(submitChallengeAnswer).mockReturnValueOnce(reply.promise as never)
    const { result } = run()

    act(() => result.current.setAnswer('D'))
    act(() => {
      result.current.check()
      result.current.skip()
    })
    expect(result.current.challenge?.challengeId).toBe('mc')
    await act(async () => reply.release(verdict('mc', true)))
    await waitFor(() => expect(result.current.feedback?.correct).toBe(true))
  })

  it('sends one quiz answer for two presses in a row', async () => {
    const paper = {
      quizId: 'q1',
      lessonId: 'l1',
      kind: 'testOut',
      status: 'inProgress',
      heartsLeft: 2,
      mistakesAllowed: 1,
      remaining: 2,
      expiresAt: '2099-01-01T00:00:00Z',
      exercise: choice,
    }
    vi.mocked(startLessonQuiz).mockResolvedValue(paper as never)
    const reply = held<unknown>()
    vi.mocked(answerLessonQuiz).mockReturnValueOnce(reply.promise as never)
    const { result } = run({ testOut: true })
    await waitFor(() => expect(result.current.challenge?.challengeId).toBe('mc'))

    act(() => result.current.setAnswer('D'))
    act(() => {
      result.current.check()
      result.current.check()
      result.current.setAnswer('B')
    })
    expect(answerLessonQuiz).toHaveBeenCalledTimes(1)
    expect(vi.mocked(answerLessonQuiz).mock.calls[0][2]).toEqual({ exerciseId: 'mc', answer: 'D' })
    expect(result.current.answer).toBe('D')

    await act(async () => reply.release({ ...paper, remaining: 1, correct: false, credential: null, credentialExpiresAt: null }))
    await waitFor(() => expect(result.current.feedback?.correct).toBe(false))
    expect(result.current.answer).toBe('D')
  })

  it('sends one star quiz answer for two presses in a row', async () => {
    const paper = { quizId: 's1', unitId: 'u1', status: 'inProgress', total: 6, answered: 0, mistakes: 0, mistakesAllowed: 1, exercise: choice }
    vi.mocked(startStarQuiz).mockResolvedValue(paper as never)
    const reply = held<unknown>()
    vi.mocked(answerStarQuiz).mockReturnValueOnce(reply.promise as never)
    const { result } = renderHook(() => useStarQuizRun('u1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.challenge?.challengeId).toBe('mc'))

    act(() => result.current.setAnswer('D'))
    act(() => {
      result.current.check()
      result.current.check()
      result.current.setAnswer('B')
    })
    expect(answerStarQuiz).toHaveBeenCalledTimes(1)
    expect(result.current.answer).toBe('D')

    await act(async () => reply.release({ ...paper, answered: 1, correct: true, retryAt: null }))
    await waitFor(() => expect(result.current.feedback?.correct).toBe(true))
  })
})

describe('a verdict for an answer no longer on screen', () => {
  it('is dropped rather than drawn beside another answer', () => {
    const chosenB = practiceLessonReducer(initialPracticeLessonState, { type: 'answer', answer: 'B' })
    const late = practiceLessonReducer(chosenB, { type: 'feedback', feedback: verdict('mc', false) as never, answer: 'D' })
    expect(late).toBe(chosenB)
    expect(late.feedback).toBeUndefined()
  })

  it('is kept for the answer it was given for, an order as much as a choice', () => {
    const ordered = practiceLessonReducer(initialPracticeLessonState, { type: 'answer', answer: ['a', 'b'] })
    expect(practiceLessonReducer(ordered, { type: 'feedback', feedback: verdict('o', true) as never, answer: ['a', 'b'] }).feedback?.correct).toBe(true)
    expect(practiceLessonReducer(ordered, { type: 'feedback', feedback: verdict('o', true) as never, answer: ['b', 'a'] }).feedback).toBeUndefined()
  })
})
