/*
 * One run through a lesson on the practice stage: the exercise on screen, the
 * answer being put together, the feedback, hints, skipping, the short quiz,
 * and finishing the lesson.
 *
 * Nothing is judged here. An ordinary answer is checked by
 * `POST /practice/challenges/:id/answer`; a quiz answer by
 * `POST /practice/lessons/:id/quiz/:quizId/answer`, which also draws the
 * paper, counts the hearts and says when the quiz is passed or lost. Which
 * exercise comes next in an ordinary lesson is a queue here: answered right,
 * it leaves; skipped, it goes to the back and gives no credit. In a quiz the
 * next exercise is whatever the backend sends back.
 *
 * Finishing posts `POST /practice/lessons/:id/complete`: after a passed quiz
 * with the credential it issued, otherwise with no body at all. Success
 * invalidates every practice query, so the chapter reads its progress again.
 *
 * Only a refusal the backend names ends a quiz (`quiz.ts`). An answer, a start
 * or a completion that fails on the way keeps what the student has and lets
 * them try again (#266). A failed check or hint belongs to the exercise it was
 * for and is cleared when the exercise changes.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  initialPracticeLessonState,
  practiceLessonReducer,
} from '@/components/practice/practiceLessonReducer'
import { quizRefused, quizTrouble, type QuizTrouble } from '@/features/chapter/quiz'
import { useCompleteLessonMutation } from '@/hooks/practice/useCompleteLessonMutation'
import { usePracticeHintMutation } from '@/hooks/practice/usePracticeHintMutation'
import { useSubmitChallengeAnswerMutation } from '@/hooks/practice/useSubmitChallengeAnswerMutation'
import { newRandomId } from '@/lib/randomId'
import { answerLessonQuiz, startLessonQuiz } from '@/services/practice/practiceApi'
import type {
  LessonQuizAnswer,
  LessonQuizKind,
  LessonQuizSession,
  PracticeHintResponse,
  PracticeLesson,
} from '@/types/practice'

/** What the stage draws after an answer, from either way of checking one. */
export type StageFeedback = {
  correct: boolean
  feedback?: string
  explanation?: string
}

/** The quiz under way: the backend's view of it, and how long its paper was. */
type Quiz = {
  view: LessonQuizSession
  size: number
}

export type LessonRunOptions = {
  /** Start with the quiz that tests out of the lesson (from the chapter). */
  testOut?: boolean
}

