/**
 * A failed check or hint belongs to the exercise it was for (#266). Both came
 * straight from the mutations' `isError`, which nothing reset, so the next
 * exercise opened with "your answer could not be checked" and "no hint right
 * now" before the student had done anything.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useLessonRun } from '@/features/chapter/useLessonRun'
import { getPracticeHint, submitChallengeAnswer } from '@/services/practice/practiceApi'

vi.mock('@/services/practice/practiceApi', () => ({
  submitChallengeAnswer: vi.fn(),
  getPracticeHint: vi.fn(),
  completePracticeLesson: vi.fn(),
  startLessonQuiz: vi.fn(),
  answerLessonQuiz: vi.fn(),
}))

const lesson = {
  id: 'l1',
  unitId: 'u1',
  subjectId: 'math',
  topicId: 't',
  gradeLevel: '8',
  title: 'L',
  topic: 'T',
  challenges: [
    { challengeId: 'c1', type: 'text_input', prompt: '1+1', options: [], hintAvailable: true },
    { challengeId: 'c2', type: 'text_input', prompt: '2+2', options: [], hintAvailable: true },
  ],
} as never

function run() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(() => useLessonRun(lesson), { wrapper })
}

async function failBoth(result: ReturnType<typeof run>['result']) {
  act(() => result.current.setAnswer('2'))
  act(() => result.current.check())
  await waitFor(() => expect(result.current.checkFailed).toBe(true))
  act(() => result.current.askHint())
  await waitFor(() => expect(result.current.hintFailed).toBe(true))
}

describe('a failed check or hint stays with its exercise', () => {
  it('is gone once the exercise is skipped', async () => {
    vi.mocked(submitChallengeAnswer).mockRejectedValue(new Error('network'))
    vi.mocked(getPracticeHint).mockRejectedValue(new Error('network'))
    const { result } = run()
    await failBoth(result)

    act(() => result.current.skip())
    expect(result.current.challenge?.challengeId).toBe('c2')
    expect(result.current.checkFailed).toBe(false)
    expect(result.current.hintFailed).toBe(false)
  })

  it('is gone once the exercise is answered right and left behind', async () => {
    vi.mocked(getPracticeHint).mockRejectedValue(new Error('network'))
    vi.mocked(submitChallengeAnswer)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue({ challengeId: 'c1', correct: true } as never)
    const { result } = run()
    await failBoth(result)

    // The hint failure outlives a successful check on the same exercise.
    act(() => result.current.check())
    await waitFor(() => expect(result.current.feedback?.correct).toBe(true))
    expect(result.current.hintFailed).toBe(true)

    act(() => result.current.advance())
    await waitFor(() => expect(result.current.challenge?.challengeId).toBe('c2'))
    expect(result.current.checkFailed).toBe(false)
    expect(result.current.hintFailed).toBe(false)
  })
})

// The stage hands `run.askHint` straight to the Hint button's onClick. A failed
// hint is shown from the mutation's state (`hintFailed`), so the press must
// give back nothing that rejects: the browser would report every failed hint
// as an unhandled rejection (#369).
describe('a failed hint leaves nothing unhandled', () => {
  it('gives the button nothing to reject, and shows the failure', async () => {
    vi.mocked(getPracticeHint).mockRejectedValue(new Error('network'))
    const unhandled: unknown[] = []
    const collect = (reason: unknown) => void unhandled.push(reason)
    process.on('unhandledRejection', collect)
    try {
      const { result } = run()
      let pressed: unknown = 'not pressed'
      act(() => {
        pressed = result.current.askHint()
      })
      expect(pressed).toBeUndefined()
      await waitFor(() => expect(result.current.hintFailed).toBe(true))
      // Node reports a rejection nobody handled once the microtasks have run.
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(unhandled).toEqual([])
    } finally {
      process.off('unhandledRejection', collect)
    }
  })
})
