/*
 * `/chapter/:unitId/:lessonId`: the practice stage, with Ask beside it
 * (#13 point 1, #12 point 4, #50 point 2; canvas boards "Tap a point ·
 * practice on the planet" and "Phone · practice on the planet").
 *
 * The stage keeps the dark ground so tapping a star never feels like leaving.
 * Top left, "You are here": the star, its ring filling as lessons pass. The
 * question in large white type, answers as dark glass rows, one lit button
 * (Placement: "Practice row: primary left, large, min 200; plain right of it;
 * Hint plain at far right"; on a phone the primary is full width and docked).
 * Ask sits beside it as a light window and knows the exercise on screen.
 *
 * Skip gives no credit: the exercise goes to the back. Once only skipped
 * exercises are left, the short quiz is offered instead (`quiz.ts`); with
 * `?mode=quiz` the stage opens on the quiz that tests out of the lesson. In a
 * quiz there are no hints, no skip, and Ask and 「问这段」 are off.
 */
import { Check, ChevronLeft, Heart, Lightbulb, Lock, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/base'
import { ICON } from '@/components/base/sizes'
import { MathRenderer } from '@/components/ui/MathRenderer'
import type { AskPractice } from '@/features/ask/practiceContext'
import { QuoteSelection } from '@/features/chapter/QuoteSelection'
import { StageWithAsk, STAGE_SIDE_QUERY } from '@/features/chapter/StageAsk'
import { QUIZ_HEARTS } from '@/features/chapter/quiz'
import { chapterPath, isOpenLesson, lessonAfter, QUIZ_MODE, useChapter, type Chapter } from '@/features/chapter/useChapter'
import { formatPracticeAnswer, useLessonRun, type LessonRun } from '@/features/chapter/useLessonRun'
import { StarGlyph } from '@/features/starmap/components/StarGlyph'
import { usePrefersReducedMotion } from '@/features/starmap/motion/usePrefersReducedMotion'
import { useLessonQuery } from '@/hooks/practice/useLessonQuery'
import { useMediaQuery } from '@/hooks/layout/useMediaQuery'
import { AppLayout } from '@/layouts/AppLayout'
import { cn } from '@/lib/utils'
import type { PracticeChallenge, PracticeLesson } from '@/types/practice'
import '@/features/chapter/chapter.css'

const plainOnSky =
  'inline-flex min-h-11 items-center gap-1 text-[15px] font-semibold text-[color:var(--on-sky-plain)] no-underline hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const bodyOnSky = 'text-[color:var(--on-sky-text-body)]'
const glass = {
  background: 'var(--sky-glass)',
  borderColor: 'var(--sky-glass-border)',
  backdropFilter: 'blur(var(--sky-glass-blur))',
  WebkitBackdropFilter: 'blur(var(--sky-glass-blur))',
} as const

export function LessonStage({ unitId, lessonId }: { unitId: string | undefined; lessonId: string | undefined }) {
  const lessonQuery = useLessonQuery(lessonId)
  const chapterQuery = useChapter(unitId)
  const chapter = chapterQuery.status === 'ready' ? chapterQuery.chapter : null
  const lesson = lessonQuery.data
  const [params] = useSearchParams()
  const askedForQuiz = params.get('mode') === QUIZ_MODE
  // A lesson from another unit is not this chapter's: a link that pairs them
  // finds nothing, as a chapter not in the catalog does.
  const inUnit = lesson !== undefined && (!unitId || lesson.unitId === unitId)
  // Whether the chapter says it is locked. Until the chapter is read the stage
  // waits rather than flash an exercise it may take back; if the chapter
  // cannot be read the stage opens, and the backend still decides.
  const status = chapter?.lessons.find((item) => item.id === lesson?.id)?.status
  // Testing out of the lesson from the chapter: only where the chapter says the
  // lesson is open (#81). Until stoa-backend#83 checks it this is the only
  // gate, so a lesson done, or one the chapter could not be read for, opens
  // as the lesson itself; a locked one gets its notice like any other way in.
  // Decided once, when the chapter first says: passing the quiz turns the
  // lesson done, and that must not turn the quiz on screen into the lesson.
  // A reload starts the quiz again from the beginning; nothing of it is kept.
  const [openWhenEntered, setOpenWhenEntered] = useState<{ lessonId: string; open: boolean } | null>(null)
  if (lesson && status !== undefined && openWhenEntered?.lessonId !== lesson.id) {
    setOpenWhenEntered({ lessonId: lesson.id, open: isOpenLesson(status) })
  }
  const testOut = askedForQuiz && openWhenEntered?.lessonId === lesson?.id && openWhenEntered?.open === true
  const notice: StageNoticeKind | null = lessonQuery.isLoading
    ? 'loading'
    : lessonQuery.isError
      ? 'failed'
      : !lesson || !inUnit
        ? 'missing'
        : chapterQuery.status === 'loading'
          ? 'loading'
          : status === 'locked'
            ? 'locked'
            : null
  // Keyed by lesson and mode: the next lesson, or the quiz, starts a fresh run.
  return (
    <AppLayout bleed>
      {lesson && notice === null ? (
        <LessonRunStage
          key={`${lesson.id}:${testOut ? 'quiz' : 'lesson'}`}
          lesson={lesson}
          unitId={unitId ?? lesson.unitId}
          chapter={chapter}
          testOut={testOut}
        />
      ) : (
        <div data-surface="sky" className="flex min-h-0 flex-1 flex-col items-start gap-3 bg-sky p-6 text-on-sky">
          <StageNotice unitId={unitId} kind={notice ?? 'missing'} retry={() => void lessonQuery.refetch()} />
        </div>
      )}
    </AppLayout>
  )
}

type StageNoticeKind = 'loading' | 'failed' | 'missing' | 'locked'

function StageNotice({ unitId, kind, retry }: { unitId?: string; kind: StageNoticeKind; retry: () => void }) {
  const { t } = useTranslation('chapter')
  return (
    <>
      {unitId && (
        <Link to={chapterPath(unitId)} className={plainOnSky}>
          <ChevronLeft size={18} strokeWidth={ICON.stroke} aria-hidden="true" />
          {t('stage.backToLessons')}
        </Link>
      )}
      {kind === 'loading' ? (
        <p role="status" className={cn('m-0 text-[15px]', bodyOnSky)}>
          {t('stage.loading')}
        </p>
      ) : kind === 'failed' ? (
        <>
          <p role="alert" className={cn('m-0 text-[15px]', bodyOnSky)}>
            {t('stage.failed')}
          </p>
          <Button variant="onSkyPlain" onClick={retry}>
            {t('stage.retry')}
          </Button>
        </>
      ) : kind === 'locked' ? (
        <div data-stage-locked className="flex flex-col items-start gap-1">
          <h1 className="m-0 inline-flex items-center gap-2 text-[22px] font-semibold text-on-sky">
            <Lock size={20} strokeWidth={ICON.stroke} aria-hidden="true" />
            {t('stage.locked.title')}
          </h1>
          <p className={cn('m-0 text-[15px]', bodyOnSky)}>{t('stage.locked.body')}</p>
        </div>
      ) : (
        <p role="alert" className={cn('m-0 text-[15px]', bodyOnSky)}>
          {t('stage.missing')}
        </p>
      )}
    </>
  )
}

function LessonRunStage({
  lesson,
  unitId,
  chapter,
  testOut,
}: {
  lesson: PracticeLesson
  unitId: string
  chapter: Chapter | null
  testOut: boolean
}) {
  const { t } = useTranslation('chapter')
  const run = useLessonRun(lesson, { testOut })
  const side = useMediaQuery(STAGE_SIDE_QUERY)
  const host = useRef<HTMLDivElement>(null)
  // The first question on arrival keeps the page's focus; every one after it
  // (the next exercise, the quiz, back from the quiz) takes the keyboard.
  const arrived = useRef(true)
  const { challenge } = run
  const inQuiz = run.quiz !== null

  // TEXT FALLBACK (#56): what Ask is told about the exercise on screen. #56
  // sends `{ challengeId, lessonId, unitId }` instead of the words.
  const practice = useMemo<AskPractice | undefined>(
    () =>
      // Not during a quiz: Ask is off, and told nothing.
      challenge && !run.finished && !inQuiz
        ? {
            context: {
              unitId,
              lessonId: lesson.id,
              challengeId: challenge.challengeId,
              topic: challenge.topic || lesson.topic,
              prompt: challenge.prompt,
              answer: formatPracticeAnswer(run.answer) || undefined,
              attempts: run.wrong,
              hintViewed: Boolean(run.hint),
            },
          }
        : undefined,
    [challenge, inQuiz, lesson.id, lesson.topic, run.answer, run.finished, run.hint, run.wrong, unitId],
  )

  const lessonNumber = chapter ? chapter.lessons.findIndex((item) => item.id === lesson.id) + 1 : 0

  return (
    <div ref={host} className="flex min-h-0 flex-1 flex-col">
      <StageWithAsk practice={practice} subjectId={lesson.subjectId} off={inQuiz ? t('quiz.askOff') : undefined}>
        <StageStrip lesson={lesson} unitId={unitId} chapter={chapter} lessonNumber={lessonNumber} run={run} side={side} />
        {run.finished ? (
          <LessonDone lesson={lesson} unitId={unitId} chapter={chapter} testedOut={testOut} />
        ) : run.failed ? (
          <QuizFailed run={run} unitId={unitId} />
        ) : challenge ? (
          <Exercise run={run} challenge={challenge} chapter={chapter} side={side} arrived={arrived} />
        ) : (
          <div className="p-6">
            <p className={cn('m-0 text-[15px]', bodyOnSky)}>{t('stage.empty')}</p>
          </div>
        )}
      </StageWithAsk>
      {!inQuiz && <QuoteSelection scope={host} />}
    </div>
  )
}

/** The strip under the bar: back to the chapter, where you are, the chapter's lessons as dots. */
function StageStrip({
  lesson,
  unitId,
  chapter,
  lessonNumber,
  run,
  side,
}: {
  lesson: PracticeLesson
  unitId: string
  chapter: Chapter | null
  lessonNumber: number
  run: LessonRun
  side: boolean
}) {
  const { t } = useTranslation('chapter')
  const chapterTitle = chapter?.title ?? lesson.topic
  const where = [
    side ? chapterTitle : null,
    chapter && lessonNumber > 0 ? t('stage.lessonOf', { lesson: lessonNumber, lessons: chapter.total }) : null,
    run.quiz ? t('quiz.label') : null,
    run.count > 0 && !run.finished && !run.failed ? t('stage.questionOf', { question: Math.min(run.index + 1, run.count), questions: run.count }) : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      className="grid shrink-0 items-center gap-2 border-b border-white/10"
      style={{ gridTemplateColumns: '1fr auto 1fr', padding: side ? '6px 20px' : '4px 8px' }}
    >
      <Link to={chapterPath(unitId)} className={cn(plainOnSky, 'justify-self-start')} aria-label={t('stage.backToChapter', { chapter: chapterTitle })}>
        <ChevronLeft size={side ? 18 : 24} strokeWidth={ICON.stroke} aria-hidden="true" />
        {side && <span className="max-w-[220px] truncate">{chapterTitle}</span>}
      </Link>
      <div className="flex min-w-0 flex-col items-center gap-1.5">
        <h1 className="sr-only">{lesson.title}</h1>
        <p className="m-0 truncate text-[13px] font-semibold text-[color:var(--on-sky-text-body)]">{where}</p>
        {chapter && chapter.total > 0 && <LessonDots chapter={chapter} lessonId={lesson.id} width={side ? 220 : 150} />}
      </div>
      <div className="justify-self-end">
        {run.quiz ? <Hearts left={run.quiz.hearts} /> : !side && !run.finished && run.challenge && !run.feedback && <HintButton run={run} />}
      </div>
    </div>
  )
}

function LessonDots({ chapter, lessonId, width }: { chapter: Chapter; lessonId: string; width: number }) {
  return (
    <div aria-hidden="true" data-lesson-dots className="flex items-center" style={{ width }}>
      {chapter.lessons.map((item, index) => {
        const here = item.id === lessonId
        const done = item.status === 'completed'
        return (
          <span key={item.id} className="contents">
            {index > 0 && <span className={cn('h-0.5 flex-1', done || here ? 'bg-lit' : 'bg-white/20')} />}
            <span
              data-dot={here ? 'here' : done ? 'done' : 'open'}
              className={cn(
                'shrink-0 rounded-full',
                here ? 'size-4 border-[3px] border-lit bg-[var(--node-fill)]' : done ? 'size-3 bg-lit' : 'size-2.5 border border-white/20 bg-white/20',
              )}
            />
          </span>
        )
      })}
    </div>
  )
}

function HintButton({ run }: { run: LessonRun }) {
  const { t } = useTranslation('chapter')
  return (
    <Button variant="onSkyPlain" onClick={run.askHint} disabled={run.hinting} aria-busy={run.hinting || undefined}>
      <Lightbulb size={18} strokeWidth={ICON.stroke} aria-hidden="true" />
      {t('stage.hint')}
    </Button>
  )
}

/** The quiz's hearts: one for each mistake it forgives, and the last one. */
function Hearts({ left }: { left: number }) {
  const { t } = useTranslation('chapter')
  // A heart lost gives a small beat (chapter.css); held still under reduced motion.
  const reducedMotion = usePrefersReducedMotion()
  return (
    <p
      role="img"
      data-quiz-hearts={left}
      data-motion={reducedMotion ? 'none' : 'beat'}
      aria-label={t('quiz.hearts', { count: left, total: QUIZ_HEARTS })}
      className="m-0 flex items-center gap-1 px-2 text-lit"
    >
      {Array.from({ length: QUIZ_HEARTS }, (_, index) => (
        <Heart
          key={index}
          aria-hidden="true"
          data-heart={index < left ? 'full' : 'lost'}
          size={20}
          strokeWidth={ICON.stroke}
          fill={index < left ? 'currentColor' : 'none'}
          className={index < left ? undefined : 'text-[color:var(--on-sky-text-caption)]'}
        />
      ))}
    </p>
  )
}

/** "You are here": the star and its ring, filling as the chapter's lessons pass. */
function YouAreHere({ chapter }: { chapter: Chapter }) {
  const { t } = useTranslation('chapter')
  return (
    <aside
      aria-label={t('stage.youAreHere')}
      className="absolute top-5 left-6 flex h-[190px] w-[300px] flex-col justify-between overflow-hidden rounded-[16px] border p-3 text-on-sky"
      style={{ ...glass, boxShadow: 'var(--shadow-glass)' }}
    >
      <p aria-hidden="true" className="m-0 text-[11px] font-semibold uppercase tracking-[0.4px] text-[color:var(--on-sky-text-caption)]">
        {t('stage.youAreHere')}
      </p>
      <div className="flex flex-1 items-center justify-center">
        <StarGlyph state={chapter.done > 0 ? 'in_progress' : 'ready'} size={72} progress={chapter.total ? chapter.done / chapter.total : 0} />
      </div>
      <div className="flex flex-col">
        <p className="m-0 truncate text-[15px] font-semibold">{chapter.title}</p>
        <p className={cn('m-0 text-[13px]', bodyOnSky)}>{t('chapter.lessons', { done: chapter.done, total: chapter.total })}</p>
      </div>
    </aside>
  )
}

function Exercise({
  run,
  challenge,
  chapter,
  side,
  arrived,
}: {
  run: LessonRun
  challenge: PracticeChallenge
  chapter: Chapter | null
  side: boolean
  arrived: MutableRefObject<boolean>
}) {
  const { t } = useTranslation('chapter')
  const prompt = useRef<HTMLHeadingElement>(null)
  const mode = run.quiz ? 'quiz' : 'lesson'

  // A new exercise, the quiz begun, or back from it: the keyboard and the
  // screen reader start on its question. Not on arrival.
  useEffect(() => {
    if (arrived.current) {
      arrived.current = false
      return
    }
    prompt.current?.focus()
  }, [arrived, challenge.challengeId, mode])

  const long = challenge.prompt.length > 48
  // In a quiz an answer is checked once: right or wrong, it holds still.
  const locked = Boolean(run.feedback?.correct) || run.checking || Boolean(run.quiz && run.feedback)

  return (
    <>
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(60% 60% at 55% 45%, rgba(214, 160, 70, 0.14) 0%, rgba(10, 16, 32, 0) 70%)' }}
        />
        {side && chapter && <YouAreHere chapter={chapter} />}
        <div
          className="relative flex min-h-full items-center justify-center"
          style={{ padding: side ? '40px 48px 40px 360px' : '22px 16px 16px' }}
        >
          <div key={challenge.challengeId} data-stage-exercise className="flex w-full max-w-[620px] flex-col" style={{ gap: side ? 26 : 20 }}>
            <div data-quote-source="exercise" className="flex flex-col gap-2">
              {challenge.topic && <p className={cn('m-0 text-[17px]', bodyOnSky)}>{challenge.topic}</p>}
              <h2
                ref={prompt}
                tabIndex={-1}
                data-stage-prompt
                className="m-0 text-on-sky outline-none"
                style={
                  long
                    ? { font: 'var(--t-title2)', letterSpacing: 'var(--t-title2-tracking)' }
                    : { font: 'var(--t-question)', letterSpacing: 'var(--t-question-tracking)', fontSize: side ? 44 : 36 }
                }
              >
                <MathRenderer>{challenge.prompt}</MathRenderer>
              </h2>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                if (!run.feedback) run.check()
              }}
            >
              {/* Enter in a text answer checks it (a form with one field submits on Enter). */}
              <AnswerInput challenge={challenge} run={run} disabled={locked} />
            </form>

            {run.hint && (
              <Nudge>
                {run.hint.title && <strong className="block">{run.hint.title}</strong>}
                {run.hint.hint}
                {run.hint.nextStep && <span className={cn('mt-1 block', bodyOnSky)}>{run.hint.nextStep}</span>}
              </Nudge>
            )}
            {run.hintFailed && !run.hint && (
              <p role="alert" className={cn('m-0 text-[13px]', bodyOnSky)}>
                {t('stage.hintFailed')}
              </p>
            )}

            <Feedback run={run} />

            {side && <ActionRow run={run} side />}
          </div>
        </div>
      </div>
      {!side && (
        <div className="shrink-0 px-4 pt-2.5">
          <ActionRow run={run} side={false} />
        </div>
      )}
    </>
  )
}

