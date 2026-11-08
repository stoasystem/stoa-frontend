/**
 * "About you" before the first landing, and the landing by profile (#591):
 *
 *   - asked of a student whose profile holds no year group from the
 *     backend's list (nothing said, or old free text), not of one who said
 *     one, and not when the backend sends no list;
 *   - "Later" (and Escape) goes on to the map and is kept for this tab;
 *   - "Done" saves the year group's code and the subjects ticked, then shows
 *     the map; a failed save is said on the card, and the student can still go on;
 *   - the subjects ticked answer plan B's question before it is asked: the
 *     landing goes to the first ticked subject's recommended star;
 *   - a star recommended by year group is introduced as such;
 *   - the design preview's demo backend follows it all as the backend does.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { demoStarMap } from '@/dev/demo/sky/demoStarMap'
import { DEMO_KNOWLEDGE_POINT } from '@/dev/demo/sky/demoSky'
import { asNewcomer } from '@/dev/demo/sky/newcomer'
import { resetDemoServer, startAsNewcomer } from '@/dev/preview/demoSource'
import { answer } from '@/dev/preview/handlers'
import { demoStarMapOverride } from '@/dev/preview/lighting'
import { subjectOfNebula, type StarMap } from '@/features/starmap/model/starMap'
import { aboutYouPassedKey, AboutYouGate } from '@/features/starmap/onboarding/AboutYouGate'
import { FirstLandingBubble } from '@/features/starmap/onboarding/FirstLandingBubble'
import { tickedSubject, useFirstLanding, type FirstLanding } from '@/features/starmap/onboarding/useFirstLanding'
import { StarMapSourceContext, type StarMapSource } from '@/features/starmap/starMapSource'
import { resolveTarget } from '@/features/starmap/view/layers'
import i18n from '@/i18n'
import enStarmap from '@/i18n/locales/en/starmap.json'
import { KNOWLEDGE_MAP_KEY } from '@/hooks/practice/useKnowledgeMapQuery'
import { asksGrade, readableGrade, saysGrade } from '@/lib/profileChoices'
import { ApiError } from '@/services/api/httpClient'
import { getStudentProfile, updateStudentProfile } from '@/services/student/studentApi'
import { studentQueryKeys } from '@/services/student/studentQueryKeys'
import { useAuthStore } from '@/store/authStore'
import type { StudentProfile } from '@/types/student'
import { fakeClock } from './starmapHarness'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/services/student/studentApi', () => ({
  getStudentProfile: vi.fn(),
  updateStudentProfile: vi.fn(),
}))

const OWNER = 'student-591'
const copy = enStarmap.aboutYou
const GRADES = [
  { code: 'grade_8_secondary', label: 'Year 8 (lower secondary)' },
  { code: 'grade_9_secondary', label: 'Year 9 (lower secondary)' },
]

function profile(grade: string, over: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: 'p-1',
    userId: OWNER,
    name: 'Lea',
    email: 'lea@example.com',
    grade,
    primarySubjects: [],
    preferredAnswerLanguage: 'en',
    guardianStatus: 'not_linked',
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-01T08:00:00Z',
    choices: { grade: GRADES },
    ...over,
  }
}

const demoMap = (): StarMap => demoStarMapOverride(demoStarMap('math', 1000, i18n.getFixedT('en', 'starmap'), { language: 'en' }), 1000)
/** A new student's sky: mathematics and physics taken, chemistry not. */
const newcomerMap = () => asNewcomer(demoMap())
const sky: StarMapSource = { demo: true, read: () => newcomerMap() }

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

function open(path = '/', ui: ReactNode = <p>the map</p>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <StarMapSourceContext.Provider value={sky}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/" element={<AboutYouGate>{ui}</AboutYouGate>} />
              <Route path="/map/:subjectId/:topicId?/:unitId?" element={<AboutYouGate>{ui}</AboutYouGate>} />
            </Routes>
            <Where />
          </MemoryRouter>
        </StarMapSourceContext.Provider>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return client
}

const card = () => screen.findByRole('region', { name: copy.title })

beforeEach(async () => {
  await i18n.changeLanguage('en')
  sessionStorage.clear()
  vi.mocked(getStudentProfile).mockReset()
  vi.mocked(updateStudentProfile).mockReset()
  useAuthStore.setState({ user: { id: OWNER, name: 'Lea', email: 'lea@example.com', role: 'student' } as never, accessToken: 't', isAuthenticated: true })
})

