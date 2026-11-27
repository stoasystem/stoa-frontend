/*
 * The star clusters' panorama hint (#747): the first time a student sees
 * the sky gathered into clusters, Murmi stands beside the cluster that holds
 * their recommended star and says what a cluster is and that a tap opens
 * its learning route. A student who has learnt or started anything already
 * knew the old map, and is told it has a new look.
 *
 * Shown once per account (`shownOnce.ts`): it goes on its ✕, its "Got it",
 * Escape, or the first cluster opened, and is remembered then. Only on the
 * whole view of a sky of clusters, and never over another first-run screen
 * or Murmi (the caller's `blocked`): the language, "About you", the subject
 * question, the first landing, a lighting moment and the first reveal come
 * first.
 */
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base'
import { MurmiBubble } from '@/features/starmap/components/MurmiBubble'
import type { FrameScheduler, StarOnScreen } from '@/features/starmap/engine/starMapEngine'
import { orderedNebulae, subjectOfNebula, type StarMap } from '@/features/starmap/model/starMap'
import { isNewcomer, recommendedIn } from '@/features/starmap/onboarding/firstLanding'
import { markShown, shownBefore } from '@/features/starmap/onboarding/shownOnce'

/** Whether the sky is laid out as star clusters (`layoutClusteredSky` gives every star its route chapter). */
export function isClusterSky(map: Pick<StarMap, 'stars'>): boolean {
  return map.stars.some((star) => star.routeChapterId !== undefined)
}

/** The cluster the hint stands by: the one holding the recommended star of the galaxy in focus, else its first. */
export function hintCluster(map: StarMap): string | null {
  const star = recommendedIn(map)
  if (star) return star.nebulaId
  return orderedNebulae(map).find((nebula) => subjectOfNebula(map, nebula.topicId) === map.subject.subjectId && map.stars.some((s) => s.nebulaId === nebula.topicId))?.topicId ?? null
}

export type ClusterHint = {
  /** The cluster Murmi stands beside, while the hint is up. */
  clusterId: string | null
  /** The galaxy's other clusters, which the bubble keeps clear of. */
  others: string[]
  /** The student knew the map before clusters: "a new look". */
  changed: boolean
  /** Waved away (✕, "Got it", Escape): gone, and remembered. */
  dismiss: () => void
  /** A cluster was opened: the hint has done its job, and is remembered. */
  opened: () => void
}

/** `hold`: the sky is not the server's yet (a cached one, #757): neither decided nor shown until it is. */
export function useClusterHint(map: StarMap, ownerId: string, { blocked, hold = false }: { blocked: boolean; hold?: boolean }): ClusterHint {
  const [done, setDone] = useState(() => shownBefore('clusterHint', ownerId))
  // Decided once, on the first sky read: lighting a star on the way does not turn "new" into "a new look".
  const [changed, setChanged] = useState<boolean | null>(() => (!hold && map.stars.length > 0 ? !isNewcomer(map) : null))
  if (changed === null && !hold && map.stars.length > 0) setChanged(!isNewcomer(map))
  const remember = useCallback(() => {
    markShown('clusterHint', ownerId)
    setDone(true)
  }, [ownerId])
  const up = !done && !blocked && !hold && isClusterSky(map)
  const clusterId = up ? hintCluster(map) : null
  const others = useMemo(
    () =>
      clusterId === null
        ? []
        : orderedNebulae(map)
            .filter((nebula) => nebula.topicId !== clusterId && subjectOfNebula(map, nebula.topicId) === map.subject.subjectId)
            .map((nebula) => nebula.topicId),
    [map, clusterId],
  )
  return { clusterId, others, changed: changed ?? false, dismiss: remember, opened: remember }
}

/** The share of a cluster's disc its stars fill: the disc keeps room round them, which the bubble need not. */
export const CLUSTER_STARS_SHARE = 0.72

export type ClusterHintBubbleProps = {
  clusterId: string
  /** The other clusters on screen: the bubble keeps clear of them. */
  others?: readonly string[]
  changed: boolean
  /** Where a star or a cluster is drawn now, from the map's engine. */
  locate: (id: string) => StarOnScreen | null
  watch?: (listener: () => void) => () => void
  onDismiss: () => void
  /** For tests: the frame clock. */
  scheduler?: FrameScheduler
}

export function ClusterHintBubble({ clusterId, others, changed, locate, watch, onDismiss, scheduler }: ClusterHintBubbleProps) {
  const { t } = useTranslation('starmap')
  // A cluster by the part its stars fill, so Murmi stands close to them and the others stay clear.
  const clusters = useMemo(() => new Set([clusterId, ...(others ?? [])]), [clusterId, others])
  const near = useCallback(
    (id: string) => {
      const spot = locate(id)
      return spot && clusters.has(id) ? { ...spot, size: spot.size * CLUSTER_STARS_SHARE } : spot
    },
    [locate, clusters],
  )
  return (
    <MurmiBubble
      unitId={clusterId}
      avoid={others}
      marker="data-cluster-hint"
      title={changed ? t('clusterGuide.hintTitleChanged') : t('clusterGuide.hintTitle')}
      body={changed ? t('clusterGuide.hintBodyChanged') : t('clusterGuide.hintBody')}
      closeLabel={t('clusterGuide.close')}
      locate={near}
      watch={watch}
      onDismiss={onDismiss}
      scheduler={scheduler}
      ways={({ leave }) => (
        <Button variant="onSky" size="small" onClick={leave}>
          {t('clusterGuide.gotIt')}
        </Button>
      )}
    />
  )
}
