/*
 * The stage the lighting moment plays on (#140, round two of #123, F1 and
 * F2): what the map draws and where it opens while a point waits to be
 * celebrated. The moment itself is `LightingOverlay.tsx`'s.
 *
 *   - Gold only at the brightest moment (F1): a point lit and not yet
 *     celebrated is drawn as it was before -- in progress -- until the
 *     overlay says the flare has reached its brightest moment (`reveal`),
 *     or, with reduced motion, the moment it is shown. Only its drawn
 *     state changes; the map the overlay reads keeps the truth, so it still
 *     knows the point is lit. A point never celebrated on this map keeps
 *     the look until it is.
 *   - Its nebula seen whole (F2): coming back to that star's route (the
 *     chapter's way back to the map), the map opens on its nebula seen whole
 *     instead -- no card -- so the star lights up among its neighbours; the
 *     route is put right to the nebula's (in place, not a new history entry),
 *     and the student zooms in if they want to. Decided once, on arrival:
 *     a tap on the star later opens its card as ever, and a star with
 *     nothing waiting opens as before.
 *
 * Both need the waiting points from the very first frame, so they read the
 * event source's `known` list; a source without it (and production's
 * default, which knows nothing) leaves the map and the route as they are.
 */
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isCelebrated, useLightingEventSource, type LightingEventSource } from '@/features/starmap/lighting/lightingEvents'
import { subjectOfNebula, type StarMap } from '@/features/starmap/model/starMap'
import { pathForTarget, sameTarget, type LayerTarget } from '@/features/starmap/view/layers'

export type LightingStage = {
  /** The map to draw: points waiting for their celebration drawn in progress. */
  map: StarMap
  /** The choice to show: on arrival at a waiting point's star, its nebula seen whole. */
  target: LayerTarget
  /** The flare reached its brightest moment on this point (or it was shown without one): draw it lit. */
  reveal: (unitId: string) => void
}

const NOTHING_WAITS = ''
const noSubscription = () => () => {}

/** The celebrated points the source knows are waiting, as one comparable string. */
function waitingKey(source: LightingEventSource): string {
  const known = source.known?.() ?? []
  return known
    .filter(isCelebrated)
    .map((event) => event.unitId)
    .sort()
    .join('\n')
}

/**
 * `map` with the `held` points that are lit drawn in progress, and not yet
 * counted lit (the header's and the switcher's counts); the same map when
 * there are none.
 */
export function presentHeld(map: StarMap, held: ReadonlySet<string>): StarMap {
  const waiting = map.stars.filter((star) => held.has(star.unitId) && star.state === 'lit')
  if (waiting.length === 0) return map
  const uncounted = new Map<string, number>()
  for (const star of waiting) {
    const subjectId = subjectOfNebula(map, star.nebulaId)
    uncounted.set(subjectId, (uncounted.get(subjectId) ?? 0) + 1)
  }
  const inFocus = uncounted.get(map.subject.subjectId) ?? 0
  return {
    ...map,
    stars: map.stars.map((star) => (waiting.includes(star) ? { ...star, state: 'in_progress' as const } : star)),
    summary: inFocus ? { ...map.summary, lit: map.summary.lit - inFocus } : map.summary,
    subjects: map.subjects.map((subject) => (uncounted.has(subject.subjectId) ? { ...subject, lit: subject.lit - (uncounted.get(subject.subjectId) ?? 0) } : subject)),
  }
}

/** `from`: the star's route it replaces, until the route is the nebula's (then ''). */
type Landing = { from: string; target: LayerTarget }

export function useLightingStage(map: StarMap, target: LayerTarget): LightingStage {
  const source = useLightingEventSource()
  const key = useSyncExternalStore(source.subscribe ?? noSubscription, () => waitingKey(source))
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(() => new Set())
  const held = useMemo(() => new Set((key === NOTHING_WAITS ? [] : key.split('\n')).filter((id) => !revealed.has(id))), [key, revealed])
  const shown = useMemo(() => presentHeld(map, held), [map, held])

  // On arrival only: the route's star waits to be celebrated, so its nebula seen whole instead.
  const [landing, setLanding] = useState<Landing | null>(() =>
    target.layer === 'star' && held.has(target.unitId) && map.stars.some((star) => star.unitId === target.unitId && star.state === 'lit')
      ? { from: target.unitId, target: { layer: 'nebula', nebulaId: target.nebulaId, whole: { star: target.unitId } } }
      : null,
  )
  const navigate = useNavigate()
  const { search } = useLocation()
  const landed = landing !== null && (sameTarget(landing.target, target) || (target.layer === 'star' && target.unitId === landing.from))
  useEffect(() => {
    if (!landing) return
    if (target.layer === 'star' && target.unitId === landing.from) {
      // The route follows what is shown: the nebula's, in place of the star's.
      const nebulaId = target.nebulaId
      navigate({ pathname: pathForTarget(subjectOfNebula(map, nebulaId), { layer: 'nebula', nebulaId }), search }, { replace: true })
    } else if (!sameTarget(landing.target, target)) {
      // The student moved on: the landing is over.
      setLanding(null)
    } else if (landing.from) {
      // Arrived on the nebula's route: a tap on the star from here opens its card.
      setLanding({ from: '', target: landing.target })
    }
  }, [landing, target, map, navigate, search])

  const reveal = useCallback((unitId: string) => {
    setRevealed((before) => (before.has(unitId) ? before : new Set(before).add(unitId)))
  }, [])

  return { map: shown, target: landed ? landing.target : target, reveal }
}
