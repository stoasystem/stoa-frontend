/*
 * The third layer: one star in HTML/SVG (#11 points 3 and 4, #72 point 5) --
 * its skills, progress, recommendation and review marker, and the way into
 * its chapter. A glass card over the dimmed map (canvas board "Zoomed in"),
 * beside it on a wide screen and along the bottom on a phone.
 */
import { ChevronLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/base'
import { StarGlyph } from '@/features/starmap/components/StarGlyph'
import { pathForTarget } from '@/features/starmap/view/layers'
import type { Nebula, Star, StarMap } from '@/features/starmap/model/starMap'
import { cn } from '@/lib/utils'

export function StarCard({
  map,
  star,
  nebula,
  wide,
  reducedMotion,
}: {
  map: StarMap
  star: Star
  nebula: Nebula
  wide: boolean
  reducedMotion: boolean
}) {
  const { t } = useTranslation('starmap')
  const subjectId = map.subject.subjectId
  const { lessonCount, lessonsDone, nextLesson } = star.chapter
  const percent = Math.round(Math.max(0, Math.min(1, star.progress)) * 100)
  const prerequisites =
    star.state === 'locked'
      ? map.prerequisites
          .filter((edge) => edge.to === star.unitId)
          .map((edge) => map.stars.find((candidate) => candidate.unitId === edge.from))
          .filter((candidate): candidate is Star => Boolean(candidate) && candidate!.state !== 'lit')
      : []
  const action =
    star.state === 'locked'
      ? null
      : star.state === 'lit'
        ? t('star.open')
        : star.state === 'in_progress'
          ? t('star.continue')
          : t('star.start')
  const allLessonsDone = lessonCount > 0 && lessonsDone >= lessonCount

  return (
    <article
      aria-labelledby="starmap-star-title"
      className={cn(
        'pointer-events-auto absolute flex flex-col gap-3 rounded-[16px] border p-[18px] text-on-sky',
        wide ? 'right-12 top-1/2 w-[340px] -translate-y-1/2' : 'inset-x-4 bottom-[calc(1rem+var(--page-bottom-inset,0px))]',
      )}
      style={{
        background: 'var(--sky-glass)',
        borderColor: 'var(--sky-glass-border)',
        backdropFilter: 'blur(var(--sky-glass-blur))',
        WebkitBackdropFilter: 'blur(var(--sky-glass-blur))',
        boxShadow: 'var(--shadow-glass)',
      }}
    >
      <Link
        to={pathForTarget(subjectId, { layer: 'nebula', nebulaId: nebula.topicId })}
        className="inline-flex min-h-11 items-center gap-1 self-start text-[15px] font-semibold text-[color:var(--on-sky-plain)] hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ChevronLeft size={18} strokeWidth={1.6} aria-hidden="true" />
        {t('nav.backToNebula', { nebula: nebula.name })}
      </Link>

      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <StarGlyph
            state={star.state}
            size={wide ? 96 : 72}
            progress={star.progress}
            recommended={Boolean(star.recommendation)}
            reviewDue={star.reviewDue > 0}
            breathe={!reducedMotion && Boolean(star.recommendation)}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 id="starmap-star-title" className="m-0 text-[18px] font-semibold leading-tight tracking-[-0.3px] text-on-sky">
            {star.name}
          </h1>
          <p className="m-0 text-[13px] text-[color:var(--on-sky-text-body)]">
            {t('star.inNebula', { nebula: nebula.name, state: t(`state.${star.state}`) })}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div
          role="progressbar"
          aria-label={t('star.lessons', { done: lessonsDone, total: lessonCount })}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-1 overflow-hidden rounded-[4px] bg-white/15"
        >
          <div className="h-full rounded-[4px] bg-lit" style={{ width: `${percent}%` }} />
        </div>
        <p className="m-0 text-[13px] text-[color:var(--on-sky-text-body)]">
          {t('star.lessons', { done: lessonsDone, total: lessonCount })}
        </p>
      </div>

      {(star.recommendation || star.reviewDue > 0 || star.unmetExercises > 0) && (
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13px] text-on-sky">
          {star.recommendation && <li>{t('marker.recommended')}</li>}
          {star.state === 'in_progress' && star.unmetExercises > 0 && (
            <li>
              {allLessonsDone
                ? t('star.unmet', { count: star.unmetExercises })
                : t('star.unmetPartial', { count: star.unmetExercises })}
            </li>
          )}
          {star.reviewDue > 0 && <li>{t('marker.reviewDue', { count: star.reviewDue })}</li>}
        </ul>
      )}

      {nextLesson && star.state !== 'locked' && (
        <p className="m-0 text-[13px] text-[color:var(--on-sky-text-body)]">
          {t('star.nextLesson', { title: nextLesson.title })}
        </p>
      )}

      {star.skills.length > 0 && (
        <section aria-labelledby="starmap-star-skills" className="flex flex-col gap-1.5">
          <h2 id="starmap-star-skills" className="m-0 text-[13px] font-semibold text-[color:var(--on-sky-text-body)]">
            {t('star.skills')}
          </h2>
          <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1.5 p-0">
            {star.skills.map((skill) => (
              <li key={skill.skillId} className="inline-flex items-center gap-1.5 text-[13px] text-on-sky">
                <span
                  aria-hidden="true"
                  className={cn('inline-block size-2 rounded-full', skill.lit ? 'bg-lit' : 'border border-solid')}
                  style={skill.lit ? undefined : { borderColor: 'rgba(255, 255, 255, 0.55)' }}
                />
                <span className="sr-only">{t(skill.lit ? 'star.skillLit' : 'star.skillDark', { name: skill.name })}</span>
                <span aria-hidden="true">{skill.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {prerequisites.length > 0 && (
        <section aria-labelledby="starmap-star-prerequisites" className="flex flex-col gap-1">
          <h2 id="starmap-star-prerequisites" className="m-0 text-[13px] font-semibold text-[color:var(--on-sky-text-body)]">
            {t('star.prerequisites')}
          </h2>
          <ul className="m-0 flex list-none flex-col p-0">
            {prerequisites.map((before) => (
              <li key={before.unitId}>
                <Link
                  to={pathForTarget(subjectId, { layer: 'star', nebulaId: before.nebulaId, unitId: before.unitId })}
                  className="inline-flex min-h-11 items-center text-[15px] font-semibold text-[color:var(--on-sky-plain)] hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {before.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {action && (
        <div className="pt-1">
          {/* index.css's unlayered `a { color: inherit }` beats the variant's text class on a link. */}
          <Button asChild variant="onSky" size="regular" style={{ color: 'var(--on-sky-button-text)' }}>
            <Link to={`/chapter/${encodeURIComponent(star.unitId)}`}>{action}</Link>
          </Button>
        </div>
      )}
    </article>
  )
}
