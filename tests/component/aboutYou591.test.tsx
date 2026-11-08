/**
 * "About you" before the first landing (#591):
 *
 *   - it asks a student whose profile has no year group the backend can read
 *     (none, or old text in no list), and nobody else;
 *   - the screen: focus on the year group, the backend's list in its order,
 *     the subjects ticked from the profile or the sky, Escape is "Later",
 *     a missing year group and a failed save are said and read out;
 *   - the answer is saved as codes and the sky read again before the landing,
 *     which waits for it; "Later" lets the landing go on, for this tab;
 *   - with subjects on the profile, plan B's question is not asked;
 *   - a star recommended for the year group says so;
 *   - the design preview's newcomer sky recommends by year group too.
 */
import { QueryClient, QueryClientProvider, QueryObserver } from '@tanstack/react-query'
import { act, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readableChoice } from '@/components/base/ChoiceSelect'
import { demoStarMapOverride } from '@/dev/preview/lighting'
import { demoStarMap } from '@/dev/demo/sky/demoStarMap'
import { DEMO_KNOWLEDGE_POINT } from '@/dev/demo/sky/demoSky'
import { asNewcomer } from '@/dev/demo/sky/newcomer'
import { AskServerProvider } from '@/features/ask/server/askServer'
import { recommendationReason } from '@/features/starmap/components/labels'
import type { StarMap } from '@/features/starmap/model/starMap'
import { AboutYou } from '@/features/starmap/onboarding/AboutYou'
import { FirstLandingBubble } from '@/features/starmap/onboarding/FirstLandingBubble'
import { asksAboutYou, hasReadableGrade, useAboutYou } from '@/features/starmap/onboarding/useAboutYou'
import { useFirstLanding, type FirstLanding } from '@/features/starmap/onboarding/useFirstLanding'
import { resolveTarget, type LayerTarget } from '@/features/starmap/view/layers'
import { KNOWLEDGE_MAP_KEY } from '@/hooks/practice/useKnowledgeMapQuery'
import i18n from '@/i18n'
import enStarmap from '@/i18n/locales/en/starmap.json'
import { updateStudentProfile } from '@/services/student/studentApi'
import type { StudentProfile } from '@/types/student'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'
import { GRADES } from '../fakes/profileChoices'
import { fakeClock } from './starmapHarness'

vi.mock('@/services/student/studentApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/student/studentApi')>()),
  updateStudentProfile: vi.fn(),
}))

const copy = enStarmap.aboutYou
const KP = DEMO_KNOWLEDGE_POINT.unitId
const KP_TOPIC = DEMO_KNOWLEDGE_POINT.topicId
/** Where a newcomer starts without a year group: mathematics' first star, "Integers". */
const START = 'numbers-1'

const demoMap = (): StarMap => demoStarMapOverride(demoStarMap('math', 1000, i18n.getFixedT('en', 'starmap'), { language: 'en' }), 1000)
const newcomerMap = (grade = '') => asNewcomer(demoMap(), [], 'en', grade)

function profile(over: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: 'p-1',
    userId: 'student-1',
    name: 'Lina Meier',
    email: 'lina@example.com',
    grade: '',
    primarySubjects: [],
    preferredAnswerLanguage: 'en',
    guardianStatus: 'not_linked',
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-01T09:00:00Z',
    choices: { grade: GRADES },
    ...over,
  }
}

beforeEach(async () => {
  sessionStorage.clear()
  vi.mocked(updateStudentProfile).mockReset()
  await i18n.changeLanguage('en')
})

afterEach(() => {
  vi.useRealTimers()
})

describe('who is asked', () => {
  it('reads a year group only as one of the backend\'s codes', () => {
    expect(readableChoice(GRADES, 'grade_9_secondary')).toBe('grade_9_secondary')
    expect(readableChoice(GRADES, '')).toBe('')
    // Old text the backend could not read comes back as stored: it is no year group (stoa-backend#310).
    expect(readableChoice(GRADES, '6. Klasse')).toBe('')
    expect(readableChoice(GRADES, '14')).toBe('')
    expect(readableChoice(undefined, 'grade_9_secondary')).toBe('')
  })

  it('asks a profile with no year group, or one nobody can read, and not one with a code', () => {
    expect(asksAboutYou(profile())).toBe(true)
    expect(asksAboutYou(profile({ grade: '6. Klasse' }))).toBe(true)
    expect(asksAboutYou(profile({ grade: 'grade_7_secondary' }))).toBe(false)
    expect(hasReadableGrade(profile({ grade: 'grade_7_secondary' }))).toBe(true)
  })

  it('asks nothing of a backend from before stoa-backend#310, which offers no list', () => {
    expect(asksAboutYou(profile({ choices: undefined }))).toBe(false)
  })
})

