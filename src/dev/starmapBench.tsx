/*
 * The star map routes with a signed-in student and no backend, for looking
 * at the map and timing it (#47, #72). Dev server only: open
 * /src/dev/starmap.html?path=/map/math&points=2000 (`path` is the map route
 * to open, `points` the fixture size: 10, 500, 1000 or 2000).
 *
 * `&foveation=off` draws every nebula star by star; `&bench=1` adds the
 * phone bench's panel (#44, `starmapBenchPanel.tsx`). On a phone, run
 * `npm run dev -- --host` and open the Network address it prints, e.g.
 * http://192.168.1.20:5173/src/dev/starmap.html?points=500&bench=1.
 *
 * `&host=ask` mounts the map the way #66's AskHost will hold it: a plain
 * block page area (`absolute inset-y-0 left-0`), not a flex container, with
 * `&panel=1` leaving 420 px for the Ask panel. `window.__askPanel(true|false)`
 * opens and closes that space at run time.
 *
 * Offline like the design preview (#135): `takePageOffline()` gives the page
 * its own empty in-memory storage and answers every backend request from the
 * preview's demo handlers (or 404), before any app module is imported (only
 * libraries load statically). A token the real dev app left in this origin's
 * storage is never read, and nothing leaves the dev server.
 *
 * Not a product screen, so its words are not translated.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { takePageOffline } from '@/dev/preview/offline'

const params = new URLSearchParams(window.location.search)
const path = params.get('path') ?? '/map/math'
const points = params.get('points')
const foveation = params.get('foveation')
const host = params.get('host')
const bench = params.get('bench') === '1'
const entry = new URLSearchParams()
if (points) entry.set('points', points)
if (foveation) entry.set('foveation', foveation)
else if (bench) entry.set('foveation', 'on')
for (const key of ['relations', 'longNames']) {
  const value = params.get(key)
  if (value) entry.set(key, value)
}

async function start() {
  await takePageOffline()
  await Promise.all([import('../index.css'), import('@/i18n')])
  const { useAuthStore } = await import('@/store/authStore')
  const pages = await import('@/pages/map/MapPages')

  useAuthStore.setState({
    user: { id: 'dev', name: 'Lina Meier', email: 'lina@example.test', role: 'student' } as never,
    accessToken: null,
    isAuthenticated: true,
  })

  const { StarMapRoute } = await import('@/features/starmap/StarMapRoute')
  // The application's own source has no sky (#131): the bench draws the demo sky.
  const { DemoStarMapSource } = await import('@/dev/demo/sky/source')
  const { AppLayout } = await import('@/layouts/AppLayout')
  const { useState } = await import('react')

  /** #66's AskHost, as far as layout goes: a block page area beside an optional 420 panel. */
  function AskLikeHost() {
    const [panel, setPanel] = useState(params.get('panel') === '1')
    ;(window as unknown as { __askPanel: (open: boolean) => void }).__askPanel = setPanel
    return (
      <AppLayout bleed>
        <div data-ask-host className="relative min-h-0 flex-1 overflow-hidden">
          <div data-surface="sky" data-ask-page className="absolute inset-y-0 left-0 bg-sky text-on-sky" style={{ right: panel ? 420 : 0 }}>
            <StarMapRoute relations={params.get('relations') === 'fixture'} longNames={params.get('longNames') === '1'} />
          </div>
        </div>
      </AppLayout>
    )
  }

  const Page = (name: 'MapHomePage' | 'MapPage') => {
    const Component = pages[name]
    return host === 'ask' ? <AskLikeHost /> : <Component />
  }

  const root = document.getElementById('root')
  if (!root) return
  // The phone bench (#44) reads the screen's refresh rate now, with nothing
  // drawn yet: measured once the map is up and breathing, a phone that lags
  // at rest would pass for a slower screen instead of a slower renderer.
  let refreshHz = 0
  if (bench) {
    try {
      refreshHz = await (await import('./starmapBenchPanel')).measureRefreshRate()
    } catch {
      // No frames (the tab is hidden, the screen is off): the rate is unknown,
      // the panel says so, and the map still mounts.
    }
  }

  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } })}>
        <DemoStarMapSource>
          <MemoryRouter initialEntries={[entry.toString() ? `${path}?${entry.toString()}` : path]}>
            <Routes>
              <Route path="/" element={Page('MapHomePage')} />
              <Route path="/map/:subjectId" element={Page('MapPage')} />
              <Route path="/map/:subjectId/:topicId" element={Page('MapPage')} />
              <Route path="/map/:subjectId/:topicId/:unitId" element={Page('MapPage')} />
              <Route path="*" element={<p>Left the map.</p>} />
            </Routes>
          </MemoryRouter>
        </DemoStarMapSource>
      </QueryClientProvider>
    </StrictMode>,
  )
  return refreshHz
}

void start().then(async (refreshHz) => {
  if (!bench) return
  const { mountBenchPanel } = await import('./starmapBenchPanel')
  // `undefined` only when start() bailed out before rendering (no root), so
  // there is no map to bench either.
  mountBenchPanel(createRoot, refreshHz ?? 0)
})
