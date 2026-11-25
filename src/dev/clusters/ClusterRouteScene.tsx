/*
 * The star cluster prototype's learning route scene, in the design preview
 * with `sky=clusters` only (mock-up; not an app route). The star map shows
 * the four clusters (`layoutClusteredSky`); a cluster chosen on the whole
 * view opens its route here (`ClusterRedirect`), and "Back to the star map"
 * returns to the view it came from.
 *
 *   /map/:subjectId/cluster/:clusterId   (`?star=<unitId>` opens on that star)
 *
 * "Start practising" opens the real chapter route; the demo backend has no
 * chapter for these knowledge-base stars, so it shows its error state.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { demoClusterMap } from '@/dev/demo/clusters/demoClusterMap'
import { ClusterRouteView } from '@/features/starmap/route/ClusterRouteView'
import { clustersOf } from '@/features/starmap/route/clusters'
import { isSupportedLanguage } from '@/i18n/languages'

export function ClusterRouteScene() {
  const { subjectId = 'math', clusterId } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { i18n } = useTranslation()
  const reading = i18n.resolvedLanguage ?? i18n.language
  const language = isSupportedLanguage(reading) ? reading : 'en'
  const map = useMemo(() => demoClusterMap(language), [language])
  const clusters = useMemo(() => clustersOf(map, language), [map, language])
  const sky = `/map/${encodeURIComponent(subjectId)}`

  const cluster = clusters.find((c) => c.clusterId === clusterId)
  if (!cluster) return <Navigate to={sky} replace />
  const star = search.get('star')
  const focusUnitId = star && cluster.stars.some((s) => s.unitId === star) ? star : null
  return (
    <ClusterRouteView
      key={`${cluster.clusterId}:${focusUnitId ?? ''}`}
      map={map}
      clusters={clusters}
      cluster={cluster}
      focusUnitId={focusUnitId}
      // Back to the sky as it was left, when the sky is what came before.
      onBack={() => ((location.state as { fromSky?: boolean } | null)?.fromSky ? navigate(-1) : navigate(sky))}
      onGo={(id, unitId) =>
        navigate(`${sky}/cluster/${encodeURIComponent(id)}?star=${encodeURIComponent(unitId)}`, { state: location.state, replace: true })
      }
      onPractise={(unitId) => navigate(`/chapter/${encodeURIComponent(unitId)}`)}
    />
  )
}

/**
 * The mock-up's hook-up to the real star map, from outside it: when the map,
 * on its whole view when the choice was made (the stage's
 * `data-whole-view="true"` at that click or key), asks for
 * a cluster or a star in it, go to that cluster's route scene instead of
 * flying in. Zoomed in past the whole view, the map keeps its own behaviour.
 * A stand-in for a callback the map would offer (`onClusterOpen`).
 */
export function ClusterRedirect() {
  const location = useLocation()
  const navigate = useNavigate()
  const before = useRef(location.pathname)
  // Whether the map was on its whole view when the choice was made: the flight may be under way when the route changes.
  const bandAtChoice = useRef<string | null>(null)
  useEffect(() => {
    const note = () => {
      bandAtChoice.current = document.querySelector('[data-whole-view]')?.getAttribute('data-whole-view') ?? null
    }
    document.addEventListener('pointerdown', note, true)
    document.addEventListener('keydown', note, true)
    return () => {
      document.removeEventListener('pointerdown', note, true)
      document.removeEventListener('keydown', note, true)
    }
  }, [])
  useLayoutEffect(() => {
    const was = before.current
    before.current = location.pathname
    const parts = location.pathname.split('/').filter(Boolean).map(decodeURIComponent)
    const wasParts = was.split('/').filter(Boolean)
    if (parts[0] !== 'map' || parts[2] === 'cluster' || (parts.length !== 3 && parts.length !== 4)) return
    // Only a choice made on the whole view: from the bare sky, with the stage still there and on the panorama.
    if (wasParts.length !== 2 || wasParts[0] !== 'map') return
    if (bandAtChoice.current !== 'true') return
    // A cluster chosen, even through a star under the pointer: the scene opens on the star to go on with, no card.
    const [, subjectId, clusterId] = parts
    const to = `/map/${encodeURIComponent(subjectId)}/cluster/${encodeURIComponent(clusterId)}`
    // In place of the map's own step: the sky stays under it in the history, so "back" returns there.
    navigate(to, { replace: true, state: { fromSky: true } })
  }, [location.pathname, navigate])
  return null
}
