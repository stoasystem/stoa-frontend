/*
 * The stage the lighting moment plays on (#140, round two of #123, F1 and
 * F2; #145, round three, C6 and C11): what the map draws and where it opens
 * while a point waits to be celebrated. The moment itself is
 * `LightingOverlay.tsx`'s.
 *
 *   - Gold only at the brightest moment (F1): a point lit and not yet
 *     celebrated is drawn as it was before -- in progress -- until the
 *     overlay says the flare has reached its brightest moment (`reveal`),
 *     or, with reduced motion, the moment it is shown. Only its drawn
 *     state changes; the map the overlay reads keeps the truth, so it still
 *     knows the point is lit. A point never celebrated on this map keeps
 *     the look until it is.
 *   - The recommendation with it (C11): a point that was its subject's
 *     recommendation when it was lit (the event says so, `recommended`)
 *     keeps the marker until that same moment; the star the map recommends
 *     now gets it then, together with the gold.
 *   - Its nebula seen whole (F2): coming back to that star's route (the
 *     chapter's way back to the map), the map opens on its nebula seen whole
 *     instead -- no card -- so the star lights up among its neighbours; the
 *     route is put right to the nebula's (in place, not a new history entry),
 *     and the student zooms in if they want to. Decided once, on arrival.
 *   - Chosen on the map before its moment (C6): a tap on that star (or its
 *     link) lands on the same view, decided before the flight takes off
 *     (`land`, which the map asks before it flies, #139), so the flight
 *     heads there from its first frame and never turns. Once the star is
 *     gold, a tap opens its card as ever; a star with nothing waiting opens
 *     as before.
 *
 * All of it needs the waiting points from the very first frame, so it reads
 * the event source's `known` list; a source without it (and production's
 * default, which knows nothing) leaves the map and the route as they are.
 */
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isCelebrated, useLightingEventSource, type LightingEventSource } from '@/features/starmap/lighting/lightingEvents'
import { subjectOfNebula, type Star, type StarMap } from '@/features/starmap/model/starMap'
import { pathForTarget, sameTarget, type LayerTarget } from '@/features/starmap/view/layers'

export type LightingStage = {
  /** The map to draw: points waiting for their celebration drawn in progress, the recommendation held with them. */
  map: StarMap
  /** The choice to show: on arrival at a waiting point's star, its nebula seen whole. */
  target: LayerTarget
  /** The flare reached its brightest moment on this point (or it was shown without one): draw it lit. */
  reveal: (unitId: string) => void
  /** Where a choice made on the map lands, decided before it flies: a waiting point's star, its nebula seen whole. */
  land: (next: LayerTarget) => LayerTarget
}

const NOTHING_WAITS = ''
/** Marks a waiting point that was its subject's recommendation, in the waiting key. */
const WAS_RECOMMENDED = '\t*'
const noSubscription = () => () => {}

/** The celebrated points the source knows are waiting, as one comparable string. */
function waitingKey(source: LightingEventSource): string {
  const known = source.known?.() ?? []
  return known
    .filter(isCelebrated)
    .map((event) => event.unitId + (event.recommended ? WAS_RECOMMENDED : ''))
    .sort()
    .join('\n')
}

/**
 * `map` with the `held` points that are lit drawn in progress, and not yet
 * counted lit (the header's and the switcher's counts); the same map when
 * there are none. Those of them in `recommended` hold their subject's
 * recommendation too: the marker is drawn on them, not on the star the map
 * recommends now (a teacher's recommendation is left where it is).
 */