function Nudge({ children }: { children: ReactNode }) {
  return (
    <div data-stage-nudge className="flex items-start gap-2 px-0.5">
      <span aria-hidden="true" className="inline-flex size-[26px] shrink-0 items-center justify-center rounded-[9px] bg-lit/20 text-lit">
        <Sparkles size={ICON.chip} strokeWidth={ICON.stroke} />
      </span>
      <div
        className="flex-1 rounded-[14px] rounded-tl-[6px] border border-white/10 bg-white/[0.08] px-3 py-[9px] text-[14px] leading-[1.4] text-on-sky"
        data-quote-source="exercise"
      >
        {children}
      </div>
    </div>
  )
}

function Feedback({ run }: { run: LessonRun }) {
  const { t } = useTranslation('chapter')
  const feedback = run.feedback
  return (
    <div role="status" aria-live="polite" data-stage-feedback={feedback ? (feedback.correct ? 'correct' : 'wrong') : undefined}>
      {feedback && (
        <div data-quote-source="exercise" className="flex flex-col gap-1 rounded-[16px] border px-[18px] py-4 text-on-sky" style={glass}>
          <p className="m-0 flex items-center gap-2 text-[17px] font-semibold">
            {feedback.correct && <Check size={18} strokeWidth={2} aria-hidden="true" className="text-lit" />}
            {feedback.correct ? t('stage.correct') : t('stage.notQuite')}
          </p>
          {feedback.feedback && <p className={cn('m-0 text-[15px]', bodyOnSky)}>{feedback.feedback}</p>}
          {feedback.correct && feedback.explanation && <p className="m-0 text-[15px]">{feedback.explanation}</p>}
          {run.quiz && !feedback.correct && (
            <p data-quiz-hearts-left className={cn('m-0 text-[15px]', bodyOnSky)}>
              {run.quiz.hearts > 0 ? t('quiz.heartLost', { count: run.quiz.hearts }) : t('quiz.noHeartsLeft')}
            </p>
          )}
        </div>
      )}
      {run.checkFailed && !feedback && (
        <p role="alert" className={cn('m-0 text-[13px]', bodyOnSky)}>
          {t('stage.checkFailed')}
        </p>
      )}
      {run.finishFailed && (
        <p role="alert" className={cn('m-0 text-[13px]', bodyOnSky)}>
          {t('stage.finishFailed')}
        </p>
      )}
    </div>
  )
}

