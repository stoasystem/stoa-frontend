/**
 * The app ships English and loads every other language when a tab is read
 * in it (#414).
 *
 * All four languages used to be inside the first-screen JavaScript: 143 kB
 * gzip of 383, when a reader needs one language and English under it. Now
 * the language a tab starts in loads before the first render, a switch loads
 * the new one before anything shows it or hears of it, and `admin`, which
 * only staff screens and account activation read, loads with the first
 * screen that asks for it. A language that fails to load reads in English.
 *
 * Every other test file has all four languages in full (tests/setup.ts);
 * this one takes that away and starts the app's i18n afresh in each test.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Suspense, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import deAdmin from '@/i18n/locales/de/admin.json'
import deCommon from '@/i18n/locales/de/common.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import enCommon from '@/i18n/locales/en/common.json'
import frAdmin from '@/i18n/locales/fr/admin.json'
import frCommon from '@/i18n/locales/fr/common.json'
import frStarmap from '@/i18n/locales/fr/starmap.json'
import { LANGUAGE_STORAGE_KEY } from '@/i18n/languages'
import { startupNamespaces } from '@/i18n/namespaces'
import type { CurrentUser } from '@/store/authStore'
import { mswServer } from '../mswServer'

vi.unmock('@/i18n/resources')

const LOCALE = 'https://api.test/auth/me/preferences/locale'

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
afterAll(() => mswServer.close())

const mocked = new Set<string>()
afterEach(() => {
  mswServer.resetHandlers()
  for (const path of mocked) vi.doUnmock(path)
  mocked.clear()
  vi.restoreAllMocks()
  window.localStorage.removeItem(LANGUAGE_STORAGE_KEY)
})

type Language = 'de' | 'fr' | 'it'

function gate() {
  let open = () => {}
  const opened = new Promise<void>((resolve) => {
    open = resolve
  })
  return { opened, open }
}

/** The language's chunk arrives once `opened` settles. */
function bundleArrivesWhen(language: Language, opened: Promise<void>) {
  const path = `@/i18n/bundles/${language}`
  mocked.add(path)
  vi.doMock(path, async () => {
    await opened
    return vi.importActual(path)
  })
}

/** The download fails, as a dropped connection fails a dynamic import. */
function fails(path: string) {
  mocked.add(path)
  vi.doMock(path, () => {
    throw new TypeError(`Failed to fetch dynamically imported module: ${path}`)
  })
}

/**
 * The app's i18n as a fresh page load starts it, in `stored` (else the
 * browser's English), with `main.tsx`'s wait for it to be ready.
 */
async function startApp(stored?: Language) {
  // i18next's instance outlives resetModules: drop what the last start hung on it.
  const shared = (await import('i18next')).default
  shared.off('languageChanged')
  shared.off('languageChanging')
  vi.resetModules()
  if (stored) window.localStorage.setItem(LANGUAGE_STORAGE_KEY, stored)
  const { default: i18n, i18nReady } = await import('@/i18n')
  const languages = await import('@/i18n/languages')
  const { useTranslation } = await import('react-i18next')
  const atStart = {
    de: i18n.hasResourceBundle('de', 'common'),
    fr: i18n.hasResourceBundle('fr', 'common'),
  }
  await i18nReady

  /** Every text a probe has rendered, in order: a raw key would show up here. */
  const rendered: string[] = []
  function Probe() {
    const { t } = useTranslation('common')
    const text = t('language.label')
    rendered.push(text)
    return <p data-testid="probe">{text}</p>
  }
  function AdminProbe() {
    const { t } = useTranslation('admin')
    const text = t('activation.title')
    rendered.push(text)
    return <p data-testid="admin-probe">{text}</p>
  }
  return { i18n, languages, atStart, rendered, Probe, AdminProbe }
}

describe('what ships with the app', () => {
  it('is English, without admin', async () => {
    const { bundledResources } = await vi.importActual<typeof import('@/i18n/resources')>('@/i18n/resources')
    expect(Object.keys(bundledResources)).toEqual(['en'])
    expect(Object.keys(bundledResources.en).sort()).toEqual([...startupNamespaces].sort())
  })
})

