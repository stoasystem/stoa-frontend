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
import { ChevronLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Murmi } from '@/components/brand/Murmi'
import { Button } from '@/components/base'
import { ICON } from '@/components/base/sizes'
import { ConstellationPath } from '@/features/chapter/ConstellationPath'
import { JumpTransition } from '@/features/chapter/JumpTransition'
import { chapterPath, useChapter, type Chapter } from '@/features/chapter/useChapter'
import { StarGlyph } from '@/features/starmap/components/StarGlyph'
import { pathForTarget } from '@/features/starmap/view/layers'
import { AppLayout } from '@/layouts/AppLayout'

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
  const remaining = Math.max(0, chapter.total - chapter.done)

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

      {/* Where the constellation ends, rather than how full a bar is. "Four
        * stars to go before this point lights" is the thing a student is
        * actually working towards; 33% is not. The bar's semantics stay — a
        * screen reader still hears a progressbar with its value. */}
      <div
        className="flex items-center gap-3 rounded-[var(--r-card)] border p-4"
        style={{ background: 'var(--sky-glass)', borderColor: 'var(--sky-glass-border)' }}
      >
        <Murmi mood={remaining > 0 ? 'watching' : 'delighted'} size={56} />
        <p
          role="progressbar"
          aria-label={t('chapter.progress')}
          aria-valuetext={lessonsLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="m-0 text-[15px] font-bold text-[color:var(--lit)]"
        >
          {remaining > 0 ? t('chapter.remaining', { count: remaining }) : t('chapter.lit')}
        </p>
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
        <ConstellationPath unitId={chapter.unitId} lessons={chapter.lessons} nextLessonId={chapter.nextLessonId} />
      )}
    </>
  )
}