/**
 * One lit button, a plain one beside it, Hint at the far right (the phone
 * keeps Hint in the strip). The plain one is Skip -- no credit, the exercise
 * goes to the back -- or, once only skipped exercises are left, the short
 * quiz. A quiz has neither, nor Hint.
 */
function ActionRow({ run, side }: { run: LessonRun; side: boolean }) {
  const { t } = useTranslation('chapter')
  const feedback = run.feedback
  const quiz = run.quiz
  const finishLabel = quiz ? t('quiz.finish') : t('stage.finish')
  const primary = !feedback
    ? { label: run.checking ? t('stage.checking') : t('stage.check'), onClick: run.check, disabled: !run.answered || run.checking }
    : feedback.correct
      ? { label: run.finishing ? t('stage.finishing') : run.last ? finishLabel : t('stage.next'), onClick: run.advance, disabled: run.finishing }
      : quiz
        ? { label: t('quiz.continue'), onClick: run.advance, disabled: false }
        : { label: t('stage.tryAgain'), onClick: run.retry, disabled: false }
  const secondary = quiz || feedback?.correct
    ? null
    : run.quizOffered
      ? { label: t('quiz.offer.action'), onClick: run.startQuiz, disabled: run.checking, offer: true }
      : { label: t('stage.skip'), onClick: run.skip, disabled: run.checking, offer: false }

  const row = (
    <div
      data-stage-actions
      className={cn('flex', side ? 'items-center gap-5' : 'flex-col items-center gap-1')}
    >
      <Button
        variant="onSky"
        size="large"
        fullWidth={!side}
        onClick={primary.onClick}
        disabled={primary.disabled}
        style={side ? { minWidth: 200 } : undefined}
      >
        {primary.label}
      </Button>
      {secondary && (
        <Button
          variant="onSkyPlain"
          onClick={secondary.onClick}
          disabled={secondary.disabled}
          aria-describedby={secondary.offer ? 'stage-quiz-offer' : undefined}
          data-quiz-start={secondary.offer || undefined}
        >
          {secondary.label}
        </Button>
      )}
      {side && !feedback && !quiz && (
        <>
          <span className="flex-1" />
          <HintButton run={run} />
        </>
      )}
    </div>
  )
  if (!secondary?.offer) return row
  return (
    <div className={cn('flex flex-col gap-2', !side && 'items-center')}>
      <p id="stage-quiz-offer" data-quiz-offer className={cn('m-0 text-[15px]', bodyOnSky, !side && 'text-center')}>
        {t('quiz.offer.body')}
      </p>
      {row}
    </div>
  )
}

