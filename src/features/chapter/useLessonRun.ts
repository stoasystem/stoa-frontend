/*
 * One run through a lesson on the practice stage: the exercise on screen, the
 * answer being put together, the feedback, hints, skipping, the short quiz,
 * and finishing the lesson.
 *
 * The answer checking is the backend's (`POST /practice/challenges/:id/answer`)
 * and each exercise's answer and feedback are the practice pages' own reducer;
 * the stage only draws them. Which exercise comes next is a queue here:
 * answered right, it leaves; skipped, it goes to the back and gives no credit.
 * The lesson is finished only when the queue is empty, or by passing the
 * short quiz (`quiz.ts`). Finishing posts `POST /practice/lessons/:id/complete`,
 * whose success invalidates every practice query, so the chapter reads its
 * progress again.
 */
import { useCallback, useMemo, useReducer, useRef, useState } from 'react'
import {
  initialPracticeLessonState,
  practiceLessonReducer,
} from '@/components/practice/practiceLessonReducer'
import { composeSkipQuiz, composeTestOutQuiz, QUIZ_HEARTS, quizLost, type QuizKind } from '@/features/chapter/quiz'
import { useCompleteLessonMutation } from '@/hooks/practice/useCompleteLessonMutation'
import { usePracticeHintMutation } from '@/hooks/practice/usePracticeHintMutation'
import { useSubmitChallengeAnswerMutation } from '@/hooks/practice/useSubmitChallengeAnswerMutation'
import type { PracticeHintResponse, PracticeLesson } from '@/types/practice'

export function formatPracticeAnswer(answer: string | string[]) {
  return Array.isArray(answer) ? answer.join(', ') : answer
}

type Quiz = {
  kind: QuizKind
  /** Exercises still to answer right, the one on screen first. */
  queue: string[]
  size: number
  mistakes: number
}

function startedQuiz(kind: QuizKind, queue: string[]): Quiz {
  return { kind, queue, size: queue.length, mistakes: 0 }
}

export type LessonRunOptions = {
  /** Start with the quiz that tests out of the lesson (from the chapter). */
  testOut?: boolean
  random?: () => number
}

