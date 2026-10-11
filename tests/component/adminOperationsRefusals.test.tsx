import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toUserFacingError } from '@/lib/userFacingText'
import { AdminTeacherApplicationsPage } from '@/pages/admin/AdminTeacherApplicationsPage'
import { LearningOperationsDashboardPage } from '@/pages/learning/LearningOperationsDashboardPage'
import { ApiError, httpClient } from '@/services/api/httpClient'
import { getWarehouseExportSummary } from '@/services/learning/learningOperationsApi'
import { listTeacherApplications } from '@/services/teacher/teacherApplicationApi'

// Card 124, walked on production as admin@: the teacher application queue
// printed `Application_id: Field required` in red and then said the queue was
// empty, and the learning operations dashboard answered a refused export with
// a blank panel and a second copy of the same request.

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en', language: 'en' },
  }),
}))

vi.mock('@/services/api/httpClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/httpClient')>()),
  httpClient: { get: vi.fn(), post: vi.fn() },
}))

const mockedGet = vi.mocked(httpClient.get)

/**
 * The list route's query parameters, from the backend's own contract.
 *
 * `stoa-backend/docs/api/openapi.json`, `GET /teacher-applications`: three
 * parameters, of which `application_id` is `"required": true`. It reads as a
 * detail-route identifier because the route shares its reviewer dependency
 * with the per-application reads, and that is exactly what made it easy to
 * leave out.
 */
const LIST_ROUTE_PARAMETERS = {
  required: ['application_id'],
  optional: ['review_state', 'limit'],
}

/** A 422 as FastAPI sends one: every field here is written for a developer. */
const VALIDATION_ISSUES = [
  { type: 'missing', loc: ['query', 'application_id'], msg: 'Field required', input: null },
  { type: 'int_parsing', loc: ['query', 'limit'], msg: 'Input should be a valid integer', input: 'x' },
  { type: 'string_too_short', loc: ['body', 'full_name'], msg: 'String should have at least 1 character' },
]

/** Every fragment of that 422 that must not reach a screen. */
function developerFragments() {
  const fragments = new Set<string>()
  for (const issue of VALIDATION_ISSUES) {
    for (const segment of issue.loc) fragments.add(segment)
    fragments.add(issue.msg)
    const last = issue.loc[issue.loc.length - 1]
    fragments.add(`${last}: ${issue.msg}`)
    fragments.add(`${last.replace(/^./, (c) => c.toUpperCase())}: ${issue.msg}`)
  }
  return [...fragments]
}

function wrapper({ children }: { children: ReactNode }) {
  // Mirrors src/app/query/queryClient.ts, whose single retry is what turned one
  // refused export into two requests. `retryDelay` only keeps the test quick.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 1, retryDelay: 0, gcTime: 0 } },
  })
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/admin/teacher-applications']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  mockedGet.mockReset()
})

describe('the teacher application queue asks for the queue', () => {
  it('sends the whole parameter set the list route declares', async () => {
    mockedGet.mockResolvedValue({
      status: 200,
      data: { reviewState: 'approved', items: [], count: 0 },
    })

    await listTeacherApplications('approved')

    expect(mockedGet).toHaveBeenCalledTimes(1)
    const [path, config] = mockedGet.mock.calls[0] as [string, { params?: Record<string, unknown> }]
    expect(path).toBe('/teacher-applications')
    // The whole set rather than one key: the request that answered 422 carried
    // a plausible subset, which any single-key assertion would have passed.
    expect(config.params).toEqual({
      review_state: 'approved',
      limit: 50,
      application_id: '*',
    })
    const sent = Object.keys(config.params ?? {})
    for (const name of LIST_ROUTE_PARAMETERS.required) expect(sent).toContain(name)
    expect(sent.sort()).toEqual(
      [...LIST_ROUTE_PARAMETERS.required, ...LIST_ROUTE_PARAMETERS.optional].sort(),
    )
  })
})

describe('a validator complaint is not a sentence for a reader', () => {
  it('falls back for every issue FastAPI sends without a code', () => {
    const fallback = 'We could not read that just now.'
    for (const issue of VALIDATION_ISSUES) {
      const error = new ApiError('Request failed with status code 422', {
        status: 422,
        detail: [issue],
      })
      expect(toUserFacingError(error, fallback)).toBe(fallback)
    }
    const whole = new ApiError('Request failed with status code 422', {
      status: 422,
      detail: VALIDATION_ISSUES,
    })
    expect(toUserFacingError(whole, fallback)).toBe(fallback)
  })

  it('still speaks when the server named a code the app has a phrase for', () => {
    const error = new ApiError('Request failed with status code 422', {
      status: 422,
      detail: [
        { code: 'teacher_application_closed', loc: ['body', 'version'], msg: 'Field required' },
      ],
    })
    const translate = (code: string) =>
      code === 'teacher_application_closed' ? 'Diese Bewerbung ist bereits entschieden.' : ''

    expect(toUserFacingError(error, 'fallback', translate)).toBe(
      'Diese Bewerbung ist bereits entschieden.',
    )
  })

  it('keeps all of it off the queue screen when the read is refused', async () => {
    mockedGet.mockRejectedValue(
      new ApiError('Request failed with status code 422', {
        status: 422,
        detail: VALIDATION_ISSUES,
      }),
    )

    const { container } = render(<AdminTeacherApplicationsPage />, { wrapper })

    await waitFor(() => expect(screen.getByText(/Could not load applications/)).toBeTruthy())
    const text = container.textContent ?? ''
    for (const fragment of developerFragments()) expect(text).not.toContain(fragment)
  })
})

describe('the warehouse export panel when the grant is missing', () => {
  it('reads a 403 as an answer and sends the request once', async () => {
    mockedGet.mockImplementation((url: string) => {
      if (url.endsWith('/warehouse-export')) return Promise.resolve({ status: 403, data: {} })
      if (url.endsWith('/warehouse-readiness')) {
        return Promise.resolve({
          status: 200,
          data: {
            state: 'ready',
            exportAllowed: true,
            liveWarehouseConfigured: true,
            blockers: [],
            warnings: [],
          },
        })
      }
      return Promise.resolve({
        status: 200,
        data: {
          summary: {},
          sampleSize: 0,
          sequencingCoverage: {},
          qualityHotspots: [],
          interventions: [],
        },
      })
    })

    const { container } = render(<LearningOperationsDashboardPage />, { wrapper })

    // The refusal has to have landed before anything is counted; asserting on a
    // query that has not settled passes for the wrong reason.
    await waitFor(() => expect(screen.getByText(/curriculum_analytics_exporter/)).toBeTruthy())

    const exportCalls = mockedGet.mock.calls.filter(([url]) =>
      String(url).endsWith('/warehouse-export'),
    )
    expect(exportCalls).toHaveLength(1)
    // And it stays a refusal, not a summary of nothing.
    expect(container.textContent).not.toContain('Warehouse export failed')
  })

  it('hands a granted export back as a summary', async () => {
    mockedGet.mockResolvedValue({
      status: 200,
      data: { schemaVersion: 'v3', count: 42, filters: {}, window: {}, privacy: { piiRemoved: true } },
    })

    const result = await getWarehouseExportSummary()

    expect(result.permissionDenied).toBe(false)
    expect(result.summary?.count).toBe(42)
  })

  it('hands a refused export back without throwing', async () => {
    mockedGet.mockResolvedValue({ status: 403, data: {} })

    const result = await getWarehouseExportSummary()

    expect(result).toEqual({ permissionDenied: true })
  })
})
