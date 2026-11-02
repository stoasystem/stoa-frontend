/*
 * One run through a star quiz (#486, stoa-backend#165): the whole knowledge
 * point tested in one paper, so a student who already knows it can light it
 * without its lessons.
 *
 * The paper, the verdicts, the mistakes left and the cooldown are the
 * backend's: `POST /practice/knowledge-map/stars/:unitId/quiz` opens it (or
 * hands back the paper still open for the star), and each answer goes to
 * `…/quiz/:quizId/answer` with the id of the exercise it answers, so one sent
 * again after a lost reply gets its first verdict back. Passed, the star is
 * lit by the backend and celebrated on the map; lost, it can be taken again
 * after `retryAt`.
 *
 * The run has the lesson run's shape (`LessonRun`), so the stage draws its
 * exercise, hearts, feedback and buttons exactly as the lesson quiz's (two
 * hearts, no hint, no Ask, no skip). What a lesson run does and a star quiz
 * does not is there and does nothing.
 *
 * Only a refusal the backend names ends the quiz (`STAR_QUIZ_TROUBLES`); an
 * answer or a start that fails on the way keeps what the student has and lets
 * them try again (#266).
 */
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  initialPracticeLessonState,
  practiceLessonReducer,
} from '@/components/practice/practiceLessonReducer'
import type { LessonRun, StageFeedback } from '@/features/chapter/useLessonRun'
import { answerStarQuiz, startStarQuiz } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'
import type { StarQuizAnswer, StarQuizView } from '@/types/practice'

/** Every refusal the two star quiz endpoints name. */
export const STAR_QUIZ_TROUBLES = [
  'star_quiz_unknown_star',
  'star_quiz_already_lit',
  'star_quiz_cooling_down',
  'star_quiz_unavailable',
  'star_quiz_not_found',
  'star_quiz_finished',
  'star_quiz_expired',
  'star_quiz_out_of_order',
] as const

/**
 * A refusal the stage has words for, or `star_quiz_not_started` when opening
 * the paper failed without one.
 */
export type StarQuizTrouble = (typeof STAR_QUIZ_TROUBLES)[number] | 'star_quiz_not_started'

/** Troubles opening the quiz again is a way out of: a fresh paper, or the one still open. */
const RESTARTABLE = new Set<StarQuizTrouble>([
  'star_quiz_not_found',
  'star_quiz_finished',
  'star_quiz_expired',
  'star_quiz_out_of_order',
  'star_quiz_not_started',
])

export function starQuizTroubleIsRestartable(trouble: StarQuizTrouble): boolean {
  return RESTARTABLE.has(trouble)
}

const SENTENCE: Record<StarQuizTrouble, string> = {
  star_quiz_unknown_star: 'starQuiz.trouble.unknownStar',
  star_quiz_already_lit: 'starQuiz.trouble.alreadyLit',
  star_quiz_cooling_down: 'starQuiz.trouble.coolingDown',
  star_quiz_unavailable: 'starQuiz.trouble.unavailable',
  star_quiz_not_found: 'starQuiz.trouble.notFound',
  star_quiz_finished: 'starQuiz.trouble.finished',
  star_quiz_expired: 'starQuiz.trouble.expired',
  star_quiz_out_of_order: 'starQuiz.trouble.outOfOrder',
  star_quiz_not_started: 'starQuiz.trouble.notStarted',
}

/** The sentence (in `chapter`) for what went wrong. */
export function starQuizTroubleKey(trouble: StarQuizTrouble): string {
  return SENTENCE[trouble]
}

function named(error: unknown): (typeof STAR_QUIZ_TROUBLES)[number] | undefined {
  const code = (error as { code?: unknown } | null)?.code
  return STAR_QUIZ_TROUBLES.find((known) => known === code)
}

/** When a cooling quiz can be taken again, from the refusal that says so. */
function retryAtOf(error: unknown): string | null {
  const retryAt = ((error as { detail?: unknown } | null)?.detail as { retryAt?: unknown } | null | undefined)?.retryAt
  return typeof retryAt === 'string' ? retryAt : null
}

export type StarQuizRun = LessonRun & {
  /** The refusal that ended it, with the time it can be taken again when it was cooling down. */
  starTrouble: { code: StarQuizTrouble; retryAt: string | null } | null
  /** Lost: when it can be taken again. */
  retryAt: string | null
}

