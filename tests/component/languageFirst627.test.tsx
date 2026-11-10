/**
 * The language first (#627): before "About you", a student whose account never
 * stored a language picks the one the app speaks to them in.
 *
 *   - it asks only when the student profile's `preferredAnswerLanguage` is
 *     null (the backend's stored `preferred_locale` as it is), only a student,
 *     and nothing when the profile cannot be read;
 *   - the browser's language is chosen to begin with, else the one on screen,
 *     and the screen switches to it, and to every language picked, at once;
 *   - "Continue" stores the language on the account, also the one already on
 *     screen; a store that fails goes on all the same, not asked again in this
 *     tab;
 *   - the card: four languages by their own names, the chosen one checked
 *     and focused, no "Later";
 *   - on the map, "About you" waits for it and follows in the language chosen;
 *   - its words in four languages.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { readDemoStarMap } from '@/dev/demo/sky/source'
import { AskServerProvider } from '@/features/ask/server/askServer'
import { LanguageFirst } from '@/features/starmap/onboarding/LanguageFirst'
import { asksLanguage, useLanguageFirst } from '@/features/starmap/onboarding/useLanguageFirst'
import { StarMapRoute } from '@/features/starmap/StarMapRoute'
import { StarMapSourceContext, type StarMapSource } from '@/features/starmap/starMapSource'
import i18n from '@/i18n'
import { browserLanguage, type SupportedLanguage } from '@/i18n/languages'
import de from '@/i18n/locales/de/starmap.json'
import en from '@/i18n/locales/en/starmap.json'
import fr from '@/i18n/locales/fr/starmap.json'
import it_ from '@/i18n/locales/it/starmap.json'
import { updateLocalePreference } from '@/services/auth/authApi'
import { useAuthStore } from '@/store/authStore'
import type { StudentProfile } from '@/types/student'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'
import { GRADES } from '../fakes/profileChoices'

vi.mock('@/services/auth/authApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/auth/authApi')>()),
  updateLocalePreference: vi.fn(),
}))

const store = vi.mocked(updateLocalePreference)
const OWNER = 'student-1'

function profile(over: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: 'p-1',
    userId: OWNER,
    name: 'Lina Meier',
    email: 'lina@example.com',
    grade: '',
    primarySubjects: [],
    preferredAnswerLanguage: null,
    guardianStatus: 'not_linked',
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-01T09:00:00Z',
    choices: { grade: GRADES },
    ...over,
  }
}

function stored(language: SupportedLanguage) {
  return { preferredLocale: language, effectiveLocale: language, supportedLocales: ['de', 'en', 'fr', 'it'], updatedAt: '2026-11-10T10:00:00Z' }
}

/** The browser's languages, as `navigator.languages` gives them. */
function browserAsks(...languages: string[]) {
  vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(languages)
  vi.spyOn(window.navigator, 'language', 'get').mockReturnValue(languages[0] ?? '')
}

function serverWith(p: StudentProfile) {
  const server = createFakeAskServer()
  server.profile = p
  return server
}

function harness(server: FakeAskServer) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <AskServerProvider value={server}>{children}</AskServerProvider>
    </QueryClientProvider>
  )
  return { client, wrapper }
}

beforeEach(async () => {
  sessionStorage.clear()
  store.mockReset()
  browserAsks('en-US')
  useAuthStore.setState({ user: { id: OWNER, role: 'student', name: 'Lina', email: 'lina@example.com', effectiveLocale: 'de' } as never })
  await i18n.changeLanguage('en')
})

afterEach(async () => {
  vi.restoreAllMocks()
  useAuthStore.setState({ user: null })
  await i18n.changeLanguage('en')
})

describe('who is asked', () => {
  it('asks an account that never stored a language, and not one that did', () => {
    expect(asksLanguage(profile())).toBe(true)
    expect(asksLanguage(profile({ preferredAnswerLanguage: 'fr' }))).toBe(false)
    expect(asksLanguage({ preferredAnswerLanguage: '' as never })).toBe(true)
  })
})

describe('the language chosen to begin with', () => {
  it('is the first language the browser asks for that the app has, by its base code', () => {
    browserAsks('rm-CH', 'de-CH', 'en')
    expect(browserLanguage()).toBe('de')
    browserAsks('fr-CH')
    expect(browserLanguage()).toBe('fr')
    browserAsks('es', 'pt')
    expect(browserLanguage()).toBeNull()
  })
})

