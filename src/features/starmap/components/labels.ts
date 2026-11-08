/*
 * What assistive technology reads for a star (#11 point 5, kept by #72): its
 * name, its learning state and its progress, then the recommendation, that
 * it waits on prerequisites not lit yet (drawn quieter, `starLook`), and the
 * review marker when it has them.
 */
import type { TFunction } from 'i18next'
import { nebulaCounts, starLook, type Nebula, type Recommendation, type Star } from '@/features/starmap/model/starMap'

export function starLabel(t: TFunction<'starmap'>, star: Star): string {
  const parts = [
    star.name,
    t(`state.${star.state}`),
    t('star.progress', { percent: Math.round(Math.max(0, Math.min(1, star.progress)) * 100) }),
  ]
  if (star.recommendation) parts.push(t('marker.recommended'))
  if (starLook(star) === 'waiting') parts.push(t('legend.waiting'))
  if (star.reviewDue > 0) parts.push(t('marker.reviewDue', { count: star.reviewDue }))
  return parts.join(', ')
}

export function nebulaLabel(t: TFunction<'starmap'>, nebula: Nebula, stars: readonly Star[]): string {
  return t('nebula.link', { nebula: nebula.name, ...nebulaCounts(stars, nebula.topicId) })
}

/**
 * Why the system recommends a star, in one sentence (#485): the star card
 * says it under the marker, and the lesson's done page under the way to it.
 * Null for a teacher's recommendation, for a backend that does not say why
 * yet, and for `after_lit` when the star it follows is not in `stars`: a
 * sentence naming no star says nothing.
 */
export function recommendationReason(
  t: TFunction<'starmap'>,
  stars: readonly Pick<Star, 'unitId' | 'name'>[],
  recommendation: Recommendation | null | undefined,
): string | null {
  if (recommendation?.source !== 'system') return null
  switch (recommendation.reason) {
    case 'in_progress':
      return t('marker.reason.inProgress')
    case 'start':
      return t('marker.reason.start')
    case 'grade':
      return t('marker.reason.grade')
    case 'after_lit': {
      const related = recommendation.relatedUnitId ? stars.find((star) => star.unitId === recommendation.relatedUnitId) : undefined
      return related ? t('marker.reason.afterLit', { name: related.name }) : null
    }
    default:
      return null
  }
}
