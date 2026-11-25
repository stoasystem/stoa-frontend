/*
 * The star cluster prototype in the design preview (`surface=clusters`,
 * `surface=clusters-route`): the real mathematics knowledge base as four
 * clusters, each opening a left-to-right learning route. Dev only; the
 * production `/map` route is untouched.
 *
 *   /clusters/:subjectId              the overview
 *   /clusters/:subjectId/:clusterId   one cluster's route (`?star=<unitId>` opens on that star)
 *
 * "Start practising" opens the real chapter route; the demo backend has no
 * chapter for these knowledge-base stars, so the chapter shows its error state.
 */
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { demoClusterMap } from '@/dev/demo/clusters/demoClusterMap'
import { ClusterOverview } from '@/features/starmap/route/ClusterOverview'
import { ClusterRouteView } from '@/features/starmap/route/ClusterRouteView'
import { clustersOf } from '@/features/starmap/route/clusters'
import { isSupportedLanguage } from '@/i18n/languages'

export function ClusterPrototype() {
  const { subjectId = 'math', clusterId } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const reading = i18n.resolvedLanguage ?? i18n.language
  const language = isSupportedLanguage(reading) ? reading : 'en'
  const map = useMemo(() => demoClusterMap(language), [language])
  const clusters = useMemo(() => clustersOf(map, language), [map, language])
  const base = `/clusters/${encodeURIComponent(subjectId)}`

  if (!clusterId) {
    return <ClusterOverview subjectName={map.subject.name} clusters={clusters} onOpen={(id) => navigate(`${base}/${encodeURIComponent(id)}`)} />
  }
  const cluster = clusters.find((c) => c.clusterId === clusterId)
  if (!cluster) return <Navigate to={base} replace />
  const star = search.get('star')
  const focusUnitId = star && cluster.stars.some((s) => s.unitId === star) ? star : null
  return (
    <ClusterRouteView
      key={`${cluster.clusterId}:${focusUnitId ?? ''}`}
      map={map}
      clusters={clusters}
      cluster={cluster}
      focusUnitId={focusUnitId}
      onBack={() => navigate(base)}
      onGo={(id, unitId) => navigate(`${base}/${encodeURIComponent(id)}?star=${encodeURIComponent(unitId)}`)}
      onPractise={(unitId) => navigate(`/chapter/${encodeURIComponent(unitId)}`)}
    />
  )
}
