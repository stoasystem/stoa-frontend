/*
 * The end of the first landing (plan A, second half): when the student's
 * first star is lit -- the only lit star in the sky, celebrated now -- the
 * camera pulls back from its nebula once the flare is over, slowly, to frame
 * that star and the one recommended next together (not the whole galaxy,
 * where both would be dots), and Murmi stands beside the next one. The
 * structure is shown at the moment it means something: one star lit, the
 * next within reach.
 *
 * Read from the sky, like the landing: a lighting moment plays once per
 * point, so the reveal does too, with nothing stored. With reduced motion
 * there is no flare and no flight: the galaxy crossfades in (the engine's
 * own policy) a beat after the "<name> is lit" label.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FLARE_MS, FLARE_PEAK_MS } from '@/features/starmap/lighting/flare'
import { subjectOfNebula, type Star, type StarMap } from '@/features/starmap/model/starMap'
import { usePrefersReducedMotion } from '@/features/starmap/motion/usePrefersReducedMotion'
import { isFirstLit, recommendedIn } from '@/features/starmap/onboarding/firstLanding'
import { pathForTarget, type LayerTarget } from '@/features/starmap/view/layers'

/** How long the lit star is held in view after its flare, before the camera pulls back. */
export const REVEAL_HOLD_MS = 900
/** The pull-back: slower than a choice's flight (600 ms), so the eye can follow the lit star out. */
export const REVEAL_FLIGHT_MS = 1400

export type FirstReveal = {
  /** While the reveal lasts: the galaxy, flown out to. */
  target: LayerTarget | null
  /** The star recommended next, Murmi beside it, until waved away. */
  star: Star | null
  /** Its route, the bubble's way to it. */
  next: string | null
  /** The lighting moment's "draw it lit now", wrapped: the first one starts the reveal. */
  onReveal: (unitId: string) => void
  dismiss: () => void
}

export function useFirstReveal(map: StarMap, target: LayerTarget, reveal: (unitId: string) => void): FirstReveal {
  const navigate = useNavigate()
  const { search } = useLocation()
  const reducedMotion = usePrefersReducedMotion()
  const [revealing, setRevealing] = useState<{ subjectId: string; lit: string; next: string | null } | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const timer = useRef<number | null>(null)
  const mapRef = useRef(map)
  useEffect(() => {
    mapRef.current = map
  }, [map])
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    [],
  )

  const onReveal = useCallback(
    (unitId: string) => {
      reveal(unitId)
      const now = mapRef.current
      const star = now.stars.find((candidate) => candidate.unitId === unitId)
      if (!star || timer.current !== null || !isFirstLit(now, unitId)) return
      const subjectId = subjectOfNebula(now, star.nebulaId)
      // At the flare's brightest moment: wait for it to go out, hold, then pull back.
      const wait = (reducedMotion ? 0 : FLARE_MS - FLARE_PEAK_MS) + REVEAL_HOLD_MS
      timer.current = window.setTimeout(() => {
        const next = recommendedIn(mapRef.current, subjectId)
        setRevealing({ subjectId, lit: unitId, next: next?.unitId ?? null })
        void navigate({ pathname: pathForTarget(subjectId, { layer: 'map' }), search }, { replace: true })
      }, wait)
    },
    [reveal, reducedMotion, navigate, search],
  )

  // The student moved on from the galaxy: the reveal is over. Not before the route has reached the
  // galaxy, which may take a render after the reveal starts.
  const [atGalaxy, setAtGalaxy] = useState(false)
  if (revealing && !atGalaxy && target.layer === 'map') setAtGalaxy(true)
  const over = revealing !== null && atGalaxy && target.layer !== 'map'
  useEffect(() => {
    if (over) setRevealing(null)
  }, [over])

  const dismiss = useCallback(() => setDismissed(true), [])
  const star = revealing && !dismissed && !over ? recommendedIn(map, revealing.subjectId) : null
  const next = star ? `${pathForTarget(revealing!.subjectId, { layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId })}${search}` : null
  const revealTarget = useMemo<LayerTarget | null>(
    () =>
      revealing
        ? { layer: 'map', fly: true, frame: revealing.next ? [revealing.lit, revealing.next] : [revealing.lit], flightMs: reducedMotion ? undefined : REVEAL_FLIGHT_MS }
        : null,
    [revealing, reducedMotion],
  )
  return { target: !over ? revealTarget : null, star, next, onReveal, dismiss }
}
