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
 * A student whose profile ticks subjects (`primarySubjects`, saved by "About
 * you", #591) is not asked: the camera goes to the first of them that has
 * somewhere to start, else the first such subject they take. The map's
 * galaxy ids are the ones the profile is written with, so nothing is mapped.
 *
 * "About you" comes before all of it (`hold`): the landing is decided only
 * once it is answered (and the sky read again) or put off, so it lands on the
 * star the backend recommends for the year group just saved.
 *
 * On a sky of star clusters (#747, #769) the landing is not a flight into
 * the nebula: the camera stays on the whole view of the chosen subject's
 * galaxy (the route follows to that galaxy if it is not the one in focus),
 * and Murmi stands beside the cluster holding the recommended star
 * (`cluster`). That one bubble says where to begin and takes the place of the
 * clusters' hint for a newcomer. The student taps the cluster themselves
 * (`openCluster`): the recommended one opens its route scene on that star
 * (`clusterPath`), its card open and Murmi there (`ClusterScene`); another
 * opens as any cluster does. Either way the landing is over: the sky under
 * the scene is marked as landed (`SceneLandingState`), so back from the
 * scene is the whole view and the landing is not decided again.
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
import { isClusterSky } from '@/features/starmap/onboarding/ClusterHint'
import { clusterPath, pathForTarget, sameTarget, type LayerTarget } from '@/features/starmap/view/layers'
import { ZOOM } from '@/features/starmap/view/semanticZoom'

const DISMISSED_KEY = 'stoa.starmap.firstLanding.dismissed'
const ANSWER_KEY = 'stoa.starmap.firstLanding.subject'
/** "Not sure": the galaxy in focus. */
const UNSURE = ''

/** Router state: the route was put right to this landing's nebula, for this star. */
type LandingState = { firstLanding: string }

/** Router state of the sky once a newcomer's landing there is over (#747, #769): a cluster was opened from it. */
export type SceneLandingState = { firstLandingSeen: string }
/** Router state of that scene: opened from the sky (`ClusterSceneState`), as a newcomer's landing on this star. */
export type SceneLandingSceneState = { fromSky: true; firstLanding: string }

function sceneLandedIn(state: unknown): boolean {
  return typeof state === 'object' && state !== null && typeof (state as Partial<SceneLandingState>).firstLandingSeen === 'string'
}

/** The star a newcomer's landing opened a cluster's scene on, from the scene's router state. */
export function sceneLandingStar(state: unknown): string | null {
  const star = typeof state === 'object' && state !== null ? (state as Partial<SceneLandingSceneState>).firstLanding : undefined
  return typeof star === 'string' ? star : null
}

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
  /** On a sky of star clusters (#769): the cluster Murmi stands beside, holding the recommended star, while the landing lasts. */
  cluster: { clusterId: string; star: Star } | null
  /** A cluster tapped on the whole view: true when the landing opened it (on its star), false to open it as usual. */
  openCluster: (clusterId: string) => boolean
  /** "Look around first", or Escape: Murmi goes, the camera stays. */
  dismiss: () => void
  /** Plan B: the subjects to choose between, while the question is open. */
  asking: Galaxy[] | null
  /** The answer: a subject, or null for "Not sure". */
  choose: (subjectId: string | null) => void
}

export type FirstLandingOptions = {
  /** Not yet: "About you" is still up, or its answer still on its way (`useAboutYou`). */
  hold?: boolean
  /** The subjects the student's profile ticks, in its order; null when it ticks none or could not be read. */
  subjects?: readonly string[] | null
}

export function useFirstLanding(map: StarMap, target: LayerTarget, ownerId: string, { hold = false, subjects = null }: FirstLandingOptions = {}): FirstLanding {
  const navigate = useNavigate()
  const location = useLocation()
  const { search } = location
  const dismissedKey = `${DISMISSED_KEY}.${ownerId}`
  const answerKey = `${ANSWER_KEY}.${ownerId}`

  type Arrival = { landing: LayerTarget | null; asking: boolean; followed: boolean }
  const arriving = (): Arrival => {
    if (readTab(dismissedKey) === '1' || sceneLandedIn(location.state)) return { landing: null, asking: false, followed: false }
    const carried = landingStarIn(location.state)
    const nebulaId = target.layer === 'nebula' ? target.nebulaId : null
    const star = carried && nebulaId && isNewcomer(map) ? map.stars.find((candidate) => candidate.unitId === carried) : undefined
    // Carried here by the route: it already follows the landing.
    if (star && star.nebulaId === nebulaId) return { landing: landingOn(star), asking: false, followed: true }
    if (target.layer !== 'map' || !isNewcomer(map)) return { landing: null, asking: false, followed: false }
    const answer = readTab(answerKey)
    const startable = startableSubjects(map)
    if (answer === null && startable.length > 1) {
      // The profile says what school is on: no need to ask.
      const taken = subjects?.length ? (subjects.find((id) => startable.some((galaxy) => galaxy.subjectId === id)) ?? startable[0].subjectId) : null
      if (taken === null) return { landing: null, asking: true, followed: false }
      return { landing: firstLandingFor(map, target, taken), asking: false, followed: false }
    }
    return { landing: firstLandingFor(map, target, answer || undefined), asking: false, followed: false }
  }
  const nothing: Arrival = { landing: null, asking: false, followed: false }
  const [arrived, setArrived] = useState(() => !hold && map.stars.length > 0)
  const [first] = useState(() => (hold ? nothing : arriving()))
  const [landing, setLanding] = useState<LayerTarget | null>(first.landing)
  const [asking, setAsking] = useState(first.asking)
  /** The landing was chosen on this page: the route waits for the flight. */
  const [flying, setFlying] = useState(false)
  /**
   * The route has reached the landing's nebula. From then on the galaxy's
   * route is the student going back out (the way back, the switcher, a pinch
   * that settles on the galaxy), and ends the landing; before, it is the
   * route still to be put right. On a sky of clusters: the route has reached
   * the landing star's galaxy, and another galaxy is the student panning on.
   */
  const [followed, setFollowed] = useState(first.followed)
  const [dismissed, setDismissed] = useState(false)
  if (!arrived && !hold && map.stars.length > 0) {
    const now = arriving()
    setArrived(true)
    setLanding(now.landing)
    setAsking(now.asking)
    setFollowed(now.followed)
  }

  // A sky of star clusters (#747, #769): the camera stays on the whole view, of the landing star's galaxy.
  const clusters = isClusterSky(map)
  const landingStarId = clusters && landing?.layer === 'nebula' ? landing.whole?.star : undefined
  const clusterStar = landingStarId ? (map.stars.find((candidate) => candidate.unitId === landingStarId) ?? null) : null
  const clusterSubject = clusterStar ? subjectOfNebula(map, clusterStar.nebulaId) : null
  useEffect(() => {
    if (!clusters || !landing) return
    if (!clusterStar || target.layer !== 'map') {
      // No star to stand by, or the student moved on (a nebula, a star): the landing is over.
      setLanding(null)
      return
    }
    if (clusterSubject === map.subject.subjectId) {
      if (!followed) setFollowed(true)
      return
    }
    // Panned or switched to another galaxy once there: the student moved on.
    if (followed) {
      setLanding(null)
      return
    }
    // Another galaxy's star (plan B's answer, the profile's subject): the route follows to that galaxy, in place.
    if (clusterSubject !== null) void navigate({ pathname: pathForTarget(clusterSubject, { layer: 'map' }), search }, { replace: true })
  }, [clusters, landing, clusterStar, clusterSubject, target, map, navigate, search, followed])

  /**
   * A cluster tapped on the whole view while the landing is up: the landing
   * is over, and the sky under the scene marked as landed. The recommended
   * star's cluster opens on that star, its card open (true); another is left
   * to open as any cluster does (false).
   */
  const openCluster = useCallback(
    (clusterId: string): boolean => {
      if (!clusterStar) return false
      const unitId = clusterStar.unitId
      setLanding(null)
      const sky: SceneLandingState = { firstLandingSeen: unitId }
      // The galaxy's own route (from `/` too), so back from the scene names the subject, as the switcher does.
      void navigate({ pathname: pathForTarget(map.subject.subjectId, { layer: 'map' }), search }, { replace: true, state: sky })
      if (clusterId !== clusterStar.nebulaId) return false
      const scene: SceneLandingSceneState = { fromSky: true, firstLanding: unitId }
      const query = new URLSearchParams(search)
      query.set('star', unitId)
      void navigate({ pathname: clusterPath(subjectOfNebula(map, clusterStar.nebulaId), clusterStar.nebulaId), search: `?${query}` }, { state: scene })
      return true
    },
    [clusterStar, map, navigate, search],
  )

  const landed = !clusters && landing !== null && (sameTarget(landing, target) || (!followed && target.layer === 'map'))
  useEffect(() => {
    if (clusters || !landing || landing.layer !== 'nebula') return
    if (sameTarget(landing, target)) {
      // The route has caught up with what is shown.
      if (!followed) setFollowed(true)
      if (flying) setFlying(false)
      return
    }
    if (target.layer === 'map' && !followed) {
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
    // The student moved on (another nebula, a star, back out to the galaxy): the landing is over.
    setLanding(null)
  }, [clusters, landing, target, map, navigate, search, flying, followed])

  const dismiss = useCallback(() => {
    writeTab(dismissedKey, '1')
    setDismissed(true)
    // On a sky of clusters the camera never left the whole view: nothing is left of the landing.
    if (clusters) setLanding(null)
  }, [dismissedKey, clusters])

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
  // Murmi by the cluster once the route is on the landing star's galaxy.
  const cluster = !dismissed && clusterStar && target.layer === 'map' && clusterSubject === map.subject.subjectId ? { clusterId: clusterStar.nebulaId, star: clusterStar } : null
  return { target: landed ? landing : target, star, cluster, openCluster, dismiss, asking: open ? startableSubjects(map) : null, choose }
}