function AnswerInput({ challenge, run, disabled }: { challenge: PracticeChallenge; run: LessonRun; disabled: boolean }) {
  const { t } = useTranslation('chapter')
  const options = challenge.options ?? []

  if (challenge.type === 'multiple_choice' && options.length > 0) {
    const selected = Array.isArray(run.answer) ? '' : run.answer
    return (
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="sr-only">{t('stage.chooseAnswer')}</legend>
        <div className="flex flex-col gap-2">
          {options.map((option, index) => {
            const chosen = selected === option
            return (
              <label
                key={option}
                data-answer-option={chosen ? 'chosen' : undefined}
                className={cn(
                  'relative flex cursor-pointer items-center gap-3.5 rounded-[14px] border px-[18px] py-3.5 backdrop-blur-[16px] has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring',
                  chosen ? 'border-lit bg-lit/16' : 'border-white/10 bg-white/[0.06]',
                  disabled && 'cursor-default',
                )}
              >
                <input
                  type="radio"
                  name={`answer-${challenge.challengeId}`}
                  value={option}
                  checked={chosen}
                  disabled={disabled}
                  onChange={() => run.setAnswer(option)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-flex size-[30px] shrink-0 items-center justify-center rounded-full text-[13px] font-semibold',
                    chosen ? 'bg-lit text-[color:var(--on-sky-button-text)]' : 'bg-white/10 text-[color:var(--on-sky-text-body)]',
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1 text-[17px] font-medium text-on-sky">
                  <MathRenderer>{option}</MathRenderer>
                </span>
                {chosen && <Check size={20} strokeWidth={2} aria-hidden="true" className="text-lit" />}
              </label>
            )
          })}
        </div>
      </fieldset>
    )
  }

  if (challenge.type === 'ordering' && options.length > 0) {
    const chosen = Array.isArray(run.answer) ? run.answer : []
    const toggle = (option: string) =>
      run.setAnswer(chosen.includes(option) ? chosen.filter((item) => item !== option) : [...chosen, option])
    return (
      <div className="flex flex-col gap-3">
        <p className={cn('m-0 text-[13px] font-semibold', bodyOnSky)}>{t('stage.order.available')}</p>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={chosen.includes(option)}
              disabled={disabled}
              onClick={() => toggle(option)}
              className={cn(
                'min-h-11 rounded-[12px] border px-4 text-[15px] font-medium text-on-sky focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40',
                chosen.includes(option) ? 'border-lit bg-lit/16' : 'border-white/10 bg-white/[0.06]',
              )}
            >
              <MathRenderer>{option}</MathRenderer>
            </button>
          ))}
        </div>
        <p className={cn('m-0 text-[13px] font-semibold', bodyOnSky)}>{t('stage.order.chosen')}</p>
        {chosen.length === 0 ? (
          <p className={cn('m-0 text-[15px]', bodyOnSky)}>{t('stage.order.empty')}</p>
        ) : (
          <ol className="m-0 flex flex-col gap-1 pl-5 text-[15px] text-on-sky">
            {chosen.map((option) => (
              <li key={option}>
                <MathRenderer>{option}</MathRenderer>
              </li>
            ))}
          </ol>
        )}
      </div>
    )
  }

  const value = Array.isArray(run.answer) ? run.answer.join(', ') : run.answer
  const field =
    'w-full rounded-[12px] border border-[color:var(--on-sky-field-rule)] bg-white/[0.06] px-4 text-[17px] text-on-sky placeholder:text-[color:var(--on-sky-text-caption)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40'
  return (
    <label className="flex flex-col gap-2">
      <span className={cn('text-[13px] font-semibold', bodyOnSky)}>{t('stage.yourAnswer')}</span>
      {challenge.type === 'explanation' ? (
        <textarea
          rows={4}
          value={value}
          disabled={disabled}
          placeholder={t('stage.explainPlaceholder')}
          onChange={(event) => run.setAnswer(event.target.value)}
          className={cn(field, 'py-3 leading-[1.45]')}
        />
      ) : (
        <input
          type="text"
          value={value}
          disabled={disabled}
          autoComplete="off"
          placeholder={t('stage.answerPlaceholder')}
          onChange={(event) => run.setAnswer(event.target.value)}
          className={cn(field, 'h-12')}
        />
      )}
    </label>
  )
}