afterAll(() => {
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

describe('whose year group is asked', () => {
  it('reads a year group only as a code from the list', () => {
    expect(readableGrade(profile('grade_9_secondary'))).toBe('grade_9_secondary')
    expect(readableGrade(profile(''))).toBe('')
    // Old free text the backend could not read back as a code.
    expect(readableGrade(profile('6. Klasse'))).toBe('')
    expect(readableGrade(profile('grade_6'))).toBe('')
  })

  it('asks when the list is there and the profile holds nothing from it; not without a list', () => {
    expect(asksGrade(profile(''))).toBe(true)
    expect(asksGrade(profile('14'))).toBe(true)
    expect(asksGrade(profile('grade_8_secondary'))).toBe(false)
    expect(asksGrade(profile('', { choices: undefined }))).toBe(false)
  })

  it("keeps Ask's hint for a year group not said, and for text from a backend with no list yet", () => {
    expect(saysGrade(profile('grade_8_secondary'))).toBe(true)
    expect(saysGrade(profile('6. Klasse'))).toBe(false)
    expect(saysGrade(profile('8', { choices: undefined }))).toBe(true)
    expect(saysGrade(profile(' ', { choices: undefined }))).toBe(false)
  })
})

describe('"About you" before the map', () => {
  it('comes first for a student without a readable year group, its first field focused', async () => {
    vi.mocked(getStudentProfile).mockResolvedValue(profile('6. Klasse'))
    open()

    const region = await card()
    expect(screen.queryByText('the map')).toBeNull()
    const grade = within(region).getByRole('combobox', { name: copy.grade })
    await waitFor(() => expect(grade).toHaveFocus())
    // The backend's list, in its order and names, nothing chosen.
    expect(within(grade).getAllByRole('option').map((option) => option.textContent)).toEqual([copy.gradeNone, ...GRADES.map((choice) => choice.label)])
    expect(grade).toHaveValue('')
    // The subjects taken already are ticked; the others are offered.
    const subjects = within(region).getByRole('group', { name: copy.subjects })
    expect(within(subjects).getByRole('checkbox', { name: 'Mathematics' })).toBeChecked()
    expect(within(subjects).getByRole('checkbox', { name: 'Physics' })).toBeChecked()
    expect(within(subjects).getByRole('checkbox', { name: 'Chemistry' })).not.toBeChecked()
    // "Later" says what it means.
    expect(within(region).getByRole('button', { name: copy.later })).toHaveAccessibleDescription(copy.laterNote)
  })

  it('does not come for a student who said a year group', async () => {
    vi.mocked(getStudentProfile).mockResolvedValue(profile('grade_9_secondary'))
    open()

    expect(await screen.findByText('the map')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: copy.title })).toBeNull()
  })

  it('does not come where a nebula or a star was asked for', async () => {
    vi.mocked(getStudentProfile).mockResolvedValue(profile(''))
    open('/map/math/numbers')
    expect(await screen.findByText('the map')).toBeInTheDocument()
  })

  it('does not hold the map when the profile cannot be read', async () => {
    vi.mocked(getStudentProfile).mockRejectedValue(new ApiError('upstream', { status: 503 }))
    open()
    expect(await screen.findByText('the map')).toBeInTheDocument()
  })

  it('"Later" goes on to the map, and is not asked again in this tab', async () => {
    vi.mocked(getStudentProfile).mockResolvedValue(profile(''))
    const user = userEvent.setup()
    open()
    await user.click(within(await card()).getByRole('button', { name: copy.later }))

    expect(await screen.findByText('the map')).toBeInTheDocument()
    expect(updateStudentProfile).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(aboutYouPassedKey(OWNER))).toBe('1')
  })

  it('is not asked again in a tab that put it off', async () => {
    sessionStorage.setItem(aboutYouPassedKey(OWNER), '1')
    vi.mocked(getStudentProfile).mockResolvedValue(profile(''))
    open()
    expect(await screen.findByText('the map')).toBeInTheDocument()
  })

  it('takes Escape as "Later"', async () => {
    vi.mocked(getStudentProfile).mockResolvedValue(profile(''))
    open()
    const grade = within(await card()).getByRole('combobox', { name: copy.grade })
    fireEvent.keyDown(grade, { key: 'Escape' })
    expect(await screen.findByText('the map')).toBeInTheDocument()
  })

  it('"Done" saves the code and the subjects ticked, reads the sky again, then shows the map', async () => {
    vi.mocked(getStudentProfile).mockResolvedValue(profile(''))
    vi.mocked(updateStudentProfile).mockImplementation(async (update) => profile(update.grade ?? '', { primarySubjects: update.primarySubjects ?? [] }))
    const user = userEvent.setup()
    const client = open()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const region = await card()

    await user.selectOptions(within(region).getByRole('combobox', { name: copy.grade }), 'Year 9 (lower secondary)')
    await user.click(within(region).getByRole('checkbox', { name: 'Physics' }))
    await user.click(within(region).getByRole('checkbox', { name: 'Chemistry' }))
    await user.click(within(region).getByRole('button', { name: copy.done }))

    expect(await screen.findByText('the map')).toBeInTheDocument()
    expect(updateStudentProfile).toHaveBeenCalledWith({ grade: 'grade_9_secondary', primarySubjects: ['math', 'chemistry'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: KNOWLEDGE_MAP_KEY })
    expect(client.getQueryData(studentQueryKeys.profile())).toMatchObject({ grade: 'grade_9_secondary' })
  })

  it('says a failed save on the card, and still lets the student go on', async () => {
    vi.mocked(getStudentProfile).mockResolvedValue(profile(''))
    vi.mocked(updateStudentProfile).mockRejectedValue(new ApiError('upstream', { status: 503 }))
    const user = userEvent.setup()
    open()
    const region = await card()
    await user.selectOptions(within(region).getByRole('combobox', { name: copy.grade }), 'grade_8_secondary')
    await user.click(within(region).getByRole('button', { name: copy.done }))

    expect(await within(region).findByRole('alert')).toHaveTextContent(copy.saveFailed)
    expect(screen.queryByText('the map')).toBeNull()
    await user.click(within(region).getByRole('button', { name: copy.later }))
    expect(await screen.findByText('the map')).toBeInTheDocument()
  })

  it('names the year group field when the backend no longer offers the one chosen', async () => {
    vi.mocked(getStudentProfile).mockResolvedValue(profile(''))
    vi.mocked(updateStudentProfile).mockRejectedValue(
      new ApiError('Choose a year group from the list.', { status: 422, code: 'profile_choice_unknown', detail: { code: 'profile_choice_unknown', fields: ['grade'] } }),
    )
    const user = userEvent.setup()
    open()
    const region = await card()
    const grade = within(region).getByRole('combobox', { name: copy.grade })
    await user.selectOptions(grade, 'grade_8_secondary')
    await user.click(within(region).getByRole('button', { name: copy.done }))

    expect(await within(region).findByRole('alert')).toHaveTextContent(copy.unknownGrade)
    expect(grade).toHaveAttribute('aria-invalid', 'true')
    expect(grade).toHaveAccessibleDescription(copy.unknownGrade)
  })
})

