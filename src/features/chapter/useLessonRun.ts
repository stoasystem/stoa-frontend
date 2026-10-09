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
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  initialPracticeLessonState,
  practiceLessonReducer,
} from '@/components/practice/practiceLessonReducer'
import { quizTrouble, type QuizTrouble } from '@/features/chapter/quiz'
import { useCompleteLessonMutation } from '@/hooks/practice/useCompleteLessonMutation'
import { usePracticeHintMutation } from '@/hooks/practice/usePracticeHintMutation'
import { useSubmitChallengeAnswerMutation } from '@/hooks/practice/useSubmitChallengeAnswerMutation'
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
  const finishing = useRef(false)
  const [answering, setAnswering] = useState(false)

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
        setQuiz(null)
        setQuizResult(null)
      } catch (error) {
        refuse(error, quizCredential !== undefined)
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
      dispatch({ type: 'reset' })
      try {
        const view = await startLessonQuiz(lesson.id, next)
        setQuiz({ view, size: view.remaining })
      } catch (error) {
        refuse(error, true)
      } finally {
        setQuizPending(false)
      }
    },
    [lesson, refuse],
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
      try {
        setQuizResult(await answerLessonQuiz(quiz.view.lessonId, quiz.view.quizId, { answer: state.answer }))
      } catch (error) {
        refuse(error, true)
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
        dispatch({ type: 'reset' })
        return
      }
      setQuiz({ view: quizResult, size: quiz.size })
      setQuizResult(null)
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
    dispatch({ type: 'reset' })
  }, [challenge, finish, queue, quiz, quizResult, state.feedback])

  /** No credit: the exercise goes to the back of the queue. Not in a quiz, nor once the quiz is offered. */
  const skip = useCallback(() => {
    if (!challenge || quiz || quizOffered || state.feedback?.correct) return
    setQueue((list) => [...list.filter((id) => id !== challenge.challengeId), challenge.challengeId])
    setSkipped((list) => (list.includes(challenge.challengeId) ? list : [...list, challenge.challengeId]))
    dispatch({ type: 'reset' })
  }, [challenge, quiz, quizOffered, state.feedback?.correct])

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
    dispatch({ type: 'reset' })
  }, [])

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
    hint: hintForChallenge,
    wrong,
    finished,
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
    checkFailed: !quiz && submitAnswer.isError,
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