describe('starting up', () => {
  it('renders the first screen in the language the tab starts in', async () => {
    const { i18n, atStart, rendered, Probe } = await startApp('de')

    // German was not there until the app asked for it, French never was.
    expect(atStart).toEqual({ de: false, fr: false })
    expect(i18n.hasResourceBundle('fr', 'common')).toBe(false)
    expect(i18n.hasResourceBundle('de', 'admin')).toBe(false)

    render(<Probe />)

    expect(screen.getByTestId('probe')).toHaveTextContent(deCommon.language.label)
    expect(rendered).toEqual([deCommon.language.label])
    expect(document.documentElement.lang).toBe('de')
  })

  it("starts in the browser's language without storing it as a choice", async () => {
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('fr-CH')
    const { i18n, rendered, Probe } = await startApp()

    render(<Probe />)

    expect(rendered).toEqual([frCommon.language.label])
    expect(i18n.language).toBe('fr')
    // The language arrives after i18next has started; that is not a switch.
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull()
  })

  it('starts in English when the language fails to load, and asks again next time', async () => {
    const errors = vi.spyOn(console, 'error')
    fails('@/i18n/bundles/it')
    const { i18n, languages, rendered, Probe } = await startApp('it')

    render(<Probe />)

    expect(screen.getByTestId('probe')).toHaveTextContent(enCommon.language.label)
    expect(rendered).toEqual([enCommon.language.label])
    expect(i18n.language).toBe('it')
    expect(languages.activeLanguage()).toBe('it')
    // The choice stays, so the next page load tries Italian again.
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('it')
    expect(errors).not.toHaveBeenCalled()
  })
})