/**
 * The quiz is lost: calm, and the way on. After the skip quiz, back to the
 * lesson with the skipped exercises still there (the quiz is offered again);
 * after testing out, back to the chapter, nothing changed, or the quiz again.
 */
function QuizFailed({ run, unitId }: { run: LessonRun; unitId: string }) {
  const { t } = useTranslation('chapter')
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])

  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-6">
      <section aria-labelledby="stage-quiz-failed-title" data-quiz-failed={run.failed} className="flex max-w-[520px] flex-col items-center gap-4 text-center">
        <h2
          ref={heading}
          id="stage-quiz-failed-title"
          tabIndex={-1}
          className="m-0 text-on-sky outline-none"
          style={{ font: 'var(--t-title1)', letterSpacing: 'var(--t-title1-tracking)' }}
        >
          {t('quiz.failed.title')}
        </h2>
        <p className={cn('m-0 text-[17px]', bodyOnSky)}>{t('quiz.failed.body')}</p>
        <div className="flex flex-col items-center gap-2 pt-2 sm:flex-row sm:gap-5">
          {run.failed === 'skip' ? (
            <Button variant="onSky" size="large" onClick={run.backToLesson} style={{ minWidth: 200 }}>
              {t('quiz.failed.backToLesson')}
            </Button>
          ) : (
            <>
              <Button asChild variant="onSky" size="large" style={{ minWidth: 200 }}>
                <Link to={chapterPath(unitId)}>{t('stage.done.backToChapter')}</Link>
              </Button>
              <Button variant="onSkyPlain" onClick={run.retryTestOut}>
                {t('quiz.failed.retry')}
              </Button>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

/**
 * The lesson is done: how far the chapter is now, and where to go on. Done by
 * testing out, it also says that the star is not lit by that alone (#81).
 */
function LessonDone({
  lesson,
  unitId,
  chapter,
  testedOut,
}: {
  lesson: PracticeLesson
  unitId: string
  chapter: Chapter | null
  testedOut: boolean
}) {
  const { t } = useTranslation('chapter')
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  const next = chapter ? lessonAfter(chapter, lesson.id) : null
  const chapterTitle = chapter?.title ?? lesson.topic
  const allDone = chapter ? chapter.total > 0 && chapter.done >= chapter.total : false

  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-6">
      <section aria-labelledby="stage-done-title" data-stage-done className="flex max-w-[520px] flex-col items-center gap-4 text-center">
        {chapter && (
          <StarGlyph state="in_progress" size={96} progress={chapter.total ? chapter.done / chapter.total : 0} />
        )}
        <h2
          ref={heading}
          id="stage-done-title"
          tabIndex={-1}
          className="m-0 text-on-sky outline-none"
          style={{ font: 'var(--t-title1)', letterSpacing: 'var(--t-title1-tracking)' }}
        >
          {t('stage.done.title')}
        </h2>
        {chapter && (
          <p data-stage-done-progress className={cn('m-0 text-[17px]', bodyOnSky)}>
            {allDone
              ? t('stage.done.allDone', { chapter: chapterTitle })
              : t('stage.done.progress', { done: chapter.done, total: chapter.total, chapter: chapterTitle })}
          </p>
        )}
        {testedOut && (
          <p className={cn('m-0 text-[15px]', bodyOnSky)}>
            {t('stage.done.testedOut')}
          </p>
        )}
        <div className="flex flex-col items-center gap-2 pt-2 sm:flex-row sm:gap-5">
          <Button asChild variant="onSky" size="large" style={{ minWidth: 200 }}>
            {next ? (
              <Link to={chapterPath(unitId, next.id)}>{t('stage.done.next', { title: next.title })}</Link>
            ) : (
              <Link to={chapterPath(unitId)}>{t('stage.done.backToChapter')}</Link>
            )}
          </Button>
          {next && (
            <Link to={chapterPath(unitId)} className={plainOnSky}>
              {t('stage.done.backToChapter')}
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
