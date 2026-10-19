/**
 * The curriculum console's requests fail the way every other request does (#260).
 *
 * `curriculumApi` passed `validateStatus: status < 500` on its calls, so axios
 * resolved every 4xx and the shared client's response interceptor never saw
 * one: a 401 on an expired access token was not renewed, and every action on
 * the page failed until it was reloaded. The call then rebuilt the error from
 * a string `detail` only, so `{detail: {code}}` lost its code and both a 401
 * on the worklist and a 403 on publish failed as 'Curriculum operation failed'
 * with no code. The panel showed that message, or a raw backend code, in
 * English under every language.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { curriculumErrorCode, curriculumErrorMessage } from '@/pages/admin/curriculumErrorMessage'
import { AdminCurriculumPage } from '@/pages/admin/AdminCurriculumPage'
import {
  applyCurriculumMigration,
  getCurriculumWorklist,
  publishCurriculumVersion,
  requestCurriculumChanges,
} from '@/services/admin/curriculumApi'
import { ApiError } from '@/services/api/httpClient'
import { rememberRefreshToken } from '@/services/auth/sessionRefresh'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const API = 'https://api.test'
const WORKLIST = { items: [{ publicLessonId: 'lesson-1', title: 'Lesson one', state: 'draft' }], count: 1 }
const CAPABILITY_REFUSAL = {
  detail: { code: 'curriculum_capability_required', required: ['curriculum.publish'] },
}

let refreshCalls = 0
let worklistAuth: string[] = []

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
afterAll(async () => {
  mswServer.close()
  await i18n.changeLanguage('en')
})
beforeEach(() => {
  refreshCalls = 0
  worklistAuth = []
  localStorage.clear()
  sessionStorage.clear()
  sessionStorage.setItem(TOKEN_KEY, 'expired-access')
  rememberRefreshToken('refresh-1')
  useAuthStore.setState({ user: null, accessToken: 'expired-access', isAuthenticated: true })
  mswServer.use(
    http.post(`${API}/auth/refresh`, () => {
      refreshCalls += 1
      return HttpResponse.json({ accessToken: 'fresh-access', refreshToken: 'refresh-1' })
    }),
    // The access token has expired: only a renewed one is let through.
    http.get(`${API}/admin/curriculum/worklist`, ({ request }) => {
      const auth = request.headers.get('authorization') ?? ''
      worklistAuth.push(auth)
      if (auth !== 'Bearer fresh-access') return HttpResponse.json({ detail: 'expired' }, { status: 401 })
      return HttpResponse.json(WORKLIST)
    }),
  )
})
afterEach(() => {
  mswServer.resetHandlers()
  vi.unstubAllGlobals()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

function stubLocation() {
  const assign = vi.fn()
  vi.stubGlobal('location', { ...window.location, pathname: '/admin/curriculum', search: '', hash: '', assign })
  return assign
}

async function rejection(request: Promise<unknown>) {
  try {
    await request
  } catch (error) {
    return error as ApiError
  }
  throw new Error('expected the request to fail')
}

/** The session the tab is on is untouched: same token, not sent to sign-in. */
function expectStillSignedIn(assign: ReturnType<typeof vi.fn>, token: string) {
  expect(useAuthStore.getState().accessToken).toBe(token)
  expect(sessionStorage.getItem(TOKEN_KEY)).toBe(token)
  expect(assign).not.toHaveBeenCalled()
}

describe('a 401 on a curriculum request', () => {
  it('renews the session once and retries with the new token', async () => {
    const assign = stubLocation()

    const worklist = await getCurriculumWorklist()

    expect(worklist).toEqual(WORKLIST)
    expect(refreshCalls).toBe(1)
    expect(worklistAuth).toEqual(['Bearer expired-access', 'Bearer fresh-access'])
    expectStillSignedIn(assign, 'fresh-access')
  })
  it('ends the session when the retry after a renewal is refused too', async () => {
    const assign = stubLocation()
    mswServer.use(
      http.get(`${API}/admin/curriculum/worklist`, ({ request }) => {
        worklistAuth.push(request.headers.get('authorization') ?? '')
        return HttpResponse.json({ detail: 'expired' }, { status: 401 })
      }),
    )

    const error = await rejection(getCurriculumWorklist())

    // One renewal, one retry, then signed out: no loop, and not read as "permission denied".
    expect((error as Error).message).toBe('session_ended')
    expect(refreshCalls).toBe(1)
    expect(worklistAuth).toEqual(['Bearer expired-access', 'Bearer fresh-access'])
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('fails a guarded read when the renewal cannot reach the server, keeping the session', async () => {
    const assign = stubLocation()
    mswServer.use(http.post(`${API}/auth/refresh`, () => HttpResponse.json({}, { status: 503 })))

    const error = await rejection(getCurriculumWorklist())

    expect(error).toMatchObject({ code: 'session_unreachable' })
    expectStillSignedIn(assign, 'expired-access')
  })
})

describe('a 403 on a curriculum request', () => {
  it('fails publish with its status, code and detail, and keeps the session', async () => {
    const assign = stubLocation()
    useAuthStore.setState({ accessToken: 'fresh-access' })
    sessionStorage.setItem(TOKEN_KEY, 'fresh-access')
    mswServer.use(
      http.post(`${API}/admin/curriculum/lessons/:id/publish`, () =>
        HttpResponse.json(CAPABILITY_REFUSAL, { status: 403 })),
    )

    const error = await rejection(publishCurriculumVersion({ publicLessonId: 'lesson-1', versionId: 'v2', reason: 'ship' }))

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 403, code: 'curriculum_capability_required' })
    expect(error.detail).toEqual(CAPABILITY_REFUSAL.detail)
    expect(refreshCalls).toBe(0)
    expectStillSignedIn(assign, 'fresh-access')
  })

  it('still answers the worklist read with "permission denied" rather than an error', async () => {
    const assign = stubLocation()
    mswServer.use(
      http.get(`${API}/admin/curriculum/worklist`, () => HttpResponse.json(CAPABILITY_REFUSAL, { status: 403 })),
    )

    await expect(getCurriculumWorklist()).resolves.toEqual({ items: [], count: 0, permissionDenied: true })
    expect(refreshCalls).toBe(0)
    expectStillSignedIn(assign, 'expired-access')
  })
})

