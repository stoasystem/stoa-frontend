/*
 * The planet routes with a signed-in student and no backend, for looking at
 * the planet and timing it (#47). Dev server only: open
 * /src/dev/planet.html?path=/planet/math&points=2000 (`path` is the planet
 * route to open, `points` the fixture size: 10, 500 or 2000).
 *
 * Not a product screen, so its words are not translated.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { registerDevelopmentRuntimeConfig } from '@/lib/runtimeConfig'

registerDevelopmentRuntimeConfig('http://localhost:8000', window.location.origin)

const params = new URLSearchParams(window.location.search)
const path = params.get('path') ?? '/planet/math'
const points = params.get('points')

async function start() {
  await Promise.all([import('../index.css'), import('@/i18n')])
  const { useAuthStore } = await import('@/store/authStore')
  const pages = await import('@/pages/planet/PlanetPages')

  useAuthStore.setState({
    user: { id: 'dev', name: 'Lina Meier', email: 'lina@example.test', role: 'student' } as never,
    accessToken: null,
    isAuthenticated: true,
  })

  const root = document.getElementById('root')
  if (!root) return
  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } })}>
        <MemoryRouter initialEntries={[points ? `${path}?points=${points}` : path]}>
          <Routes>
            <Route path="/" element={<pages.PlanetHomePage />} />
            <Route path="/planet/:subjectId" element={<pages.PlanetSubjectPage />} />
            <Route path="/planet/:subjectId/:topicId" element={<pages.PlanetTopicPage />} />
            <Route path="/planet/:subjectId/:topicId/:unitId" element={<pages.PlanetUnitPage />} />
            <Route path="*" element={<p>Left the planet.</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </StrictMode>,
  )
}

void start()
