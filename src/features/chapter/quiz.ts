/*
 * The short quiz that gives credit for a lesson without answering every
 * exercise in order (product decision 2026-09-29, after Duolingo).
 *
 * Skipping inside a lesson gives no credit: the exercise goes to the back of
 * the queue. Once only skipped exercises are left, the stage offers this quiz
 * instead of skipping again. From the chapter, a lesson open to the student
 * and not done yet can be tested out of with the same quiz ("jump here"); a
 * locked one cannot (#81). Passing it completes the lesson and nothing more:
 * the star still lights only once every exercise has been answered right (#9).
 *
 * During a quiz: no hints, no Ask, no skip. Every wrong answer costs a heart
 * and sends the exercise to the back of the quiz; losing more than
 * QUIZ_MAX_MISTAKES hearts fails it. The quiz lives in the frontend only; a
 * reload starts it again from the beginning.
 *
 * Every number the rules turn on is here, so they are easy to change.
 */
import type { RoadmapLessonStatus } from '@/types/practice'

/** Wrong answers a quiz forgives. Shown as QUIZ_MAX_MISTAKES + 1 hearts. */
export const QUIZ_MAX_MISTAKES = 1
/** Hearts at the start of a quiz: one for each forgiven mistake, and the last one. */
export const QUIZ_HEARTS = QUIZ_MAX_MISTAKES + 1
/** Exercises already answered right in this lesson that a skip quiz adds, at most. */
export const QUIZ_REVIEW_EXTRA = 2
/** The fewest exercises a skip quiz has, when the lesson has that many. */
export const QUIZ_MIN_SIZE = 3
/** Exercises drawn from a lesson to test out of it from the chapter, at most. */
export const QUIZ_TEST_OUT_SIZE = 5

export type QuizKind = 'skip' | 'testOut'

/** Whether a lesson can be tested out of: open to the student and not done yet (#81). */
export function canTestOut(status: RoadmapLessonStatus): boolean {
  return status === 'available' || status === 'current' || status === 'review'
}

type Random = () => number

function shuffle<T>(items: readonly T[], random: Random): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * The quiz that finishes a lesson with skips: every exercise still skipped,
 * and up to QUIZ_REVIEW_EXTRA of those already answered right (drawn at
 * random), topped up to QUIZ_MIN_SIZE when the lesson has that many.
 */
export function composeSkipQuiz(skipped: readonly string[], correct: readonly string[], random: Random = Math.random): string[] {
  const extra = Math.min(correct.length, Math.max(QUIZ_REVIEW_EXTRA, QUIZ_MIN_SIZE - skipped.length))
  const review = shuffle(correct, random).slice(0, extra)
  return shuffle([...skipped, ...review], random)
}

/** The quiz that tests out of a lesson: QUIZ_TEST_OUT_SIZE of its exercises at most, drawn at random. */
export function composeTestOutQuiz(exercises: readonly string[], random: Random = Math.random): string[] {
  return shuffle(exercises, random).slice(0, Math.min(QUIZ_TEST_OUT_SIZE, exercises.length))
}

/** Whether a quiz with this many wrong answers is lost. */
export function quizLost(mistakes: number) {
  return mistakes > QUIZ_MAX_MISTAKES
}
