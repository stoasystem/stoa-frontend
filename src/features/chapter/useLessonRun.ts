/*
 * One run through a lesson on the practice stage: the exercise on screen, the
 * answer being put together, the feedback, hints, and finishing the lesson.
 *
 * The answer checking is the backend's (`POST /practice/challenges/:id/answer`)
 * and the state is the practice pages' own reducer; the stage only draws it.
 * Finishing posts `POST /practice/lessons/:id/complete`, whose success
 * invalidates every practice query, so the chapter reads its progress again.
 */
import { useCallback, useReducer, useState } from 'react'
import {
  initialPracticeLessonState,
  practiceLessonReducer,
} from '@/components/practice/practiceLessonReducer'
import { useCompleteLessonMutation } from '@/hooks/practice/useCompleteLessonMutation'
import { usePracticeHintMutation } from '@/hooks/practice/usePracticeHintMutation'
import { useSubmitChallengeAnswerMutation } from '@/hooks/practice/useSubmitChallengeAnswerMutation'
import type { PracticeHintResponse, PracticeLesson } from '@/types/practice'

export function formatPracticeAnswer(answer: string | string[]) {
  return Array.isArray(answer) ? answer.join(', ') : answer
}

export function useLessonRun(lesson: PracticeLesson | undefined) {
  const [state, dispatch] = useReducer(practiceLessonReducer, initialPracticeLessonState)
  const submitAnswer = useSubmitChallengeAnswerMutation()
  const completeLesson = useCompleteLessonMutation()
  const hintMutation = usePracticeHintMutation()
  // A hint belongs to the exercise it was asked for.
  const [hint, setHint] = useState<{ challengeId: string; hint: PracticeHintResponse } | null>(null)
  // Per exercise: wrong answers, and whether a hint was seen (the reducer counts across the lesson).
  const [tries, setTries] = useState<{ challengeId: string; wrong: number } | null>(null)
  const [finished, setFinished] = useState(false)

  const challenges = lesson?.challenges ?? []
  const challenge = challenges[state.currentIndex]
  const last = state.currentIndex >= challenges.length - 1
  const answered = Array.isArray(state.answer) ? state.answer.length > 0 : state.answer.trim().length > 0
  const hintForChallenge = hint && challenge && hint.challengeId === challenge.id ? hint.hint : null
  const wrong = tries && challenge && tries.challengeId === challenge.id ? tries.wrong : 0

  const check = useCallback(async () => {
    if (!challenge || !answered || submitAnswer.isPending) return
    const feedback = await submitAnswer.mutateAsync({ challengeId: challenge.id, payload: { answer: state.answer } })
    if (!feedback.correct) setTries({ challengeId: challenge.id, wrong: wrong + 1 })
    dispatch({ type: 'feedback', feedback })
  }, [answered, challenge, state.answer, submitAnswer, wrong])

  const askHint = useCallback(async () => {
    if (!challenge || !lesson || hintMutation.isPending) return
    const response = await hintMutation.mutateAsync({
      subjectId: lesson.subjectId,
      gradeLevel: lesson.gradeLevel,
      topicId: lesson.topicId,
      lessonId: lesson.id,
      challengeId: challenge.id,
      answer: state.answer,
    })
    setHint({ challengeId: challenge.id, hint: response })
    dispatch({ type: 'hint' })
  }, [challenge, hintMutation, lesson, state.answer])

  const finish = useCallback(async () => {
    if (!lesson || completeLesson.isPending) return
    await completeLesson.mutateAsync(lesson.id)
    setFinished(true)
  }, [completeLesson, lesson])

  /** On to the next exercise, or finish the lesson after the last one. */
  const advance = useCallback(async () => {
    if (!lesson) return
    if (!last) {
      dispatch({ type: 'next', challenges: lesson.challenges })
      return
    }
    await finish()
  }, [finish, last, lesson])

  const retry = useCallback(() => dispatch({ type: 'retry' }), [])
  const answer = useCallback((value: string | string[]) => dispatch({ type: 'answer', answer: value }), [])

  return {
    challenge,
    index: state.currentIndex,
    count: challenges.length,
    last,
    answer: state.answer,
    answered,
    feedback: state.feedback,
    hint: hintForChallenge,
    wrong,
    finished,
    checking: submitAnswer.isPending,
    checkFailed: submitAnswer.isError,
    hinting: hintMutation.isPending,
    hintFailed: hintMutation.isError,
    finishing: completeLesson.isPending,
    finishFailed: completeLesson.isError,
    setAnswer: answer,
    check: () => void check().catch(() => {}),
    askHint: () => void askHint().catch(() => {}),
    advance: () => void advance().catch(() => {}),
    retry,
  }
}

export type LessonRun = ReturnType<typeof useLessonRun>
