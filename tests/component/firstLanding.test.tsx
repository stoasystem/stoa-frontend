/**
 * The first landing (plan A of docs/research/user-onboarding-design.md):
 *
 *   - a newcomer (nothing lit, nothing in progress) arriving on the galaxy
 *     lands on the recommended star's nebula seen whole, and the route
 *     follows, carrying the landing to the page it mounts;
 *   - a student who has started something, or chose a nebula or star
 *     themself, opens as before;
 *   - a newcomer who takes more than one subject is asked which one school
 *     is on first (plan B), and lands on that galaxy's recommended star;
 *   - "Look around first" sends Murmi away for this tab and keeps the camera;
 *   - the first star lit is the only one lit: the reveal's signal;
 *   - on a phone the bubble docks across the map, clear of its controls;
 *   - the design preview's newcomer sky is a true newcomer's sky.
 */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { demoStarMapOverride } from '@/dev/preview/lighting'
import { demoStarMap } from '@/dev/demo/sky/demoStarMap'
import { DEMO_KNOWLEDGE_POINT } from '@/dev/demo/sky/demoSky'
import { asNewcomer } from '@/dev/demo/sky/newcomer'
import { firstLandingFor, isFirstLit, isNewcomer, startableSubjects } from '@/features/starmap/onboarding/firstLanding'
import { dockedPlace, FirstLandingBubble } from '@/features/starmap/onboarding/FirstLandingBubble'
import { useFirstLanding, type FirstLanding } from '@/features/starmap/onboarding/useFirstLanding'
import { REVEAL_HOLD_MS, useFirstReveal, type FirstReveal } from '@/features/starmap/onboarding/useFirstReveal'
import { FLARE_MS, FLARE_PEAK_MS } from '@/features/starmap/lighting/flare'
import { ZOOM } from '@/features/starmap/view/semanticZoom'
import { subjectOfNebula, type StarMap } from '@/features/starmap/model/starMap'
import { resolveTarget, type LayerTarget } from '@/features/starmap/view/layers'
import i18n from '@/i18n'
import { fakeClock } from './starmapHarness'

const KP = DEMO_KNOWLEDGE_POINT.unitId
const TOPIC = DEMO_KNOWLEDGE_POINT.topicId

const demoMap = (size: 10 | 1000 = 1000): StarMap =>
  demoStarMapOverride(demoStarMap('math', size, i18n.getFixedT('en', 'starmap'), { language: 'en' }), size)
const newcomerMap = (size: 10 | 1000 = 1000, completed: readonly string[] = []) => asNewcomer(demoMap(size), completed)
const ALL_LESSONS = DEMO_KNOWLEDGE_POINT.lessons.map((lesson) => lesson.lessonId)
const ANSWER_KEY = 'stoa.starmap.firstLanding.subject'

beforeEach(() => {
  sessionStorage.clear()
})

/** The landing without plan B's question: as if mathematics was answered in this tab. */
const answeredMath = (ownerId = 'student-1') => sessionStorage.setItem(`${ANSWER_KEY}.${ownerId}`, 'math')

describe('who is new', () => {
  it('is a student with nothing lit and nothing in progress', () => {
    expect(isNewcomer(newcomerMap())).toBe(true)
    expect(isNewcomer(demoMap())).toBe(false)
    expect(isNewcomer({ stars: [] })).toBe(false)
  })

  it('lands a newcomer on the recommended star of the galaxy in focus, its nebula seen whole', () => {
    expect(firstLandingFor(newcomerMap(), { layer: 'map' })).toEqual({ layer: 'nebula', nebulaId: TOPIC, whole: { star: KP } })
  })

  it('leaves a chosen nebula or star, and a student who has started, as they are', () => {
    expect(firstLandingFor(newcomerMap(), { layer: 'nebula', nebulaId: TOPIC })).toBeNull()
    expect(firstLandingFor(newcomerMap(), { layer: 'star', nebulaId: TOPIC, unitId: KP })).toBeNull()
    expect(firstLandingFor(demoMap(), { layer: 'map' })).toBeNull()
  })
})