function harness(server: FakeAskServer) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <AskServerProvider value={server}>{children}</AskServerProvider>
    </QueryClientProvider>
  )
  return { client, wrapper }
}

function serverWith(p: StudentProfile) {
  const server = createFakeAskServer()
  server.profile = p
  return server
}

describe('when it is up (useAboutYou)', () => {
  it('holds the landing while the profile is read, then asks a student with no year group', async () => {
    const server = serverWith(profile())
    const release = server.holdNext('getStudentProfile')
    const { wrapper } = harness(server)
    const { result } = renderHook(() => useAboutYou(true, 'student-1'), { wrapper })
    expect(result.current).toMatchObject({ grades: null, hold: true })
    act(() => release())
    await waitFor(() => expect(result.current.grades).toEqual(GRADES))
    expect(result.current.hold).toBe(true)
  })

  it('does not ask, nor hold, a student whose year group is a code', async () => {
    const { wrapper } = harness(serverWith(profile({ grade: 'grade_8_secondary', primarySubjects: ['math'] })))
    const { result } = renderHook(() => useAboutYou(true, 'student-1'), { wrapper })
    await waitFor(() => expect(result.current.hold).toBe(false))
    expect(result.current.grades).toBeNull()
    expect(result.current.subjects).toEqual(['math'])
  })

  it('asks no one but a student, and reads no profile for anyone else', () => {
    const server = serverWith(profile())
    const { wrapper } = harness(server)
    const { result } = renderHook(() => useAboutYou(false, 'teacher-1'), { wrapper })
    expect(result.current).toMatchObject({ grades: null, hold: false })
    expect(server.student.getStudentProfile).not.toHaveBeenCalled()
  })

  it('lets go when the profile cannot be read: nothing asked, nothing held', async () => {
    const server = serverWith(profile())
    server.refuseNextWith(new Error('down'), 'getStudentProfile')
    const { wrapper } = harness(server)
    const { result } = renderHook(() => useAboutYou(true, 'student-1'), { wrapper })
    await waitFor(() => expect(result.current.hold).toBe(false))
    expect(result.current.grades).toBeNull()
  })

  it('"Later" is kept for this tab and this account only', async () => {
    const { wrapper } = harness(serverWith(profile()))
    const { result } = renderHook(() => useAboutYou(true, 'student-1'), { wrapper })
    await waitFor(() => expect(result.current.grades).not.toBeNull())
    act(() => result.current.later())
    expect(result.current).toMatchObject({ grades: null, hold: false })

    const again = renderHook(() => useAboutYou(true, 'student-1'), { wrapper })
    await waitFor(() => expect(again.result.current.hold).toBe(false))
    expect(again.result.current.grades).toBeNull()

    const someoneElse = renderHook(() => useAboutYou(true, 'student-2'), { wrapper })
    await waitFor(() => expect(someoneElse.result.current.grades).not.toBeNull())
  })

  it('saves codes, reads the sky again, and only then lets the landing go', async () => {
    const { client, wrapper } = harness(serverWith(profile()))
    vi.mocked(updateStudentProfile).mockResolvedValue(profile({ grade: 'grade_9_secondary', primarySubjects: ['math'] }))
    let skyRead: () => void = () => {}
    // The first read answers at once; the one after the save waits until the test lets it go.
    const sky = vi.fn(() => (sky.mock.calls.length === 1 ? Promise.resolve(null) : new Promise<null>((resolve) => (skyRead = () => resolve(null)))))
    // The sky is on screen: invalidating it reads it again, and the save waits for that read.
    const stop = new QueryObserver(client, { queryKey: KNOWLEDGE_MAP_KEY, queryFn: sky }).subscribe(() => {})
    await waitFor(() => expect(sky).toHaveBeenCalledTimes(1))
    const { result } = renderHook(() => useAboutYou(true, 'student-1'), { wrapper })
    await waitFor(() => expect(result.current.grades).not.toBeNull())

    act(() => result.current.save({ grade: 'grade_9_secondary', subjects: ['math'] }))
    await waitFor(() => expect(sky).toHaveBeenCalledTimes(2))
    expect(updateStudentProfile).toHaveBeenCalledWith({ grade: 'grade_9_secondary', primarySubjects: ['math'] })
    // Saved, the sky still on its way: the question stays up, saying it saves, and the landing waits.
    expect(result.current).toMatchObject({ saving: true, hold: true })
    expect(result.current.grades).not.toBeNull()

    act(() => skyRead())
    await waitFor(() => expect(result.current.hold).toBe(false))
    expect(result.current.grades).toBeNull()
    expect(result.current.subjects).toEqual(['math'])
    stop()
  })

  it('keeps the question up when the save fails, and "Later" still goes on', async () => {
    const { wrapper } = harness(serverWith(profile()))
    vi.mocked(updateStudentProfile).mockRejectedValue(new Error('upstream'))
    const { result } = renderHook(() => useAboutYou(true, 'student-1'), { wrapper })
    await waitFor(() => expect(result.current.grades).not.toBeNull())
    act(() => result.current.save({ grade: 'grade_9_secondary', subjects: [] }))
    await waitFor(() => expect(result.current.failed).toBe(true))
    expect(result.current).toMatchObject({ saving: false, hold: true })
    act(() => result.current.later())
    expect(result.current.hold).toBe(false)
  })
})