export function useLessonRun(lesson: PracticeLesson | undefined, { testOut = false, random = Math.random }: LessonRunOptions = {}) {
  const [state, dispatch] = useReducer(practiceLessonReducer, initialPracticeLessonState)
  const submitAnswer = useSubmitChallengeAnswerMutation()
  const completeLesson = useCompleteLessonMutation()
  const hintMutation = usePracticeHintMutation()
  const challenges = useMemo(() => lesson?.challenges ?? [], [lesson?.challenges])
  const ids = useMemo(() => challenges.map((item) => item.challengeId), [challenges])

  // The lesson's queue, the exercises answered right, and those skipped.
  const [queue, setQueue] = useState<string[]>(ids)
  const [correct, setCorrect] = useState<string[]>([])
  const [skipped, setSkipped] = useState<string[]>([])
  const [quiz, setQuiz] = useState<Quiz | null>(() =>
    testOut ? startedQuiz('testOut', composeTestOutQuiz(ids, random)) : null,
  )
  const [failed, setFailed] = useState<QuizKind | null>(null)
  // A hint belongs to the exercise it was asked for.
  const [hint, setHint] = useState<{ challengeId: string; hint: PracticeHintResponse } | null>(null)
  // Per exercise: wrong answers, and whether a hint was seen (the reducer counts across the lesson).
  const [tries, setTries] = useState<{ challengeId: string; wrong: number } | null>(null)
  const [finished, setFinished] = useState(false)
  const finishing = useRef(false)

  const onScreen = quiz ? quiz.queue[0] : queue[0]
  const challenge = failed || finished ? undefined : challenges.find((item) => item.challengeId === onScreen)
  const last = quiz ? quiz.queue.length <= 1 : queue.length <= 1
  const answered = Array.isArray(state.answer) ? state.answer.length > 0 : state.answer.trim().length > 0
  const hintForChallenge = !quiz && hint && challenge && hint.challengeId === challenge.challengeId ? hint.hint : null
  const wrong = tries && challenge && tries.challengeId === challenge.challengeId ? tries.wrong : 0
  // Only skipped exercises are left: the quiz is offered instead of skipping again.
  const quizOffered = !quiz && !failed && !finished && queue.length > 0 && queue.every((id) => skipped.includes(id))

  const check = useCallback(async () => {
    if (!challenge || !answered || submitAnswer.isPending) return
    const feedback = await submitAnswer.mutateAsync({ challengeId: challenge.challengeId, payload: { answer: state.answer } })
    if (!feedback.correct) {
      if (quiz) setQuiz({ ...quiz, mistakes: quiz.mistakes + 1 })
      else setTries({ challengeId: challenge.challengeId, wrong: wrong + 1 })
    }
    dispatch({ type: 'feedback', feedback })
  }, [answered, challenge, quiz, state.answer, submitAnswer, wrong])

  const askHint = useCallback(async () => {
    if (!challenge || !lesson || quiz || hintMutation.isPending) return
    const response = await hintMutation.mutateAsync({
      subjectId: lesson.subjectId,
      gradeLevel: lesson.gradeLevel,
      topicId: lesson.topicId,
      lessonId: lesson.id,
      challengeId: challenge.challengeId,
      answer: state.answer,
    })
    setHint({ challengeId: challenge.challengeId, hint: response })
    dispatch({ type: 'hint' })
  }, [challenge, hintMutation, lesson, quiz, state.answer])

  const finish = useCallback(async () => {
    if (!lesson || finishing.current) return
    finishing.current = true
    try {
      // The backend's `complete_lesson` (stoa-backend
      // `src/stoa/routers/practice.py:790`) accepts completion with no check
      // of its own: that every exercise was answered right, or the quiz was
      // passed, is enforced here in the frontend only. Server-side
      // enforcement is tracked separately: backend ticket pending.
      await completeLesson.mutateAsync(lesson.id)
      setFinished(true)
      setQuiz(null)
    } finally {
      finishing.current = false
    }
  }, [completeLesson, lesson])

  /**
   * On from the feedback. Answered right: the next exercise, or finish. In a
   * quiz, a wrong answer costs a heart and goes to the back -- or, past
   * QUIZ_MAX_MISTAKES, loses the quiz.
   */
  const advance = useCallback(async () => {
    if (!challenge || !state.feedback) return
    if (quiz) {
      if (!state.feedback.correct) {
        if (quizLost(quiz.mistakes)) {
          setFailed(quiz.kind)
          setQuiz(null)
        } else {
          setQuiz({ ...quiz, queue: [...quiz.queue.slice(1), challenge.challengeId] })
        }
        dispatch({ type: 'reset' })
        return
      }
      const rest = quiz.queue.slice(1)
      if (rest.length === 0) {
        await finish()
        return
      }
      setQuiz({ ...quiz, queue: rest })
      dispatch({ type: 'reset' })
      return
    }
    if (!state.feedback.correct) return
    const rest = queue.filter((id) => id !== challenge.challengeId)
    if (rest.length === 0) {
      await finish()
      return
    }
    setQueue(rest)
    setCorrect((done) => [...done, challenge.challengeId])
    setSkipped((list) => list.filter((id) => id !== challenge.challengeId))
    dispatch({ type: 'reset' })
  }, [challenge, finish, queue, quiz, state.feedback])

  /** No credit: the exercise goes to the back of the queue. Not in a quiz, nor once the quiz is offered. */
  const skip = useCallback(() => {
    if (!challenge || quiz || quizOffered || state.feedback?.correct) return
    setQueue((list) => [...list.filter((id) => id !== challenge.challengeId), challenge.challengeId])
    setSkipped((list) => (list.includes(challenge.challengeId) ? list : [...list, challenge.challengeId]))
    dispatch({ type: 'reset' })
  }, [challenge, quiz, quizOffered, state.feedback?.correct])

  /** The skip quiz: every exercise still skipped, and a few answered right. */
  const startQuiz = useCallback(() => {
    if (!quizOffered) return
    setQuiz(startedQuiz('skip', composeSkipQuiz(queue, correct, random)))
    dispatch({ type: 'reset' })
  }, [correct, queue, quizOffered, random])

  /** After a lost test-out quiz: the quiz again, drawn afresh. */
  const retryTestOut = useCallback(() => {
    setFailed(null)
    setQuiz(startedQuiz('testOut', composeTestOutQuiz(ids, random)))
    dispatch({ type: 'reset' })
  }, [ids, random])

  /** After a lost skip quiz: back to the lesson, the skipped exercises still pending. */
  const backToLesson = useCallback(() => {
    setFailed(null)
    dispatch({ type: 'reset' })
  }, [])

  const retry = useCallback(() => dispatch({ type: 'retry' }), [])
  const answer = useCallback((value: string | string[]) => dispatch({ type: 'answer', answer: value }), [])

  return {
    challenge,
    /** Exercises answered right so far, of the lesson or of the quiz. */
    index: quiz ? quiz.size - quiz.queue.length : correct.length,
    count: quiz ? quiz.size : challenges.length,
    last,
    answer: state.answer,
    answered,
    feedback: state.feedback,
    hint: hintForChallenge,
    wrong,
    finished,
    /** The quiz under way, if any. */
    quiz: quiz ? { kind: quiz.kind, size: quiz.size, mistakes: quiz.mistakes, hearts: Math.max(0, QUIZ_HEARTS - quiz.mistakes) } : null,
    /** Only skipped exercises are left: offer the quiz instead of Skip. */
    quizOffered,
    /** The quiz just lost, and which. */
    failed,
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
    skip,
    startQuiz,
    retryTestOut,
    backToLesson,
    retry,
  }
}

export type LessonRun = ReturnType<typeof useLessonRun>
