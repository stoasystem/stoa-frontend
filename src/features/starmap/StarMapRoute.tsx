/*
 * The star map for the current route (#47, #72): reads the subject, nebula
 * and star from the path, gets the map's data, and mounts the renderer. It
 * paints nothing around itself -- the page supplies the sky surface (today
 * `AppLayout surface="sky"`, and `AskHost` once Ask lands, #49) and the map
 * fills whatever box it is given, following that box's size.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import { DEFAULT_SUBJECT_ID, DEMO_STAR_COUNT, fixtureSizeFrom, foveationFrom, useStarMap } from '@/features/starmap/useStarMap'
import { pathForTarget, resolveTarget, type LayerTarget } from '@/features/starmap/view/layers'
import { markLoginFirstScreenReady } from '@/lib/loginTiming'
import { defaultDemoSubject } from '@/features/starmap/fixtures/demoStarMap'
import { subjectOfNebula } from '@/features/starmap/model/starMap'
import { useAuthStore } from '@/store/authStore'
import { useStarMapStore } from '@/store/starMapStore'

export function StarMapRoute({ relations = false, longNames = false }: { relations?: boolean; longNames?: boolean } = {}) {
  const params = useParams()
  const [search] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const ownerId = useAuthStore((state) => state.user?.id) ?? 'demo'
  const lastSubject = useStarMapStore((state) => state.lastSubjects[ownerId])
  const remember = useStarMapStore((state) => state.remember)
  const defaults = useStarMap(DEFAULT_SUBJECT_ID, fixtureSizeFrom(search, DEMO_STAR_COUNT))
  const subjectId = params.subjectId ?? defaultDemoSubject(lastSubject, defaults.subjects)
  const map = useStarMap(subjectId, fixtureSizeFrom(search, DEMO_STAR_COUNT),
    relations, longNames)
  useEffect(() => {
    if (map.subjects.some((s) => s.subjectId === map.subject.subjectId) && lastSubject !== map.subject.subjectId) {
      remember(ownerId, map.subject.subjectId)
    }
  }, [map, lastSubject, ownerId, remember])
  const { topicId, unitId } = params
  const target = useMemo(() => resolveTarget(map, topicId, unitId), [map, topicId, unitId])

  // Sign-in timing, handed over from ChatPage / LearnPage (#45): a student
  // lands on the map now, so its first drawn frame ends the wait. The mark is
  // a no-op unless a sign-in started the clock, and clears it once made.
  const landedAt = useRef(location.pathname)
  const onFirstFrame = useCallback(() => markLoginFirstScreenReady(landedAt.current), [])

  // A nebula or star lives under its own galaxy's route: one sky, so it may be another subject's.
  const onNavigate = useCallback(
    (next: LayerTarget) =>
      navigate({ pathname: pathForTarget(next.layer === 'map' ? map.subject.subjectId : subjectOfNebula(map, next.nebulaId), next), search: location.search }),
    [navigate, map, location.search],
  )
  // Panned to another galaxy: the route (and with it the header and the switcher) follows, in place.
  const onCentreGalaxy = useCallback(
    (id: string) => {
      if (id !== map.subject.subjectId) navigate({ pathname: pathForTarget(id, { layer: 'map' }), search: location.search }, { replace: true })
    },
    [navigate, map.subject.subjectId, location.search],
  )

  return (
    <StarMapView demo map={map} target={target} onNavigate={onNavigate} onFirstFrame={onFirstFrame} onCentreGalaxy={onCentreGalaxy} foveate={search.has('foveation') ? foveationFrom(search) : false} />
  )
}