describe('when it is up (useLanguageFirst)', () => {
  it('holds while the profile is read, then asks, choosing the browser\'s language and switching to it', async () => {
    browserAsks('it-CH')
    const server = serverWith(profile())
    const release = server.holdNext('getStudentProfile')
    const { wrapper } = harness(server)
    const { result } = renderHook(() => useLanguageFirst(true, OWNER), { wrapper })
    expect(result.current).toMatchObject({ open: false, hold: true })
    act(() => release())
    await waitFor(() => expect(result.current.open).toBe(true))
    expect(result.current).toMatchObject({ chosen: 'it', hold: true })
    await waitFor(() => expect(i18n.language).toBe('it'))
  })

  it('chooses the language on screen when the browser asks for none the app has', async () => {
    browserAsks('es')
    await i18n.changeLanguage('fr')
    const { wrapper } = harness(serverWith(profile()))
    const { result } = renderHook(() => useLanguageFirst(true, OWNER), { wrapper })
    await waitFor(() => expect(result.current.open).toBe(true))
    expect(result.current.chosen).toBe('fr')
  })

  it('does not ask, nor hold, an account that stored a language', async () => {
    const { wrapper } = harness(serverWith(profile({ preferredAnswerLanguage: 'de' })))
    const { result } = renderHook(() => useLanguageFirst(true, OWNER), { wrapper })
    await waitFor(() => expect(result.current.hold).toBe(false))
    expect(result.current.open).toBe(false)
    expect(i18n.language).toBe('en')
  })

  it('asks no one but a student, and lets go when the profile cannot be read', async () => {
    const teacher = serverWith(profile())
    const asTeacher = renderHook(() => useLanguageFirst(false, 'teacher-1'), { wrapper: harness(teacher).wrapper })
    expect(asTeacher.result.current).toMatchObject({ open: false, hold: false })
    expect(teacher.student.getStudentProfile).not.toHaveBeenCalled()

    const down = serverWith(profile())
    down.refuseNextWith(new Error('down'), 'getStudentProfile')
    const { result } = renderHook(() => useLanguageFirst(true, OWNER), { wrapper: harness(down).wrapper })
    await waitFor(() => expect(result.current.hold).toBe(false))
    expect(result.current.open).toBe(false)
  })

  it('switches the screen to each language picked, and stores only the one confirmed', async () => {
    store.mockResolvedValue(stored('fr'))
    const { wrapper } = harness(serverWith(profile()))
    const { result } = renderHook(() => useLanguageFirst(true, OWNER), { wrapper })
    await waitFor(() => expect(result.current.open).toBe(true))
    act(() => result.current.pick('de'))
    await waitFor(() => expect(i18n.language).toBe('de'))
    act(() => result.current.pick('fr'))
    await waitFor(() => expect(i18n.language).toBe('fr'))
    expect(store).not.toHaveBeenCalled()

    act(() => result.current.confirm())
    await waitFor(() => expect(result.current.hold).toBe(false))
    expect(store).toHaveBeenCalledTimes(1)
    expect(store).toHaveBeenCalledWith('fr')
    expect(result.current.open).toBe(false)
    // Next sign-in reads it from the account.
    expect(useAuthStore.getState().user).toMatchObject({ effectiveLocale: 'fr', preferredLocale: 'fr' })
  })

  it('stores the language already on screen too, or the question would come back', async () => {
    store.mockResolvedValue(stored('en'))
    const { wrapper } = harness(serverWith(profile()))
    const { result } = renderHook(() => useLanguageFirst(true, OWNER), { wrapper })
    await waitFor(() => expect(result.current.open).toBe(true))
    expect(result.current.chosen).toBe('en')
    act(() => result.current.confirm())
    await waitFor(() => expect(result.current.open).toBe(false))
    expect(store).toHaveBeenCalledWith('en')
  })

  it('says it is storing, and holds until it is stored', async () => {
    let done: (value: ReturnType<typeof stored>) => void = () => {}
    store.mockReturnValue(new Promise((resolve) => (done = resolve)))
    const { wrapper } = harness(serverWith(profile()))
    const { result } = renderHook(() => useLanguageFirst(true, OWNER), { wrapper })
    await waitFor(() => expect(result.current.open).toBe(true))
    act(() => result.current.confirm())
    await waitFor(() => expect(result.current.saving).toBe(true))
    expect(result.current).toMatchObject({ open: true, hold: true })
    act(() => done(stored('en')))
    await waitFor(() => expect(result.current.hold).toBe(false))
  })

  it('goes on in the language chosen when the store fails, and does not ask again in this tab, for this account', async () => {
    store.mockRejectedValue(new Error('upstream'))
    const { wrapper } = harness(serverWith(profile()))
    const { result } = renderHook(() => useLanguageFirst(true, OWNER), { wrapper })
    await waitFor(() => expect(result.current.open).toBe(true))
    act(() => result.current.pick('it'))
    act(() => result.current.confirm())
    await waitFor(() => expect(result.current.hold).toBe(false))
    expect(result.current.open).toBe(false)
    expect(i18n.language).toBe('it')

    const again = renderHook(() => useLanguageFirst(true, OWNER), { wrapper })
    await waitFor(() => expect(again.result.current.hold).toBe(false))
    expect(again.result.current.open).toBe(false)

    const someoneElse = renderHook(() => useLanguageFirst(true, 'student-2'), { wrapper })
    await waitFor(() => expect(someoneElse.result.current.open).toBe(true))
  })
})

