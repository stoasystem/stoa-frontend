/*
 * A chapter's lessons as a constellation (step 4 of the combined design).
 *
 * The list this replaces was correct and read as a list: a progress bar, a
 * button, and rows. What it never showed was being partway along something.
 * Here the lessons are stars and the line between them is lit as far as the
 * student has come, so the shape of the chapter — what is behind, what is
 * next, how much is left — is the first thing seen rather than a percentage.
 *
 * It is the same metaphor as the map one level up, not a second one borrowed
 * from somewhere else: finish the constellation and this knowledge point
 * becomes one lit star up there. That is why the walked line is the same gold
 * as a lit star, and why the end of the path is the point itself.
 *
 * Every state is told by shape as well as by colour — filled, ringed, outlined,
 * dimmed — so it survives being read by someone who cannot separate the hues.
 * Sizes and timings are tokens; nothing here is a measurement.
 */
import { Check, Lock, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ICON } from '@/components/base/sizes'
import { chapterPath, isOpenLesson, quizPath, type ChapterLesson } from '@/features/chapter/useChapter'
import { cn } from '@/lib/utils'

type NodeState = 'done' | 'doing' | 'ready' | 'review' | 'locked'

function nodeState(lesson: ChapterLesson, upNext: boolean): NodeState {
  if (lesson.status === 'completed') return 'done'
  if (lesson.status === 'locked') return 'locked'
  if (lesson.status === 'review') return 'review'
  return upNext || lesson.status === 'current' ? 'doing' : 'ready'
}

/** Filled gold, filled blue, outlined, gold-outlined, dimmed — in that order of reading. */
const DISC: Record<NodeState, string> = {
  done: 'bg-lit text-[color:var(--on-sky-button-text)] shadow-[0_var(--press-depth)_0_var(--lit-deep)]',
  doing:
    'bg-[color:var(--accent-on-sky)] text-[color:var(--on-accent-on-sky)] shadow-[0_var(--press-depth)_0_rgba(0,0,0,0.45)]',
  ready: 'border-solid border-white/75 text-on-sky',
  review: 'border-solid border-[color:var(--lit)] text-[color:var(--lit)]',
  locked: 'bg-white/[0.07] border-solid border-white/15 text-[color:var(--on-sky-text-muted)]',
}

/**
 * The outline width, as a value rather than a class.
 *
 * `border-[var(--token)]` compiles to a border *colour*, not a width: the two
 * outlined states shipped with no ring at all, and only the colour classes
 * made it look deliberate. A width the component sets itself cannot be read
 * as the other property.
 */
const RING: Partial<Record<NodeState, string>> = {
  ready: 'var(--constellation-ring)',
  review: 'var(--constellation-ring)',
  locked: 'var(--constellation-ring)',
}

function NodeFace({ state, number }: { state: NodeState; number: number }) {
  if (state === 'done') return <Check size={ICON.rowLeading} strokeWidth={2.5} aria-hidden="true" />
  if (state === 'locked') return <Lock size={ICON.chip} strokeWidth={ICON.stroke} aria-hidden="true" />
  if (state === 'review') return <Star size={ICON.chip} strokeWidth={2} aria-hidden="true" />
  return <>{number}</>
}

/**
 * One lesson.
 *
 * The line is drawn by the node above it reaching down, not between them, so a
 * row can be added or removed without the line needing to know.
 */
