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
 */
import { Check, ChevronLeft, Lightbulb, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/base'
import { ICON } from '@/components/base/sizes'
import { MathRenderer } from '@/components/ui/MathRenderer'
import type { AskPractice } from '@/features/ask/practiceContext'
import { QuoteSelection } from '@/features/chapter/QuoteSelection'
import { StageWithAsk, STAGE_SIDE_QUERY } from '@/features/chapter/StageAsk'
import { chapterPath, lessonAfter, useChapter, type Chapter } from '@/features/chapter/useChapter'
import { formatPracticeAnswer, useLessonRun, type LessonRun } from '@/features/chapter/useLessonRun'
import { StarGlyph } from '@/features/starmap/components/StarGlyph'
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
  // Keyed by lesson: moving on to the next lesson starts a fresh run.
  return (
    <AppLayout bleed>
      {lesson ? (
        <LessonRunStage key={lesson.id} lesson={lesson} unitId={unitId ?? lesson.unitId} chapter={chapter} />
      ) : (
        <div data-surface="sky" className="flex min-h-0 flex-1 flex-col items-start gap-3 bg-sky p-6 text-on-sky">
          <StageNotice unitId={unitId} loading={lessonQuery.isLoading} failed={lessonQuery.isError} retry={() => void lessonQuery.refetch()} />
        </div>
      )}
    </AppLayout>
  )
}

function StageNotice({ unitId, loading, failed, retry }: { unitId?: string; loading: boolean; failed: boolean; retry: () => void }) {
  const { t } = useTranslation('chapter')
  return (
    <>
      {unitId && (
        <Link to={chapterPath(unitId)} className={plainOnSky}>
          <ChevronLeft size={18} strokeWidth={ICON.stroke} aria-hidden="true" />
          {t('stage.backToLessons')}
        </Link>
      )}
      {loading ? (
        <p role="status" className={cn('m-0 text-[15px]', bodyOnSky)}>
          {t('stage.loading')}
        </p>
      ) : failed ? (
        <>
          <p role="alert" className={cn('m-0 text-[15px]', bodyOnSky)}>
            {t('stage.failed')}
          </p>
          <Button variant="onSkyPlain" onClick={retry}>
            {t('stage.retry')}
          </Button>
        </>
      ) : (
        <p role="alert" className={cn('m-0 text-[15px]', bodyOnSky)}>
          {t('stage.missing')}
        </p>
      )}
    </>
  )
}

function LessonRunStage({ lesson, unitId, chapter }: { lesson: PracticeLesson; unitId: string; chapter: Chapter | null }) {
  const { t } = useTranslation('chapter')
  const run = useLessonRun(lesson)
  const side = useMediaQuery(STAGE_SIDE_QUERY)
  const host = useRef<HTMLDivElement>(null)
  const told = useRef(new Map<string, string>())
  const { challenge } = run

  // TEXT FALLBACK (#56): what Ask is told about the exercise on screen. #56
  // sends `{ challengeId, lessonId, unitId }` instead of the words.
  const practice = useMemo<AskPractice | undefined>(
    () =>
      challenge && !run.finished
        ? {
            told: told.current,
            context: {
              unitId,
              lessonId: lesson.id,
              challengeId: challenge.id,
              topic: challenge.topic || lesson.topic,
              prompt: challenge.prompt,
              answer: formatPracticeAnswer(run.answer) || undefined,
              attempts: run.wrong,
              hintViewed: Boolean(run.hint),
            },
          }
        : undefined,
    [challenge, lesson.id, lesson.topic, run.answer, run.finished, run.hint, run.wrong, unitId],
  )

  const lessonNumber = chapter ? chapter.lessons.findIndex((item) => item.id === lesson.id) + 1 : 0

  return (
    <div ref={host} className="flex min-h-0 flex-1 flex-col">
      <StageWithAsk practice={practice} subjectId={lesson.subjectId}>
        <StageStrip lesson={lesson} unitId={unitId} chapter={chapter} lessonNumber={lessonNumber} run={run} side={side} />
        {run.finished ? (
          <LessonDone lesson={lesson} unitId={unitId} chapter={chapter} />
        ) : challenge ? (
          <Exercise run={run} challenge={challenge} chapter={chapter} side={side} />
        ) : (
          <div className="p-6">
            <p className={cn('m-0 text-[15px]', bodyOnSky)}>{t('stage.empty')}</p>
          </div>
        )}
      </StageWithAsk>
      <QuoteSelection scope={host} />
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
    run.count > 0 && !run.finished ? t('stage.questionOf', { question: run.index + 1, questions: run.count }) : null,
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
        {!side && !run.finished && run.challenge && !run.feedback && <HintButton run={run} />}
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

function Exercise({ run, challenge, chapter, side }: { run: LessonRun; challenge: PracticeChallenge; chapter: Chapter | null; side: boolean }) {
  const { t } = useTranslation('chapter')
  const prompt = useRef<HTMLHeadingElement>(null)
  const firstQuestion = useRef(true)

  // A new exercise: the keyboard and the screen reader start on its question.
  useEffect(() => {
    if (firstQuestion.current) {
      firstQuestion.current = false
      return
    }
    prompt.current?.focus()
  }, [challenge.id])

  const long = challenge.prompt.length > 48
  const locked = Boolean(run.feedback?.correct) || run.checking

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
          <div key={challenge.id} data-stage-exercise className="flex w-full max-w-[620px] flex-col" style={{ gap: side ? 26 : 20 }}>
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

/** One lit button, a plain one beside it, Hint at the far right (the phone keeps Hint in the strip). */
function ActionRow({ run, side }: { run: LessonRun; side: boolean }) {
  const { t } = useTranslation('chapter')
  const feedback = run.feedback
  const primary = !feedback
    ? { label: run.checking ? t('stage.checking') : t('stage.check'), onClick: run.check, disabled: !run.answered || run.checking }
    : feedback.correct
      ? { label: run.finishing ? t('stage.finishing') : run.last ? t('stage.finish') : t('stage.next'), onClick: run.advance, disabled: run.finishing }
      : { label: t('stage.tryAgain'), onClick: run.retry, disabled: false }
  const skip = !feedback?.correct
    ? { label: run.last ? t('stage.skipAndFinish') : t('stage.skip'), onClick: run.advance, disabled: run.finishing || run.checking }
    : null

  return (
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
      {skip && (
        <Button variant="onSkyPlain" onClick={skip.onClick} disabled={skip.disabled}>
          {skip.label}
        </Button>
      )}
      {side && !feedback && (
        <>
          <span className="flex-1" />
          <HintButton run={run} />
        </>
      )}
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
                  name={`answer-${challenge.id}`}
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

/** The lesson is done: how far the chapter is now, and where to go on. */
function LessonDone({ lesson, unitId, chapter }: { lesson: PracticeLesson; unitId: string; chapter: Chapter | null }) {
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
        <div className="flex flex-col items-center gap-2 pt-2 sm:flex-row sm:gap-5">
          {/* index.css's unlayered `a { color: inherit }` beats the variant's text class on a link. */}
          <Button asChild variant="onSky" size="large" style={{ color: 'var(--on-sky-button-text)', minWidth: 200 }}>
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
