/*
 * What assistive technology reads for a star (#11 point 5, kept by #72): its
 * name, its learning state and its progress, then the recommendation and the
 * review marker when it has them.
 */
import type { TFunction } from 'i18next'
import { nebulaCounts, type Nebula, type Star } from '@/features/starmap/model/starMap'

export function starLabel(t: TFunction<'starmap'>, star: Star): string {
  const parts = [
    star.name,
    t(`state.${star.state}`),
    t('star.progress', { percent: Math.round(Math.max(0, Math.min(1, star.progress)) * 100) }),
  ]
  if (star.recommendation) parts.push(t('marker.recommended'))
  if (star.reviewDue > 0) parts.push(t('marker.reviewDue', { count: star.reviewDue }))
  return parts.join(', ')
}

export function nebulaLabel(t: TFunction<'starmap'>, nebula: Nebula, stars: readonly Star[]): string {
  return t('nebula.link', { nebula: nebula.name, ...nebulaCounts(stars, nebula.topicId) })
}