describe('switching language', () => {
  it('loads the new language before anything shows it or hears of it', async () => {
    const french = gate()
    bundleArrivesWhen('fr', french.opened)
    const { i18n, languages, rendered, Probe } = await startApp()
    const { AppProviders } = await import('@/app/providers/AppProviders')
    const { queryClient } = await import('@/app/query/queryClient')
    const refetchedWithFrenchIn: boolean[] = []
    vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(async () => {
      refetchedWithFrenchIn.push(i18n.hasResourceBundle('fr', 'common'))
    })
    const heard: { language: string; frenchIn: boolean; requestsIn: string }[] = []
    const onChanged = (language: string) =>
      heard.push({ language, frenchIn: i18n.hasResourceBundle('fr', 'common'), requestsIn: languages.activeLanguage() })
    i18n.on('languageChanged', onChanged)
    render(
      <AppProviders>
        <Probe />
      </AppProviders>,
    )

    let switched!: Promise<unknown>
    act(() => {
      switched = i18n.changeLanguage('fr')
    })
    await new Promise((resolve) => setTimeout(resolve, 30))

    // Still loading: the screen, the requests and the cache stay English.
    expect(screen.getByTestId('probe')).toHaveTextContent(enCommon.language.label)
    expect(i18n.language).toBe('en')
    expect(languages.activeLanguage()).toBe('en')
    expect(heard).toEqual([])
    expect(refetchedWithFrenchIn).toEqual([])

    french.open()
    await act(() => switched)

    expect(screen.getByTestId('probe')).toHaveTextContent(frCommon.language.label)
    expect(heard).toEqual([{ language: 'fr', frenchIn: true, requestsIn: 'fr' }])
    expect(refetchedWithFrenchIn).toEqual([true])
    // English until French was in, then French: no raw key, nothing between.
    expect([...new Set(rendered)]).toEqual([enCommon.language.label, frCommon.language.label])
    i18n.off('languageChanged', onChanged)
  })

  it('reads in English when the new language fails to load', async () => {
    const errors = vi.spyOn(console, 'error')
    fails('@/i18n/bundles/de')
    const { i18n, rendered, Probe } = await startApp()
    render(<Probe />)

    await act(() => i18n.changeLanguage('de'))

    expect(screen.getByTestId('probe')).toHaveTextContent(enCommon.language.label)
    expect([...new Set(rendered)]).toEqual([enCommon.language.label])
    expect(i18n.language).toBe('de')
    expect(errors).not.toHaveBeenCalled()
  })

  it('reports a failed save in the new language, even when the save fails before the language is in', async () => {
    const french = gate()
    bundleArrivesWhen('fr', french.opened)
    const { i18n } = await startApp()
    const { queryClient } = await import('@/app/query/queryClient')
    const { useChangeLanguage } = await import('@/hooks/i18n/useChangeLanguage')
    const { useAuthStore } = await import('@/store/authStore')
    useAuthStore.setState({
      user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student', preferredLocale: 'en' } as CurrentUser,
      accessToken: 'token',
      isAuthenticated: true,
    })
    const received: string[] = []
    mswServer.use(
      http.patch(LOCALE, async ({ request }) => {
        received.push(((await request.json()) as { preferredLocale: string }).preferredLocale)
        return HttpResponse.json({ detail: 'down' }, { status: 503 })
      }),
    )
    render(<Toaster />)
    const { result } = renderHook(() => useChangeLanguage(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    act(() => result.current.changeLanguage('fr'))
    await waitFor(() => expect(received).toEqual(['fr']))
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(i18n.language).toBe('en')
    expect(screen.queryByText(enCommon.language.saveFailed)).toBeNull()

    french.open()

    expect(await screen.findByText(frCommon.language.saveFailed)).toBeInTheDocument()
    expect(screen.queryByText(enCommon.language.saveFailed)).toBeNull()
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
    queryClient.clear()
  })
})

describe('copy added by hand', () => {
  // The preview and the bench add their demo words to `starmap` while the
  // app starts. Added to a language not loaded yet, they stood in for its
  // whole namespace, and its own star map copy never loaded.
  it('leaves the rest of the namespace to load with its language', async () => {
    const { i18n } = await startApp()
    const { addDemoSkyStrings, DEMO_SKY_STRINGS } = await import('@/dev/demo/sky/strings')
    addDemoSkyStrings()

    await i18n.changeLanguage('fr')

    expect(i18n.t('starmap:empty')).toBe(frStarmap.empty)
    expect(i18n.t('starmap:demo.notice')).toBe(DEMO_SKY_STRINGS.fr.notice)
    expect(i18n.t('starmap:demo.notice', { lng: 'en' })).toBe(DEMO_SKY_STRINGS.en.notice)
  })
})

describe('the admin copy', () => {
  it('loads with the first screen that asks for it, which waits for it', async () => {
    const { i18n, rendered, AdminProbe } = await startApp('de')
    expect(i18n.hasResourceBundle('de', 'admin')).toBe(false)
    expect(i18n.hasResourceBundle('en', 'admin')).toBe(false)

    render(
      <Suspense fallback={<p>loading</p>}>
        <AdminProbe />
      </Suspense>,
    )
    expect(screen.getByText('loading')).toBeInTheDocument()

    expect(await screen.findByTestId('admin-probe')).toHaveTextContent(deAdmin.activation.title)
    expect(i18n.hasResourceBundle('en', 'admin')).toBe(true)
    expect(i18n.hasResourceBundle('fr', 'admin')).toBe(false)

    // Once loaded, a switch brings it along in the new language.
    const heard: boolean[] = []
    const onChanged = () => heard.push(i18n.hasResourceBundle('fr', 'admin'))
    i18n.on('languageChanged', onChanged)
    await act(() => i18n.changeLanguage('fr'))

    expect(heard).toEqual([true])
    expect(screen.getByTestId('admin-probe')).toHaveTextContent(frAdmin.activation.title)
    expect([...new Set(rendered)]).toEqual([deAdmin.activation.title, frAdmin.activation.title])
    i18n.off('languageChanged', onChanged)
  })

  it('reads in English when it fails to load in the language shown', async () => {
    fails('@/i18n/locales/de/admin.json')
    const { rendered, AdminProbe } = await startApp('de')

    render(
      <Suspense fallback={<p>loading</p>}>
        <AdminProbe />
      </Suspense>,
    )

    expect(await screen.findByTestId('admin-probe')).toHaveTextContent(enAdmin.activation.title)
    expect([...new Set(rendered)]).toEqual([enAdmin.activation.title])
  })
})