export function useLessonRun(lesson: PracticeLesson | undefined, { testOut = false }: LessonRunOptions = {}) {
  const [state, dispatch] = useReducer(practiceLessonReducer, initialPracticeLessonState)
  const submitAnswer = useSubmitChallengeAnswerMutation()
  const completeLesson = useCompleteLessonMutation()
  const hintMutation = usePracticeHintMutation()
  const { reset: resetCheck } = submitAnswer
  const { reset: resetHint } = hintMutation
  const challenges = useMemo(() => lesson?.challenges ?? [], [lesson?.challenges])
  const ids = useMemo(() => challenges.map((item) => item.challengeId), [challenges])

  // The lesson's queue, the exercises answered right, and those skipped.
  const [queue, setQueue] = useState<string[]>(ids)
  const [skipped, setSkipped] = useState<string[]>([])
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  // The quiz answer just judged; the exercise on screen holds until it is read.
  const [quizResult, setQuizResult] = useState<LessonQuizAnswer | null>(null)
  const [quizPending, setQuizPending] = useState(testOut)
  const [failed, setFailed] = useState<LessonQuizKind | null>(null)
  /** A refusal the backend named. `inQuiz` ones take the whole stage. */
  const [trouble, setTrouble] = useState<{ code: QuizTrouble; inQuiz: boolean } | null>(null)
  const kind = useRef<LessonQuizKind>(testOut ? 'testOut' : 'skip')
  // A hint belongs to the exercise it was asked for.
  const [hint, setHint] = useState<{ challengeId: string; hint: PracticeHintResponse } | null>(null)
  // Per exercise: wrong answers, and whether a hint was seen (the reducer counts across the lesson).
  const [tries, setTries] = useState<{ challengeId: string; wrong: number } | null>(null)
  const [finished, setFinished] = useState(false)
  // Finished with a quiz's credential: some exercises may never have been answered.
  const [passedQuiz, setPassedQuiz] = useState(false)
  const finishing = useRef(false)
  const [answering, setAnswering] = useState(false)
  // A quiz answer that never reached a verdict: the quiz goes on, the student tries again.
  const [quizCheckFailed, setQuizCheckFailed] = useState(false)

  const quizExercise = quiz?.view.exercise ?? undefined
  const lessonChallenge = challenges.find((item) => item.challengeId === queue[0])
  const stopped = failed !== null || finished || trouble?.inQuiz === true || quizPending
  const challenge = stopped ? undefined : quiz ? quizExercise : lessonChallenge
  // Hearts and what is left come from the backend, and from the answer it just
  // judged while that answer is still on screen.
  const quizView = quizResult ?? quiz?.view ?? null
  const feedback: StageFeedback | null = quiz
    ? quizResult
      ? { correct: quizResult.correct }
      : null
    : state.feedback ?? null
  const last = quiz ? quiz.view.remaining <= 1 : queue.length <= 1
  const answered = Array.isArray(state.answer) ? state.answer.length > 0 : state.answer.trim().length > 0
  const hintForChallenge = !quiz && hint && challenge && hint.challengeId === challenge.challengeId ? hint.hint : null
  const wrong = tries && challenge && tries.challengeId === challenge.challengeId ? tries.wrong : 0
  // Only skipped exercises are left: the quiz is offered instead of skipping again.
  const quizOffered = !quiz && !stopped && queue.length > 0 && queue.every((id) => skipped.includes(id))

  const refuse = useCallback((error: unknown, inQuiz: boolean) => {
    setTrouble({ code: quizTrouble(error), inQuiz })
    if (inQuiz) {
      setQuiz(null)
      setQuizResult(null)
    }
  }, [])

  /** A new exercise starts clean: no "check failed" or "hint failed" from the last one. */
  const clearFailures = useCallback(() => {
    resetCheck()
    resetHint()
    setQuizCheckFailed(false)
  }, [resetCheck, resetHint])

  const finish = useCallback(
    async (quizCredential?: string) => {
      if (!lesson || finishing.current) return
      finishing.current = true
      setTrouble(null)
      try {
        await completeLesson.mutateAsync(
          quizCredential ? { lessonId: lesson.id, quizCredential } : lesson.id,
        )
        setFinished(true)
        setPassedQuiz(quizCredential !== undefined)
        setQuiz(null)
        setQuizResult(null)
      } catch (error) {
        // A passed quiz stays passed unless the backend refused its credential
        // by name: Continue sends the same credential again.
        refuse(error, quizCredential !== undefined && quizRefused(error))
      } finally {
        finishing.current = false
      }
    },
    [completeLesson, lesson, refuse],
  )

  /** Ask the backend for a paper and put the first exercise on screen. */
  const begin = useCallback(
    async (next: LessonQuizKind) => {
      if (!lesson) return
      kind.current = next
      setTrouble(null)
      setFailed(null)
      setQuizResult(null)
      setQuizPending(true)
      clearFailures()
      dispatch({ type: 'reset' })
      try {
        const view = await startLessonQuiz(lesson.id, next)
        setQuiz({ view, size: view.remaining })
      } catch (error) {
        if (quizRefused(error)) refuse(error, true)
        else setTrouble({ code: 'quiz_not_started', inQuiz: true })
      } finally {
        setQuizPending(false)
      }
    },
    [clearFailures, lesson, refuse],
  )

  // Testing out from the chapter: the quiz is the way in, so it is drawn as
  // soon as the lesson is known.
  const testOutStarted = useRef(false)
  useEffect(() => {
    if (!testOut || !lesson || testOutStarted.current) return
    testOutStarted.current = true
    void begin('testOut')
  }, [begin, lesson, testOut])

  const check = useCallback(async () => {
    if (!challenge || !answered || answering) return
    if (quiz) {
      setAnswering(true)
      setQuizCheckFailed(false)
      try {
        setQuizResult(await answerLessonQuiz(quiz.view.lessonId, quiz.view.quizId, { answer: state.answer }))
      } catch (error) {
        if (quizRefused(error)) refuse(error, true)
        else setQuizCheckFailed(true)
      } finally {
        setAnswering(false)
      }
      return
    }
    if (submitAnswer.isPending) return
    const judged = await submitAnswer.mutateAsync({
      challengeId: challenge.challengeId,
      payload: { answer: state.answer },
    })
    if (!judged.correct) setTries({ challengeId: challenge.challengeId, wrong: wrong + 1 })
    dispatch({ type: 'feedback', feedback: judged })
  }, [answered, answering, challenge, quiz, refuse, state.answer, submitAnswer, wrong])

  // The press a hint is being asked for. One that fails on the way is sent
  // again with the same key, so the backend counts it once (#325).
  const hintPress = useRef<{ challengeId: string; key: string } | null>(null)
  const askHint = useCallback(async () => {
    if (!challenge || quiz || !challenge.hintAvailable || hintMutation.isPending) return
    const { challengeId } = challenge
    if (hintPress.current?.challengeId !== challengeId) hintPress.current = { challengeId, key: newRandomId() }
    const response = await hintMutation.mutateAsync({ challengeId, idempotencyKey: hintPress.current.key })
    hintPress.current = null
    setHint({ challengeId, hint: response })
    dispatch({ type: 'hint' })
  }, [challenge, hintMutation, quiz])

  /**
   * On from the feedback. In a quiz the backend has already said what the
   * answer was worth: `passed` finishes the lesson with the credential it
   * issued, `failed` ends the quiz, and anything else moves to the exercise
   * it sent back.
   */
  const advance = useCallback(async () => {
    if (quiz) {
      if (!quizResult) return
      if (quizResult.status === 'passed') {
        await finish(quizResult.credential ?? undefined)
        return
      }
      if (quizResult.status === 'failed') {
        setFailed(quiz.view.kind)
        setQuiz(null)
        setQuizResult(null)
        clearFailures()
        dispatch({ type: 'reset' })
        return
      }
      setQuiz({ view: quizResult, size: quiz.size })
      setQuizResult(null)
      clearFailures()
      dispatch({ type: 'reset' })
      return
    }
    if (!challenge || !state.feedback?.correct) return
    const rest = queue.filter((id) => id !== challenge.challengeId)
    if (rest.length === 0) {
      await finish()
      return
    }
    setQueue(rest)
    setSkipped((list) => list.filter((id) => id !== challenge.challengeId))
    clearFailures()
    dispatch({ type: 'reset' })
  }, [challenge, clearFailures, finish, queue, quiz, quizResult, state.feedback])

  /** No credit: the exercise goes to the back of the queue. Not in a quiz, nor once the quiz is offered. */
  const skip = useCallback(() => {
    if (!challenge || quiz || quizOffered || state.feedback?.correct) return
    setQueue((list) => [...list.filter((id) => id !== challenge.challengeId), challenge.challengeId])
    setSkipped((list) => (list.includes(challenge.challengeId) ? list : [...list, challenge.challengeId]))
    clearFailures()
    dispatch({ type: 'reset' })
  }, [challenge, clearFailures, quiz, quizOffered, state.feedback?.correct])

  /** The quiz that finishes a lesson with skips. */
  const startQuiz = useCallback(() => {
    if (!quizOffered) return
    void begin('skip')
  }, [begin, quizOffered])

  /** After a lost test-out quiz, or a refusal a fresh paper gets past. */
  const restartQuiz = useCallback(() => void begin(kind.current), [begin])

  /** After a lost skip quiz: back to the lesson, the skipped exercises still pending. */
  const backToLesson = useCallback(() => {
    setFailed(null)
    setTrouble(null)
    clearFailures()
    dispatch({ type: 'reset' })
  }, [clearFailures])

  const retry = useCallback(() => dispatch({ type: 'retry' }), [])
  const answer = useCallback((value: string | string[]) => dispatch({ type: 'answer', answer: value }), [])

  return {
    challenge,
    /** Exercises done so far, of the lesson or of the quiz. */
    index: quiz ? quiz.size - quiz.view.remaining : ids.length - queue.length,
    count: quiz ? quiz.size : challenges.length,
    last,
    answer: state.answer,
    answered,
    feedback,
    /** What the backend said to Hint; `hint.hint` is null when the exercise has none. */
    hint: hintForChallenge,
    /** Hint is offered: an ordinary exercise the backend has a hint for. */
    hintOffered: !quiz && challenge?.hintAvailable === true,
    wrong,
    finished,
    /** Finished by passing a quiz, a skip quiz or testing out, rather than by answering every exercise. */
    passedQuiz,
    /** The quiz under way, as the backend sees it. */
    quiz: quizView && quiz ? { kind: quiz.view.kind, hearts: quizView.heartsLeft, total: quizView.mistakesAllowed + 1 } : null,
    /** The quiz's paper is being drawn. */
    quizPending,
    /** Only skipped exercises are left: offer the quiz instead of Skip. */
    quizOffered,
    /** The quiz just lost, and which. */
    failed,
    /** What the backend refused, if it did. */
    trouble,
    checking: quiz ? answering : submitAnswer.isPending,
    checkFailed: quiz ? quizCheckFailed : submitAnswer.isError,
    hinting: hintMutation.isPending,
    hintFailed: hintMutation.isError,
    finishing: completeLesson.isPending,
    setAnswer: answer,
    check: () => void check().catch(() => {}),
    askHint: () => void askHint().catch(() => {}),
    advance: () => void advance().catch(() => {}),
    skip,
    startQuiz,
    restartQuiz,
    backToLesson,
    retry,
  }
}

export type LessonRun = ReturnType<typeof useLessonRun>
