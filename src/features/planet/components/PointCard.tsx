/*
 * The third layer: one knowledge point in HTML/SVG (#11 points 3 and 4) --
 * its skills, progress, recommendation and review marker, and the way into
 * its chapter. A glass card over the dimmed sphere (canvas board "Zoomed in"),
 * beside it on a wide screen and along the bottom on a phone.
 */
import { ChevronLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/base'
import { PointGlyph } from '@/features/planet/components/PointGlyph'
import { pathForTarget } from '@/features/planet/geo/zoom'
import type { KnowledgeMap, KnowledgePoint, KnowledgeRegion } from '@/features/planet/model/knowledgeMap'
import { cn } from '@/lib/utils'

export function PointCard({
  map,
  point,
  region,
  wide,
  reducedMotion,
}: {
  map: KnowledgeMap
  point: KnowledgePoint
  region: KnowledgeRegion
  wide: boolean
  reducedMotion: boolean
}) {
  const { t } = useTranslation('planet')
  const subjectId = map.subject.subjectId
  const { lessonCount, lessonsDone, nextLesson } = point.chapter
  const percent = Math.round(Math.max(0, Math.min(1, point.progress)) * 100)
  const prerequisites =
    point.state === 'locked'
      ? map.edges
          .filter((edge) => edge.to === point.unitId)
          .map((edge) => map.points.find((candidate) => candidate.unitId === edge.from))
          .filter((candidate): candidate is KnowledgePoint => Boolean(candidate) && candidate!.state !== 'lit')
      : []
  const action =
    point.state === 'locked'
      ? null
      : point.state === 'lit'
        ? t('point.open')
        : point.state === 'in_progress'
          ? t('point.continue')
          : t('point.start')
  const allLessonsDone = lessonCount > 0 && lessonsDone >= lessonCount

  return (
    <article
      aria-labelledby="planet-point-title"
      className={cn(
        'pointer-events-auto absolute flex flex-col gap-3 rounded-[16px] border p-[18px] text-on-sky',
        wide ? 'right-12 top-1/2 w-[340px] -translate-y-1/2' : 'inset-x-4 bottom-4',
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
        to={pathForTarget(subjectId, { layer: 'region', regionId: region.topicId })}
        className="inline-flex min-h-11 items-center gap-1 self-start text-[15px] font-semibold text-[color:var(--on-sky-plain)] hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ChevronLeft size={18} strokeWidth={1.6} aria-hidden="true" />
        {t('nav.backToRegion', { region: region.name })}
      </Link>

      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <PointGlyph
            state={point.state}
            size={wide ? 96 : 72}
            progress={point.progress}
            recommended={Boolean(point.recommendation)}
            reviewDue={point.reviewDue > 0}
            breathe={!reducedMotion}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 id="planet-point-title" className="m-0 text-[18px] font-semibold leading-tight tracking-[-0.3px] text-on-sky">
            {point.name}
          </h1>
          <p className="m-0 text-[13px] text-[color:var(--on-sky-text-body)]">
            {t('point.inRegion', { region: region.name, state: t(`state.${point.state}`) })}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div
          role="progressbar"
          aria-label={t('point.lessons', { done: lessonsDone, total: lessonCount })}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-1 overflow-hidden rounded-[4px] bg-white/15"
        >
          <div className="h-full rounded-[4px] bg-lit" style={{ width: `${percent}%` }} />
        </div>
        <p className="m-0 text-[13px] text-[color:var(--on-sky-text-body)]">
          {t('point.lessons', { done: lessonsDone, total: lessonCount })}
        </p>
      </div>

      {(point.recommendation || point.reviewDue > 0 || point.unmetExercises > 0) && (
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13px] text-on-sky">
          {point.recommendation && <li>{t('marker.recommended')}</li>}
          {point.state === 'in_progress' && point.unmetExercises > 0 && (
            <li>
              {allLessonsDone
                ? t('point.unmet', { count: point.unmetExercises })
                : t('point.unmetPartial', { count: point.unmetExercises })}
            </li>
          )}
          {point.reviewDue > 0 && <li>{t('marker.reviewDue', { count: point.reviewDue })}</li>}
        </ul>
      )}

      {nextLesson && point.state !== 'locked' && (
        <p className="m-0 text-[13px] text-[color:var(--on-sky-text-body)]">
          {t('point.nextLesson', { title: nextLesson.title })}
        </p>
      )}

      {point.skills.length > 0 && (
        <section aria-labelledby="planet-point-skills" className="flex flex-col gap-1.5">
          <h2 id="planet-point-skills" className="m-0 text-[13px] font-semibold text-[color:var(--on-sky-text-body)]">
            {t('point.skills')}
          </h2>
          <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1.5 p-0">
            {point.skills.map((skill) => (
              <li key={skill.skillId} className="inline-flex items-center gap-1.5 text-[13px] text-on-sky">
                <span
                  aria-hidden="true"
                  className={cn('inline-block size-2 rounded-full', skill.lit ? 'bg-lit' : 'border border-solid')}
                  style={skill.lit ? undefined : { borderColor: 'rgba(255, 255, 255, 0.55)' }}
                />
                <span className="sr-only">{t(skill.lit ? 'point.skillLit' : 'point.skillDark', { name: skill.name })}</span>
                <span aria-hidden="true">{skill.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {prerequisites.length > 0 && (
        <section aria-labelledby="planet-point-prerequisites" className="flex flex-col gap-1">
          <h2 id="planet-point-prerequisites" className="m-0 text-[13px] font-semibold text-[color:var(--on-sky-text-body)]">
            {t('point.prerequisites')}
          </h2>
          <ul className="m-0 flex list-none flex-col p-0">
            {prerequisites.map((before) => (
              <li key={before.unitId}>
                <Link
                  to={pathForTarget(subjectId, { layer: 'point', regionId: before.regionId, pointId: before.unitId })}
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
            <Link to={`/chapter/${encodeURIComponent(point.unitId)}`}>{action}</Link>
          </Button>
        </div>
      )}
    </article>
  )
}
