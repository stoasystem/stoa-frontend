/*
 * The star map for the current route (#47, #72): reads the subject, nebula
 * and star from the path, gets the map's data, and mounts the renderer. It
 * paints nothing around itself -- the page supplies the sky surface (today
 * `AppLayout surface="sky"`, and `AskHost` once Ask lands, #49) and the map
 * fills whatever box it is given, following that box's size.
 */
import { useCallback, useMemo, useRef } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import { DEFAULT_SUBJECT_ID, fixtureSizeFrom, useStarMap } from '@/features/starmap/useStarMap'
import { pathForTarget, resolveTarget, type LayerTarget } from '@/features/starmap/view/layers'
import { markLoginFirstScreenReady } from '@/lib/loginTiming'

export function StarMapRoute() {
  const params = useParams()
  const [search] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const subjectId = params.subjectId ?? DEFAULT_SUBJECT_ID
  const map = useStarMap(subjectId, fixtureSizeFrom(search))
  const { topicId, unitId } = params
  const target = useMemo(() => resolveTarget(map, topicId, unitId), [map, topicId, unitId])

  // Sign-in timing, handed over from ChatPage / LearnPage (#45): a student
  // lands on the map now, so its first drawn frame ends the wait. The mark is
  // a no-op unless a sign-in started the clock, and clears it once made.
  const landedAt = useRef(location.pathname)
  const onFirstFrame = useCallback(() => markLoginFirstScreenReady(landedAt.current), [])

  const onNavigate = useCallback(
    (next: LayerTarget) => navigate({ pathname: pathForTarget(map.subject.subjectId, next), search: location.search }),
    [navigate, map.subject.subjectId, location.search],
  )

  return <StarMapView map={map} target={target} onNavigate={onNavigate} onFirstFrame={onFirstFrame} />
}
