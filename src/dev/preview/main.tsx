/*
 * The design preview (#115): the real app's routes, providers and shell with
 * a demo student signed in and no backend. Dev server only; see
 * docs/agents/design-preview.md.
 *
 *   /src/dev/preview.html?surface=map&points=1000
 *   /src/dev/preview.html?path=/chapter/demo-sine-cosine&lang=de
 *
 * `surface` is one of `surfaces.ts`; `path` opens any route instead;
 * `points` (10 / 1000 / 2000) sizes the star map; `lang` (de / en / fr / it)
 * the language; `longNames=1` gives the star map's nebulae long names, to
 * check labels; `fresh=1` forgets what the demo backend kept in this tab
 * (completed lessons, the lighting and its acknowledgement, #51, and Ask's
 * messages). Moving around inside the page writes the route back to `path` (with
 * `signedIn=0` once signed out, and `lang` once the language changes), so a
 * reload stays where it was -- also back on the surface's own route.
 *
 * Order matters: storage is isolated, the runtime config registered and the
 * network intercepted before anything of the app is imported, because the
 * app reads its configuration and storage while its modules load.
 *
 * Not a product screen, so its own words are not translated.
 */
import { API_ORIGIN, installInterception } from '@/dev/preview/interception'
import { isolateStorage } from '@/dev/preview/storage'
import { starCountFrom, surfaceById, SURFACES } from '@/dev/preview/surfaces'
import { registerDevelopmentRuntimeConfig } from '@/lib/runtimeConfig'

const params = new URLSearchParams(window.location.search)
const surface = surfaceById(params.get('surface')) ?? (params.get('path') ? undefined : SURFACES[1])
const points = starCountFrom(params.get('points'))
const path = params.get('path') ?? surface?.path(points) ?? '/'
const signedIn = params.has('signedIn') ? params.get('signedIn') !== '0' : (surface?.signedIn ?? true)
const language = params.get('lang')
const longNames = params.get('longNames') === '1'

// For the screenshot script and the comparison page: what there is to open.
;(window as Window & { __stoaPreviewSurfaces?: unknown }).__stoaPreviewSurfaces = SURFACES.map(
  ({ id, label, stars, pending }) => ({ id, label, stars, pending: pending ?? null }),
)

isolateStorage()
registerDevelopmentRuntimeConfig(API_ORIGIN, window.location.origin)

async function start() {
  await installInterception()
  const { LANGUAGE_STORAGE_KEY, isSupportedLanguage } = await import('@/i18n/languages')
  if (language && isSupportedLanguage(language)) localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  const [, { default: i18n }, { demo, setDemoLanguage, resetDemoServer, finishDemoKnowledgePoint }] = await Promise.all([
    import('../../index.css'),
    import('@/i18n'),
    import('@/dev/preview/demoSource'),
  ])
  // The demo account reads in the page's language, so `/auth/me` does not switch it back.
  const reading = i18n.resolvedLanguage ?? i18n.language
  setDemoLanguage(isSupportedLanguage(reading) ? reading : 'en')
  if (params.get('fresh') === '1') resetDemoServer()
  if (surface?.demo === 'demo-point-finished') finishDemoKnowledgePoint()

  const [{ StrictMode, Suspense }, { createRoot }, { MemoryRouter }] = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('react-router-dom'),
  ])
  const [{ AppProviders }, { AppRoutes }, { AuthBootstrap }, { PageSkeleton }, { useAuthStore }, { PreviewChrome }, { PreviewLighting }] =
    await Promise.all([
      import('@/app/providers/AppProviders'),
      import('@/app/router/AppRoutes'),
      import('@/app/router/AuthBootstrap'),
      import('@/components/common/PageSkeleton'),
      import('@/store/authStore'),
      import('@/dev/preview/PreviewChrome'),
      import('@/dev/preview/lighting'),
    ])

  // Signed in the way the login form leaves it: a token in the store, the
  // account read back from `/auth/me` by the real AuthBootstrap.
  useAuthStore.setState(
    signedIn
      ? { user: demo().demoStudent, accessToken: 'design-preview', isAuthenticated: true }
      : { user: null, accessToken: null, isAuthenticated: false },
  )

  const root = document.getElementById('root')
  if (!root) return
  createRoot(root).render(
    <StrictMode>
      <AppProviders>
        <PreviewLighting longNames={longNames}>
          <MemoryRouter initialEntries={[path]}>
            <AuthBootstrap />
            <PreviewChrome initialPath={path} open={surface?.open} focus={surface?.focus} pending={surface?.pending} readyWhen={surface?.readyWhen} />
            <Suspense fallback={<PageSkeleton rows={4} />}>
              <AppRoutes />
            </Suspense>
          </MemoryRouter>
        </PreviewLighting>
      </AppProviders>
    </StrictMode>,
  )
}

void start()