describe("the design preview's newcomer sky", () => {
  for (const size of [10, 1000] as const) {
    it(`has no evidence and keeps CONTEXT.md's states true (${size} stars)`, () => {
      const map = newcomerMap(size)
      const waits = new Set(map.prerequisites.map((edge) => edge.to))
      for (const star of map.stars) {
        expect(star.state === 'lit' || star.state === 'in_progress').toBe(false)
        expect(star.state).toBe(waits.has(star.unitId) ? 'locked' : 'ready')
        expect(star.reviewDue).toBe(0)
        expect(star.skills.every((skill) => !skill.lit)).toBe(true)
      }
      expect(map.subjects.every((galaxy) => galaxy.lit === 0)).toBe(true)
    })

    it(`recommends one ready star in each subject the student takes, the demo knowledge point in mathematics (${size} stars)`, () => {
      const map = newcomerMap(size)
      const recommended = map.stars.filter((star) => star.recommendation)
      const subjects = recommended.map((star) => subjectOfNebula(map, star.nebulaId))
      expect(new Set(subjects).size).toBe(subjects.length)
      expect(subjects.sort()).toEqual(map.subjects.filter((galaxy) => galaxy.enrolled).map((galaxy) => galaxy.subjectId).sort())
      expect(recommended.every((star) => star.state === 'ready')).toBe(true)
      expect(map.stars.find((star) => star.unitId === KP)?.recommendation).toEqual({ source: 'system' })
    })
  }

  it('gives the same arrays for the same map, as the engine compares by identity', () => {
    const map = demoMap()
    expect(asNewcomer(map).stars).toBe(asNewcomer(map).stars)
  })
})

function Probe({ map, ownerId = 'student-1', out }: { map: StarMap; ownerId?: string; out: { current: FirstLanding | null; path: string; state: unknown } }) {
  const location = useLocation()
  const [, , , topicId, unitId] = location.pathname.split('/')
  const target: LayerTarget = resolveTarget(map, topicId, unitId)
  out.current = useFirstLanding(map, target, ownerId)
  out.path = location.pathname
  out.state = location.state
  return null
}

const probe = () => ({ current: null as FirstLanding | null, path: '', state: null as unknown })

describe('on the route', () => {
  it('puts the route right to the nebula, carrying the landing to the page it mounts', () => {
    answeredMath()
    const map = newcomerMap()
    const out = probe()
    render(
      <MemoryRouter initialEntries={['/map/math']}>
        <Probe map={map} out={out} />
      </MemoryRouter>,
    )
    expect(out.path).toBe(`/map/math/${TOPIC}`)
    expect(out.state).toEqual({ firstLanding: KP })
    expect(out.current?.target).toEqual({ layer: 'nebula', nebulaId: TOPIC, whole: { star: KP } })
    expect(out.current?.star?.unitId).toBe(KP)

    // The nebula's page, mounted afresh with the state the galaxy's left it.
    const again = probe()
    render(
      <MemoryRouter initialEntries={[{ pathname: `/map/math/${TOPIC}`, state: { firstLanding: KP } }]}>
        <Probe map={map} out={again} />
      </MemoryRouter>,
    )
    expect(again.current?.target).toEqual({ layer: 'nebula', nebulaId: TOPIC, whole: { star: KP } })
    expect(again.current?.star?.unitId).toBe(KP)
  })

  it('opens a nebula reached any other way as before', () => {
    const out = probe()
    render(
      <MemoryRouter initialEntries={[`/map/math/${TOPIC}`]}>
        <Probe map={newcomerMap()} out={out} />
      </MemoryRouter>,
    )
    expect(out.current?.target).toEqual({ layer: 'nebula', nebulaId: TOPIC })
    expect(out.current?.star).toBeNull()
  })

  it('sends Murmi away for this tab and this account, the camera staying where it is', () => {
    answeredMath()
    answeredMath('student-2')
    const map = newcomerMap()
    const out = probe()
    render(
      <MemoryRouter initialEntries={['/map/math']}>
        <Probe map={map} out={out} />
      </MemoryRouter>,
    )
    act(() => out.current?.dismiss())
    expect(out.current?.star).toBeNull()
    expect(out.current?.target).toEqual({ layer: 'nebula', nebulaId: TOPIC, whole: { star: KP } })

    const later = probe()
    render(
      <MemoryRouter initialEntries={['/map/math']}>
        <Probe map={map} out={later} />
      </MemoryRouter>,
    )
    expect(later.path).toBe('/map/math')
    expect(later.current?.star).toBeNull()

    const someoneElse = probe()
    render(
      <MemoryRouter initialEntries={['/map/math']}>
        <Probe map={map} ownerId="student-2" out={someoneElse} />
      </MemoryRouter>,
    )
    expect(someoneElse.current?.star?.unitId).toBe(KP)
  })
})