describe('the card', () => {
  const show = (over: Partial<Parameters<typeof LanguageFirst>[0]> = {}) => {
    const onPick = vi.fn()
    const onConfirm = vi.fn()
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageFirst chosen="fr" saving={false} onPick={onPick} onConfirm={onConfirm} {...over} />
      </I18nextProvider>,
    )
    return { onPick, onConfirm, region: screen.getByRole('region', { name: en.languageFirst.title }) }
  }

  it('says why it asks, and offers the four languages by their own names, the country\'s first', () => {
    const { region } = show()
    expect(region).toHaveTextContent(en.languageFirst.why)
    const radios = within(region).getAllByRole('radio')
    expect(radios.map((radio) => radio.closest('label')?.textContent)).toEqual(['Deutsch', 'Français', 'Italiano', 'English'])
    // Each name is read in its own language.
    expect(radios.map((radio) => radio.closest('label')?.getAttribute('lang'))).toEqual(['de', 'fr', 'it', 'en'])
    expect(within(region).getByRole('group', { name: en.languageFirst.choose })).toBeInTheDocument()
  })

  it('opens on the language chosen, focused, and has no "Later"', () => {
    const { region } = show()
    const french = within(region).getByRole('radio', { name: 'Français' })
    expect(french).toBeChecked()
    expect(french).toHaveFocus()
    expect(within(region).getAllByRole('button').map((button) => button.textContent)).toEqual([en.languageFirst.next])
  })

  it('hands on each language picked, and "Continue" (or Enter) goes on', async () => {
    const user = userEvent.setup()
    const { region, onPick, onConfirm } = show()
    await user.click(within(region).getByRole('radio', { name: 'Italiano' }))
    expect(onPick).toHaveBeenCalledWith('it')
    await user.keyboard('{Enter}')
    expect(onConfirm).toHaveBeenCalledTimes(1)
    await user.click(within(region).getByRole('button', { name: en.languageFirst.next }))
    expect(onConfirm).toHaveBeenCalledTimes(2)
  })

  it('says it is storing, and does not send twice', () => {
    const { region, onConfirm } = show({ saving: true })
    const button = within(region).getByRole('button', { name: en.languageFirst.saving })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    fireEvent.submit(region.querySelector('form')!)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('sits above the map key, as "About you" does', () => {
    show()
    expect(document.querySelector('[data-language-first]')).toHaveClass('z-10')
  })
})

describe('on the map', () => {
  const source: StarMapSource = { read: readDemoStarMap, demo: false }

  beforeAll(async () => {
    await import('@/dev/demo/sky/source')
  }, 30_000)

  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  })

  function mount(server: FakeAskServer) {
    const { wrapper: Wrapper } = harness(server)
    return render(
      <I18nextProvider i18n={i18n}>
        <Wrapper>
          <StarMapSourceContext.Provider value={source}>
            <MemoryRouter initialEntries={['/map/math']}>
              <Routes>
                <Route path="/map/:subjectId" element={<StarMapRoute />} />
              </Routes>
            </MemoryRouter>
          </StarMapSourceContext.Provider>
        </Wrapper>
      </I18nextProvider>,
    )
  }

  it('comes before "About you", which then asks in the language chosen', async () => {
    store.mockResolvedValue(stored('de'))
    const server = serverWith(profile())
    mount(server)
    await waitFor(() => expect(document.querySelector('[data-language-first]')).not.toBeNull(), { timeout: 10_000 })
    expect(document.querySelector('[data-about-you]')).toBeNull()

    fireEvent.click(screen.getByRole('radio', { name: 'Deutsch' }))
    await waitFor(() => expect(i18n.language).toBe('de'))
    fireEvent.click(screen.getByRole('button', { name: de.languageFirst.next }))

    await waitFor(() => expect(document.querySelector('[data-about-you]')).not.toBeNull())
    expect(document.querySelector('[data-language-first]')).toBeNull()
    expect(screen.getByRole('region', { name: de.aboutYou.title })).toBeInTheDocument()
    expect(store).toHaveBeenCalledWith('de')
  })

  it('is not there for an account that stored a language: "About you" asks at once', async () => {
    mount(serverWith(profile({ preferredAnswerLanguage: 'en' })))
    await waitFor(() => expect(document.querySelector('[data-about-you]')).not.toBeNull(), { timeout: 10_000 })
    expect(document.querySelector('[data-language-first]')).toBeNull()
  })
})

describe('its words, in four languages', () => {
  it.each([
    ['de', de],
    ['en', en],
    ['fr', fr],
    ['it', it_],
  ] as const)('%s has every line', (_, locale) => {
    for (const key of ['title', 'why', 'choose', 'next', 'saving'] as const) expect(locale.languageFirst[key]).toBeTruthy()
  })

  it('keeps French punctuation on the line it belongs to', () => {
    expect(fr.languageFirst.title).toMatch(/\u00a0\?$/)
    expect(fr.languageFirst.why).toContain('«\u00a0Moi\u00a0»')
  })
})