describe('structured details', () => {
  it('keeps a 422 validation detail with its fields', async () => {
    const detail = { code: 'invalid_manifest', fields: ['publicLessonId'] }
    mswServer.use(
      http.post(`${API}/admin/curriculum/migrations/:id/apply`, () => HttpResponse.json({ detail }, { status: 422 })),
    )

    const error = await rejection(applyCurriculumMigration({ migrationId: 'm-1', manifest: {}, confirmationToken: 't' }))

    expect(error).toMatchObject({ status: 422, code: 'invalid_manifest' })
    expect(error.detail).toEqual(detail)
  })

  it('reads a bare string code such as `not_in_review` as the code', async () => {
    mswServer.use(
      http.post(`${API}/admin/curriculum/lessons/:id/drafts/:version/request-changes`, () =>
        HttpResponse.json({ detail: 'not_in_review' }, { status: 409 })),
    )

    const error = await rejection(requestCurriculumChanges({ publicLessonId: 'lesson-1', versionId: 'v2', reason: 'fix' }))

    expect(error).toMatchObject({ status: 409, detail: 'not_in_review' })
    expect(curriculumErrorCode(error)).toBe('not_in_review')
  })
})

describe('the copy for a failed curriculum request', () => {
  const tIn = (language: string) => i18n.getFixedT(language, 'admin')

  it('names a missing capability in each language, formally in German and French', () => {
    const error = new ApiError('Forbidden', { status: 403, code: 'curriculum_capability_required' })
    expect(curriculumErrorMessage(error, tIn('de'))).toBe('Ihrem Konto fehlt die Lehrplan-Berechtigung für diese Aktion.')
    expect(curriculumErrorMessage(error, tIn('fr'))).toBe(
      'Votre compte n’a pas l’autorisation de programme requise pour cette action.',
    )
    expect(curriculumErrorMessage(error, tIn('it'))).toBe(
      'Il tuo account non ha l’autorizzazione al programma necessaria per questa azione.',
    )
    expect(curriculumErrorMessage(error, tIn('en'))).toBe(
      'Your account does not have the curriculum permission this action needs.',
    )
  })

  it('falls back on the status for a 403 without a code it knows', () => {
    const error = new ApiError('action_not_allowed', { status: 403, code: 'action_not_allowed' })
    expect(curriculumErrorMessage(error, tIn('de'))).toBe('Sie haben keine Berechtigung für diese Lehrplan-Aktion.')
    expect(curriculumErrorMessage(error, tIn('fr'))).toBe('Vous n’avez pas l’autorisation pour cette action sur le programme.')
  })

  it('never shows the backend message, in any language', () => {
    const error = new ApiError('Curriculum operation failed', { status: 418 })
    for (const language of ['de', 'fr', 'it', 'en']) {
      expect(curriculumErrorMessage(error, tIn(language))).not.toContain('Curriculum operation failed')
    }
  })

  it('has a phrase in all four languages for every code and status it names', () => {
    const errors = [
      ...['stale_pointer', 'migration_confirmation_mismatch', 'validation_failed', 'session_unreachable'].map(
        (code) => new ApiError(code, { status: 409, code }),
      ),
      ...[401, 403, 404, 409, 422, 429, 500].map((status) => new ApiError('x', { status })),
      new ApiError('Network Error', { transportCode: 'ERR_NETWORK' }),
    ]
    for (const language of ['de', 'fr', 'it', 'en']) {
      for (const error of errors) {
        const message = curriculumErrorMessage(error, tIn(language))
        expect(message).not.toMatch(/^curriculum\./)
        if (language !== 'en') expect(message).not.toBe(curriculumErrorMessage(error, tIn('en')))
      }
    }
  })
})

describe('the curriculum page in German', () => {
  it('shows a backend refusal in German, not its raw code', async () => {
    await i18n.changeLanguage('de')
    mswServer.use(
      http.get(`${API}/admin/curriculum/worklist`, () =>
        HttpResponse.json({ detail: 'migration_confirmation_mismatch' }, { status: 409 })),
    )
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>
            <AdminCurriculumPage />
          </MemoryRouter>
        </I18nextProvider>
      </QueryClientProvider>,
    )

    const alert = await screen.findByText(/Bestätigungstoken passt nicht zu diesem Probelauf/)
    expect(alert.getAttribute('role')).toBe('alert')
    expect(document.body.textContent).not.toContain('migration_confirmation_mismatch')
    expect(document.body.textContent).not.toContain('Curriculum operation failed')
  })
})
