/**
 * "Question k of n" after Skip (#734, with #729).
 *
 * k counted the exercises answered, so a skip left it where it was and the
 * number no longer matched the exercise on screen. Decided on the ticket: k
 * is the exercise's place in the lesson's own order. A skip moves it on; a
 * skipped exercise come round again keeps its own number and is marked as
 * skipped earlier. In a quiz, where nothing is skipped, k is which question
 * of the paper this is, as before.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useLessonRun } from '@/features/chapter/useLessonRun'
import { answerLessonQuiz, startLessonQuiz, submitChallengeAnswer } from '@/services/practice/practiceApi'

vi.mock('@/services/practice/practiceApi', () => ({
  submitChallengeAnswer: vi.fn(),
  getPracticeHint: vi.fn(),
  completePracticeLesson: vi.fn(),
  startLessonQuiz: vi.fn(),
  answerLessonQuiz: vi.fn(),
}))

const exercise = (n: number) => ({ challengeId: `c${n}`, type: 'text_input', prompt: `${n} + ${n}`, options: [], hintAvailable: false })
const lesson = {
  id: 'l1',
  unitId: 'u1',
  subjectId: 'math',
  topicId: 't',
  gradeLevel: '8',
  title: 'L',
  topic: 'T',
  challenges: [exercise(1), exercise(2), exercise(3)],
} as never

function run(options?: { testOut?: boolean }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
  return renderHook(() => useLessonRun(lesson, options), { wrapper })
}

type Run = ReturnType<typeof run>['result']
const where = (result: Run) => ({
  on: result.current.challenge?.challengeId,
  position: result.current.position,
  of: result.current.count,
  skippedBefore: result.current.skippedBefore,
})

async function answerRight(result: Run) {
  const id = result.current.challenge!.challengeId
  vi.mocked(submitChallengeAnswer).mockResolvedValueOnce({ challengeId: id, correct: true, feedback: '', attemptsRemaining: 2 } as never)
  act(() => result.current.setAnswer('x'))
  act(() => result.current.check())
  await waitFor(() => expect(result.current.feedback?.correct).toBe(true))
  act(() => result.current.advance())
  await waitFor(() => expect(result.current.challenge?.challengeId).not.toBe(id))
}

describe('the number in the header is the exercise on screen', () => {
  it('moves on with a skip, and a skipped one comes back with its own number, marked', async () => {
    const { result } = run()
    expect(where(result)).toEqual({ on: 'c1', position: 1, of: 3, skippedBefore: false })

    act(() => result.current.skip())
    expect(where(result)).toEqual({ on: 'c2', position: 2, of: 3, skippedBefore: false })

    await answerRight(result)
    expect(where(result)).toEqual({ on: 'c3', position: 3, of: 3, skippedBefore: false })

    await answerRight(result)
    expect(where(result)).toEqual({ on: 'c1', position: 1, of: 3, skippedBefore: true })
  })

  it('keeps each one its number when everything is skipped, and marks every one that comes round again', () => {
    const { result } = run()
    act(() => result.current.skip())
    act(() => result.current.skip())
    act(() => result.current.skip())
    expect(where(result)).toEqual({ on: 'c1', position: 1, of: 3, skippedBefore: true })
  })

  it('drops the mark once a skipped exercise is answered right', async () => {
    const { result } = run()
    act(() => result.current.skip())
    act(() => result.current.skip())
    // c3, then c1 and c2 again, both skipped before.
    await answerRight(result)
    expect(where(result)).toEqual({ on: 'c1', position: 1, of: 3, skippedBefore: true })
    await answerRight(result)
    expect(where(result)).toEqual({ on: 'c2', position: 2, of: 3, skippedBefore: true })
  })

  it('counts the questions of a quiz as before: which question of the paper this is', async () => {
    const paper = (remaining: number, n: number) => ({
      quizId: 'q1',
      lessonId: 'l1',
      kind: 'testOut',
      status: 'inProgress',
      heartsLeft: 2,
      mistakesAllowed: 1,
      remaining,
      expiresAt: '2099-01-01T00:00:00Z',
      exercise: exercise(n),
    })
    vi.mocked(startLessonQuiz).mockResolvedValue(paper(3, 2) as never)
    vi.mocked(answerLessonQuiz).mockResolvedValueOnce({ ...paper(2, 3), correct: true, credential: null, credentialExpiresAt: null } as never)
    const { result } = run({ testOut: true })
    await waitFor(() => expect(result.current.challenge?.challengeId).toBe('c2'))
    expect(where(result)).toEqual({ on: 'c2', position: 1, of: 3, skippedBefore: false })

    act(() => result.current.setAnswer('x'))
    act(() => result.current.check())
    await waitFor(() => expect(result.current.feedback?.correct).toBe(true))
    act(() => result.current.advance())
    await waitFor(() => expect(result.current.challenge?.challengeId).toBe('c3'))
    expect(where(result)).toEqual({ on: 'c3', position: 2, of: 3, skippedBefore: false })
  })
})
