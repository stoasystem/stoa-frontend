/*
 * The review reminder's state on the route (`reviewReminder.ts`, #593).
 *
 * A tap flies to the star with the most cards due the way finding a star
 * does (#489): the galaxy's route, the camera framing that star, Murmi's
 * bubble beside it. The flight lasts as long as this visit -- it goes with
 * the bubble waved away and with any route the student moves to (a push or
 * a pop); a pan to another galaxy only replaces the route and keeps it.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { useReviewSummaryQuery } from '@/hooks/practice/useReviewQueries'
import { subjectOfNebula, type Star, type StarMap } from '@/features/starmap/model/starMap'
import { ZOOM_MS } from '@/features/starmap/motion/motionPolicy'
import { usePrefersReducedMotion } from '@/features/starmap/motion/usePrefersReducedMotion'
import { REVEAL_FLIGHT_MS } from '@/features/starmap/onboarding/useFirstReveal'
import { localDay, mostDueStar, readDay, reminderKeys, reminderMood, writeDay, type ReminderMood } from '@/features/starmap/reviewReminder/reviewReminder'
import { pathForTarget, type LayerTarget } from '@/features/starmap/view/layers'
import type { ReviewSummary } from '@/types/practice'

export type ReviewReminder = {
  /** What the corner Murmi does; null: not there (nothing scheduled, waved away today, or not a student). */
  mood: ReminderMood | null
  summary: ReviewSummary | undefined
  /** The star a tap flies to: the one with the most cards due. */
  mostDue: Star | null
  /** While flown there: the camera framing that star. */
  target: LayerTarget | null
  /** The star Murmi's bubble stands beside, while it is up. */
  star: Star | null
  /** The tap: fly to the most-due star and show the bubble. */
  open: () => void
  /** The bubble waved away (✕, Escape, a tap on the map): the corner Murmi stays. */
  close: () => void
  /** "Got it": gone for the rest of today. */
  wave: () => void
}

/** The camera on the star: a choice's flight in the galaxy in view, the first reveal's slow one from another. */
export function reminderTarget(map: Pick<StarMap, 'nebulae' | 'subject'>, star: Star, reducedMotion: boolean): LayerTarget {
  const home = subjectOfNebula(map, star.nebulaId) === map.subject.subjectId
  return { layer: 'map', fly: true, frame: [star.unitId], flightMs: reducedMotion ? undefined : home ? ZOOM_MS : REVEAL_FLIGHT_MS }
}

/** Router state: the tap asked to fly to this star. From `/` the galaxy's route is another page, mounted afresh, which takes it over from here. */
type ReminderArrival = { reviewReminder: string }

function askedToReview(state: unknown): string | null {
  const unitId = typeof state === 'object' && state !== null ? (state as Partial<ReminderArrival>).reviewReminder : undefined
  return typeof unitId === 'string' && unitId.length > 0 ? unitId : null
}

export function useReviewReminder(map: StarMap, ownerId: string, enabled: boolean): ReviewReminder {
  const location = useLocation()
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const reducedMotion = usePrefersReducedMotion()
  const { data: summary } = useReviewSummaryQuery({ enabled })
  const keys = reminderKeys(ownerId)
  const [today] = useState(() => localDay(new Date()))
  const [waved, setWaved] = useState(() => readDay(keys.waved) === today)

  const asked = askedToReview(location.state)
  const [guide, setGuide] = useState<{ unitId: string; key: string } | null>(null)
  // Still this visit: the entry it was opened on, or one that only replaced it (the move to the
  // galaxy's route, a pan to another galaxy). A push or a pop is a move elsewhere.
  const following = guide !== null && (navigationType === 'REPLACE' || location.key === guide.key)
  useEffect(() => {
    if (guide && !following && !asked) setGuide(null)
  }, [guide, following, asked])
  // Arrived by the tap: the flight starts, and the state is taken out of the entry at once, so
  // neither a reload nor a way back to it brings the bubble back.
  const { key, pathname, search } = location
  useEffect(() => {
    if (!asked) return
    setGuide({ unitId: asked, key })
    void navigate({ pathname, search }, { replace: true, state: null })
  }, [asked, key, pathname, search, navigate])

  const mostDue = enabled ? mostDueStar(map) : null
  const open = useCallback(() => {
    if (!mostDue) return
    // The star's galaxy, the tap carried in the state (taken over just above, on this page or the next).
    const galaxy = pathForTarget(subjectOfNebula(map, mostDue.nebulaId), { layer: 'map' })
    const state: ReminderArrival = { reviewReminder: mostDue.unitId }
    void navigate({ pathname: galaxy, search }, { replace: true, state })
  }, [mostDue, map, search, navigate])
  const close = useCallback(() => setGuide(null), [])
  const wave = useCallback(() => {
    writeDay(keys.waved, today)
    setWaved(true)
    setGuide(null)
  }, [keys.waved, today])

  const star = following ? (map.stars.find((candidate) => candidate.unitId === guide.unitId) ?? null) : null
  const target = useMemo(() => (star ? reminderTarget(map, star, reducedMotion) : null), [map, star, reducedMotion])
  const mood = enabled && !waved ? reminderMood(summary) : null
  return { mood, summary, mostDue, target, star, open, close, wave }
}
