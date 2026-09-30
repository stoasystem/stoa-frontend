/*
 * `/chapter/:unitId`: a knowledge point's chapter, its lessons in order and
 * how far the student is (#13 point 1, #50 point 1).
 *
 * The chapter stays on the sky, like the stage it leads to ("practice stays
 * on the planet"): the star with its ring filling as lessons pass, one lit
 * button for the lesson to go on with, and the lessons as rows (Components,
 * "Grouped list": every navigation target is a row with a chevron; rows carry
 * their status, never a button). Opened from a star, the jump plays first.
 *
 * A lesson open to the student and not done yet also offers 「跳过这一课」
 * beside its row: the short quiz that tests out of it (`quiz.ts`). A locked
 * lesson offers none (#81).
 */
import { Check, ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/base'
import { ICON } from '@/components/base/sizes'
import { JumpTransition } from '@/features/chapter/JumpTransition'
import { canTestOut } from '@/features/chapter/quiz'
import { chapterPath, quizPath, useChapter, type Chapter, type ChapterLesson } from '@/features/chapter/useChapter'
import { StarGlyph } from '@/features/starmap/components/StarGlyph'
import { pathForTarget } from '@/features/starmap/view/layers'
import { AppLayout } from '@/layouts/AppLayout'
import { cn } from '@/lib/utils'

const plainOnSky =
  'inline-flex min-h-11 items-center gap-1 self-start text-[15px] font-semibold text-[color:var(--on-sky-plain)] no-underline hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

export function ChapterView({ unitId }: { unitId: string | undefined }) {
  const query = useChapter(unitId)

  return (
    <AppLayout surface="sky">
      <JumpTransition>
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
          {query.status === 'ready' ? <ChapterBody chapter={query.chapter} /> : <ChapterState query={query} />}
        </div>
      </JumpTransition>
    </AppLayout>
  )
}

function ChapterState({ query }: { query: Exclude<ReturnType<typeof useChapter>, { status: 'ready' }> }) {
  const { t } = useTranslation('chapter')
  return (
    <>
      <Link to="/" className={plainOnSky}>
        <ChevronLeft size={18} strokeWidth={ICON.stroke} aria-hidden="true" />
        {t('chapter.backToMap')}
      </Link>
      {query.status === 'loading' ? (
        <p role="status" className="m-0 text-[15px] text-[color:var(--on-sky-text-body)]">
          {t('chapter.loading')}
        </p>
      ) : query.status === 'error' ? (
        <div className="flex flex-col items-start gap-3">
          <p role="alert" className="m-0 text-[15px] text-[color:var(--on-sky-text-body)]">
            {t('chapter.failed')}
          </p>
          <Button variant="onSkyPlain" onClick={query.retry}>
            {t('chapter.retry')}
          </Button>
        </div>
      ) : (
        <p role="alert" className="m-0 text-[15px] text-[color:var(--on-sky-text-body)]">
          {t('chapter.missing')}
        </p>
      )}
    </>
  )
}

function ChapterBody({ chapter }: { chapter: Chapter }) {
  const { t } = useTranslation('chapter')
  const next = chapter.lessons.find((lesson) => lesson.id === chapter.nextLessonId)
  const allDone = chapter.total > 0 && chapter.done >= chapter.total
  const first = chapter.lessons[0]
  const primary = next
    ? { to: chapterPath(chapter.unitId, next.id), label: t(chapter.done > 0 ? 'chapter.continue' : 'chapter.start', { title: next.title }) }
    : allDone && first
      ? { to: chapterPath(chapter.unitId, first.id), label: t('chapter.again') }
      : null
  const percent = chapter.total > 0 ? Math.round((chapter.done / chapter.total) * 100) : 0
  const lessonsLabel = t('chapter.lessons', { done: chapter.done, total: chapter.total })

  return (
    <>
      <Link
        to={pathForTarget(chapter.subjectId, { layer: 'star', nebulaId: chapter.topicId, unitId: chapter.unitId })}
        className={plainOnSky}
      >
        <ChevronLeft size={18} strokeWidth={ICON.stroke} aria-hidden="true" />
        {t('chapter.backToMap')}
      </Link>

      <header className="flex items-center gap-4">
        <div className="shrink-0">
          <StarGlyph state={chapter.done > 0 ? 'in_progress' : 'ready'} size={72} progress={chapter.total ? chapter.done / chapter.total : 0} />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="m-0 text-on-sky" style={{ font: 'var(--t-title1)', letterSpacing: 'var(--t-title1-tracking)' }}>
            {chapter.title}
          </h1>
          <p className="m-0 text-[15px] text-[color:var(--on-sky-text-body)]">{lessonsLabel}</p>
        </div>
      </header>

      <div
        role="progressbar"
        aria-label={t('chapter.progress')}
        aria-valuetext={lessonsLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-1 overflow-hidden rounded-[4px] bg-white/15"
      >
        <div className="h-full rounded-[4px] bg-lit" style={{ width: `${percent}%` }} />
      </div>

      {primary && (
        <div>
          <Button asChild variant="onSky" size="large" style={{ minWidth: 200 }}>
            <Link to={primary.to}>{primary.label}</Link>
          </Button>
        </div>
      )}

      {chapter.lessons.length === 0 ? (
        <p className="m-0 text-[15px] text-[color:var(--on-sky-text-body)]">{t('chapter.empty')}</p>
      ) : (
        <section aria-labelledby="chapter-lessons-heading" className="flex flex-col gap-2">
          <h2
            id="chapter-lessons-heading"
            className="m-0 uppercase text-[color:var(--on-sky-text-caption)]"
            style={{ font: 'var(--t-section)', letterSpacing: 'var(--t-section-tracking)', padding: '0 16px' }}
          >
            {t('chapter.listLabel')}
          </h2>
          <ol
            data-chapter-lessons
            className="m-0 flex list-none flex-col overflow-hidden rounded-[12px] border p-0 [&>li+li]:border-t [&>li+li]:border-white/10"
            style={{
              background: 'var(--sky-glass)',
              borderColor: 'var(--sky-glass-border)',
              backdropFilter: 'blur(var(--sky-glass-blur))',
              WebkitBackdropFilter: 'blur(var(--sky-glass-blur))',
            }}
          >
            {chapter.lessons.map((lesson, index) => (
              <li key={lesson.id} data-lesson-status={lesson.status} className="flex flex-col sm:flex-row sm:items-stretch">
                <LessonRow unitId={chapter.unitId} lesson={lesson} number={index + 1} upNext={lesson.id === chapter.nextLessonId} />
                {canTestOut(lesson.status) && <TestOut unitId={chapter.unitId} lesson={lesson} />}
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  )
}

function LessonRow({ unitId, lesson, number, upNext }: { unitId: string; lesson: ChapterLesson; number: number; upNext: boolean }) {
  const { t } = useTranslation('chapter')
  const locked = lesson.status === 'locked'
  const done = lesson.status === 'completed'
  const status = upNext ? t('chapter.status.current') : t(`chapter.status.${lesson.status}`)
  const meta = t('chapter.lessonMeta', { minutes: lesson.estimatedMinutes ?? 10, count: lesson.exerciseCount })

  const body = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold',
          done ? 'bg-lit text-[color:var(--on-sky-button-text)]' : upNext ? 'border-2 border-lit text-on-sky' : 'bg-white/10 text-[color:var(--on-sky-text-body)]',
        )}
      >
        {done ? <Check size={ICON.chip} strokeWidth={2} /> : locked ? <Lock size={ICON.chip} strokeWidth={ICON.stroke} /> : number}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="truncate text-[15px] leading-[1.35] font-medium text-on-sky">
          <span className="sr-only">{t('chapter.lessonNumber', { number })}: </span>
          {lesson.title}
        </span>
        <span className="truncate text-[13px] leading-[1.35] text-[color:var(--on-sky-text-body)]">{meta}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2.5 text-[13px] text-[color:var(--on-sky-text-body)]">
        <span data-lesson-status-label>{status}</span>
        {!locked && <ChevronRight aria-hidden="true" size={ICON.rowLeading} strokeWidth={1.8} className="text-[color:var(--on-sky-text-caption)]" />}
      </span>
    </>
  )
  const classes = 'flex min-h-14 min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-inherit no-underline'

  if (locked) return <div className={classes}>{body}</div>
  return (
    <Link
      to={chapterPath(unitId, lesson.id)}
      className={cn(classes, 'transition-colors duration-[var(--motion-press)] ease-out hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring')}
      aria-current={upNext ? 'step' : undefined}
    >
      {body}
    </Link>
  )
}

/** 「跳过这一课」: the short quiz that tests out of an open lesson. A sibling of the row, not inside its link. */
function TestOut({ unitId, lesson }: { unitId: string; lesson: ChapterLesson }) {
  const { t } = useTranslation('chapter')
  return (
    <Link
      to={quizPath(unitId, lesson.id)}
      data-test-out
      aria-label={t('quiz.testOut.label', { title: lesson.title })}
      // A phone puts it under the row's title (a third line), wider screens at the row's end.
      className="-mt-2 flex min-h-11 shrink-0 items-center self-start pr-4 pl-[60px] text-[13px] font-semibold text-[color:var(--on-sky-plain)] no-underline hover:opacity-70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:mt-0 sm:self-auto sm:border-l sm:border-white/10 sm:px-3 sm:hover:bg-white/[0.06] sm:hover:opacity-100"
    >
      {t('quiz.testOut.action')}
    </Link>
  )
}