describe('the screen', () => {
  const galaxies = [
    { subjectId: 'math', name: 'Mathematics', enrolled: true },
    { subjectId: 'physics', name: 'Physics', enrolled: true },
    { subjectId: 'chemistry', name: 'Chemistry', enrolled: false },
  ]
  const show = (over: Partial<Parameters<typeof AboutYou>[0]> = {}) => {
    const onSave = vi.fn()
    const onLater = vi.fn()
    render(
      <I18nextProvider i18n={i18n}>
        <AboutYou grades={GRADES} galaxies={galaxies} ticked={null} saving={false} failed={false} onSave={onSave} onLater={onLater} {...over} />
      </I18nextProvider>,
    )
    return { onSave, onLater, region: screen.getByRole('region', { name: copy.title }) }
  }

  it('says why it asks, and starts on the year group, offering the backend\'s list in its order', () => {
    const { region } = show()
    expect(region).toHaveTextContent(copy.why)
    const grade = within(region).getByRole('combobox', { name: copy.grade })
    expect(grade).toHaveFocus()
    expect(grade).toHaveValue('')
    expect(within(grade).getAllByRole('option').map((option) => option.textContent)).toEqual([copy.gradePlaceholder, ...GRADES.map((choice) => choice.label)])
    expect(region).toHaveTextContent(copy.laterNote)
  })

  it('ticks the subjects the student takes, or the ones the profile names', () => {
    const { region } = show()
    const group = within(region).getByRole('group', { name: copy.subjects })
    expect(within(group).getByRole('checkbox', { name: 'Mathematics' })).toBeChecked()
    expect(within(group).getByRole('checkbox', { name: 'Physics' })).toBeChecked()
    expect(within(group).getByRole('checkbox', { name: 'Chemistry' })).not.toBeChecked()
  })

  it('ticks only what the profile names when it names any', () => {
    show({ ticked: ['chemistry'] })
    expect(screen.getByRole('checkbox', { name: 'Chemistry' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Mathematics' })).not.toBeChecked()
  })

  it('saves the code chosen and the subjects ticked', async () => {
    const user = userEvent.setup()
    const { onSave } = show()
    await user.selectOptions(screen.getByRole('combobox', { name: copy.grade }), 'Year 9 (lower secondary)')
    await user.click(screen.getByRole('checkbox', { name: 'Physics' }))
    await user.click(screen.getByRole('checkbox', { name: 'Chemistry' }))
    await user.click(screen.getByRole('button', { name: copy.done }))
    expect(onSave).toHaveBeenCalledWith({ grade: 'grade_9_secondary', subjects: ['math', 'chemistry'] })
  })

  it('says a year group is missing, on the field and read out with it, and sends nothing', async () => {
    const user = userEvent.setup()
    const { onSave } = show()
    await user.click(screen.getByRole('button', { name: copy.done }))
    const grade = screen.getByRole('combobox', { name: copy.grade })
    expect(grade).toHaveAttribute('aria-invalid', 'true')
    expect(grade).toHaveAccessibleDescription(copy.gradeMissing)
    expect(grade).toHaveFocus()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('takes Escape for "Later", as the button', async () => {
    const user = userEvent.setup()
    const { onLater } = show()
    await user.keyboard('{Escape}')
    expect(onLater).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: copy.later }))
    expect(onLater).toHaveBeenCalledTimes(2)
  })

  it('reads out a failed save from a live region already on the page', () => {
    const { region } = show()
    const alert = within(region).getByRole('alert')
    expect(alert).toBeEmptyDOMElement()
  })

  it('says so when the save failed', () => {
    show({ failed: true })
    expect(screen.getByRole('alert')).toHaveTextContent(copy.saveFailed)
  })

  it('says it is saving, and does not send twice', async () => {
    const user = userEvent.setup()
    const { onSave } = show({ saving: true })
    await user.click(screen.getByRole('button', { name: copy.saving }))
    expect(onSave).not.toHaveBeenCalled()
  })
})

function Probe({ map, hold, subjects, out }: { map: StarMap; hold?: boolean; subjects?: readonly string[] | null; out: { current: FirstLanding | null; path: string } }) {
  const location = useLocation()
  const [, , , topicId, unitId] = location.pathname.split('/')
  const target: LayerTarget = resolveTarget(map, topicId, unitId)
  out.current = useFirstLanding(map, target, 'student-1', { hold, subjects })
  out.path = location.pathname
  return null
}

describe('the landing after it', () => {
  it('waits while held, then lands on the star recommended for the year group', () => {
    const out = { current: null as FirstLanding | null, path: '' }
    const view = render(
      <MemoryRouter initialEntries={['/map/math']}>
        <Probe map={newcomerMap()} hold subjects={null} out={out} />
      </MemoryRouter>,
    )
    expect(out.path).toBe('/map/math')
    expect(out.current?.target).toEqual({ layer: 'map' })
    expect(out.current?.asking).toBeNull()

    // Saved, and the sky read again: the year group's star, and no question, as the profile names subjects now.
    view.rerender(
      <MemoryRouter initialEntries={['/map/math']}>
        <Probe map={newcomerMap('grade_9_secondary')} hold={false} subjects={['math', 'physics']} out={out} />
      </MemoryRouter>,
    )
    expect(out.current?.asking).toBeNull()
    expect(out.path).toBe(`/map/math/${KP_TOPIC}`)
    expect(out.current?.star?.unitId).toBe(KP)
    expect(out.current?.star?.recommendation?.reason).toBe('grade')
  })

  it('after "Later", asks plan B\'s question as before and starts where the course starts', () => {
    const map = newcomerMap()
    const out = { current: null as FirstLanding | null, path: '' }
    render(
      <MemoryRouter initialEntries={['/map/math']}>
        <Probe map={map} subjects={null} out={out} />
      </MemoryRouter>,
    )
    expect(out.current?.asking?.map((galaxy) => galaxy.subjectId)).toEqual(['math', 'physics'])
    act(() => out.current?.choose('math'))
    expect(out.current?.target).toEqual({ layer: 'nebula', nebulaId: 'numbers', whole: { star: START } })
  })

  it('does not ask which subject when the profile names one, and goes to the first it names', () => {
    const out = { current: null as FirstLanding | null, path: '' }
    render(
      <MemoryRouter initialEntries={['/map/math']}>
        <Probe map={newcomerMap()} subjects={['chemistry', 'physics', 'math']} out={out} />
      </MemoryRouter>,
    )
    expect(out.current?.asking).toBeNull()
    // Chemistry has nowhere to start (not taken): physics is the first named that has.
    expect(out.path.startsWith('/map/physics/')).toBe(true)
  })
})

describe('a star recommended for the year group', () => {
  it('has Murmi say so', () => {
    const star = newcomerMap('grade_9_secondary').stars.find((candidate) => candidate.unitId === KP)!
    const clock = fakeClock()
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <FirstLandingBubble star={star} locate={() => ({ x: 100, y: 100, size: 20 })} onDismiss={() => {}} scheduler={clock} />
        </MemoryRouter>
      </I18nextProvider>,
    )
    // jsdom lays nothing out: give the layer a size, and let the bubble find its star.
    const layer = document.querySelector<HTMLElement>('[data-first-landing]')!
    Object.defineProperty(layer, 'clientWidth', { value: 1024 })
    Object.defineProperty(layer, 'clientHeight', { value: 700 })
    act(() => clock.advance(500))
    expect(screen.getByRole('heading', { name: enStarmap.firstLanding.titleGrade.replace('{{name}}', star.name) })).toBeInTheDocument()
  })

  it('says why on its card', () => {
    const t = i18n.getFixedT('en', 'starmap')
    expect(recommendationReason(t, [], { source: 'system', reason: 'grade', relatedUnitId: null })).toBe(enStarmap.marker.reason.grade)
  })
})

describe("the design preview's newcomer sky, by year group", () => {
  it('starts a lower-secondary year on the demo knowledge point, and keeps one recommendation per subject', () => {
    const map = newcomerMap('grade_9_secondary')
    const kp = map.stars.find((star) => star.unitId === KP)
    expect(kp?.recommendation).toEqual({ source: 'system', reason: 'grade', relatedUnitId: null })
    expect(map.stars.find((star) => star.unitId === START)?.recommendation).toBeNull()
  })

  it('keeps "Integers" for a primary year, said to be for that year, and "start" with no year group', () => {
    expect(newcomerMap('grade_4_primary').stars.find((star) => star.unitId === START)?.recommendation?.reason).toBe('grade')
    expect(newcomerMap('').stars.find((star) => star.unitId === START)?.recommendation?.reason).toBe('start')
    expect(newcomerMap('6. Klasse').stars.find((star) => star.unitId === START)?.recommendation?.reason).toBe('start')
  })

  it('gives the same arrays for the same year group, as the engine compares by identity', () => {
    const map = demoMap()
    expect(asNewcomer(map, [], 'en', 'grade_9_secondary').stars).toBe(asNewcomer(map, [], 'en', 'grade_9_secondary').stars)
  })
})