export function useStarQuizRun(unitId: string | undefined): StarQuizRun {
  const queryClient = useQueryClient()
  const [state, dispatch] = useReducer(practiceLessonReducer, initialPracticeLessonState)
  const [view, setView] = useState<StarQuizView | null>(null)
  // The answer just judged; the exercise on screen holds until it is read.
  const [result, setResult] = useState<StarQuizAnswer | null>(null)
  const [pending, setPending] = useState(true)
  const [outcome, setOutcome] = useState<{ passed: boolean; retryAt: string | null } | null>(null)
  const [trouble, setTrouble] = useState<{ code: StarQuizTrouble; retryAt: string | null } | null>(null)
  const [answering, setAnswering] = useState(false)
  const [checkFailed, setCheckFailed] = useState(false)

  /** The sky says the star is lit, or cooling, once the quiz is over. */
  const readSkyAgain = useCallback(() => void queryClient.invalidateQueries({ queryKey: practiceQueryKeys.all }), [queryClient])

  const begin = useCallback(async () => {
    if (!unitId) return
    setTrouble(null)
    setOutcome(null)
    setResult(null)
    setCheckFailed(false)
    setPending(true)
    dispatch({ type: 'reset' })
    try {
      setView(await startStarQuiz(unitId))
    } catch (error) {
      const code = named(error)
      setView(null)
      setTrouble({ code: code ?? 'star_quiz_not_started', retryAt: retryAtOf(error) })
      // Already lit or cooling: the card on the map should say so too.
      if (code === 'star_quiz_already_lit' || code === 'star_quiz_cooling_down') readSkyAgain()
    } finally {
      setPending(false)
    }
  }, [readSkyAgain, unitId])

  const started = useRef<string | null>(null)
  useEffect(() => {
    if (!unitId || started.current === unitId) return
    started.current = unitId
    void begin()
  }, [begin, unitId])

  const stopped = outcome !== null || trouble !== null || pending
  const challenge = stopped ? undefined : (view?.exercise ?? undefined)
  const shown = result ?? view
  const answered = Array.isArray(state.answer) ? state.answer.length > 0 : state.answer.trim().length > 0
  const feedback: StageFeedback | null = result ? { correct: result.correct } : null

  const check = useCallback(async () => {
    if (!unitId || !view || !challenge || !answered || answering || result) return
    setAnswering(true)
    setCheckFailed(false)
    try {
      setResult(await answerStarQuiz(unitId, view.quizId, { exerciseId: challenge.challengeId, answer: state.answer }))
    } catch (error) {
      const code = named(error)
      if (code) {
        setView(null)
        setTrouble({ code, retryAt: retryAtOf(error) })
      } else {
        setCheckFailed(true)
      }
    } finally {
      setAnswering(false)
    }
  }, [answered, answering, challenge, result, state.answer, unitId, view])

  /** On from the feedback: the next exercise the backend sent, or the verdict it gave. */
  const advance = useCallback(() => {
    if (!result) return
    if (result.status !== 'inProgress') {
      setOutcome({ passed: result.status === 'passed', retryAt: result.retryAt })
      setView(null)
      setResult(null)
      readSkyAgain()
      return
    }
    setView(result)
    setResult(null)
    setCheckFailed(false)
    dispatch({ type: 'reset' })
  }, [readSkyAgain, result])

  const nothing = useCallback(() => {}, [])
  const retry = useCallback(() => dispatch({ type: 'retry' }), [])
  const setAnswer = useCallback((value: string | string[]) => dispatch({ type: 'answer', answer: value }), [])
  const hearts = shown ? Math.max(0, shown.mistakesAllowed + 1 - shown.mistakes) : 0

  return {
    challenge,
    index: shown ? Math.min(shown.answered, shown.total) : 0,
    count: shown?.total ?? 0,
    last: shown ? shown.total - shown.answered <= 1 : false,
    answer: state.answer,
    answered,
    feedback,
    hint: null,
    hintOffered: false,
    wrong: 0,
    finished: outcome?.passed === true,
    passedQuiz: outcome?.passed === true,
    quiz: shown && !stopped ? { kind: 'testOut', hearts, total: shown.mistakesAllowed + 1 } : null,
    quizPending: pending,
    quizOffered: false,
    failed: outcome && !outcome.passed ? 'testOut' : null,
    trouble: null,
    checking: answering,
    checkFailed,
    hinting: false,
    hintFailed: false,
    finishing: false,
    setAnswer,
    check: () => void check().catch(() => {}),
    askHint: () => undefined,
    advance: () => void advance(),
    skip: () => undefined,
    startQuiz: () => undefined,
    restartQuiz: () => void begin(),
    backToLesson: nothing,
    retry,
    starTrouble: trouble,
    retryAt: outcome && !outcome.passed ? outcome.retryAt : null,
  }
}

/** When a star quiz can be taken again, as the reader's language writes a day and a time. */
export function formatRetryAt(iso: string, language: string): string {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return iso
  return new Intl.DateTimeFormat(language, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(at)
}