describe('plan B, the question', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('asks a newcomer who takes more than one subject, the route staying on the galaxy', () => {
    const map = newcomerMap()
    expect(startableSubjects(map).map((galaxy) => galaxy.subjectId)).toEqual(['math', 'physics'])
    const out = probe()
    render(
      <MemoryRouter initialEntries={['/map/math']}>
        <Probe map={map} out={out} />
      </MemoryRouter>,
    )
    expect(out.current?.asking?.map((galaxy) => galaxy.subjectId)).toEqual(['math', 'physics'])
    expect(out.current?.target).toEqual({ layer: 'map' })
    expect(out.path).toBe('/map/math')
  })

  it("flies to the answer's recommended star, and the route follows once the flight is over", () => {
    vi.useFakeTimers()
    const map = newcomerMap()
    const physics = map.stars.find((star) => star.recommendation && subjectOfNebula(map, star.nebulaId) === 'physics')!
    const out = probe()
    render(
      <MemoryRouter initialEntries={['/map/math']}>
        <Probe map={map} out={out} />
      </MemoryRouter>,
    )
    act(() => out.current?.choose('physics'))
    expect(out.current?.asking).toBeNull()
    expect(out.current?.target).toEqual({ layer: 'nebula', nebulaId: physics.nebulaId, whole: { star: physics.unitId } })
    expect(out.path).toBe('/map/math')
    act(() => {
      vi.advanceTimersByTime(ZOOM.flightMs + 100)
    })
    expect(out.path).toBe(`/map/physics/${physics.nebulaId}`)
    expect(sessionStorage.getItem(`${ANSWER_KEY}.student-1`)).toBe('physics')
  })

  it('lands "Not sure" on the galaxy in focus', () => {
    const map = newcomerMap()
    const out = probe()
    render(
      <MemoryRouter initialEntries={['/map/math']}>
        <Probe map={map} out={out} />
      </MemoryRouter>,
    )
    act(() => out.current?.choose(null))
    expect(out.current?.target).toEqual({ layer: 'nebula', nebulaId: TOPIC, whole: { star: KP } })
  })
})

describe('the first lighting', () => {
  it('lights the demo knowledge point once its lessons are done, and moves the recommendation on', () => {
    const map = newcomerMap(1000, ALL_LESSONS)
    const kp = map.stars.find((star) => star.unitId === KP)!
    expect(kp.state).toBe('lit')
    expect(kp.recommendation).toBeNull()
    const next = map.stars.filter((star) => star.recommendation && subjectOfNebula(map, star.nebulaId) === 'math')
    expect(next).toHaveLength(1)
    expect(next[0].state).toBe('ready')
    expect(map.summary.lit).toBe(1)
    expect(newcomerMap(1000, ALL_LESSONS.slice(0, 1)).stars.find((star) => star.unitId === KP)?.state).toBe('in_progress')
  })

  it("is the student's first when it is the only star lit in the sky", () => {
    expect(isFirstLit(newcomerMap(1000, ALL_LESSONS), KP)).toBe(true)
    expect(isFirstLit(demoMap(), KP)).toBe(false)
    expect(isNewcomer(newcomerMap(1000, ALL_LESSONS))).toBe(false)
  })
})

function RevealProbe({ map, out }: { map: StarMap; out: { current: FirstReveal | null; path: string; revealed: string[] } }) {
  const location = useLocation()
  const [, , , topicId, unitId] = location.pathname.split('/')
  out.current = useFirstReveal(map, resolveTarget(map, topicId, unitId), (id) => out.revealed.push(id))
  out.path = location.pathname
  return null
}

