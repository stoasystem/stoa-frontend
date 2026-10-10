/**
 * The learning operations page read the warehouse export summary and, for an
 * administrator without the exporter capability, showed "Warehouse export
 * failed" beside "Export allowed: Yes" (app-planet, 2026-10-10, #162). The
 * refusal is by design (route inventory: `curriculum_analytics_exporter`), and
 * "allowed" was the system's setting, not the account's.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Suspense } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { AppRoutes } from '@/app/router/AppRoutes'
import i18n from '@/i18n'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

let exportReads = 0

beforeAll(async () => {
  mswServer.listen({ onUnhandledRequest: 'bypass' })
  await import('@/pages/learning/LearningOperationsDashboardPage')
})
beforeEach(async () => {
  exportReads = 0
  await i18n.changeLanguage('en')
  mswServer.use(
    http.get('https://api.test/admin/curriculum/analytics/dashboard', () =>
      HttpResponse.json({ detail: 'not in this test' }, { status: 500 }),
    ),
    http.get('https://api.test/admin/curriculum/analytics/warehouse-readiness', () =>
      HttpResponse.json({
        state: 'ready',
        exportAllowed: true,
        liveWarehouseConfigured: false,
        schemaVersion: 'v1',
        sources: [],
        sourceSchemas: {},
        blockers: [],
        warnings: [],
        privacy: {},
      }),
    ),
    http.get('https://api.test/admin/curriculum/analytics/warehouse-export', () => {
      exportReads += 1
      return HttpResponse.json({ detail: { code: 'capability_required' } }, { status: 403 })
    }),
    http.get('https://api.test/notifications', () => HttpResponse.json({ items: [], count: 0 })),
  )
  useAuthStore.setState({
    user: { id: 'a-1', name: 'Test Admin', email: 'admin@example.com', role: 'admin' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
})
afterEach(() => {
  mswServer.resetHandlers()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterAll(() => mswServer.close())

describe('an export the account may not read', () => {
  it('says the permission is missing, once, and calls the system setting what it is', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={['/admin/learning-operations']}>
            <Suspense fallback={null}>
              <AppRoutes />
            </Suspense>
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>,
    )

    expect(await screen.findByText(/does not hold the export permission/)).toBeInTheDocument()
    expect(screen.queryByText('Warehouse export failed')).toBeNull()
    expect(await screen.findByText('Export enabled (system)')).toBeInTheDocument()
    expect(screen.queryByText('Export allowed')).toBeNull()
    expect(exportReads).toBe(1)
  })
})
