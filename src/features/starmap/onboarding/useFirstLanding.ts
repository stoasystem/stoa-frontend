/*
 * The first landing on the route (`firstLanding.ts`): decided once, on
 * arrival -- the first render that has the sky, as the lighting stage decides
 * its own (#330 M8) -- and then the route follows what is shown, the
 * nebula's in place of the galaxy's, the way `useLightingStage` puts a star's
 * route right. The new route carries the landing in its state: from `/` it
 * is another page, mounted afresh, which takes the landing over from there.
 * Moving on (another nebula, a star, back out) ends it.
 *
 * A student who takes more than one subject is asked first (plan B): the
 * map stays on the galaxy until they answer, then the camera flies to the
 * answer's recommended star, and the route follows once it has arrived, so
 * a new page mounting does not cut the flight short.
 *
 * The answer and "Look around first" are remembered for this tab only
 * (sessionStorage, one key per account): a reload or a way back to the map in
 * this tab does not ask again. A new tab does; the answer only steers the
 * camera, and nothing about it is sent anywhere.
 */
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { firstLandingFor, isNewcomer, landingOn, startableSubjects } from '@/features/starmap/onboarding/firstLanding'
import { subjectOfNebula, type Galaxy, type Star, type StarMap } from '@/features/starmap/model/starMap'
import { pathForTarget, sameTarget, type LayerTarget } from '@/features/starmap/view/layers'
import { ZOOM } from '@/features/starmap/view/semanticZoom'

const DISMISSED_KEY = 'stoa.starmap.firstLanding.dismissed'
const ANSWER_KEY = 'stoa.starmap.firstLanding.subject'
/** "Not sure": the galaxy in focus. */
const UNSURE = ''

/** Router state: the route was put right to this landing's nebula, for this star. */
type LandingState = { firstLanding: string }

function landingStarIn(state: unknown): string | null {
  const star = typeof state === 'object' && state !== null ? (state as Partial<LandingState>).firstLanding : undefined
  return typeof star === 'string' ? star : null
}

function readTab(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeTab(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // Storage refused: the question or Murmi simply comes back next time.
  }
}

export type FirstLanding = {
  /** The choice to show: on a newcomer's arrival, the recommended star's nebula seen whole. */
  target: LayerTarget
  /** The star Murmi stands beside, while the landing lasts and the student has not waved it away. */
  star: Star | null
  /** "Look around first", or Escape: Murmi goes, the camera stays. */
  dismiss: () => void
  /** Plan B: the subjects to choose between, while the question is open. */
  asking: Galaxy[] | null
  /** The answer: a subject, or null for "Not sure". */
  choose: (subjectId: string | null) => void
}

export function useFirstLanding(map: StarMap, target: LayerTarget, ownerId: string): FirstLanding {
  const navigate = useNavigate()
  const location = useLocation()
  const { search } = location
  const dismissedKey = `${DISMISSED_KEY}.${ownerId}`
  const answerKey = `${ANSWER_KEY}.${ownerId}`

  type Arrival = { landing: LayerTarget | null; asking: boolean }
  const arriving = (): Arrival => {
    if (readTab(dismissedKey) === '1') return { landing: null, asking: false }
    const carried = landingStarIn(location.state)
    const nebulaId = target.layer === 'nebula' ? target.nebulaId : null
    const star = carried && nebulaId && isNewcomer(map) ? map.stars.find((candidate) => candidate.unitId === carried) : undefined
    if (star && star.nebulaId === nebulaId) return { landing: landingOn(star), asking: false }
    if (target.layer !== 'map' || !isNewcomer(map)) return { landing: null, asking: false }
    const answer = readTab(answerKey)
    if (answer === null && startableSubjects(map).length > 1) return { landing: null, asking: true }
    return { landing: firstLandingFor(map, target, answer || undefined), asking: false }
  }
  const [arrived, setArrived] = useState(() => map.stars.length > 0)
  const [first] = useState(arriving)
  const [landing, setLanding] = useState<LayerTarget | null>(first.landing)
  const [asking, setAsking] = useState(first.asking)
  /** The landing was chosen on this page: the route waits for the flight. */
  const [flying, setFlying] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  if (!arrived && map.stars.length > 0) {
    const now = arriving()
    setArrived(true)
    setLanding(now.landing)
    setAsking(now.asking)
  }

  const landed = landing !== null && (target.layer === 'map' || sameTarget(landing, target))
  useEffect(() => {
    if (!landing || landing.layer !== 'nebula') return
    if (target.layer === 'map') {
      // The route follows what is shown: the nebula's, in place of the galaxy's.
      const state: LandingState | undefined = landing.whole ? { firstLanding: landing.whole.star } : undefined
      const follow = () => {
        void navigate({ pathname: pathForTarget(subjectOfNebula(map, landing.nebulaId), { layer: 'nebula', nebulaId: landing.nebulaId }), search }, { replace: true, state })
      }
      if (!flying) {
        follow()
        return
      }
      const timer = window.setTimeout(follow, ZOOM.flightMs + 80)
      return () => window.clearTimeout(timer)
    }
    if (!sameTarget(landing, target)) {
      // The student moved on: the landing is over.
      setLanding(null)
    }
  }, [landing, target, map, navigate, search, flying])

  const dismiss = useCallback(() => {
    writeTab(dismissedKey, '1')
    setDismissed(true)
  }, [dismissedKey])

  const choose = useCallback(
    (subjectId: string | null) => {
      writeTab(answerKey, subjectId ?? UNSURE)
      setAsking(false)
      setFlying(true)
      setLanding(firstLandingFor(map, { layer: 'map' }, subjectId ?? undefined))
    },
    [answerKey, map],
  )

  const starId = landed && landing.layer === 'nebula' ? landing.whole?.star : undefined
  const star = !dismissed && starId ? (map.stars.find((candidate) => candidate.unitId === starId) ?? null) : null
  const open = asking && target.layer === 'map' && isNewcomer(map)
  return { target: landed ? landing : target, star, dismiss, asking: open ? startableSubjects(map) : null, choose }
}
