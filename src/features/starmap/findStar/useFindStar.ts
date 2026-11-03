/*
 * Finding a star, on the map (#489, CONTEXT.md「找星」; the rules are #478,
 * the drawing #488). A card in Ask sends the student to a star with
 * `FindStarArrival` in the navigation state. If stars are missing on the way
 * (`model/missingStars.ts`), the map does not open the star's card: the
 * camera frames the star and every missing star on the galaxy, the path is
 * drawn over the lines, and Murmi beside the star suggests the first missing
 * one. With nothing missing -- the star lit, or its prerequisites all lit --
 * finding it is what it was (#487): the star's card opens.
 *
 * The path lasts as long as this visit. It goes with any route the student
 * moves to -- another star or nebula chosen, the browser's back -- and with
 * Murmi waved away; zooming and panning keep it (a pan to another galaxy only
 * replaces the route). It is never kept: the arrival's state is taken out of
 * the history entry at once (the entry is replaced by the galaxy's), so
 * neither a reload nor coming back to the entry brings it back.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { findStarPath, type FindStarPath } from '@/features/starmap/model/missingStars'
import { subjectOfNebula, type Star, type StarMap } from '@/features/starmap/model/starMap'
import { ZOOM_MS } from '@/features/starmap/motion/motionPolicy'
import { usePrefersReducedMotion } from '@/features/starmap/motion/usePrefersReducedMotion'
import { REVEAL_FLIGHT_MS } from '@/features/starmap/onboarding/useFirstReveal'
import { pathForTarget, type LayerTarget } from '@/features/starmap/view/layers'

/** Navigation state that asks the map to find a star (#489): sent by Ask's card (`AskTargetCard`). */
export type FindStarArrival = { findStar: { unitId: string } }

/** The star a navigation state asks to find, if any. */
export function askedToFind(state: unknown): string | null {
  const unitId = (state as Partial<FindStarArrival> | null)?.findStar?.unitId
  return typeof unitId === 'string' && unitId.length > 0 ? unitId : null
}

/**
 * How long the camera takes to frame a path (#488 point 3): a choice's flight
 * (420 ms) when the star and every missing star are in one nebula, the first
 * reveal's slow pull-back when any is in another nebula or galaxy.
 */
export function findStarFlightMs(map: Pick<StarMap, 'stars'>, path: Pick<FindStarPath, 'target' | 'missing'>): number {
  const nebulaOf = new Map(map.stars.map((star) => [star.unitId, star.nebulaId]))
  const home = nebulaOf.get(path.target)
  return path.missing.every((unitId) => nebulaOf.get(unitId) === home) ? ZOOM_MS : REVEAL_FLIGHT_MS
}

/** The galaxy framing the star asked for and every missing star (#488 point 1); reduced motion gives no flight time (a crossfade). */
export function findStarTarget(map: Pick<StarMap, 'stars'>, path: FindStarPath, reducedMotion: boolean): LayerTarget {
  return { layer: 'map', fly: true, frame: [path.target, ...path.missing], flightMs: reducedMotion ? undefined : findStarFlightMs(map, path) }
}

export type FindStar = {
  /** While the path is shown: the camera's framing of it, which the route's choice gives way to. */
  target: LayerTarget | null
  path: FindStarPath | null
  /** The star asked for, and the first missing star Murmi names. */
  star: Star | null
  first: Star | null
  /** Murmi waved away, or one of its ways taken: the path goes too. */
  dismiss: () => void
}

export function useFindStar(map: StarMap): FindStar {
  const location = useLocation()
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const reducedMotion = usePrefersReducedMotion()
  const asked = askedToFind(location.state)
  const [guide, setGuide] = useState<{ unitId: string; key: string } | null>(null)
  // Still this visit: the entry it arrived on, or one that only replaced it (the arrival's own
  // clean-up, a pan to another galaxy). A push or a pop is a move elsewhere.
  const following = guide !== null && (navigationType === 'REPLACE' || location.key === guide.key)
  const unitId = asked ?? (following ? guide.unitId : null)
  const path = useMemo(() => (unitId ? findStarPath(map, unitId) : null), [map, unitId])

  const mapRef = useRef(map)
  useEffect(() => {
    mapRef.current = map
  }, [map])
  // Arrived with a star to find and stars missing: the path starts, and the entry is replaced by
  // the galaxy's, without the state. With nothing missing the star's route is left as it is.
  const { key, search } = location
  useEffect(() => {
    if (!asked) return
    const now = mapRef.current
    const star = now.stars.find((candidate) => candidate.unitId === asked)
    if (!star || !findStarPath(now, asked)) return
    setGuide({ unitId: asked, key })
    void navigate({ pathname: pathForTarget(subjectOfNebula(now, star.nebulaId), { layer: 'map' }), search }, { replace: true, state: null })
  }, [asked, key, search, navigate])
  // Moved elsewhere: the path is over.
  useEffect(() => {
    if (guide && !following && !asked) setGuide(null)
  }, [guide, following, asked])

  const dismiss = useCallback(() => setGuide(null), [])
  const target = useMemo(() => (path ? findStarTarget(map, path, reducedMotion) : null), [map, path, reducedMotion])
  const star = path ? (map.stars.find((candidate) => candidate.unitId === path.target) ?? null) : null
  const first = path ? (map.stars.find((candidate) => candidate.unitId === path.first) ?? null) : null
  return { target, path, star, first, dismiss }
}
