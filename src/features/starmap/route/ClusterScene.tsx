/*
 * One star cluster's learning route scene (#747, ADR 0007), at
 * `/map/:subjectId/cluster/:clusterId` (`?star=<unitId>` opens it on that
 * star, with its card).
 *
 * The star map stays mounted under the scene (`StarMapRoute`), inert and
 * where the student left it, so "Back to the star map" finds the view as it
 * was. Opened from the map (`ClusterSceneState.fromSky`), back is a step back
 * in the history; opened from a link, it goes to the subject's whole view.
 *
 * The scene fades in over the map and out again on the way back; under
 * reduced motion it simply appears and goes.
 *
 * "Start practising" opens the star's chapter (`chapterPath`), as the star
 * card's main action does.
 */
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { chapterPath } from '@/features/chapter/useChapter'
import type { StarMap } from '@/features/starmap/model/starMap'
import { usePrefersReducedMotion } from '@/features/starmap/motion/usePrefersReducedMotion'
import { ClusterRouteView } from '@/features/starmap/route/ClusterRouteView'
import { clustersOf } from '@/features/starmap/route/clusters'
import { clusterPath, pathForTarget } from '@/features/starmap/view/layers'
import { sceneLandingStar } from '@/features/starmap/onboarding/useFirstLanding'
import { isNewcomer } from '@/features/starmap/onboarding/firstLanding'
import { findOwnExamples } from '@/features/starmap/onboarding/findOwnStar'
import { useAskStore } from '@/store/askStore'
import { useAuthStore } from '@/store/authStore'
import { isSupportedLanguage } from '@/i18n/languages'

/** The navigation state the map hands the scene: the sky is the entry before it in the history. */
export type ClusterSceneState = { fromSky: true; firstLanding?: string }

/** How long the scene takes to fade out on the way back (ms); `clusterRoute.css` fades it in over as long. */
export const SCENE_FADE_MS = 180

export function isFromSky(state: unknown): boolean {
  return typeof state === 'object' && state !== null && (state as Partial<ClusterSceneState>).fromSky === true
}

export function ClusterScene({ map, clusterId }: { map: StarMap; clusterId: string }) {
  const { i18n, t } = useTranslation('starmap')
  const offerExamples = useAskStore((state) => state.offerExamples)
  const reading = i18n.resolvedLanguage ?? i18n.language
  const language = isSupportedLanguage(reading) ? reading : 'en'
  const [search] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const reducedMotion = usePrefersReducedMotion()
  const ownerId = useAuthStore((state) => state.user?.id) ?? 'demo'
  const [leaving, setLeaving] = useState(false)
  const left = useRef(false)
  const subjectId = map.subject.subjectId
  const sky = pathForTarget(subjectId, { layer: 'map' })
  const clusters = useMemo(() => clustersOf(map, language), [map, language])

  const cluster = clusters.find((candidate) => candidate.clusterId === clusterId)
  // A cluster this sky does not have (an old link, another subject's): the subject seen whole.
  if (!cluster) return <Navigate to={sky} replace />
  const star = search.get('star')
  const focusUnitId = star && cluster.stars.some((s) => s.unitId === star) ? star : null
  // A newcomer's first landing opened the scene on this star (#747): Murmi says start here.
  const landing = focusUnitId !== null && sceneLandingStar(location.state) === focusUnitId && isNewcomer(map)

  const back = () => {
    if (left.current) return
    left.current = true
    const go = () => (isFromSky(location.state) ? navigate(-1) : navigate(sky))
    if (reducedMotion) {
      go()
      return
    }
    setLeaving(true)
    window.setTimeout(go, SCENE_FADE_MS)
  }

  return (
    <div className="cluster-scene absolute inset-0 z-10" data-cluster-scene={cluster.clusterId} data-leaving={leaving ? '' : undefined}>
      <ClusterRouteView
        key={`${cluster.clusterId}:${focusUnitId ?? ''}`}
        map={map}
        clusters={clusters}
        cluster={cluster}
        focusUnitId={focusUnitId}
        ownerId={ownerId}
        landing={landing}
        onFindOwn={landing ? () => offerExamples(ownerId, findOwnExamples(t, subjectId)) : undefined}
        onBack={back}
        // Another cluster's star: its scene in place of this one, the sky still the step back.
        onGo={(id, unitId) => navigate(clusterPath(subjectId, id, unitId), { replace: true, state: location.state })}
        onPractise={(unitId) => navigate(chapterPath(unitId))}
      />
    </div>
  )
}