function Probe({ map, primarySubjects, out }: { map: StarMap; primarySubjects?: string[]; out: { current: FirstLanding | null } }) {
  const location = useLocation()
  const [, , , topicId, unitId] = location.pathname.split('/')
  out.current = useFirstLanding(map, resolveTarget(map, topicId, unitId), OWNER, primarySubjects)
  return null
}

describe('the landing by profile', () => {
  it('reads the first ticked subject that has somewhere to start', () => {
    const map = newcomerMap()
    expect(tickedSubject(map, [])).toBeNull()
    expect(tickedSubject(map, ['chemistry', 'physics', 'math'])).toBe('physics')
    // Ticked, but nowhere to start: plan B is not asked, the galaxy in focus is landed on.
    expect(tickedSubject(map, ['chemistry'])).toBe('')
  })

  it('skips the question of which subject when the profile ticks subjects, and lands in the first', () => {
    const map = newcomerMap()
    const out = { current: null as FirstLanding | null }
    render(
      <MemoryRouter initialEntries={['/map/math']}>
        <Probe map={map} primarySubjects={['physics']} out={out} />
      </MemoryRouter>,
    )
    expect(out.current?.asking).toBeNull()
    const star = out.current?.star
    expect(star && subjectOfNebula(map, star.nebulaId)).toBe('physics')
  })

  it('still asks a student who takes more than one subject and ticked none', () => {
    const out = { current: null as FirstLanding | null }
    render(
      <MemoryRouter initialEntries={['/map/math']}>
        <Probe map={newcomerMap()} primarySubjects={[]} out={out} />
      </MemoryRouter>,
    )
    expect(out.current?.asking?.map((galaxy) => galaxy.subjectId)).toEqual(['math', 'physics'])
  })

  it('leaves a newcomer the backend recommends nothing to on the galaxy, asked nothing, as before', () => {
    // A real new account that ticked no subject: enrolled nowhere, so no recommendation (stoa-backend#321).
    const fresh = newcomerMap()
    const bare: StarMap = {
      ...fresh,
      subjects: fresh.subjects.map((galaxy) => ({ ...galaxy, enrolled: false })),
      stars: fresh.stars.map((star) => ({ ...star, recommendation: null })),
    }
    for (const primarySubjects of [[], ['math']]) {
      const out = { current: null as FirstLanding | null }
      render(
        <MemoryRouter initialEntries={['/map/math']}>
          <Probe map={bare} primarySubjects={primarySubjects} out={out} />
        </MemoryRouter>,
      )
      expect(out.current?.asking).toBeNull()
      expect(out.current?.star).toBeNull()
      expect(out.current?.target).toEqual({ layer: 'map' })
    }
  })

  it('introduces a star recommended by year group as such', () => {
    const map = asNewcomer(demoMap(), [], 'en', { grade: 'grade_9_secondary', primarySubjects: ['math'] })
    const star = map.stars.find((candidate) => candidate.unitId === DEMO_KNOWLEDGE_POINT.unitId)!
    expect(star.recommendation).toEqual({ source: 'system', reason: 'grade', relatedUnitId: null })
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <FirstLandingBubble star={star} locate={() => null} onDismiss={() => {}} scheduler={fakeClock()} />
        </MemoryRouter>
      </I18nextProvider>,
    )
    const bubble = document.querySelector('[data-first-landing]')!
    expect(bubble.textContent).toContain(enStarmap.firstLanding.titleGrade.replace('{{name}}', star.name))
    expect(bubble.textContent).not.toContain(enStarmap.firstLanding.title.replace('{{name}}', star.name))
  })
})

