/*
 * What assistive technology reads for a point (#11 point 5): its name, its
 * learning state and its progress, then the recommendation and the review
 * marker when it has them.
 */
import type { TFunction } from 'i18next'
import type { KnowledgePoint, KnowledgeRegion } from '@/features/planet/model/knowledgeMap'

export function pointLabel(t: TFunction<'planet'>, point: KnowledgePoint): string {
  const parts = [
    point.name,
    t(`state.${point.state}`),
    t('point.progress', { percent: Math.round(Math.max(0, Math.min(1, point.progress)) * 100) }),
  ]
  if (point.recommendation) parts.push(t('marker.recommended'))
  if (point.reviewDue > 0) parts.push(t('marker.reviewDue', { count: point.reviewDue }))
  return parts.join(', ')
}

export function regionCounts(points: readonly KnowledgePoint[], regionId: string): { lit: number; total: number } {
  let lit = 0
  let total = 0
  for (const point of points) {
    if (point.regionId !== regionId) continue
    total += 1
    if (point.state === 'lit') lit += 1
  }
  return { lit, total }
}

export function regionLabel(t: TFunction<'planet'>, region: KnowledgeRegion, points: readonly KnowledgePoint[]): string {
  return t('region.link', { region: region.name, ...regionCounts(points, region.topicId) })
}