describe('the reveal', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('pulls back to the galaxy once the first flare is over, Murmi beside the next star', () => {
    vi.useFakeTimers()
    const map = newcomerMap(1000, ALL_LESSONS)
    const out = { current: null as FirstReveal | null, path: '', revealed: [] as string[] }
    render(
      <MemoryRouter initialEntries={[`/map/math/${TOPIC}`]}>
        <RevealProbe map={map} out={out} />
      </MemoryRouter>,
    )
    act(() => out.current?.onReveal(KP))
    expect(out.revealed).toEqual([KP])
    expect(out.current?.target).toBeNull()
    act(() => {
      vi.advanceTimersByTime(FLARE_MS - FLARE_PEAK_MS + REVEAL_HOLD_MS)
    })
    const next = map.stars.find((star) => star.recommendation && subjectOfNebula(map, star.nebulaId) === 'math')!
    expect(out.path).toBe('/map/math')
    expect(out.current?.target).toEqual({ layer: 'map', fly: true })
    expect(out.current?.star?.unitId).toBe(next.unitId)
    expect(out.current?.next).toBe(`/map/math/${next.nebulaId}/${next.unitId}`)
  })

  it('does nothing for a star that is not the first lit', () => {
    vi.useFakeTimers()
    const map = demoStarMapOverride(demoStarMap('math', 1000, i18n.getFixedT('en', 'starmap'), { language: 'en' }), 1000, ALL_LESSONS)
    const out = { current: null as FirstReveal | null, path: '', revealed: [] as string[] }
    render(
      <MemoryRouter initialEntries={[`/map/math/${TOPIC}`]}>
        <RevealProbe map={map} out={out} />
      </MemoryRouter>,
    )
    act(() => out.current?.onReveal(KP))
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(out.path).toBe(`/map/math/${TOPIC}`)
    expect(out.current?.star).toBeNull()
  })
})

describe('the bubble', () => {
  it('says where to start, leads into the chapter, and goes on "Look around first" or Escape', () => {
    const star = newcomerMap().stars.find((candidate) => candidate.unitId === KP)!
    const clock = fakeClock()
    let dismissed = 0
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <FirstLandingBubble star={star} locate={() => ({ x: 100, y: 100, size: 20 })} onDismiss={() => (dismissed += 1)} scheduler={clock} />
        </MemoryRouter>
      </I18nextProvider>,
    )
    // jsdom lays nothing out: give the layer a size, and let the bubble find its star.
    const layer = document.querySelector<HTMLElement>('[data-first-landing]')!
    Object.defineProperty(layer, 'clientWidth', { value: 1024 })
    Object.defineProperty(layer, 'clientHeight', { value: 700 })
    act(() => clock.advance(500))
    expect(layer.querySelector('[data-shown]')).not.toBeNull()
    // Still since it was placed: the bubble stops asking for frames (#330 M4).
    expect(clock.pending).toBe(0)
    expect(screen.getByRole('heading', { name: `Start here: ${star.name}` })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Start this star' }).getAttribute('href')).toBe(`/chapter/${KP}`)
    fireEvent.click(screen.getByRole('button', { name: 'Look around first' }))
    fireEvent.keyDown(screen.getByRole('complementary'), { key: 'Escape' })
    expect(dismissed).toBe(2)
  })

  it('docks above the controls along the bottom on a phone, and under the top ones when that would cover the star', () => {
    const layer = { width: 375, height: 767 }
    const controls = [
      { x0: 16, y0: 40, x1: 359, y1: 132 }, // switcher and the way back
      { x0: 308, y0: 573, x1: 360, y1: 671 }, // zoom
      { x0: 315, y0: 420, x1: 359, y1: 464 }, // Ask's button on the edge
    ]
    const high = dockedPlace({ x: 280, y: 300, size: 20 }, { height: 150 }, layer, controls)
    expect(high).toMatchObject({ side: 'docked-bottom', x: 16, y: 573 - 16 - 150 })
    expect(16 + high.width).toBeLessThanOrEqual(315)

    const low = dockedPlace({ x: 280, y: 480, size: 20 }, { height: 150 }, layer, controls)
    expect(low).toMatchObject({ side: 'docked-top', x: 16, y: 132 + 16 })
  })
})