describe("the design preview's demo backend", () => {
  beforeEach(() => resetDemoServer())

  const call = (method: string, body: unknown = null) =>
    Promise.resolve(answer({ method, path: '/students/me/profile', query: new URLSearchParams(), body }))

  it('starts a newcomer with no year group said and nothing ticked, and offers the list', async () => {
    startAsNewcomer(true)
    const read = (await call('GET'))?.data as StudentProfile
    expect(read.grade).toBe('')
    expect(read.primarySubjects).toEqual([])
    expect(read.choices?.grade.map((choice) => choice.code)).toContain('grade_9_secondary')
    expect(asksGrade(read)).toBe(true)
  })

  it('stores a code and the subjects, and refuses a code the list does not offer', async () => {
    startAsNewcomer(true)
    expect((await call('PATCH', { grade: 'grade_9_secondary', primarySubjects: ['math'] }))?.data).toMatchObject({ grade: 'grade_9_secondary', primarySubjects: ['math'] })
    const refused = await call('PATCH', { grade: 'grade_6' })
    expect(refused?.status).toBe(422)
    expect(refused?.data).toMatchObject({ detail: { code: 'profile_choice_unknown', fields: ['grade'] } })
    expect(((await call('GET'))?.data as StudentProfile).grade).toBe('grade_9_secondary')
  })

  it('recommends by year group as the backend does: year 9 at the demo knowledge point, the ticked subject taken', () => {
    const year9 = asNewcomer(demoMap(), [], 'en', { grade: 'grade_9_secondary', primarySubjects: ['chemistry'] })
    expect(year9.stars.find((star) => star.unitId === DEMO_KNOWLEDGE_POINT.unitId)?.recommendation?.reason).toBe('grade')
    expect(year9.subjects.find((galaxy) => galaxy.subjectId === 'chemistry')?.enrolled).toBe(true)
    // Physics has no years: where its course starts.
    const physics = year9.stars.filter((star) => star.recommendation && subjectOfNebula(year9, star.nebulaId) === 'physics')
    expect(physics.map((star) => star.recommendation?.reason)).toEqual(['start'])
    // Nothing said: where the course starts, as before (#591's "Later").
    const later = asNewcomer(demoMap(), [], 'en', { grade: '', primarySubjects: [] })
    expect(later.stars.find((star) => star.unitId === 'numbers-1')?.recommendation?.reason).toBe('start')
  })
})