export function presentHeld(map: StarMap, held: ReadonlySet<string>, recommended: ReadonlySet<string> = new Set()): StarMap {
  const waiting = map.stars.filter((star) => held.has(star.unitId) && star.state === 'lit')
  if (waiting.length === 0) return map
  const subjectOf = new Map(map.nebulae.map((nebula) => [nebula.topicId, nebula.subjectId ?? map.subject.subjectId]))
  const subjectOfStar = (star: Star) => subjectOf.get(star.nebulaId) ?? map.subject.subjectId
  const uncounted = new Map<string, number>()
  for (const star of waiting) uncounted.set(subjectOfStar(star), (uncounted.get(subjectOfStar(star)) ?? 0) + 1)

  // Each subject's recommendation held on its waiting point: at most one per subject (#9 point 8).
  const holder = new Map<string, string>()
  for (const star of waiting) {
    const subjectId = subjectOfStar(star)
    if (!recommended.has(star.unitId) || holder.has(subjectId)) continue
    const byTeacher = map.stars.some((other) => other.recommendation?.source === 'teacher' && subjectOfStar(other) === subjectId)
    if (!byTeacher) holder.set(subjectId, star.unitId)
  }
  const recommendationOf = (star: Star): Star['recommendation'] => {
    const holds = holder.get(subjectOfStar(star))
    if (holds === undefined) return star.recommendation
    return star.unitId === holds ? (star.recommendation ?? { source: 'system' }) : null
  }

  const inFocus = uncounted.get(map.subject.subjectId) ?? 0
  return {
    ...map,
    stars: map.stars.map((star) => {
      const recommendation = holder.size > 0 ? recommendationOf(star) : star.recommendation
      if (waiting.includes(star)) return { ...star, state: 'in_progress' as const, recommendation }
      return recommendation === star.recommendation ? star : { ...star, recommendation }
    }),
    summary: inFocus ? { ...map.summary, lit: map.summary.lit - inFocus } : map.summary,
    subjects: map.subjects.map((subject) => (uncounted.has(subject.subjectId) ? { ...subject, lit: subject.lit - (uncounted.get(subject.subjectId) ?? 0) } : subject)),
  }
}

/**
 * Where choosing `next` lands while `held` points wait: a waiting point's
 * lit star opens on its nebula seen whole, the star kept in view (#140 F2,
 * #145 C6); null for anything else, which opens as itself.
 */
export function landingFor(map: StarMap, held: ReadonlySet<string>, next: LayerTarget): LayerTarget | null {
  if (next.layer !== 'star' || !held.has(next.unitId)) return null
  if (!map.stars.some((star) => star.unitId === next.unitId && star.state === 'lit')) return null
  return { layer: 'nebula', nebulaId: next.nebulaId, whole: { star: next.unitId } }
}

/**
 * `from`: the star's route it replaces, until the route is the nebula's (then '').
 * `routeAt`: chosen on the map, the route it was chosen on, until the route follows the choice.
 */
type Landing = { from: string; target: LayerTarget; routeAt?: LayerTarget }

export function useLightingStage(map: StarMap, target: LayerTarget): LightingStage {
  const source = useLightingEventSource()
  const key = useSyncExternalStore(source.subscribe ?? noSubscription, () => waitingKey(source))
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(() => new Set())
  const { held, recommended } = useMemo(() => {
    const entries = key === NOTHING_WAITS ? [] : key.split('\n')
    const waiting = (some: string[]) => new Set(some.map((entry) => entry.replace(WAS_RECOMMENDED, '')).filter((id) => !revealed.has(id)))
    return { held: waiting(entries), recommended: waiting(entries.filter((entry) => entry.endsWith(WAS_RECOMMENDED))) }
  }, [key, revealed])
  const shown = useMemo(() => presentHeld(map, held, recommended), [map, held, recommended])

  // On arrival: the route's star waits to be celebrated, so its nebula seen whole instead.
  const [landing, setLanding] = useState<Landing | null>(() => {
    const whole = landingFor(map, held, target)
    return whole && target.layer === 'star' ? { from: target.unitId, target: whole } : null
  })
  const navigate = useNavigate()
  const { search } = useLocation()
  const landed = landing !== null && (sameTarget(landing.target, target) || (target.layer === 'star' && target.unitId === landing.from))
  useEffect(() => {
    if (!landing) return
    if (target.layer === 'star' && target.unitId === landing.from) {
      // The route follows what is shown: the nebula's, in place of the star's.
      const nebulaId = target.nebulaId
      navigate({ pathname: pathForTarget(subjectOfNebula(map, nebulaId), { layer: 'nebula', nebulaId }), search }, { replace: true })
    } else if (sameTarget(landing.target, target)) {
      // On the nebula's route: a tap on the star from here opens its card once it is gold.
      if (landing.from || landing.routeAt) setLanding({ from: '', target: landing.target })
    } else if (landing.routeAt && sameTarget(landing.routeAt, target)) {
      // Chosen on the map: the route follows the flight a few frames later (#139).
    } else {
      // The student moved on: the landing is over.
      setLanding(null)
    }
  }, [landing, target, map, navigate, search])

  const reveal = useCallback((unitId: string) => {
    setRevealed((before) => (before.has(unitId) ? before : new Set(before).add(unitId)))
  }, [])

  const land = useCallback(
    (next: LayerTarget) => {
      const whole = landingFor(map, held, next)
      if (!whole) return next
      setLanding({ from: '', target: whole, routeAt: target })
      return whole
    },
    [map, held, target],
  )

  return { map: shown, target: landed ? landing.target : target, reveal, land }
}