function Node({
  unitId,
  lesson,
  number,
  upNext,
  last,
}: {
  unitId: string
  lesson: ChapterLesson
  number: number
  upNext: boolean
  last: boolean
}) {
  const { t } = useTranslation('chapter')
  const state = nodeState(lesson, upNext)
  const locked = state === 'locked'
  const walked = state === 'done'
  const status = upNext ? t('chapter.status.current') : t(`chapter.status.${lesson.status}`)
  const meta = t('chapter.lessonMeta', { minutes: lesson.estimatedMinutes ?? 10, count: lesson.exerciseCount })

  const body = (
    <>
      <span
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: 'var(--constellation-gutter)', height: 'var(--constellation-node)' }}
      >
        {!last && (
          <span
            aria-hidden="true"
            className={cn('absolute top-1/2 h-[calc(100%+var(--constellation-gap)*2)]')}
            style={{
              width: 'var(--constellation-line)',
              background: walked ? 'var(--constellation-walked)' : 'var(--constellation-ahead)',
            }}
          />
        )}
        {state === 'doing' && (
          <span
            aria-hidden="true"
            data-constellation-pulse
            className="absolute rounded-full border-[var(--constellation-line)] border-[color:var(--accent-on-sky)] motion-safe:animate-[constellation-pulse_var(--constellation-pulse)_ease-out_infinite]"
            style={{ width: 'var(--constellation-node)', height: 'var(--constellation-node)' }}
          />
        )}
        <span
          aria-hidden="true"
          className={cn(
            'relative z-[1] inline-flex items-center justify-center rounded-full text-[17px] font-extrabold',
            DISC[state],
          )}
          data-node-state={state}
          style={{
            width: 'var(--constellation-node)',
            height: 'var(--constellation-node)',
            borderWidth: RING[state],
          }}
        >
          <NodeFace state={state} number={number} />
        </span>
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5 py-2 text-left">
        <span className="text-[16px] leading-[1.3] font-bold text-on-sky">
          <span className="sr-only">{t('chapter.lessonNumber', { number })}: </span>
          {lesson.title}
        </span>
        <span className="text-[13px] leading-[1.35] text-[color:var(--on-sky-text-body)]">{meta}</span>
        <span className="text-[13px] leading-[1.35] text-[color:var(--on-sky-text-caption)]" data-lesson-status-label>
          {status}
        </span>
      </span>
    </>
  )

  const row = 'flex min-w-0 items-center gap-3 text-inherit no-underline'
  if (locked) return <div className={row}>{body}</div>
  return (
    <Link
      to={chapterPath(unitId, lesson.id)}
      className={cn(
        row,
        'rounded-[var(--r-control)] transition-colors duration-[var(--motion-press)] ease-out',
        'hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
      )}
      aria-current={upNext ? 'step' : undefined}
    >
      {body}
    </Link>
  )
}

/** 「跳过这一课」: the short quiz that tests out of an open lesson (#81). */
function TestOut({ unitId, lesson }: { unitId: string; lesson: ChapterLesson }) {
  const { t } = useTranslation('chapter')
  return (
    <Link
      to={quizPath(unitId, lesson.id)}
      data-test-out
      aria-label={t('quiz.testOut.label', { title: lesson.title })}
      className="ml-[var(--constellation-gutter)] inline-flex min-h-11 items-center gap-1 text-[13px] font-bold text-[color:var(--on-sky-plain)] no-underline hover:opacity-70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      {t('quiz.testOut.action')}
    </Link>
  )
}

export function ConstellationPath({
  unitId,
  lessons,
  nextLessonId,
}: {
  unitId: string
  lessons: readonly ChapterLesson[]
  nextLessonId: string | null | undefined
}) {
  const { t } = useTranslation('chapter')
  return (
    <section aria-labelledby="chapter-lessons-heading">
      <h2
        id="chapter-lessons-heading"
        className="m-0 uppercase text-[color:var(--on-sky-text-caption)]"
        style={{ font: 'var(--t-section)', letterSpacing: 'var(--t-section-tracking)' }}
      >
        {t('chapter.listLabel')}
      </h2>
      <ol
        data-chapter-lessons
        data-constellation
        className="m-0 flex list-none flex-col p-0"
        style={{ gap: 'var(--constellation-gap)', marginTop: 'var(--constellation-gap)' }}
      >
        {lessons.map((lesson, index) => (
          <li key={lesson.id} data-lesson-status={lesson.status} className="flex flex-col">
            <Node
              unitId={unitId}
              lesson={lesson}
              number={index + 1}
              upNext={lesson.id === nextLessonId}
              last={index === lessons.length - 1}
            />
            {isOpenLesson(lesson.status) && <TestOut unitId={unitId} lesson={lesson} />}
          </li>
        ))}
      </ol>
    </section>
  )
}
