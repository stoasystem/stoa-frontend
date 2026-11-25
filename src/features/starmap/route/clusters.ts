/*
 * Star clusters (prototype, the design preview's `starmap-clusters`): a
 * subject drawn as a few large clusters instead of many nebulae. A cluster is
 * a group of topics, defined by the table below; a topic the table does not
 * name is a cluster of its own under its own id, so every subject works
 * without an entry. On the map each cluster is one nebula
 * (`clusteredSky.ts`).
 *
 * The names are the table's own, in four languages, until the backend names
 * clusters itself.
 */
import { layoutRoute, type RouteLayout } from '@/features/starmap/route/routeLayout'
import { orderedNebulae, subjectOfNebula, type Star, type StarMap } from '@/features/starmap/model/starMap'
import type { SupportedLanguage } from '@/i18n/languages'

export type ClusterDefinition = {
  clusterId: string
  topicIds: readonly string[]
  names: Record<SupportedLanguage, string>
  /** A hand-made main line for this cluster's route, overriding the computed one. */
  mainline?: readonly string[]
}

/** Mathematics in four clusters (decided with the product owner). */
export const CLUSTER_TABLE: readonly ClusterDefinition[] = [
  {
    clusterId: 'numbers',
    topicIds: ['zahlen', 'brueche', 'prozentrechnung'],
    names: { de: 'Zahlen und Rechnen', en: 'Numbers and operations', fr: 'Nombres et opérations', it: 'Numeri e operazioni' },
  },
  {
    clusterId: 'geometry',
    topicIds: ['geometrie', 'groessen'],
    names: { de: 'Geometrie', en: 'Geometry', fr: 'Géométrie', it: 'Geometria' },
  },
  {
    clusterId: 'algebra',
    topicIds: ['gleichungen'],
    names: { de: 'Gleichungen und Algebra', en: 'Equations and algebra', fr: 'Équations et algèbre', it: 'Equazioni e algebra' },
  },
  {
    clusterId: 'data',
    topicIds: ['daten'],
    names: { de: 'Daten und Wahrscheinlichkeit', en: 'Data and probability', fr: 'Données et probabilités', it: 'Dati e probabilità' },
  },
]

export type StarCluster = {
  clusterId: string
  name: string
  topicIds: string[]
  /** The cluster's stars, in route order (column, then lane). */
  stars: Star[]
  lit: number
  total: number
  /** Where to go on: the recommended star, else the one in progress, else the first ready one with nothing unlit before it. */
  next: Star | null
  route: RouteLayout
}

/** The cluster a topic belongs to: its table entry's, else the topic's own id. */
export function clusterIdOf(topicId: string, table: readonly ClusterDefinition[] = CLUSTER_TABLE): string {
  return table.find((d) => d.topicIds.includes(topicId))?.clusterId ?? topicId
}

/** The clusters of the subject in focus, in the order of their first nebula. */
export function clustersOf(
  map: Pick<StarMap, 'subject' | 'nebulae' | 'stars' | 'prerequisites'>,
  language: SupportedLanguage,
  table: readonly ClusterDefinition[] = CLUSTER_TABLE,
): StarCluster[] {
  const subjectId = map.subject.subjectId
  const nebulae = orderedNebulae(map).filter((n) => subjectOfNebula(map, n.topicId) === subjectId)
  const groups: { definition: ClusterDefinition | null; clusterId: string; name: string; topicIds: string[] }[] = []
  for (const nebula of nebulae) {
    const definition = table.find((d) => d.topicIds.includes(nebula.topicId)) ?? null
    const clusterId = clusterIdOf(nebula.topicId, table)
    const group = groups.find((g) => g.clusterId === clusterId)
    if (group) group.topicIds.push(nebula.topicId)
    else groups.push({ definition, clusterId, name: definition?.names[language] ?? nebula.name, topicIds: [nebula.topicId] })
  }

  const clusterOfTopic = new Map(groups.flatMap((g) => g.topicIds.map((t) => [t, g.clusterId] as const)))
  const clusterOf = new Map<string, string>()
  for (const star of map.stars) {
    const clusterId = clusterOfTopic.get(star.nebulaId)
    if (clusterId) clusterOf.set(star.unitId, clusterId)
  }

  return groups.map(({ definition, clusterId, name, topicIds }) => {
    const members = map.stars.filter((s) => clusterOf.get(s.unitId) === clusterId)
    const route = layoutRoute({ stars: members, prerequisites: map.prerequisites, clusterOf, mainline: definition?.mainline })
    const place = new Map(route.nodes.map((n, i) => [n.id, i]))
    const stars = [...members].sort((a, b) => place.get(a.unitId)! - place.get(b.unitId)!)
    return {
      clusterId,
      name,
      topicIds,
      stars,
      lit: stars.filter((s) => s.state === 'lit').length,
      total: stars.length,
      next: nextStar(stars),
      route,
    }
  })
}

/** The star to go on with, among stars in route order. */
export function nextStar(stars: readonly Star[]): Star | null {
  return (
    stars.find((s) => s.recommendation !== null && s.state !== 'lit')
    ?? stars.find((s) => s.state === 'in_progress')
    ?? stars.find((s) => s.state === 'ready' && s.unlitPrerequisiteIds.length === 0)
    ?? stars.find((s) => s.state !== 'lit')
    ?? null
  )
}

/** The cluster a star is in. */
export function clusterOfStar(clusters: readonly StarCluster[], unitId: string): StarCluster | undefined {
  return clusters.find((c) => c.stars.some((s) => s.unitId === unitId))
}
